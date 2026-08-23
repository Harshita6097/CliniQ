/**
 * Seed script — Task 17
 * Creates the first admin account + one sample doctor (optional).
 *
 * Usage:
 *   node scripts/seed.js
 *   node scripts/seed.js --admin-email=admin@example.com --admin-password=secret123
 *
 * Flags (all optional — defaults shown below):
 *   --admin-name      "System Admin"
 *   --admin-email     admin@healthcare.local
 *   --admin-password  Admin@1234
 *   --skip-doctor     skip sample doctor creation
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoose      = require("mongoose");
const User          = require("../src/models/User");
const DoctorProfile = require("../src/models/DoctorProfile");

// ─── Parse CLI args ───────────────────────────────────────────────────────────
const arg = (flag, fallback) => {
  const match = process.argv.find((a) => a.startsWith(`--${flag}=`));
  return match ? match.split("=").slice(1).join("=") : fallback;
};

const ADMIN_NAME     = arg("admin-name",     "System Admin");
const ADMIN_EMAIL    = arg("admin-email",    "admin@healthcare.local");
const ADMIN_PASSWORD = arg("admin-password", "Admin@1234");
const SKIP_DOCTOR    = process.argv.includes("--skip-doctor");

// ─── Sample doctor data ───────────────────────────────────────────────────────
const SAMPLE_DOCTOR = {
  name:            "Dr. Sample Doctor",
  email:           "doctor@healthcare.local",
  password:        "Doctor@1234",
  specialization:  "General Physician",
  slotDurationMins: 30,
  consultationFee:  500,
  workingHours: [
    { day: "Monday",    start: "09:00", end: "17:00" },
    { day: "Tuesday",   start: "09:00", end: "17:00" },
    { day: "Wednesday", start: "09:00", end: "17:00" },
    { day: "Thursday",  start: "09:00", end: "17:00" },
    { day: "Friday",    start: "09:00", end: "13:00" },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const log  = (msg) => console.log(`  \u2713  ${msg}`);
const warn = (msg) => console.log(`  \u26a0  ${msg}`);
const fail = (msg) => console.error(`  \u2717  ${msg}`);

// ─── Seed admin ───────────────────────────────────────────────────────────────
const seedAdmin = async () => {
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    warn(`Admin already exists: ${ADMIN_EMAIL} — skipping.`);
    return;
  }

  await User.create({
    name:         ADMIN_NAME,
    email:        ADMIN_EMAIL,
    passwordHash: ADMIN_PASSWORD, // pre-save hook hashes this
    role:         "admin",
  });

  log(`Admin created: ${ADMIN_EMAIL}`);
};

// ─── Seed sample doctor ───────────────────────────────────────────────────────
const seedDoctor = async () => {
  const existing = await User.findOne({ email: SAMPLE_DOCTOR.email });
  if (existing) {
    warn(`Sample doctor already exists: ${SAMPLE_DOCTOR.email} — skipping.`);
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const [user] = await User.create(
      [{ name: SAMPLE_DOCTOR.name, email: SAMPLE_DOCTOR.email, passwordHash: SAMPLE_DOCTOR.password, role: "doctor" }],
      { session }
    );

    await DoctorProfile.create(
      [{
        userId:           user._id,
        specialization:   SAMPLE_DOCTOR.specialization,
        slotDurationMins: SAMPLE_DOCTOR.slotDurationMins,
        consultationFee:  SAMPLE_DOCTOR.consultationFee,
        workingHours:     SAMPLE_DOCTOR.workingHours,
      }],
      { session }
    );

    await session.commitTransaction();
    log(`Sample doctor created: ${SAMPLE_DOCTOR.email}`);
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const run = async () => {
  if (!process.env.MONGO_URI) {
    fail("MONGO_URI is not set. Create a .env file from .env.example first.");
    process.exit(1);
  }

  console.log("\n CliniQ — Seed Script\n");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    log("Connected to MongoDB");

    await seedAdmin();
    if (!SKIP_DOCTOR) await seedDoctor();

    console.log("\n Seed complete.\n");
    console.log(`  Admin login:  ${ADMIN_EMAIL}  /  ${ADMIN_PASSWORD}`);
    if (!SKIP_DOCTOR) {
      console.log(`  Doctor login: ${SAMPLE_DOCTOR.email}  /  ${SAMPLE_DOCTOR.password}`);
    }
    console.log("\n  Change these passwords immediately after first login.\n");
  } catch (e) {
    fail(`Seed failed: ${e.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

run();
