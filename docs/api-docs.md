# API Documentation

## Base URL

```
http://localhost:5000/api
```

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Tokens are obtained from `POST /auth/login` and expire after 7 days (configurable via `JWT_EXPIRES_IN`).

---

## Error Response Format

All errors return a consistent JSON body:

```json
{ "message": "Human-readable error description." }
```

| HTTP Status | When |
|---|---|
| 400 | Validation error or bad request |
| 401 | Missing or invalid JWT token |
| 403 | Authenticated but wrong role |
| 404 | Resource not found |
| 409 | Conflict — e.g. slot already taken, duplicate email |
| 429 | Rate limit exceeded (100 req / 15 min in production) |
| 500 | Unexpected server error |

---

## Auth — `/api/auth`

### POST `/auth/register`

Register a new patient account. Doctors are created by admins only.

**Auth:** Public

**Request body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "role": "patient",
  "phone": "+91 98765 43210"
}
```

**Response `201`:**
```json
{
  "message": "Registration successful.",
  "token": "<jwt>",
  "user": { "id": "<id>", "name": "Jane Doe", "email": "jane@example.com", "role": "patient" }
}
```

---

### POST `/auth/login`

**Auth:** Public

**Request body:**
```json
{ "email": "jane@example.com", "password": "secret123" }
```

**Response `200`:**
```json
{
  "token": "<jwt>",
  "user": { "id": "<id>", "name": "Jane Doe", "email": "jane@example.com", "role": "patient" }
}
```

---

### GET `/auth/me`

Returns the full profile of the currently authenticated user including `notificationPreferences`.

**Auth:** Any role

**Response `200`:**
```json
{
  "user": {
    "id": "<id>",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "patient",
    "phone": "+91 98765 43210",
    "isActive": true,
    "notificationPreferences": {
      "appointmentReminder": true,
      "medicationReminder": true,
      "calendarUpdates": true
    }
  }
}
```

---

### PATCH `/auth/me`

Update name, phone, or notification preferences.

**Auth:** Any role

**Request body (all fields optional):**
```json
{
  "name": "Jane Smith",
  "phone": "+91 99999 00000",
  "notificationPreferences": {
    "appointmentReminder": false
  }
}
```

**Response `200`:**
```json
{ "message": "Profile updated.", "user": { ... } }
```

---

### POST `/auth/change-password`

**Auth:** Any role

**Request body:**
```json
{ "currentPassword": "old123", "newPassword": "new456" }
```

**Response `200`:**
```json
{ "message": "Password changed successfully." }
```

---

## Patient — `/api/patient`

All routes require role `patient`.

---

### GET `/patient/doctors`

List all active doctors. Optionally filter by specialization.

**Query params:** `?specialization=Cardiology`

**Response `200`:**
```json
{
  "doctors": [
    {
      "_id": "<profileId>",
      "userId": { "_id": "<userId>", "name": "Dr. Smith", "email": "smith@example.com" },
      "specialization": "Cardiology",
      "slotDurationMins": 30,
      "consultationFee": 800,
      "workingHours": [{ "day": "Monday", "start": "09:00", "end": "17:00" }]
    }
  ]
}
```

---

### GET `/patient/doctors/:doctorId/slots`

Get available slots for a doctor on a specific date. Slots already held or confirmed are excluded. Past slots for today are excluded.

**Query params:** `?date=2025-09-01` (required, YYYY-MM-DD)

**Response `200`:**
```json
{
  "date": "2025-09-01",
  "slots": [
    { "slotStart": "2025-09-01T09:00:00.000Z", "slotEnd": "2025-09-01T09:30:00.000Z" },
    { "slotStart": "2025-09-01T09:30:00.000Z", "slotEnd": "2025-09-01T10:00:00.000Z" }
  ]
}
```

---

### POST `/patient/appointments/hold`

Step 1 of booking. Holds a slot for 5 minutes. A patient can only hold one slot at a time.

**Request body:**
```json
{
  "doctorId": "<userId>",
  "slotStart": "2025-09-01T09:00:00.000Z",
  "slotEnd": "2025-09-01T09:30:00.000Z"
}
```

**Response `201`:**
```json
{
  "message": "Slot held. Complete the symptom form within the hold window.",
  "appointment": {
    "id": "<id>",
    "slotStart": "2025-09-01T09:00:00.000Z",
    "slotEnd": "2025-09-01T09:30:00.000Z",
    "holdExpiresAt": "2025-09-01T08:35:00.000Z",
    "status": "held"
  }
}
```

**Error `409`:** Slot already taken by another patient.

---

### POST `/patient/appointments/:id/confirm`

Step 2 of booking. Submit symptom form to confirm the held slot. Triggers LLM pre-visit summary generation and sends confirmation emails to both patient and doctor.

**Request body:**
```json
{ "symptomFormText": "Fever for 3 days, headache, mild cough. (min 20 characters)" }
```

**Response `200`:**
```json
{
  "message": "Appointment confirmed.",
  "appointment": {
    "_id": "<id>",
    "status": "confirmed",
    "preVisitSummary": {
      "urgency": "Medium",
      "chiefComplaint": "Fever with headache and cough for 3 days.",
      "suggestedQuestions": ["When did the fever start?", "..."],
      "documentsToCarry": ["Recent blood test reports", "..."],
      "isFallback": false
    }
  }
}
```

---

### DELETE `/patient/appointments/:id`

Cancel a held or confirmed appointment.

**Request body (optional):**
```json
{ "reason": "Change of plans" }
```

**Response `200`:**
```json
{ "message": "Appointment cancelled.", "appointment": { ... } }
```

---

### GET `/patient/appointments`

List all appointments for the logged-in patient.

**Query params:** `?status=confirmed` (optional — `held`, `confirmed`, `cancelled`, `completed`)

**Response `200`:**
```json
{ "appointments": [ { "_id": "<id>", "status": "confirmed", "slotStart": "...", "doctorId": { "name": "Dr. Smith" } } ] }
```

---

### GET `/patient/appointments/:id`

Single appointment detail including pre-visit summary, post-visit summary, prescription, and full status history.

**Response `200`:**
```json
{
  "appointment": { ... },
  "history": [
    { "fromStatus": null, "toStatus": "held", "reason": "Slot held by patient", "timestamp": "..." },
    { "fromStatus": "held", "toStatus": "confirmed", "reason": "Symptom form submitted", "timestamp": "..." }
  ]
}
```

---

## Doctor — `/api/doctor`

All routes require role `doctor`.

---

### GET `/doctor/profile`

**Response `200`:**
```json
{
  "profile": {
    "userId": { "name": "Dr. Smith", "email": "smith@example.com" },
    "specialization": "Cardiology",
    "workingHours": [...],
    "slotDurationMins": 30,
    "leaveDays": ["2025-09-10"]
  }
}
```

---

### GET `/doctor/appointments`

**Query params:** `?status=confirmed`

**Response `200`:**
```json
{ "appointments": [ { "_id": "<id>", "patientId": { "name": "Jane", "email": "..." }, "status": "confirmed", "preVisitSummary": { ... } } ] }
```

---

### GET `/doctor/appointments/:id`

Single appointment with patient info, pre-visit summary, and status history.

---

### POST `/doctor/appointments/:id/notes`

Submit post-visit notes and prescription. Transitions appointment to `completed`. Triggers LLM post-visit summary, medication reminder notifications, and Google Calendar event update.

**Request body:**
```json
{
  "postVisitNotes": "Patient has viral fever. Rest advised. (min 20 characters)",
  "prescription": [
    {
      "medicine": "Paracetamol",
      "dosage": "500mg",
      "frequency": "Twice daily",
      "durationDays": 5,
      "notes": "After meals"
    }
  ]
}
```

**Response `200`:**
```json
{ "message": "Notes submitted successfully.", "appointment": { "status": "completed", "postVisitSummary": { "patientFriendlySummary": "...", "isFallback": false } } }
```

---

### POST `/doctor/leave`

Mark leave days. Cancels any confirmed appointments on those dates and notifies affected patients.

**Request body:**
```json
{ "dates": ["2025-09-10", "2025-09-11"] }
```

**Response `200`:**
```json
{
  "message": "Leave days saved. 2 confirmed appointment(s) cancelled and patients notified.",
  "leaveDays": ["2025-09-10", "2025-09-11"],
  "cancelledAppointments": [{ "id": "<id>", "slotStart": "...", "patientName": "Jane" }]
}
```

---

### DELETE `/doctor/leave`

Remove previously set leave days.

**Request body:**
```json
{ "dates": ["2025-09-10"] }
```

---

## Admin — `/api/admin`

All routes require role `admin`.

---

### POST `/admin/doctors`

Create a doctor user account and profile atomically in a single transaction.

**Request body:**
```json
{
  "name": "Dr. Smith",
  "email": "smith@example.com",
  "password": "secret123",
  "specialization": "Cardiology",
  "slotDurationMins": 30,
  "consultationFee": 800,
  "qualifications": "MBBS, MD",
  "bio": "15 years experience",
  "workingHours": [
    { "day": "Monday", "start": "09:00", "end": "17:00" },
    { "day": "Wednesday", "start": "10:00", "end": "15:00" }
  ]
}
```

**Response `201`:**
```json
{ "message": "Doctor created.", "user": { ... }, "profile": { ... } }
```

---

### GET `/admin/doctors`

List all doctors (active and inactive) with their profiles.

---

### GET `/admin/doctors/:id`

Single doctor profile by user ID.

---

### PATCH `/admin/doctors/:id`

Update doctor profile fields (specialization, working hours, slot duration, fee, qualifications, bio).

---

### DELETE `/admin/doctors/:id`

Soft-deactivate a doctor account (`isActive: false`). Appointment history is preserved.

---

### POST `/admin/doctors/:id/leave`

Mark leave days for a doctor (same conflict handling as doctor self-service).

**Request body:**
```json
{ "dates": ["2025-09-10"] }
```

---

### GET `/admin/appointments`

System-wide appointment list with optional filters.

**Query params:** `?status=confirmed&doctorId=<id>&patientId=<id>&from=2025-09-01&to=2025-09-30`

**Response `200`:**
```json
{ "total": 42, "appointments": [ ... ] }
```

---

### GET `/admin/notifications`

Notification dashboard with summary counts and recent entries.

**Query params:** `?status=failed`

**Response `200`:**
```json
{
  "summary": { "queued": 3, "sent": 120, "failed": 2 },
  "notifications": [
    {
      "_id": "<id>",
      "type": "confirmation",
      "status": "failed",
      "retryCount": 5,
      "errorMessage": "Connection refused",
      "recipientId": { "name": "Jane", "email": "jane@example.com" }
    }
  ]
}
```

---

### GET `/admin/users`

List all users.

**Query params:** `?role=patient`

---

### PATCH `/admin/users/:id/toggle-active`

Toggle a user's `isActive` status.

**Response `200`:**
```json
{ "message": "User deactivated.", "isActive": false }
```

---

## Calendar — `/api/calendar`

---

### GET `/calendar/connect`

Returns the Google OAuth consent URL. Redirect the user to this URL to grant calendar access.

**Auth:** Any role

**Response `200`:**
```json
{ "url": "https://accounts.google.com/o/oauth2/auth?..." }
```

---

### GET `/calendar/oauth/callback`

OAuth redirect handler. Google calls this after the user grants consent. Exchanges the auth code for tokens, saves them on the user document, then redirects to `CLIENT_URL/settings?calendar=connected`.

**Auth:** Public (called by Google)

---

### DELETE `/calendar/disconnect`

Removes stored Google tokens. Future appointments will not create calendar events.

**Auth:** Any role

**Response `200`:**
```json
{ "message": "Google Calendar disconnected." }
```

---

### GET `/calendar/status`

**Auth:** Any role

**Response `200`:**
```json
{ "connected": true }
```
