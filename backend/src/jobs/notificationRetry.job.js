const cron = require("node-cron");
const { processRetryQueue } = require("../services/notification.service");
const logger = require("../utils/logger");

// Runs every 5 minutes — picks up queued notifications whose nextRetryAt has elapsed
// and attempts to send them with exponential backoff (2, 4, 8, 16, 32 minutes).
// After MAX_NOTIFICATION_RETRIES failures the notification is marked "failed"
// and left visible in the admin notification dashboard.
const start = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      await processRetryQueue();
    } catch (err) {
      logger.error(`Notification retry job error: ${err.message}`);
    }
  });

  logger.info("Notification retry job scheduled — runs every 5 minutes");
};

module.exports = { start };
