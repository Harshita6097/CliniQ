/**
 * Concurrency test — double-booking prevention
 *
 * Fires N simultaneous hold requests for the same doctor slot and asserts
 * that exactly one succeeds (HTTP 201) and the rest are rejected (HTTP 409).
 *
 * Prerequisites:
 *   - Backend running on http://localhost:5000
 *   - A seeded patient JWT and doctor userId available (see setup below)
 *
 * Run:
 *   node tests/concurrency.test.js
 */

const http = require("http");

// ─── Configuration ────────────────────────────────────────────────────────────
// Replace these with values from your seeded database before running.
const BASE_URL   = "http://localhost:5000";
const PATIENT_JWT = process.env.TEST_PATIENT_JWT || "<patient_jwt_here>";
const DOCTOR_ID   = process.env.TEST_DOCTOR_ID   || "<doctor_user_id_here>";

// A future slot — must be a valid working-hours slot for the doctor above
const SLOT_START = process.env.TEST_SLOT_START || "2026-12-01T09:00:00.000Z";
const SLOT_END   = process.env.TEST_SLOT_END   || "2026-12-01T09:30:00.000Z";

const CONCURRENT_REQUESTS = 10;

// ─── HTTP helper ──────────────────────────────────────────────────────────────
const postJSON = (path, body, token) =>
  new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        Authorization: `Bearer ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (_) { resolve({ status: res.statusCode, body: data }); }
      });
    });

    req.on("error", (err) => resolve({ status: 0, error: err.message }));
    req.write(payload);
    req.end();
  });

// ─── Test runner ──────────────────────────────────────────────────────────────
const run = async () => {
  console.log(`\nFiring ${CONCURRENT_REQUESTS} simultaneous hold requests for the same slot...`);
  console.log(`Slot: ${SLOT_START} → ${SLOT_END}\n`);

  const requests = Array.from({ length: CONCURRENT_REQUESTS }, () =>
    postJSON(
      "/api/patient/appointments/hold",
      { doctorId: DOCTOR_ID, slotStart: SLOT_START, slotEnd: SLOT_END },
      PATIENT_JWT
    )
  );

  const results = await Promise.all(requests);

  const succeeded = results.filter((r) => r.status === 201);
  const rejected  = results.filter((r) => r.status === 409);
  const errors    = results.filter((r) => r.status !== 201 && r.status !== 409);

  console.log(`Results:`);
  console.log(`  ✅ 201 (held):     ${succeeded.length}`);
  console.log(`  ⛔ 409 (conflict): ${rejected.length}`);
  console.log(`  ❌ Other errors:   ${errors.length}`);

  if (errors.length > 0) {
    console.log("\nUnexpected responses:");
    errors.forEach((r) => console.log(`  status=${r.status}`, r.body || r.error));
  }

  // ─── Assertions ───────────────────────────────────────────────────────────
  let passed = true;

  if (succeeded.length !== 1) {
    console.error(`\n❌ FAIL: Expected exactly 1 success, got ${succeeded.length}`);
    passed = false;
  }

  if (rejected.length !== CONCURRENT_REQUESTS - 1) {
    console.error(`❌ FAIL: Expected ${CONCURRENT_REQUESTS - 1} rejections, got ${rejected.length}`);
    passed = false;
  }

  if (passed) {
    console.log("\n✅ PASS: Double-booking prevention works correctly under concurrent load.");
  }

  process.exit(passed ? 0 : 1);
};

run();
