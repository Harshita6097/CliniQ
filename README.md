# CliniQ — Healthcare Appointment & Follow-up Manager

> Full-stack healthcare appointment platform with patient, doctor, and admin portals.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TailwindCSS + React Router v6 + TanStack Query |
| Backend | Node.js + Express |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT — role-based (patient / doctor / admin) |
| LLM | Google Gemini API (gemini-3.6-flash) |
| Email | Resend API |
| Calendar | Google Calendar API (OAuth 2.0 per-user) |
| Background Jobs | node-cron (hold cleanup, notification retry, reminders) |

---

## Project Structure

```
cliniq/
├── backend/
│   ├── scripts/          # seed.js — first admin + sample doctor
│   ├── src/
│   │   ├── config/       # db.js, googleOAuth.js
│   │   ├── controllers/  # auth, appointment, doctor, admin
│   │   ├── jobs/         # holdCleanup, notificationRetry, medicationReminder
│   │   ├── middleware/   # auth.middleware, errorHandler.middleware
│   │   ├── models/       # User, DoctorProfile, Appointment, AppointmentStatusHistory, Notification
│   │   ├── routes/       # auth, patient, doctor, admin, calendar
│   │   ├── services/     # slot, llm, email, notification, calendar
│   │   └── utils/        # logger, slotGenerator
│   ├── .env.example
│   └── server.js
├── docs/
│   ├── system-design.md  # double-booking, leave conflicts, slot hold, notification reliability
│   └── api-docs.md       # full endpoint reference
├── frontend/
│   ├── src/
│   │   ├── api/          # axiosInstance, auth.api, appointment.api, doctor.api, admin.api, calendar.api
│   │   ├── context/      # AuthContext
│   │   ├── hooks/        # useAuth, useAppointments, useSlots
│   │   ├── pages/
│   │   │   ├── auth/     # Login, Register
│   │   │   ├── patient/  # PatientLayout, Dashboard, BookAppointment, MyAppointments, AppointmentDetail
│   │   │   ├── doctor/   # DoctorLayout, Dashboard, AppointmentDetail, LeaveManager
│   │   │   ├── admin/    # AdminLayout, Dashboard, ManageDoctors, AllAppointments, Notifications
│   │   │   └── shared/   # CalendarSettings (Google Calendar connect + notification preferences)
│   │   └── utils/        # dateUtils, statusBadge
│   └── .env.example
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (free tier works)
- Gemini API key — [aistudio.google.com](https://aistudio.google.com)
- Resend account + API key — [resend.com](https://resend.com) (free tier: 3000 emails/month)
- Google Cloud project with Calendar API enabled (optional — app works without it)

---

### 1. Clone & install

```bash
git clone <repo-url>
cd cliniq

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

---

### 2. Backend environment

```bash
cp backend/.env.example backend/.env
```

Fill in every value — see the [Environment Variables](#environment-variables) section below.

---

### 3. Seed the database

Two seed scripts are available:

**Minimal seed** — creates one admin + one sample doctor:
```bash
cd backend
npm run seed
```

**Demo seed** — creates full evaluation-ready data (recommended):
```bash
cd backend
npm run seed:demo
```

Both are idempotent — safe to re-run, skips existing accounts.

---

## Demo Credentials

> All demo accounts are created by `npm run seed:demo`.

### Admin
| Email | Password |
|-------|----------|
| admin@cliniq.demo | Admin@1234 |

### Doctors (all use password: `Doctor@1234`)
| Name | Email | Specialization |
|------|-------|----------------|
| Dr. Priya Sharma | priya.sharma@cliniq.demo | Cardiologist |
| Dr. Arjun Mehta | arjun.mehta@cliniq.demo | Dermatologist |
| Dr. Sneha Iyer | sneha.iyer@cliniq.demo | Pediatrician |
| Dr. Rohan Kapoor | rohan.kapoor@cliniq.demo | Orthopedic Surgeon |
| Dr. Meera Nair | meera.nair@cliniq.demo | General Physician |

### Patients (all use password: `Patient@1234`)
| Name | Email |
|------|-------|
| Rahul Verma | rahul.verma@cliniq.demo |
| Ananya Singh | ananya.singh@cliniq.demo |
| Vikram Patel | vikram.patel@cliniq.demo |
| Kavya Reddy | kavya.reddy@cliniq.demo |

### Pre-seeded Appointments
| Status | Patient | Doctor | Notes |
|--------|---------|--------|-------|
| ✅ Completed | Rahul Verma | Dr. Priya Sharma | With prescription + AI summary |
| ✅ Completed | Ananya Singh | Dr. Arjun Mehta | With prescription + AI summary |
| ✅ Completed | Vikram Patel | Dr. Meera Nair | With prescription + AI summary |
| 🕐 Confirmed | Rahul Verma | Dr. Rohan Kapoor | Upcoming |
| 🕐 Confirmed | Kavya Reddy | Dr. Sneha Iyer | Upcoming |
| 🕐 Confirmed | Ananya Singh | Dr. Priya Sharma | Upcoming |
| ❌ Cancelled | Vikram Patel | Dr. Rohan Kapoor | Cancelled by patient |
| ❌ Cancelled | Kavya Reddy | Dr. Arjun Mehta | Cancelled by admin (doctor leave) |

---

### 4. Run the app

```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 — frontend (http://localhost:3000)
cd frontend && npm start
```

Health check: `GET http://localhost:5000/health`

---

## Environment Variables

All variables live in `backend/.env`. Copy from `backend/.env.example`.

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default `5000`) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGO_URI` | **Yes** | MongoDB Atlas connection string |
| `JWT_SECRET` | **Yes** | Min 32-character random string |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `7d`) |
| `GEMINI_API_KEY` | No* | Google Gemini API key — LLM summaries fall back gracefully if missing |
| `GEMINI_MODEL` | No | Model name (default `gemini-3.6-flash`) |
| `LLM_TIMEOUT_MS` | No | LLM call timeout in ms (default `30000`) |
| `RESEND_API_KEY` | No* | Resend API key — emails silently fail if missing |
| `EMAIL_FROM` | No | From address (default `CliniQ <onboarding@resend.dev>`) |
| `RESEND_DEV_OVERRIDE` | No | If set, all emails are redirected to this address — useful on Resend free tier without a verified domain |
| `GOOGLE_CLIENT_ID` | No* | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No* | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | No | OAuth callback URL (default `http://localhost:5000/api/calendar/oauth/callback`) |
| `CLIENT_URL` | No | Frontend URL for CORS + OAuth redirects (default `http://localhost:3000`) |
| `HOLD_DURATION_MINUTES` | No | Slot hold window in minutes (default `5`) |
| `MAX_NOTIFICATION_RETRIES` | No | Max email retry attempts (default `5`) |

*App runs without these — the relevant feature degrades gracefully.

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require:
```
Authorization: Bearer <jwt_token>
```

---

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Public | Register a patient account |
| POST | `/login` | Public | Login — returns JWT + user |
| GET | `/me` | Any role | Get current user profile |
| PATCH | `/me` | Any role | Update name / phone |
| POST | `/change-password` | Any role | Change password |

**POST /register**
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123", "role": "patient", "phone": "+91 98765 43210" }
```

**POST /login**
```json
{ "email": "jane@example.com", "password": "secret123" }
```
Response: `{ "token": "...", "user": { "id", "name", "email", "role" } }`

---

### Patient — `/api/patient` *(role: patient)*

| Method | Path | Description |
|--------|------|-------------|
| GET | `/doctors` | List doctors, optional `?specialization=` filter |
| GET | `/doctors/:doctorId/slots` | Available slots — requires `?date=YYYY-MM-DD` |
| POST | `/appointments/hold` | Step 1 — hold a slot (15-min window) |
| POST | `/appointments/:id/confirm` | Step 2 — submit symptoms, confirm booking |
| DELETE | `/appointments/:id` | Cancel an appointment |
| GET | `/appointments` | List own appointments, optional `?status=` filter |
| GET | `/appointments/:id` | Single appointment detail + status history |

**POST /appointments/hold**
```json
{ "doctorId": "<id>", "slotStart": "2025-09-01T09:00:00.000Z", "slotEnd": "2025-09-01T09:30:00.000Z" }
```

**POST /appointments/:id/confirm**
```json
{ "symptomFormText": "Fever for 3 days, headache, mild cough." }
```

---

### Doctor — `/api/doctor` *(role: doctor)*

| Method | Path | Description |
|--------|------|-------------|
| GET | `/profile` | Own doctor profile |
| GET | `/appointments` | All appointments, optional `?status=` filter |
| GET | `/appointments/:id` | Single appointment + patient info + history |
| POST | `/appointments/:id/notes` | Submit post-visit notes + prescription → marks completed |
| POST | `/leave` | Mark leave days (cancels conflicting appointments) |
| DELETE | `/leave` | Remove leave days |

**POST /appointments/:id/notes**
```json
{
  "postVisitNotes": "Patient has viral fever. Rest advised.",
  "prescription": [
    { "medicine": "Paracetamol", "dosage": "500mg", "frequency": "Twice daily", "durationDays": 5, "notes": "After meals" }
  ]
}
```

**POST /leave**
```json
{ "dates": ["2025-09-10", "2025-09-11"] }
```

---

### Admin — `/api/admin` *(role: admin)*

| Method | Path | Description |
|--------|------|-------------|
| POST | `/doctors` | Create doctor account + profile (atomic) |
| GET | `/doctors` | List all doctors |
| GET | `/doctors/:id` | Single doctor profile |
| PATCH | `/doctors/:id` | Update doctor profile fields |
| DELETE | `/doctors/:id` | Deactivate doctor (soft delete) |
| POST | `/doctors/:id/leave` | Mark leave for a doctor |
| PATCH | `/doctors/:id/reactivate` | Reactivate a deactivated doctor |
| PATCH | `/doctors/:id/user` | Update doctor's name / email (User record) |
| GET | `/appointments` | System-wide appointments — filters: `status`, `doctorId`, `patientId`, `from`, `to` |
| GET | `/appointments/:id` | Single appointment detail + status history |
| GET | `/notifications` | Notification dashboard — optional `?status=queued\|sent\|failed` |
| GET | `/users` | All users — optional `?role=patient\|doctor` |
| PATCH | `/users/:id/toggle-active` | Activate / deactivate any user |

**POST /doctors**
```json
{
  "name": "Dr. Smith", "email": "smith@example.com", "password": "secret123",
  "specialization": "Cardiology", "slotDurationMins": 30, "consultationFee": 800,
  "workingHours": [
    { "day": "Monday", "start": "09:00", "end": "17:00" },
    { "day": "Wednesday", "start": "10:00", "end": "15:00" }
  ]
}
```

---

### Calendar — `/api/calendar`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/connect` | Any role | Returns Google OAuth consent URL |
| GET | `/oauth/callback` | Public | OAuth redirect handler — saves tokens |
| DELETE | `/disconnect` | Any role | Remove stored Google tokens |
| GET | `/status` | Any role | `{ "connected": true/false }` |

---

## Database Schema

### User
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `name` | String | required |
| `email` | String | unique, lowercase |
| `passwordHash` | String | bcrypt, `select: false` |
| `role` | String | `patient` \| `doctor` \| `admin` |
| `phone` | String | optional |
| `googleTokens` | Object | `access_token`, `refresh_token`, `expiry_date` |
| `isActive` | Boolean | default `true` — soft delete flag |
| `notificationPreferences` | Object | `{ appointmentReminder, medicationReminder, calendarUpdates }` — all default `true` |
| `createdAt` / `updatedAt` | Date | auto |

### DoctorProfile
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `userId` | ObjectId → User | unique |
| `specialization` | String | indexed |
| `qualifications` | String | optional |
| `bio` | String | optional |
| `workingHours` | Array | `[{ day, start "HH:mm", end "HH:mm" }]` |
| `slotDurationMins` | Number | min 5, default 30 |
| `leaveDays` | Array[String] | `["YYYY-MM-DD", ...]` |
| `consultationFee` | Number | default 0 |

### Appointment
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `patientId` | ObjectId → User | |
| `doctorId` | ObjectId → User | |
| `slotStart` / `slotEnd` | Date | UTC |
| `status` | String | `held` \| `confirmed` \| `cancelled` \| `completed` |
| `holdExpiresAt` | Date | null after confirmation |
| `symptomFormText` | String | patient-submitted |
| `preVisitSummary` | Object | `{ urgency, chiefComplaint, suggestedQuestions[], documentsToCarry[], generatedAt, isFallback }` |
| `postVisitNotes` | String | doctor-submitted |
| `postVisitSummary` | Object | `{ patientFriendlySummary, generatedAt, isFallback }` |
| `prescription` | Array | `[{ medicine, dosage, frequency, durationDays, notes }]` |
| `calendarEventId` | Object | `{ patient, doctor }` — Google Calendar event IDs |
| `cancellationReason` | String | optional |

**Critical index:** Partial unique index on `(doctorId, slotStart)` where `status IN [held, confirmed]` — DB-level double-booking prevention.

### AppointmentStatusHistory
| Field | Type | Notes |
|-------|------|-------|
| `appointmentId` | ObjectId → Appointment | |
| `fromStatus` | String \| null | null for initial creation |
| `toStatus` | String | |
| `reason` | String | human-readable |
| `changedBy` | ObjectId → User \| null | null = system (cron job) |
| `timestamp` | Date | write-once, auto |

### Notification
| Field | Type | Notes |
|-------|------|-------|
| `type` | String | `confirmation` \| `reminder` \| `cancellation` \| `medication_reminder` |
| `recipientId` | ObjectId → User | |
| `appointmentId` | ObjectId → Appointment | |
| `status` | String | `queued` \| `sent` \| `failed` |
| `retryCount` | Number | incremented on each failure |
| `nextRetryAt` | Date | exponential backoff: 1m, 2m, 4m, 8m, 16m |
| `emailPayload` | Object | `{ to, subject, body }` — stored for retries |
| `errorMessage` | String | last failure reason |

---

## Background Jobs

| Job | Schedule | What it does |
|-----|----------|-------------|
| Hold Cleanup | Every minute | Finds expired `held` appointments, transitions to `cancelled`, writes history |
| Notification Retry | Every 5 minutes | Picks up `queued` notifications past `nextRetryAt`, dispatches in batches of 10 |
| Appointment Reminder | Every hour at `:00` | Sends reminder email 24–25 hours before confirmed appointments (deduped) |
| Medication Reminder | Every hour at `:30` | Sends per-medicine reminders based on frequency, stops after `durationDays` |

---

## LLM Integration (Google Gemini)

Two summaries are generated automatically — both always resolve (never throw). If the LLM fails or times out, `isFallback: true` is stored and a template response is used instead.

### Pre-visit Summary
Triggered when a patient confirms a booking. System prompt instructs the model to return strict JSON:

```
{
  "urgency": "Low" | "Medium" | "High",
  "chiefComplaint": "<one sentence under 20 words>",
  "suggestedQuestions": ["<doctor question 1>", "<doctor question 2>", "<doctor question 3>"],
  "documentsToCarry": ["<document 1>", "<document 2>", "<document 3>"]
}
```

The doctor sees `suggestedQuestions` on the appointment detail page. The patient sees `documentsToCarry` as a checklist of what to bring.

### Post-visit Summary
Triggered when a doctor submits notes. Model converts clinical notes + prescription into a patient-friendly plain-English summary (under 200 words, warm tone). Markdown symbols are stripped from the output.

**Failure handling:** `extractJSON()` repairs truncated/malformed responses. 2-attempt retry on timeout. All fields validated individually — partial LLM responses are padded with safe defaults. Arrays always contain exactly 3 items.

**Timeout:** Configurable via `LLM_TIMEOUT_MS` (default 30 seconds). Uses `Promise.race` against the Gemini call.

---

## Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Google Calendar API**
3. Create OAuth 2.0 credentials (Web application type)
4. Add authorised redirect URI: `http://localhost:5000/api/calendar/oauth/callback`
5. Copy Client ID + Secret into `.env`

**Flow:**
1. User calls `GET /api/calendar/connect` → receives consent URL
2. User visits URL, grants access
3. Google redirects to `/api/calendar/oauth/callback` with auth code
4. Backend exchanges code for tokens, stores on `User.googleTokens`
5. All future appointment confirmations/cancellations automatically create/delete calendar events

Calendar integration is **optional** — the app works fully without it. Users without tokens simply skip calendar operations silently.

> **Note:** After connecting, the OAuth scope is `https://www.googleapis.com/auth/calendar` (full calendar access, required for custom reminder overrides). Users in Testing mode must be added as test users in the Google Cloud Console → APIs & Services → OAuth consent screen → Test users.

---

## Deployment

### Backend — Render (free tier)

1. Push code to GitHub (main branch, public repo)
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo, set root directory to `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add all environment variables from `.env.example` under Environment
7. Set `NODE_ENV=production` and update `CLIENT_URL` to your Vercel frontend URL

### Frontend — Vercel (free tier)

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set root directory to `frontend`
3. Add environment variable: `REACT_APP_API_URL=https://your-render-backend.onrender.com/api`
4. Deploy

### Post-deployment

- Update `GOOGLE_REDIRECT_URI` in backend env to `https://your-render-backend.onrender.com/api/calendar/oauth/callback`
- Add the same URI to your Google Cloud Console → OAuth credentials → Authorised redirect URIs
- Update `CLIENT_URL` in backend env to your Vercel frontend URL

---

## Further Documentation

- [System Design Write-up](docs/system-design.md) — double-booking prevention, leave conflict handling, slot hold mechanism, notification failure handling
- [API Documentation](docs/api-docs.md) — full endpoint reference with request/response examples

---

## Key Architecture Decisions

- **Double-booking prevention** — Partial unique index on `(doctorId, slotStart)` for `held/confirmed` status at the DB level, not application level. Race conditions are impossible.
- **Outbox pattern** — Every notification is written to MongoDB first, then dispatched async. Failures are retried with exponential backoff by the cron job.
- **Soft deletes** — Doctors are deactivated (`isActive: false`), never deleted. Appointment history is preserved.
- **Non-blocking external calls** — LLM, email, and calendar operations are all fire-and-forget after the main transaction commits. They never block the HTTP response.
- **Lazy service initialisation** — Gemini and Resend clients are initialised on first use, so the server boots cleanly even without API keys set.
- **UTC slots** — `slotGenerator.js` uses `Date.UTC()` to avoid timezone issues on non-UTC servers.
- **Notification preferences** — Confirmation and cancellation emails are always sent (mandatory). Appointment reminders, medication reminders, and calendar updates are patient-controlled via toggles in the Settings page.
