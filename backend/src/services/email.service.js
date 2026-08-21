const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

// Lazy-initialise transporter — same pattern as LLM service.
// SMTP credentials only need to exist when an email is actually sent.
let _transporter = null;

const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return _transporter;
};

/**
 * Sends a single email.
 * @param {{ to: string, subject: string, body: string }} payload
 * @throws on SMTP failure — caller handles retry logic
 */
const sendEmail = async ({ to, subject, body }) => {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "Healthcare App <noreply@healthcare.app>",
    to,
    subject,
    // body is plain text; wrap in minimal HTML for email clients
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">
      <p>${body.replace(/\n/g, "<br/>")}</p>
      <hr/>
      <small style="color:#888">Healthcare Appointment System — do not reply to this email.</small>
    </div>`,
    text: body,
  });
  logger.info(`Email sent to ${to} — subject: "${subject}"`);
};

module.exports = { sendEmail };
