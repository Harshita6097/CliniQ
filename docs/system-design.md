# System Design Write-up

## Healthcare Appointment & Follow-up Manager

---

## Double-Booking Prevention

The core challenge in any appointment system is ensuring two patients cannot book the same doctor slot simultaneously. Application-level checks — read the DB, check if slot is free, then write — are inherently unsafe under concurrent load because two requests can pass the check at the same time before either has written.

This system solves it at the database level using a **partial unique index** on the `Appointment` collection:

```
{ doctorId: 1, slotStart: 1 }, unique: true,
partialFilterExpression: { status: { $in: ["held", "confirmed"] } }
```

This index enforces that only one document with a given `(doctorId, slotStart)` pair can exist in the `held` or `confirmed` state at any time. `cancelled` and `completed` appointments are excluded from the index so the same slot can be re-booked after a cancellation.

Booking follows a two-step flow. In step one, the patient holds a slot — this creates a `held` appointment document inside a MongoDB transaction. If two requests arrive simultaneously for the same slot, MongoDB's index rejects the second insert with a duplicate key error (code 11000), which the error handler converts to a user-friendly "Slot no longer available" response. No application-level locking, no race condition. In step two, the patient submits their symptom form within a 5-minute window, transitioning the appointment from `held` to `confirmed`. If the window expires, a background job (running every minute) finds all `held` appointments past their `holdExpiresAt` timestamp and cancels them, freeing the slot.

---

## Doctor Leave Conflict Handling

When a doctor marks a leave day, there may already be confirmed appointments on that date. The system handles this atomically to ensure no appointment is left in an inconsistent state.

The leave marking and conflict resolution run inside a single MongoDB transaction:

1. The doctor's `leaveDays` array is updated with the new dates (duplicates are deduplicated using a `Set`).
2. All `confirmed` appointments on those dates are queried.
3. Each affected appointment is transitioned to `cancelled` with reason "Doctor marked leave for this day".
4. An `AppointmentStatusHistory` record is written for each cancellation.
5. A `Notification` document is created for each affected patient (outbox pattern — see below).
6. The transaction commits atomically — either all of this succeeds or none of it does.

After the transaction commits, Google Calendar events for the cancelled appointments are deleted asynchronously (fire-and-forget, non-blocking). This same logic is shared between doctor self-service leave and admin-triggered leave, avoiding duplication.

Past dates are rejected at the validation layer — a doctor cannot mark leave for a date that has already passed.

---

## Slot Hold Mechanism

The hold mechanism solves a UX problem: a patient needs time to fill in their symptom form before the booking is finalised, but the slot should not be available to other patients during that time.

When a patient selects a slot, the system immediately creates a `held` appointment with a `holdExpiresAt` timestamp set 5 minutes in the future (configurable via `HOLD_DURATION_MINUTES`). This is done inside a MongoDB transaction so the status history record is written atomically with the appointment.

A patient can only hold one slot at a time — the system checks for an existing `held` appointment before creating a new one, preventing a patient from locking multiple slots simultaneously.

The hold cleanup job runs every minute via `node-cron`. It queries for all `held` appointments where `holdExpiresAt` is in the past and transitions them to `cancelled`, writing a status history entry for each. This frees the slot for other patients without any manual intervention.

When the patient submits their symptom form within the window, `confirmSlot` uses a conditional update — `findOneAndUpdate` with `{ status: "held", holdExpiresAt: { $gt: now } }` — so an expired hold cannot be confirmed even if the cleanup job hasn't run yet.

---

## Notification Failure Handling

Email delivery is unreliable — SMTP servers go down, rate limits are hit, and transient network errors occur. The system uses the **outbox pattern** to ensure no notification is ever lost.

Every notification — confirmation, cancellation, reminder, medication reminder — is written to the `Notification` collection in MongoDB **before** any attempt to send it. The document stores the full email payload (`to`, `subject`, `body`) so retries never need to recompute it. Only after the document is persisted does the system attempt to dispatch it.

If dispatch fails, the notification document is updated with:
- `status: "queued"` (remains retryable)
- `retryCount` incremented
- `nextRetryAt` set using exponential backoff: `2^retryCount` minutes (1m, 2m, 4m, 8m, 16m)
- `errorMessage` storing the last failure reason for admin visibility

A notification retry job runs every 5 minutes, picking up all `queued` notifications whose `nextRetryAt` has elapsed and dispatching them in batches of 10 to avoid SMTP rate limits. After 5 failed attempts (`MAX_NOTIFICATION_RETRIES`), the notification is marked `failed` and removed from the retry queue. Admins can view the full notification status — queued, sent, failed, retry count, error message — from the admin dashboard.

Deduplication is enforced per-recipient per-appointment: before queuing a confirmation, the system checks whether a `queued` or `sent` confirmation already exists for that recipient and appointment, preventing duplicate emails if the booking flow is retried.

All external calls — LLM, email, and Google Calendar — are fire-and-forget after the main HTTP transaction commits. They never block the API response. If the LLM times out or returns unparseable output, a fallback summary with `isFallback: true` is stored instead. The booking confirmation is returned to the patient regardless of whether the LLM, email, or calendar operations succeed.
