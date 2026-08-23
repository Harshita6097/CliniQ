const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger");

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || 10000;

// Lazy-initialise so the module loads safely without GEMINI_API_KEY set at import time.
let _genAI = null;
const getGenAI = () => {
  if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return _genAI;
};

// ─── Core caller ──────────────────────────────────────────────────────────────
// Wraps every Gemini call with a hard timeout and structured error logging.
// Returns the response text or throws — callers decide on fallback.
const callGemini = (systemPrompt, userPrompt) => {
  const model = getGenAI().getGenerativeModel({
    model: MODEL,
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
  });

  const geminiCall = model.generateContent(userPrompt).then(
    (res) => res.response.text()?.trim() ?? ""
  );

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`LLM call timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
  );

  return Promise.race([geminiCall, timeout]);
};

// ─── Pre-visit summary ────────────────────────────────────────────────────────
// Called when patient submits symptom form, before confirming booking.
// Returns: { urgency, chiefComplaint, suggestedQuestions[], generatedAt, isFallback }
const generatePreVisitSummary = async (symptomText) => {
  const systemPrompt = `You are a clinical triage assistant. 
Analyse the patient's symptoms and respond ONLY with valid JSON in this exact shape:
{
  "urgency": "Low" | "Medium" | "High",
  "chiefComplaint": "<one sentence>",
  "suggestedQuestions": ["<question 1>", "<question 2>", "<question 3>"]
}
Do not include any text outside the JSON object.`;

  const userPrompt = `Patient symptoms: ${symptomText}`;

  try {
    const raw = await callGemini(systemPrompt, userPrompt);

    // Strip markdown code fences if model wraps response in ```json ... ```
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(cleaned);

    // Validate shape — fall back if model returned unexpected structure
    if (
      !["Low", "Medium", "High"].includes(parsed.urgency) ||
      typeof parsed.chiefComplaint !== "string" ||
      !Array.isArray(parsed.suggestedQuestions)
    ) {
      throw new Error("LLM returned unexpected JSON shape for pre-visit summary");
    }

    logger.info("Pre-visit summary generated successfully");
    return {
      urgency: parsed.urgency,
      chiefComplaint: parsed.chiefComplaint,
      suggestedQuestions: parsed.suggestedQuestions.slice(0, 3),
      generatedAt: new Date(),
      isFallback: false,
    };
  } catch (err) {
    logger.error(`Pre-visit LLM failure: ${err.message}`);
    // Graceful fallback — booking flow continues uninterrupted
    return {
      urgency: null,
      chiefComplaint: "AI summary unavailable — raw symptoms shown below.",
      suggestedQuestions: [
        "Can you describe when the symptoms started?",
        "Have you experienced this before?",
        "Are you currently taking any medication?",
      ],
      generatedAt: new Date(),
      isFallback: true,
    };
  }
};

// ─── Post-visit summary ───────────────────────────────────────────────────────
// Called when doctor submits post-visit notes + prescription.
// Returns: { patientFriendlySummary, generatedAt, isFallback }
const generatePostVisitSummary = async (clinicalNotes, prescription = []) => {
  const prescriptionText =
    prescription.length > 0
      ? prescription
          .map(
            (p) =>
              `${p.medicine} ${p.dosage} — ${p.frequency} for ${p.durationDays} day(s)${p.notes ? ` (${p.notes})` : ""}`
          )
          .join("\n")
      : "No medication prescribed.";

  const systemPrompt = `You are a patient communication assistant in a healthcare app.
Convert the doctor's clinical notes into a clear, friendly summary a non-medical patient can understand.
Include:
1. What was found / diagnosed (in plain language)
2. Medication schedule (if any)
3. Follow-up steps or lifestyle advice
Keep the tone warm, reassuring, and concise (under 200 words).`;

  const userPrompt = `Clinical notes:\n${clinicalNotes}\n\nPrescription:\n${prescriptionText}`;

  try {
    const summary = await callGemini(systemPrompt, userPrompt);
    if (!summary) throw new Error("LLM returned empty post-visit summary");

    logger.info("Post-visit summary generated successfully");
    return {
      patientFriendlySummary: summary,
      generatedAt: new Date(),
      isFallback: false,
    };
  } catch (err) {
    logger.error(`Post-visit LLM failure: ${err.message}`);
    // Graceful fallback — notes submission flow continues uninterrupted
    const fallbackLines = [
      "AI summary is currently unavailable. Here are your visit details:",
      "",
      `Doctor's notes: ${clinicalNotes}`,
      "",
      prescription.length > 0
        ? `Prescription:\n${prescriptionText}`
        : "No medication was prescribed.",
      "",
      "Please contact your doctor if you have any questions.",
    ];
    return {
      patientFriendlySummary: fallbackLines.join("\n"),
      generatedAt: new Date(),
      isFallback: true,
    };
  }
};

module.exports = { generatePreVisitSummary, generatePostVisitSummary };
