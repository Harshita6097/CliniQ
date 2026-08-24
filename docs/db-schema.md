# Database Schema

## CliniQ — MongoDB Collections

All collections use Mongoose ODM. Timestamps (`createdAt`, `updatedAt`) are auto-managed unless noted.

---

## User

Stores all accounts — patients, doctors, and admins share this collection, differentiated by `role`.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | ObjectId | auto | |
| `name` | String | required, trimmed | |
| `email` | String | required, unique, lowercase | Validated against `/^\S+@\S+\.\S+$/` |
| `passwordHash` | String | required, `select: false` | bcrypt hash (12 rounds) — never returned in queries |
| `role` | String | required, enum | `patient` \| `doctor` \| `admin` |
| `phone` | String | optional | default `null` |
| `googleTokens.access_token` | String | optional | Google Calendar OAuth |
| `googleTokens.refresh_token` | String | optional | Google Calendar OAuth |
| `googleTokens.expiry_date` | Number | optional | Unix ms timestamp |
| `isActive` | Boolean | default `true` | Soft delete flag — `false` blocks login |
| `notificationPreferences.appointmentReminder` | Boolean | default `true` | Patient-controlled |
| `notificationPreferences.medicationReminder` | Boolean | default `true` | Patient-controlled |
| `notificationPreferences.calendarUpdates` | Boolean | default `true` | Patient-controlled |
| `createdAt` / `updatedAt` | Date | auto | |

**Indexes:** unique on `email`

---

## DoctorProfile

One document per doctor — linked to `User` via `userId`. Stores scheduling configuration.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | ObjectId | auto | |
| `userId` | ObjectId → User | required, unique | One profile per doctor |
| `specialization` | String | required, trimmed | e.g. `"Cardiology"` |
| `qualifications` | String | optional | e.g. `"MBBS, MD"` |
| `bio` | String | optional | Free-text about section |
| `workingHours` | Array of WorkingHours | default `[]` | See sub-schema below |
| `slotDurationMins` | Number | required, min 5, default 30 | Drives slot generation |
| `leaveDays` | Array of String | default `[]` | ISO dates `"YYYY-MM-DD"` |
| `consultationFee` | Number | min 0, default 0 | In INR |
| `createdAt` / `updatedAt` | Date | auto | |

**WorkingHours sub-schema** (no `_id`):

| Field | Type | Notes |
|-------|------|-------|
| `day` | String | `Monday` \| `Tuesday` \| ... \| `Sunday` |
| `start` | String | `"HH:mm"` 24-hour format |
| `end` | String | `"HH:mm"` 24-hour format |

**Indexes:** `{ specialization: 1 }` for doctor search filtering

---

## Appointment

Core booking record. Moves through a defined status lifecycle.

**Status lifecycle:** `held` → `confirmed` → `completed` or `cancelled`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | ObjectId | auto | |
| `patientId` | ObjectId → User | required | |
| `doctorId` | ObjectId → User | required | |
| `slotStart` | Date | required | UTC |
| `slotEnd` | Date | required | UTC |
| `status` | String | enum, default `"held"` | `held` \| `confirmed` \| `cancelled` \| `completed` |
| `holdExpiresAt` | Date | default `null` | Set on hold, cleared on confirm |
| `symptomFormText` | String | default `null` | Patient-submitted, min 20 chars |
| `preVisitSummary` | PreVisitSummary | default `null` | LLM-generated on confirm |
| `postVisitNotes` | String | default `null` | Doctor-submitted, min 20 chars |
| `postVisitSummary` | PostVisitSummary | default `null` | LLM-generated on notes submit |
| `prescription` | Array of PrescriptionItem | default `[]` | Doctor-submitted |
| `calendarEventId.patient` | String | default `null` | Google Calendar event ID |
| `calendarEventId.doctor` | String | default `null` | Google Calendar event ID |
| `cancellationReason` | String | default `null` | |
| `createdAt` / `updatedAt` | Date | auto | |

**PreVisitSummary sub-schema** (no `_id`):

| Field | Type | Notes |
|-------|------|-------|
| `urgency` | String | `"Low"` \| `"Medium"` \| `"High"` \| `null` |
| `chiefComplaint` | String | One sentence, under 20 words |
| `suggestedQuestions` | Array of String | Exactly 3 — shown to doctor |
| `documentsToCarry` | Array of String | Exactly 3 — shown to patient as checklist |
| `generatedAt` | Date | |
| `isFallback` | Boolean | `true` when LLM failed and template was used |

**PostVisitSummary sub-schema** (no `_id`):

| Field | Type | Notes |
|-------|------|-------|
| `patientFriendlySummary` | String | Plain-English, under 200 words |
| `generatedAt` | Date | |
| `isFallback` | Boolean | `true` when LLM failed |

**PrescriptionItem sub-schema** (no `_id`):

| Field | Type | Notes |
|-------|------|-------|
| `medicine` | String | required |
| `dosage` | String | required, e.g. `"500mg"` |
| `frequency` | String | required, e.g. `"Twice daily"` |
| `durationDays` | Number | required, min 1 |
| `notes` | String | optional, e.g. `"After meals"` |

**Indexes:**

| Index | Type | Purpose |
|-------|------|---------|
| `{ doctorId: 1, slotStart: 1 }` where `status IN [held, confirmed]` | **Partial unique** | Double-booking prevention — DB-level guarantee |
| `{ patientId: 1, status: 1 }` | Compound | Patient appointment list queries |
| `{ doctorId: 1, status: 1 }` | Compound | Doctor appointment list queries |
| `{ holdExpiresAt: 1 }` | Single | Hold cleanup cron job |
| `{ status: 1, slotStart: 1 }` | Compound | Medication reminder cron job |

---

## AppointmentStatusHistory

Immutable audit trail — one document per status transition. Never updated, only inserted.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | ObjectId | auto | |
| `appointmentId` | ObjectId → Appointment | required | |
| `fromStatus` | String \| null | enum | `null` for initial `held` creation |
| `toStatus` | String | required, enum | `held` \| `confirmed` \| `cancelled` \| `completed` |
| `reason` | String | default `null` | Human-readable e.g. `"Doctor marked leave"` |
| `changedBy` | ObjectId → User \| null | default `null` | `null` = system / cron job |
| `timestamp` | Date | auto (`createdAt`) | Write-once — no `updatedAt` |

**Indexes:** `{ appointmentId: 1, timestamp: 1 }` for full history lookup

---

## Notification

Outbox pattern — every email is persisted here before dispatch. Enables retry with exponential backoff.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `_id` | ObjectId | auto | |
| `type` | String | required, enum | `confirmation` \| `reminder` \| `cancellation` \| `medication_reminder` |
| `recipientId` | ObjectId → User | required | |
| `appointmentId` | ObjectId → Appointment | default `null` | |
| `status` | String | enum, default `"queued"` | `queued` \| `sent` \| `failed` |
| `retryCount` | Number | default 0 | Incremented on each failed attempt |
| `maxRetries` | Number | default 5 | Configurable via `MAX_NOTIFICATION_RETRIES` |
| `lastAttemptAt` | Date | default `null` | Updated on every dispatch attempt |
| `nextRetryAt` | Date | default `null` | Exponential backoff: `2^retryCount` minutes |
| `emailPayload.to` | String | required | Recipient email address |
| `emailPayload.subject` | String | required | Email subject line |
| `emailPayload.body` | String | required | Plain-text body — stored for retries |
| `errorMessage` | String | default `null` | Last failure reason — visible in admin dashboard |
| `createdAt` / `updatedAt` | Date | auto | |

**Indexes:**

| Index | Purpose |
|-------|---------|
| `{ status: 1, nextRetryAt: 1 }` | Notification retry cron job — picks up due notifications |
| `{ recipientId: 1, status: 1 }` | Per-recipient notification lookup |
| `{ appointmentId: 1 }` | Deduplication check before queuing |

---

## Relationships

```
User (patient) ──────────────────────────┐
                                          ├── Appointment ──── AppointmentStatusHistory
User (doctor) ────── DoctorProfile        │
                                          └── Notification
User (any role) ──── Notification
```

- One `User` (doctor) → one `DoctorProfile`
- One `Appointment` → many `AppointmentStatusHistory` entries
- One `Appointment` → many `Notification` entries (one per email type per recipient)
- `User.googleTokens` stores per-user Google Calendar OAuth tokens
