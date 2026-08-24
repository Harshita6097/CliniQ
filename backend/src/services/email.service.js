const { Resend } = require("resend");
const logger = require("../utils/logger");

let _resend = null;
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};

/**
 * Sends a single email via Resend API (HTTPS — works on Render free tier).
 * @param {{ to: string, subject: string, body: string }} payload
 * @throws on failure — caller handles retry logic
 */
const sendEmail = async ({ to, subject, body }) => {
  const from = process.env.EMAIL_FROM || "CliniQ <onboarding@resend.dev>";
  const html = `<div style="font-family:sans-serif;max-width:600px;margin:auto">
    <p>${body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</p>
    <hr/>
    <small style="color:#888">CliniQ — do not reply to this email.</small>
  </div>`;

  const { error } = await getResend().emails.send({ from, to, subject, html, text: body });
  if (error) throw new Error(error.message);
  logger.info(`Email sent to ${to} — subject: "${subject}"`);
};

module.exports = { sendEmail };
