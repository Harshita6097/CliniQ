require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Notification = require("../src/models/Notification");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const r = await Notification.updateMany(
    { status: { $in: ["queued", "failed"] } },
    { $set: { retryCount: 0, nextRetryAt: new Date(), status: "queued", errorMessage: null } }
  );
  console.log("Reset", r.modifiedCount, "notifications");
  mongoose.disconnect();
});
