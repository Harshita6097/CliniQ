const { google } = require("googleapis");
const { getOAuthClient } = require("../config/googleOAuth");
const User = require("../models/User");
const logger = require("../utils/logger");

// ─── Helper: build calendar event body ───────────────────────────────────────
const buildEventBody = (appointment, patientName, doctorName, description = "") => ({
  summary: `Appointment: ${patientName} with Dr. ${doctorName}`,
  description: description || `Healthcare appointment.\nStatus: ${appointment.status}`,
  start: { dateTime: appointment.slotStart.toISOString(), timeZone: "UTC" },
  end:   { dateTime: appointment.slotEnd.toISOString(),   timeZone: "UTC" },
  reminders: {
    useDefault: false,
    overrides: [
      { method: "email", minutes: 24 * 60 }, // 24 hours before
      { method: "popup", minutes: 30 },       // 30 minutes before
    ],
  },
});

// ─── Helper: get calendar client for a user ──────────────────────────────────
// Returns null (with a warning log) if user hasn't connected Google Calendar.
const getCalendarForUser = async (userId) => {
  const user = await User.findById(userId).select("googleTokens name").lean();
  if (!user) return { calendar: null, name: "Unknown" };

  const auth = getOAuthClient(user.googleTokens);
  if (!auth) {
    logger.warn(`User ${userId} has no Google Calendar tokens — skipping calendar operation`);
    return { calendar: null, name: user.name };
  }

  return {
    calendar: google.calendar({ version: "v3", auth }),
    name: user.name,
  };
};

// ─── createCalendarEvents ─────────────────────────────────────────────────────
// Creates a Google Calendar event for both patient and doctor on booking confirmation.
// Returns { patientEventId, doctorEventId } — stored on the appointment document.
// Either side can fail independently — the other still gets their event.
const createCalendarEvents = async (appointment) => {
  const result = { patient: null, doctor: null };

  const [patientData, doctorData] = await Promise.all([
    getCalendarForUser(appointment.patientId),
    getCalendarForUser(appointment.doctorId),
  ]);

  const eventBody = buildEventBody(
    appointment,
    patientData.name,
    doctorData.name,
    appointment.symptomFormText
      ? `Chief concern: ${appointment.symptomFormText.substring(0, 100)}`
      : ""
  );

  // Patient calendar event
  if (patientData.calendar) {
    try {
      const res = await patientData.calendar.events.insert({
        calendarId: "primary",
        resource: eventBody,
      });
      result.patient = res.data.id;
      logger.info(`Calendar event created for patient ${appointment.patientId}: ${result.patient}`);
    } catch (err) {
      logger.error(`Failed to create patient calendar event: ${err.message}`);
    }
  }

  // Doctor calendar event
  if (doctorData.calendar) {
    try {
      const res = await doctorData.calendar.events.insert({
        calendarId: "primary",
        resource: eventBody,
      });
      result.doctor = res.data.id;
      logger.info(`Calendar event created for doctor ${appointment.doctorId}: ${result.doctor}`);
    } catch (err) {
      logger.error(`Failed to create doctor calendar event: ${err.message}`);
    }
  }

  return result;
};

// ─── updateCalendarEvents ─────────────────────────────────────────────────────
// Updates existing calendar events when an appointment is rescheduled.
const updateCalendarEvents = async (appointment) => {
  const [patientData, doctorData] = await Promise.all([
    getCalendarForUser(appointment.patientId),
    getCalendarForUser(appointment.doctorId),
  ]);

  const eventBody = buildEventBody(appointment, patientData.name, doctorData.name);

  const updates = [];

  if (patientData.calendar && appointment.calendarEventId?.patient) {
    updates.push(
      patientData.calendar.events
        .update({
          calendarId: "primary",
          eventId: appointment.calendarEventId.patient,
          resource: eventBody,
        })
        .then(() => logger.info(`Calendar event updated for patient ${appointment.patientId}`))
        .catch((e) => logger.error(`Failed to update patient calendar event: ${e.message}`))
    );
  }

  if (doctorData.calendar && appointment.calendarEventId?.doctor) {
    updates.push(
      doctorData.calendar.events
        .update({
          calendarId: "primary",
          eventId: appointment.calendarEventId.doctor,
          resource: eventBody,
        })
        .then(() => logger.info(`Calendar event updated for doctor ${appointment.doctorId}`))
        .catch((e) => logger.error(`Failed to update doctor calendar event: ${e.message}`))
    );
  }

  await Promise.allSettled(updates);
};

// ─── deleteCalendarEvents ─────────────────────────────────────────────────────
// Deletes calendar events on cancellation.
// Called by leave conflict handler and patient cancellation flow.
const deleteCalendarEvents = async (appointment) => {
  const [patientData, doctorData] = await Promise.all([
    getCalendarForUser(appointment.patientId),
    getCalendarForUser(appointment.doctorId),
  ]);

  const deletions = [];

  if (patientData.calendar && appointment.calendarEventId?.patient) {
    deletions.push(
      patientData.calendar.events
        .delete({
          calendarId: "primary",
          eventId: appointment.calendarEventId.patient,
        })
        .then(() => logger.info(`Calendar event deleted for patient ${appointment.patientId}`))
        .catch((e) => logger.error(`Failed to delete patient calendar event: ${e.message}`))
    );
  }

  if (doctorData.calendar && appointment.calendarEventId?.doctor) {
    deletions.push(
      doctorData.calendar.events
        .delete({
          calendarId: "primary",
          eventId: appointment.calendarEventId.doctor,
        })
        .then(() => logger.info(`Calendar event deleted for doctor ${appointment.doctorId}`))
        .catch((e) => logger.error(`Failed to delete doctor calendar event: ${e.message}`))
    );
  }

  await Promise.allSettled(deletions);
};

module.exports = { createCalendarEvents, updateCalendarEvents, deleteCalendarEvents };
