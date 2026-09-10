/**
 * Aero Villas — Lead Submission API (/api/leads)
 * Express handler for local development (`npm start`).
 *
 * Production runs on Cloudflare Workers — see src/index.js, which shares
 * the validation and email template logic in api/lead-core.js.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const nodemailer = require('nodemailer');
const {
  DEFAULT_SALES_EMAIL,
  buildLeadRecord,
  buildSubject,
  buildEnquiryEmailText,
  buildEnquiryEmailHTML
} = require('./lead-core.js');

// Helper: Create Nodemailer SMTP transporter from environment variables
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'SMTP configuration missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your .env file.'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
}

// Helper: Send Email via SMTP (Nodemailer)
async function sendLeadEmail(lead) {
  const salesEmail = process.env.SALES_EMAIL || DEFAULT_SALES_EMAIL;
  const fromUser   = process.env.SMTP_USER;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Aero Villas Leads" <${fromUser}>`,
    to: salesEmail,
    subject: buildSubject(lead),
    text: buildEnquiryEmailText(lead),
    html: buildEnquiryEmailHTML(lead)
  });
}

// Express Handler
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { error, lead } = buildLeadRecord(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    console.log(`[AeroVillas API] Processing enquiry...`);
    console.log(`[AeroVillas API] Lead ID generated: ${lead.leadId} | Name: ${lead.name} | Contact: ${lead.contact}`);

    // Email dispatch via SMTP (Nodemailer)
    let emailSent = false;
    let emailErrorMsg = null;

    try {
      await sendLeadEmail(lead);
      emailSent = true;
      console.log(`[AeroVillas Email] Email sent successfully to ${process.env.SALES_EMAIL || DEFAULT_SALES_EMAIL} for Lead ${lead.leadId}`);
    } catch (emailErr) {
      emailErrorMsg = emailErr.message;
      console.error(`[AeroVillas Email Error] Email dispatch failed for Lead ${lead.leadId}:`, emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Enquiry received',
      leadId: lead.leadId,
      emailSent: emailSent,
      ...(emailErrorMsg ? { emailError: emailErrorMsg } : {})
    });

  } catch (error) {
    console.error('[AeroVillas API Server Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to process enquiry'
    });
  }
};
