/**
 * Demo Seed Script — CliniQ
 * Populates the database with realistic demo data for evaluation.
 *
 * Creates:
 *   - 1 Admin
 *   - 5 Doctors (different specializations)
 *   - 4 Patients
 *   - Appointments in all statuses: confirmed, completed (with prescriptions), cancelled
 *
 * Usage:
 *   node scripts/seedDemo.js
 *
 * Safe to re-run — skips any user that already exists by email.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const User = require("../src/models/User");
const DoctorProfile = require("../src/models/DoctorProfile");
const Appointment = require("../src/models/Appointment");
const AppointmentStatusHistory = require("../src/models/AppointmentStatusHistory");

const log  = (msg) => console.log(`  ✓  ${msg}`);
const warn = (msg) => console.log(`  ⚠  ${msg}`);
const fail = (msg) => console.error(`  ✗  ${msg}`);

// ─── Users ────────────────────────────────────────────────────────────────────

const ADMIN = {
  name: "System Admin",
  email: "admin@cliniq.demo",
  password: "Admin@1234",
  role: "admin",
};

const DOCTORS = [
  {
    name: "Dr. Priya Sharma",
    email: "priya.sharma@cliniq.demo",
    password: "Doctor@1234",
    phone: "+91 98100 11001",
    profile: {
      specialization: "Cardiologist",
      qualifications: "MBBS, MD (Cardiology), DM — AIIMS Delhi",
      bio: "15 years of experience in interventional cardiology. Special interest in preventive cardiac care and heart failure management.",
      slotDurationMins: 30,
      consultationFee: 1200,
      workingHours: [
        { day: "Monday",    start: "09:00", end: "13:00" },
        { day: "Tuesday",   start: "09:00", end: "13:00" },
        { day: "Wednesday", start: "14:00", end: "18:00" },
        { day: "Thursday",  start: "09:00", end: "13:00" },
        { day: "Friday",    start: "09:00", end: "12:00" },
      ],
    },
  },
  {
    name: "Dr. Arjun Mehta",
    email: "arjun.mehta@cliniq.demo",
    password: "Doctor@1234",
    phone: "+91 98100 22002",
    profile: {
      specialization: "Dermatologist",
      qualifications: "MBBS, MD (Dermatology) — KEM Hospital Mumbai",
      bio: "Expert in medical and cosmetic dermatology with over 10 years of practice. Specialises in acne, eczema, psoriasis, and skin cancer screening.",
      slotDurationMins: 20,
      consultationFee: 800,
      workingHours: [
        { day: "Monday",    start: "10:00", end: "14:00" },
        { day: "Wednesday", start: "10:00", end: "14:00" },
        { day: "Friday",    start: "10:00", end: "16:00" },
        { day: "Saturday",  start: "09:00", end: "13:00" },
      ],
    },
  },
  {
    name: "Dr. Sneha Iyer",
    email: "sneha.iyer@cliniq.demo",
    password: "Doctor@1234",
    phone: "+91 98100 33003",
    profile: {
      specialization: "Pediatrician",
      qualifications: "MBBS, DCH, MD (Pediatrics) — CMC Vellore",
      bio: "Dedicated to child health from newborns to adolescents. Special focus on developmental paediatrics, vaccinations, and nutritional guidance.",
      slotDurationMins: 30,
      consultationFee: 700,
      workingHours: [
        { day: "Monday",    start: "09:00", end: "17:00" },
        { day: "Tuesday",   start: "09:00", end: "17:00" },
        { day: "Thursday",  start: "09:00", end: "17:00" },
        { day: "Friday",    start: "09:00", end: "13:00" },
      ],
    },
  },
  {
    name: "Dr. Rohan Kapoor",
    email: "rohan.kapoor@cliniq.demo",
    password: "Doctor@1234",
    phone: "+91 98100 44004",
    profile: {
      specialization: "Orthopedic Surgeon",
      qualifications: "MBBS, MS (Orthopaedics) — PGIMER Chandigarh",
      bio: "Specialist in joint replacement, sports injuries, and spine disorders. Over 12 years of surgical experience with 2000+ successful procedures.",
      slotDurationMins: 30,
      consultationFee: 1000,
      workingHours: [
        { day: "Tuesday",   start: "10:00", end: "14:00" },
        { day: "Wednesday", start: "10:00", end: "14:00" },
        { day: "Thursday",  start: "10:00", end: "14:00" },
        { day: "Saturday",  start: "09:00", end: "12:00" },
      ],
    },
  },
  {
    name: "Dr. Meera Nair",
    email: "meera.nair@cliniq.demo",
    password: "Doctor@1234",
    phone: "+91 98100 55005",
    profile: {
      specialization: "General Physician",
      qualifications: "MBBS, MD (General Medicine) — Kasturba Medical College",
      bio: "Primary care physician with 8 years of experience. Handles general health concerns, chronic disease management, and preventive care.",
      slotDurationMins: 15,
      consultationFee: 500,
      workingHours: [
        { day: "Monday",    start: "08:00", end: "12:00" },
        { day: "Tuesday",   start: "08:00", end: "12:00" },
        { day: "Wednesday", start: "08:00", end: "12:00" },
        { day: "Thursday",  start: "08:00", end: "12:00" },
        { day: "Friday",    start: "08:00", end: "12:00" },
        { day: "Saturday",  start: "09:00", end: "11:00" },
      ],
    },
  },
];

const PATIENTS = [
  {
    name: "Rahul Verma",
    email: "rahul.verma@cliniq.demo",
    password: "Patient@1234",
    phone: "+91 99001 10001",
    role: "patient",
  },
  {
    name: "Ananya Singh",
    email: "ananya.singh@cliniq.demo",
    password: "Patient@1234",
    phone: "+91 99001 20002",
    role: "patient",
  },
  {
    name: "Vikram Patel",
    email: "vikram.patel@cliniq.demo",
    password: "Patient@1234",
    phone: "+91 99001 30003",
    role: "patient",
  },
  {
    name: "Kavya Reddy",
    email: "kavya.reddy@cliniq.demo",
    password: "Patient@1234",
    phone: "+91 99001 40004",
    role: "patient",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Returns a UTC Date for a given days-offset from today at a specific HH:MM
const slotDate = (daysOffset, hour, minute = 0) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysOffset);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
};

const createHistory = async (appointmentId, entries) => {
  await AppointmentStatusHistory.insertMany(
    entries.map((e) => ({ appointmentId, ...e }))
  );
};

// ─── Seed users ───────────────────────────────────────────────────────────────

const seedUser = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    warn(`User already exists: ${data.email} — skipping`);
    return existing;
  }
  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash: data.password,
    role: data.role || "doctor",
    phone: data.phone || null,
  });
  log(`Created ${user.role}: ${user.email}`);
  return user;
};

// ─── Seed doctors ─────────────────────────────────────────────────────────────

const seedDoctors = async () => {
  const doctorUsers = [];
  for (const d of DOCTORS) {
    const user = await seedUser(d);
    const existingProfile = await DoctorProfile.findOne({ userId: user._id });
    if (!existingProfile) {
      await DoctorProfile.create({ userId: user._id, ...d.profile });
      log(`Created profile for ${user.name}`);
    }
    doctorUsers.push(user);
  }
  return doctorUsers;
};

// ─── Seed appointments ────────────────────────────────────────────────────────

const seedAppointments = async (doctors, patients) => {
  const [drPriya, drArjun, drSneha, drRohan, drMeera] = doctors;
  const [rahul, ananya, vikram, kavya] = patients;

  const appts = [];

  // ── 1. COMPLETED — Rahul with Dr. Priya (Cardiology) ──────────────────────
  const c1Start = slotDate(-10, 10, 0);
  const c1End   = slotDate(-10, 10, 30);
  const appt1 = await Appointment.create({
    patientId: rahul._id,
    doctorId: drPriya._id,
    slotStart: c1Start,
    slotEnd: c1End,
    status: "completed",
    symptomFormText: "Chest discomfort for the past 2 weeks, mild shortness of breath on exertion, occasional palpitations.",
    preVisitSummary: {
      urgency: "High",
      chiefComplaint: "Chest discomfort with shortness of breath and palpitations for two weeks.",
      suggestedQuestions: [
        "Does the chest discomfort radiate to your arm or jaw?",
        "Do you have a family history of heart disease?",
        "Are you currently on any blood pressure or cholesterol medication?",
      ],
      documentsToCarry: [
        "Previous ECG reports if available",
        "Blood pressure readings from the past month",
        "List of current medications",
      ],
      generatedAt: c1Start,
      isFallback: false,
    },
    postVisitNotes: "Patient presented with atypical chest pain. ECG normal. BP 138/88. Advised lifestyle modification, low-sodium diet, and daily 30-min walk. Prescribed antihypertensive and statin. Follow-up in 4 weeks.",
    postVisitSummary: {
      patientFriendlySummary: "Your visit went well. Your ECG looks normal, which is reassuring. Your blood pressure is slightly elevated, so Dr. Sharma has prescribed a medication to help bring it down along with a statin to manage cholesterol. The most important thing right now is to reduce salt in your diet and go for a 30-minute walk every day. Please come back in 4 weeks so we can check how you are responding to the medication.",
      generatedAt: slotDate(-10, 11, 0),
      isFallback: false,
    },
    prescription: [
      { medicine: "Amlodipine", dosage: "5mg", frequency: "Once daily", durationDays: 30, notes: "Take in the morning with water" },
      { medicine: "Atorvastatin", dosage: "10mg", frequency: "Once daily", durationDays: 30, notes: "Take at night after dinner" },
      { medicine: "Aspirin", dosage: "75mg", frequency: "Once daily", durationDays: 30, notes: "Take after breakfast" },
    ],
  });
  await createHistory(appt1._id, [
    { fromStatus: null, toStatus: "held", reason: "Appointment booked by patient", changedBy: rahul._id },
    { fromStatus: "held", toStatus: "confirmed", reason: "Patient confirmed booking", changedBy: rahul._id },
    { fromStatus: "confirmed", toStatus: "completed", reason: "Doctor submitted post-visit notes", changedBy: drPriya._id },
  ]);
  log("Created completed appointment: Rahul → Dr. Priya (Cardiology)");
  appts.push(appt1);

  // ── 2. COMPLETED — Ananya with Dr. Arjun (Dermatology) ────────────────────
  const c2Start = slotDate(-5, 10, 0);
  const c2End   = slotDate(-5, 10, 20);
  const appt2 = await Appointment.create({
    patientId: ananya._id,
    doctorId: drArjun._id,
    slotStart: c2Start,
    slotEnd: c2End,
    status: "completed",
    symptomFormText: "Persistent acne on face and back for 6 months. Tried over-the-counter creams with no improvement. Skin feels oily.",
    preVisitSummary: {
      urgency: "Low",
      chiefComplaint: "Persistent acne on face and back unresponsive to OTC treatment for six months.",
      suggestedQuestions: [
        "Have you noticed any triggers like stress or diet that worsen the acne?",
        "Are you currently on any hormonal medications or contraceptives?",
        "Have you had any allergic reactions to skincare products before?",
      ],
      documentsToCarry: [
        "List of skincare products currently in use",
        "Photos of affected areas taken over the past month",
        "Any previous dermatology prescriptions",
      ],
      generatedAt: c2Start,
      isFallback: false,
    },
    postVisitNotes: "Moderate acne vulgaris — grade 2. Comedones and papules on face and upper back. Prescribed topical retinoid and antibiotic gel. Advised oil-free moisturiser and SPF 30 sunscreen. Review in 6 weeks.",
    postVisitSummary: {
      patientFriendlySummary: "Dr. Mehta has diagnosed you with moderate acne and prescribed two topical treatments — a retinoid cream to unclog pores and an antibiotic gel to reduce bacteria. Apply the retinoid only at night and always use a light, oil-free moisturiser and sunscreen during the day as the retinoid can make your skin sensitive to sunlight. Results typically take 6 to 8 weeks to show, so please be patient and consistent. Come back in 6 weeks for a review.",
      generatedAt: slotDate(-5, 11, 0),
      isFallback: false,
    },
    prescription: [
      { medicine: "Tretinoin Cream 0.025%", dosage: "Pea-sized amount", frequency: "Once daily at night", durationDays: 42, notes: "Apply only to affected areas. Avoid eye area." },
      { medicine: "Clindamycin Gel 1%", dosage: "Thin layer", frequency: "Twice daily", durationDays: 42, notes: "Apply morning and night after cleansing" },
    ],
  });
  await createHistory(appt2._id, [
    { fromStatus: null, toStatus: "held", reason: "Appointment booked by patient", changedBy: ananya._id },
    { fromStatus: "held", toStatus: "confirmed", reason: "Patient confirmed booking", changedBy: ananya._id },
    { fromStatus: "confirmed", toStatus: "completed", reason: "Doctor submitted post-visit notes", changedBy: drArjun._id },
  ]);
  log("Created completed appointment: Ananya → Dr. Arjun (Dermatology)");
  appts.push(appt2);

  // ── 3. COMPLETED — Vikram with Dr. Meera (General Physician) ──────────────
  const c3Start = slotDate(-3, 8, 0);
  const c3End   = slotDate(-3, 8, 15);
  const appt3 = await Appointment.create({
    patientId: vikram._id,
    doctorId: drMeera._id,
    slotStart: c3Start,
    slotEnd: c3End,
    status: "completed",
    symptomFormText: "Fever of 101°F for 3 days, sore throat, body aches, mild cough. No travel history.",
    preVisitSummary: {
      urgency: "Medium",
      chiefComplaint: "Three-day fever with sore throat, body aches, and mild cough.",
      suggestedQuestions: [
        "Have you been in contact with anyone who tested positive for flu or COVID recently?",
        "Do you have any difficulty swallowing or breathing?",
        "Have you taken any medication for the fever so far?",
      ],
      documentsToCarry: [
        "Temperature log if you have been tracking it",
        "List of any medications taken in the past week",
        "Previous blood reports if you have any chronic conditions",
      ],
      generatedAt: c3Start,
      isFallback: false,
    },
    postVisitNotes: "Viral upper respiratory tract infection. Throat mildly inflamed. No bacterial signs. Advised rest, fluids, steam inhalation. Prescribed antipyretic and antihistamine. Should resolve in 5-7 days.",
    postVisitSummary: {
      patientFriendlySummary: "You have a viral throat infection which is very common and should clear up on its own in 5 to 7 days. Dr. Nair has prescribed a fever-reducing medication and an antihistamine to help with the throat irritation. The most important things are to rest as much as possible, drink plenty of warm fluids, and try steam inhalation twice a day. You do not need antibiotics as this is a viral infection. If your fever goes above 103°F or you have difficulty breathing, please visit immediately.",
      generatedAt: slotDate(-3, 9, 0),
      isFallback: false,
    },
    prescription: [
      { medicine: "Paracetamol", dosage: "500mg", frequency: "Three times daily", durationDays: 5, notes: "Take after meals. Do not exceed 4 tablets in 24 hours." },
      { medicine: "Cetirizine", dosage: "10mg", frequency: "Once daily at night", durationDays: 5, notes: "May cause drowsiness" },
      { medicine: "Vitamin C", dosage: "500mg", frequency: "Once daily", durationDays: 7, notes: "Take after breakfast" },
    ],
  });
  await createHistory(appt3._id, [
    { fromStatus: null, toStatus: "held", reason: "Appointment booked by patient", changedBy: vikram._id },
    { fromStatus: "held", toStatus: "confirmed", reason: "Patient confirmed booking", changedBy: vikram._id },
    { fromStatus: "confirmed", toStatus: "completed", reason: "Doctor submitted post-visit notes", changedBy: drMeera._id },
  ]);
  log("Created completed appointment: Vikram → Dr. Meera (General Physician)");
  appts.push(appt3);

  // ── 4. CONFIRMED — Rahul with Dr. Rohan (Orthopaedics) — upcoming ─────────
  const conf1Start = slotDate(2, 10, 0);
  const conf1End   = slotDate(2, 10, 30);
  const appt4 = await Appointment.create({
    patientId: rahul._id,
    doctorId: drRohan._id,
    slotStart: conf1Start,
    slotEnd: conf1End,
    status: "confirmed",
    symptomFormText: "Right knee pain for 3 weeks after a football injury. Swelling and difficulty bending the knee fully. Pain worsens when climbing stairs.",
    preVisitSummary: {
      urgency: "Medium",
      chiefComplaint: "Right knee pain and swelling for three weeks following a football injury.",
      suggestedQuestions: [
        "Was there a popping sound at the time of injury?",
        "Can you bear full weight on the knee while standing?",
        "Have you had any previous knee injuries or surgeries?",
      ],
      documentsToCarry: [
        "X-ray of the right knee if already done",
        "MRI report if available",
        "List of any pain medications currently being taken",
      ],
      generatedAt: new Date(),
      isFallback: false,
    },
  });
  await createHistory(appt4._id, [
    { fromStatus: null, toStatus: "held", reason: "Appointment booked by patient", changedBy: rahul._id },
    { fromStatus: "held", toStatus: "confirmed", reason: "Patient confirmed booking", changedBy: rahul._id },
  ]);
  log("Created confirmed appointment: Rahul → Dr. Rohan (Orthopaedics) — upcoming");
  appts.push(appt4);

  // ── 5. CONFIRMED — Kavya with Dr. Sneha (Paediatrics) — upcoming ──────────
  const conf2Start = slotDate(3, 9, 0);
  const conf2End   = slotDate(3, 9, 30);
  const appt5 = await Appointment.create({
    patientId: kavya._id,
    doctorId: drSneha._id,
    slotStart: conf2Start,
    slotEnd: conf2End,
    status: "confirmed",
    symptomFormText: "My 4-year-old has had a recurring cough for 2 months, mostly at night. No fever. Slightly reduced appetite. Paediatrician visit overdue.",
    preVisitSummary: {
      urgency: "Medium",
      chiefComplaint: "Recurring nocturnal cough in a 4-year-old child for two months with reduced appetite.",
      suggestedQuestions: [
        "Does the cough worsen after physical activity or exposure to cold air?",
        "Is there any family history of asthma or allergies?",
        "Has the child's vaccination schedule been up to date?",
      ],
      documentsToCarry: [
        "Child's vaccination record",
        "Previous paediatric consultation notes if any",
        "List of any medications or supplements the child is taking",
      ],
      generatedAt: new Date(),
      isFallback: false,
    },
  });
  await createHistory(appt5._id, [
    { fromStatus: null, toStatus: "held", reason: "Appointment booked by patient", changedBy: kavya._id },
    { fromStatus: "held", toStatus: "confirmed", reason: "Patient confirmed booking", changedBy: kavya._id },
  ]);
  log("Created confirmed appointment: Kavya → Dr. Sneha (Paediatrics) — upcoming");
  appts.push(appt5);

  // ── 6. CONFIRMED — Ananya with Dr. Priya (Cardiology) — upcoming ──────────
  const conf3Start = slotDate(4, 9, 0);
  const conf3End   = slotDate(4, 9, 30);
  const appt6 = await Appointment.create({
    patientId: ananya._id,
    doctorId: drPriya._id,
    slotStart: conf3Start,
    slotEnd: conf3End,
    status: "confirmed",
    symptomFormText: "Occasional heart palpitations, especially after coffee. No chest pain. Feeling anxious about it. Family history of heart disease on father's side.",
    preVisitSummary: {
      urgency: "Medium",
      chiefComplaint: "Occasional heart palpitations after caffeine intake with family history of cardiac disease.",
      suggestedQuestions: [
        "How long do the palpitations last and how often do they occur?",
        "Do you experience dizziness or fainting during these episodes?",
        "What is your daily caffeine intake?",
      ],
      documentsToCarry: [
        "Any previous ECG or Holter monitor reports",
        "Family medical history documentation if available",
        "List of current medications and supplements",
      ],
      generatedAt: new Date(),
      isFallback: false,
    },
  });
  await createHistory(appt6._id, [
    { fromStatus: null, toStatus: "held", reason: "Appointment booked by patient", changedBy: ananya._id },
    { fromStatus: "held", toStatus: "confirmed", reason: "Patient confirmed booking", changedBy: ananya._id },
  ]);
  log("Created confirmed appointment: Ananya → Dr. Priya (Cardiology) — upcoming");
  appts.push(appt6);

  // ── 7. CANCELLED — Vikram with Dr. Rohan (Orthopaedics) ───────────────────
  const can1Start = slotDate(-1, 10, 0);
  const can1End   = slotDate(-1, 10, 30);
  const appt7 = await Appointment.create({
    patientId: vikram._id,
    doctorId: drRohan._id,
    slotStart: can1Start,
    slotEnd: can1End,
    status: "cancelled",
    symptomFormText: "Lower back pain radiating to left leg for 2 weeks.",
    cancellationReason: "Patient recovered and no longer needs the appointment.",
  });
  await createHistory(appt7._id, [
    { fromStatus: null, toStatus: "held", reason: "Appointment booked by patient", changedBy: vikram._id },
    { fromStatus: "held", toStatus: "confirmed", reason: "Patient confirmed booking", changedBy: vikram._id },
    { fromStatus: "confirmed", toStatus: "cancelled", reason: "Patient recovered and no longer needs the appointment.", changedBy: vikram._id },
  ]);
  log("Created cancelled appointment: Vikram → Dr. Rohan (Orthopaedics)");
  appts.push(appt7);

  // ── 8. CANCELLED — Kavya with Dr. Arjun (Dermatology) ────────────────────
  const can2Start = slotDate(-2, 10, 0);
  const can2End   = slotDate(-2, 10, 20);
  const appt8 = await Appointment.create({
    patientId: kavya._id,
    doctorId: drArjun._id,
    slotStart: can2Start,
    slotEnd: can2End,
    status: "cancelled",
    symptomFormText: "Rash on arms, possibly allergic reaction.",
    cancellationReason: "Doctor unavailable — leave marked by admin.",
  });
  await createHistory(appt8._id, [
    { fromStatus: null, toStatus: "held", reason: "Appointment booked by patient", changedBy: kavya._id },
    { fromStatus: "held", toStatus: "confirmed", reason: "Patient confirmed booking", changedBy: kavya._id },
    { fromStatus: "confirmed", toStatus: "cancelled", reason: "Doctor unavailable — leave marked by admin.", changedBy: null },
  ]);
  log("Created cancelled appointment: Kavya → Dr. Arjun (Dermatology)");
  appts.push(appt8);

  return appts;
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const run = async () => {
  if (!process.env.MONGO_URI) {
    fail("MONGO_URI is not set.");
    process.exit(1);
  }

  console.log("\n CliniQ — Demo Seed Script\n");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    log("Connected to MongoDB");

    // Admin
    await seedUser({ ...ADMIN, role: "admin" });

    // Doctors
    const doctorUsers = await seedDoctors();

    // Patients
    const patientUsers = [];
    for (const p of PATIENTS) {
      patientUsers.push(await seedUser(p));
    }

    // Appointments
    await seedAppointments(doctorUsers, patientUsers);

    console.log("\n ─────────────────────────────────────────────");
    console.log("  Demo seed complete!\n");
    console.log("  ADMIN");
    console.log(`    Email:    ${ADMIN.email}`);
    console.log(`    Password: ${ADMIN.password}\n`);
    console.log("  DOCTORS  (all use password: Doctor@1234)");
    DOCTORS.forEach((d) => console.log(`    ${d.profile.specialization.padEnd(22)} ${d.email}`));
    console.log("\n  PATIENTS  (all use password: Patient@1234)");
    PATIENTS.forEach((p) => console.log(`    ${p.name.padEnd(22)} ${p.email}`));
    console.log("\n  APPOINTMENTS");
    console.log("    3 × completed  (with prescriptions + AI summaries)");
    console.log("    3 × confirmed  (upcoming)");
    console.log("    2 × cancelled");
    console.log(" ─────────────────────────────────────────────\n");
  } catch (e) {
    fail(`Seed failed: ${e.message}`);
    console.error(e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

run();
