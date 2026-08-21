const cron = require("node-cron");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const AppointmentStatusHistory = require("../models/AppointmentStatusHistory");
const logger = require("../utils/logger");

// Runs every minute — releases held appointments whose holdExpiresAt has passed.
// This is what makes the 5-minute slot hold window work:
// if a patient abandons the symptom form, the slot becomes bookable again.
const start = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // Find all expired holds in one query (holdExpiresAt index makes this fast)
      const expired = await Appointment.find({
        status: "held",
        holdExpiresAt: { $lte: now },
      }).select("_id patientId doctorId slotStart");

      if (expired.length === 0) return;

      logger.info(`Hold cleanup: releasing ${expired.length} expired hold(s)`);

      // Cancel each in a transaction to keep history consistent
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const ids = expired.map((a) => a._id);

        await Appointment.updateMany(
          { _id: { $in: ids } },
          { status: "cancelled", cancellationReason: "Hold expired — patient did not complete booking" },
          { session }
        );

        const historyDocs = expired.map((a) => ({
          appointmentId: a._id,
          fromStatus: "held",
          toStatus: "cancelled",
          reason: "Hold expired — patient did not complete booking",
          changedBy: null, // system-triggered
        }));

        await AppointmentStatusHistory.insertMany(historyDocs, { session });
        await session.commitTransaction();

        logger.info(`Hold cleanup: released slots for appointments [${ids.join(", ")}]`);
      } catch (err) {
        await session.abortTransaction();
        logger.error(`Hold cleanup transaction failed: ${err.message}`);
      } finally {
        session.endSession();
      }
    } catch (err) {
      logger.error(`Hold cleanup job error: ${err.message}`);
    }
  });

  logger.info("Hold cleanup job scheduled — runs every minute");
};

module.exports = { start };
