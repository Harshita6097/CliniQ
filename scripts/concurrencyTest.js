/**
 * Concurrency test — run from project root
 *
 * Convenience wrapper that delegates to backend/tests/concurrency.test.js
 *
 * Usage from project root:
 *   TEST_PATIENT_JWT=<jwt> TEST_DOCTOR_ID=<id> TEST_SLOT_START=<iso> TEST_SLOT_END=<iso> node scripts/concurrencyTest.js
 */

require("../backend/tests/concurrency.test.js");
