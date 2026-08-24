# Booking Race Condition — Sequence Diagram

Illustrates how two patients attempting to book the same slot simultaneously are handled. Only one succeeds — guaranteed at the database level by the partial unique index.

```
Patient A                    Patient B                    Backend                      MongoDB
    |                            |                            |                            |
    |── POST /appointments/hold ─────────────────────────────>|                            |
    |                            |── POST /appointments/hold ─>|                            |
    |                            |                            |                            |
    |                            |                   [Both requests arrive concurrently]   |
    |                            |                            |                            |
    |                            |                            |── startTransaction() ──────>|
    |                            |                            |── startTransaction() ──────>|
    |                            |                            |                            |
    |                            |                            |── Appointment.create() ────>|  (Patient A)
    |                            |                            |── Appointment.create() ────>|  (Patient B)
    |                            |                            |                            |
    |                            |                            |          [Index: unique (doctorId, slotStart)
    |                            |                            |           where status IN [held, confirmed]]
    |                            |                            |                            |
    |                            |                            |<── { _id: appt1 } ─────────|  (first write wins)
    |                            |                            |<── DuplicateKeyError 11000 ─|  (second write fails)
    |                            |                            |                            |
    |                            |                   [Transaction A commits]               |
    |                            |                   [Transaction B aborts]                |
    |                            |                            |                            |
    |<── 201 { status: "held" } ─|                            |                            |
    |                            |<── 409 "Slot no longer available" ──────────────────────|
    |                            |                            |                            |
```

## Key Points

- Both requests enter `holdSlot()` at the same time inside separate MongoDB transactions.
- Both attempt `Appointment.create()` with the same `(doctorId, slotStart)` pair.
- MongoDB's partial unique index allows only one insert to succeed. The second receives a duplicate key error (code 11000).
- The winning transaction commits and returns `201`. The losing transaction aborts and the error handler returns `409 "Slot no longer available"`.
- No application-level locking, no `findOne` + `create` check-then-act pattern. The guarantee is entirely at the storage engine level.

## Hold Expiry Flow

```
Patient                      Backend (cron — every minute)       MongoDB
    |                                    |                            |
    |── POST /appointments/hold ─────────────────────────────────────>|
    |<── 201 { holdExpiresAt: T+15min } ─|                            |
    |                                    |                            |
    |   [Patient abandons symptom form]  |                            |
    |                                    |                            |
    |                          [T+15min passes]                       |
    |                                    |                            |
    |                          cron tick |── find held where ─────────>|
    |                                    |   holdExpiresAt <= now      |
    |                                    |<── [appt1] ────────────────|
    |                                    |                            |
    |                                    |── updateMany → cancelled ──>|
    |                                    |── insertMany (history) ────>|
    |                                    |── commitTransaction() ─────>|
    |                                    |                            |
    |                          [Slot is now free — other patients can book it]
```
