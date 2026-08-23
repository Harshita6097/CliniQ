const { addMinutes } = require("date-fns");

// Day name lookup — avoids locale-dependent Date.toLocaleDateString
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Generates all possible time slots for a doctor on a given date.
 * All times are treated as UTC to stay consistent with MongoDB storage.
 * Slots that have already started are excluded when the date is today.
 *
 * @param {string} date             - "YYYY-MM-DD"
 * @param {Array}  workingHours     - [{ day, start, end }] from DoctorProfile
 * @param {number} slotDurationMins - e.g. 30
 * @returns {Array<{ slotStart: Date, slotEnd: Date }>}
 */
const generateSlotsForDate = (date, workingHours, slotDurationMins) => {
  // Parse date parts manually to avoid timezone shifts
  const [year, month, day] = date.split("-").map(Number);
  const baseDate = new Date(Date.UTC(year, month - 1, day));
  const dayName = DAY_NAMES[baseDate.getUTCDay()];

  const daySchedule = workingHours.find((wh) => wh.day === dayName);
  if (!daySchedule) return [];

  const [startHour, startMin] = daySchedule.start.split(":").map(Number);
  const [endHour, endMin] = daySchedule.end.split(":").map(Number);

  let cursor = new Date(Date.UTC(year, month - 1, day, startHour, startMin));
  const dayEnd = new Date(Date.UTC(year, month - 1, day, endHour, endMin));

  // Guard: if start >= end (misconfigured working hours), return empty
  if (cursor >= dayEnd) return [];

  const now = new Date();
  const slots = [];
  while (true) {
    const slotEnd = addMinutes(cursor, slotDurationMins);
    if (slotEnd > dayEnd) break;
    // Skip slots that have already started
    if (cursor > now) slots.push({ slotStart: new Date(cursor), slotEnd });
    cursor = slotEnd;
  }

  return slots;
};

module.exports = { generateSlotsForDate };
