const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger");

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || 30000;

let _genAI = null;
const getGenAI = () => {
  if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return _genAI;
};

// ─── Core caller ──────────────────────────────────────────────────────────────
// Retries up to 2 times on timeout or network error.
const callGemini = async (systemPrompt, userPrompt, retries = 2) => {
  const model = getGenAI().getGenerativeModel({
    model: MODEL,
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const geminiCall = model.generateContent(userPrompt).then(
        (res) => res.response.text()?.trim() ?? ""
      );
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`LLM call timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
      );
      return await Promise.race([geminiCall, timeout]);
    } catch (err) {
      if (attempt === retries) throw err;
      logger.warn(`LLM attempt ${attempt} failed: ${err.message} — retrying...`);
    }
  }
};

// ─── Robust JSON extractor ────────────────────────────────────────────────────
// Handles all known Gemini response quirks:
//   1. Wrapped in ```json ... ``` code fences
//   2. Extra text before/after the JSON object
//   3. Truncated / unterminated strings — attempts to repair by closing open
//      strings, arrays, and objects before parsing
const extractJSON = (raw) => {
  // Step 1: strip markdown code fences
  let text = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  // Step 2: extract the first {...} block in case there's surrounding text
  const braceStart = text.indexOf("{");
  const braceEnd   = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    text = text.slice(braceStart, braceEnd + 1);
  }

  // Step 3: try parsing as-is
  try {
    return JSON.parse(text);
  } catch (_) {}

  // Step 4: attempt to repair truncated JSON
  // Close any unterminated string by appending a quote, then close open
  // arrays and objects in reverse order
  try {
    let repaired = text;

    // Count unmatched quotes to detect open string
    const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) repaired += '"';

    // Close open arrays and objects
    const stack = [];
    for (const ch of repaired) {
      if (ch === "{") stack.push("}");
      else if (ch === "[") stack.push("]");
      else if (ch === "}" || ch === "]") stack.pop();
    }
    repaired += stack.reverse().join("");

    return JSON.parse(repaired);
  } catch (_) {}

  throw new Error(`Could not parse LLM response as JSON: ${raw.slice(0, 100)}`);
};

// ─── Pre-visit summary ────────────────────────────────────────────────────────
const generatePreVisitSummary = async (symptomText) => {
  const systemPrompt = `You are a clinical triage assistant.
Analyse the patient's symptoms and respond ONLY with valid JSON — no extra text, no markdown, no code fences.
Use exactly this structure:
{"urgency":"Medium","chiefComplaint":"Brief one-sentence description under 20 words","suggestedQuestions":["Doctor question 1","Doctor question 2","Doctor question 3"],"documentsToCarry":["Document or report 1","Document or report 2","Document or report 3"]}
Rules:
- urgency: must be exactly "Low", "Medium", or "High"
- chiefComplaint: one sentence, under 20 words
- suggestedQuestions: exactly 3 short questions a doctor should ask the patient, each under 15 words
- documentsToCarry: exactly 3 specific reports or documents the patient should bring, each under 12 words
- Output raw JSON only — no explanation, no markdown`;

  if (symptomText.length > 800)
    logger.warn(`Pre-visit symptom text truncated from ${symptomText.length} to 800 chars`);
  const userPrompt = `Patient symptoms: ${symptomText.slice(0, 800)}`;

  try {
    const raw = await callGemini(systemPrompt, userPrompt);
    const parsed = extractJSON(raw);

    // Normalise and validate each field — use safe defaults for partial responses
    const urgency = ["Low", "Medium", "High"].includes(parsed.urgency)
      ? parsed.urgency
      : "Medium";

    const chiefComplaint = typeof parsed.chiefComplaint === "string" && parsed.chiefComplaint.trim()
      ? parsed.chiefComplaint.trim()
      : "Symptoms require medical evaluation.";

    const DEFAULT_QUESTIONS = [
      "Can you describe when the symptoms started?",
      "Have you experienced this before?",
      "Are you currently taking any medication?",
    ];
    const DEFAULT_DOCS = [
      "List of current medications and supplements",
      "Any recent lab reports or test results",
      "Government ID and health insurance card",
    ];

    const rawQuestions = Array.isArray(parsed.suggestedQuestions)
      ? parsed.suggestedQuestions.filter(q => typeof q === "string" && q.trim()).slice(0, 3)
      : [];
    const suggestedQuestions = [
      ...rawQuestions,
      ...DEFAULT_QUESTIONS.slice(rawQuestions.length),
    ];

    const rawDocs = Array.isArray(parsed.documentsToCarry)
      ? parsed.documentsToCarry.filter(d => typeof d === "string" && d.trim()).slice(0, 3)
      : [];
    const documentsToCarry = [
      ...rawDocs,
      ...DEFAULT_DOCS.slice(rawDocs.length),
    ];

    // If all meaningful fields fell through to defaults, treat as fallback
    const allDefaults =
      chiefComplaint === "Symptoms require medical evaluation." &&
      rawQuestions.length === 0 &&
      rawDocs.length === 0;

    logger.info("Pre-visit summary generated successfully");
    return {
      urgency,
      chiefComplaint,
      suggestedQuestions,
      documentsToCarry,
      generatedAt: new Date(),
      isFallback: allDefaults,
    };
  } catch (err) {
    logger.error(`Pre-visit LLM failure: ${err.message}`);
    return {
      urgency: null,
      chiefComplaint: "AI summary unavailable — raw symptoms shown below.",
      suggestedQuestions: [
        "Can you describe when the symptoms started?",
        "Have you experienced this before?",
        "Are you currently taking any medication?",
      ],
      documentsToCarry: [
        "List of current medications and supplements",
        "Any recent lab reports or test results",
        "Government ID and health insurance card",
      ],
      generatedAt: new Date(),
      isFallback: true,
    };
  }
};

// ─── Post-visit summary ───────────────────────────────────────────────────────
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
Keep the tone warm, reassuring, and concise (under 200 words). Output plain text only — no markdown, no bullet symbols.`;

  if (clinicalNotes.length > 1500)
    logger.warn(`Post-visit clinical notes truncated from ${clinicalNotes.length} to 1500 chars`);
  const userPrompt = `Clinical notes:\n${clinicalNotes.slice(0, 1500)}\n\nPrescription:\n${prescriptionText}`;

  try {
    const raw = await callGemini(systemPrompt, userPrompt);
    // Strip markdown symbols Gemini sometimes emits despite instructions
    const summary = raw
      ? raw.replace(/^#{1,6}\s+/gm, "").replace(/[*_`]/g, "").trim()
      : "";
    if (!summary || summary.length < 10)
      throw new Error("LLM returned empty post-visit summary");

    logger.info("Post-visit summary generated successfully");
    return {
      patientFriendlySummary: summary,
      generatedAt: new Date(),
      isFallback: false,
    };
  } catch (err) {
    logger.error(`Post-visit LLM failure: ${err.message}`);
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
