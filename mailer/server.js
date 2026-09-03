/**
 * Aero Villas – SMTP Mailer Server
 * ─────────────────────────────────
 * A lightweight Express server that receives form submissions
 * from the Aero Villas website and forwards them as emails
 * to sales@aerovillas.in using your own SMTP credentials.
 *
 * Setup:
 *   1. cp .env.example .env
 *   2. Fill in your SMTP credentials in .env
 *   3. npm install
 *   4. npm start   (or: npm run dev  for auto-reload)
 */

require("dotenv").config();
const express    = require("express");
const nodemailer = require("nodemailer");
const cors       = require("cors");

const app = express();

// ── Middleware ────────────────────────────────────────────────────

// Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS – only allow requests from your configured origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., Postman, same-server calls)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin "${origin}" not allowed.`));
    },
    methods: ["POST", "OPTIONS"],
  })
);

// ── Nodemailer Transporter ────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === "true", // true = SSL (port 465)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Accept self-signed certs (common in shared hosting)
    rejectUnauthorized: false,
  },
});

// Verify transporter config on startup
transporter.verify((err) => {
  if (err) {
    console.error("❌  SMTP connection failed:", err.message);
    console.error("   Check your .env credentials (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS).");
  } else {
    console.log("✅  SMTP connection established. Ready to send emails.");
  }
});

// ── Helper: Build Email HTML ──────────────────────────────────────

function buildEmailHTML({ name, phone, email, interested, message, sourcePage }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .card { background: #fff; border-radius: 8px; max-width: 600px; margin: 0 auto; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .header { background: #6B0BD4; color: #fff; border-radius: 6px 6px 0 0; padding: 20px 24px; margin: -30px -30px 24px; }
    .header h2 { margin: 0; font-size: 20px; }
    .header p  { margin: 4px 0 0; font-size: 13px; opacity: .85; }
    table { width: 100%; border-collapse: collapse; }
    td    { padding: 10px 0; vertical-align: top; border-bottom: 1px solid #f0f0f0; }
    td:first-child { width: 140px; font-weight: bold; color: #555; font-size: 13px; }
    td:last-child  { font-size: 14px; color: #222; }
    .message-box { background: #f9f9f9; border-left: 3px solid #6B0BD4; padding: 12px 16px; border-radius: 4px; font-size: 14px; white-space: pre-wrap; }
    .footer { text-align: center; font-size: 11px; color: #aaa; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>🏡 New Lead – Aero Villas</h2>
      <p>Submitted via: ${sourcePage || "Website"}</p>
    </div>

    <table>
      <tr>
        <td>Name</td>
        <td>${name || "—"}</td>
      </tr>
      <tr>
        <td>Phone</td>
        <td>${phone || "—"}</td>
      </tr>
      <tr>
        <td>Email</td>
        <td>${email || "—"}</td>
      </tr>
      <tr>
        <td>Interested In</td>
        <td>${interested || "—"}</td>
      </tr>
    </table>

    ${
      message
        ? `<p style="font-weight:bold;color:#555;margin:20px 0 8px;font-size:13px;">Message</p>
           <div class="message-box">${message}</div>`
        : ""
    }

    <div class="footer">
      Sent automatically from aerovillas.in at ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ── POST /send-email ──────────────────────────────────────────────

app.post("/send-email", async (req, res) => {
  const {
    name,
    phone,
    email      = "",
    interested = "",
    message    = "",
    sourcePage = "Website",
  } = req.body;

  // Basic validation
  if (!name || !phone) {
    return res.status(400).json({ success: false, error: "Name and phone are required." });
  }

  const recipient  = process.env.MAIL_TO        || "sales@aerovillas.in";
  const fromName   = process.env.MAIL_FROM_NAME || "Aero Villas Website";
  const fromEmail  = process.env.SMTP_USER;

  const mailOptions = {
    from:    `"${fromName}" <${fromEmail}>`,
    to:      recipient,
    replyTo: email || fromEmail,
    subject: `New Enquiry from ${name} – Aero Villas`,
    html:    buildEmailHTML({ name, phone, email, interested, message, sourcePage }),
    text:
      `New Enquiry – Aero Villas\n\n` +
      `Name:        ${name}\n` +
      `Phone:       ${phone}\n` +
      `Email:       ${email || "—"}\n` +
      `Interested:  ${interested || "—"}\n` +
      `Source:      ${sourcePage}\n\n` +
      `Message:\n${message || "—"}\n\n` +
      `Sent: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧  Email sent to ${recipient} | Lead: ${name} (${phone}) | Source: ${sourcePage}`);
    return res.json({ success: true });
  } catch (err) {
    console.error("❌  Failed to send email:", err.message);
    return res.status(500).json({ success: false, error: "Failed to send email." });
  }
});

// ── Health Check ──────────────────────────────────────────────────

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Start ─────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT, 10) || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀  Aero Villas Mailer running on http://localhost:${PORT}`);
  console.log(`   POST /send-email  – accepts form submissions`);
  console.log(`   GET  /health      – health check\n`);
});
