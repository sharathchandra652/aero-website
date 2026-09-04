/**
 * Aero Villas — Lead Submission API (/api/leads)
 * Vercel Serverless Function / Express Handler for Enquiry Form Submissions
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const nodemailer = require('nodemailer');

// Helper: Sanitize string inputs
function sanitize(input) {
  if (typeof input !== 'string') return input ? String(input) : '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// Helper: Generate unique Lead ID
function generateLeadId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSeq = Math.floor(1000 + Math.random() * 9000);
  return `AV-${dateStr}-${randomSeq}`;
}

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

// Helper: Build HTML Email Template
function buildEnquiryEmailHTML(lead) {
  const formattedDate = new Date(lead.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const scheduleRows = [
    lead.visitDate   ? `<div class="row"><div class="cell-label">Visit Date</div><div class="cell-value">${lead.visitDate}</div></div>` : '',
    lead.visitTime   ? `<div class="row"><div class="cell-label">Visit Time</div><div class="cell-value">${lead.visitTime}</div></div>` : '',
    lead.visitGuests ? `<div class="row"><div class="cell-label">No. of Guests</div><div class="cell-value">${lead.visitGuests}</div></div>` : '',
  ].filter(Boolean).join('\n        ');

  const scheduleSection = scheduleRows
    ? `<div class="section"><div class="section-title">VISIT DETAILS</div><div class="grid">${scheduleRows}</div></div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #222; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: #111111; color: #d4af37; padding: 24px; text-align: center; border-bottom: 3px solid #d4af37; }
    .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; }
    .header p { margin: 6px 0 0; color: #cccccc; font-size: 14px; }
    .section { padding: 20px 24px; border-bottom: 1px solid #edf2f7; }
    .section-title { font-size: 12px; font-weight: 700; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .grid { display: table; width: 100%; }
    .row { display: table-row; }
    .cell-label { display: table-cell; padding: 6px 0; font-weight: 600; color: #4a5568; width: 40%; font-size: 14px; }
    .cell-value { display: table-cell; padding: 6px 0; color: #1a202c; font-size: 14px; }
    .badge { display: inline-block; padding: 4px 10px; background: #d4af37; color: #111111; font-weight: bold; border-radius: 4px; font-size: 12px; }
    .footer { background: #f7fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #a0aec0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AERO VILLAS</h1>
      <p>New Enquiry &mdash; Lead ID: <strong>${lead.leadId}</strong></p>
    </div>
    <div class="section">
      <div class="section-title">CUSTOMER DETAILS</div>
      <div class="grid">
        <div class="row"><div class="cell-label">Name</div><div class="cell-value"><strong>${lead.name}</strong></div></div>
        <div class="row"><div class="cell-label">Contact</div><div class="cell-value"><a href="tel:${lead.contact}">${lead.contact}</a></div></div>
        <div class="row"><div class="cell-label">Mail</div><div class="cell-value"><a href="mailto:${lead.mail}">${lead.mail || 'N/A'}</a></div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">ENQUIRY DETAILS</div>
      <div class="grid">
        <div class="row"><div class="cell-label">Interested In</div><div class="cell-value">${lead.interestedIn || 'N/A'}</div></div>
        <div class="row"><div class="cell-label">Lead Type</div><div class="cell-value"><span class="badge">${lead.leadType.toUpperCase()}</span></div></div>
      </div>
    </div>
    ${scheduleSection}
    <div class="section">
      <div class="section-title">MESSAGE</div>
      <p style="margin: 0; color: #2d3748; line-height: 1.5; white-space: pre-wrap;">${lead.message || 'No message provided.'}</p>
    </div>
    <div class="section">
      <div class="section-title">SOURCE &amp; LOCATION</div>
      <div class="grid">
        <div class="row"><div class="cell-label">Source</div><div class="cell-value">${lead.source || 'Website'}</div></div>
        <div class="row"><div class="cell-label">Page URL</div><div class="cell-value">${lead.page || '/'}</div></div>
        <div class="row"><div class="cell-label">Submitted</div><div class="cell-value">${formattedDate}</div></div>
      </div>
    </div>
    <div class="footer">
      STATUS: <strong>NEW</strong> &nbsp;|&nbsp; Aero Villas Official Sales Enquiry System
    </div>
  </div>
</body>
</html>`;
}

// Helper: Send Email via SMTP (Nodemailer)
async function sendLeadEmail(lead) {
  const salesEmail = process.env.SALES_EMAIL || 'sales@aerovillas.in';
  const fromUser   = process.env.SMTP_USER;
  const subject    = `[AERO VILLAS] New ${lead.leadType === 'schedule-visit' ? 'Visit Request' : 'Enquiry'} — ${lead.name}`;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Aero Villas Leads" <${fromUser}>`,
    to: salesEmail,
    subject,
    html: buildEnquiryEmailHTML(lead)
  });
}

// Vercel / Express Handler
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
    const body = req.body || {};
    const name         = sanitize(body.name);
    const contact      = sanitize(body.contact || body.phone);
    const mail         = sanitize(body.mail || body.email);
    const interestedIn = sanitize(body.interestedIn || body.interested);
    const message      = sanitize(body.message);
    const leadType     = sanitize(body.leadType || 'enquiry');
    const source       = sanitize(body.source || 'website');
    const page         = sanitize(body.page || '/');

    // Schedule-visit specific fields (preserved as-is)
    const visitDate   = sanitize(body.visitDate   || '');
    const visitTime   = sanitize(body.visitTime   || '');
    const visitGuests = sanitize(body.visitGuests || '');

    // Server-side field validation
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const cleanContact = contact.replace(/\D/g, '');
    if (!cleanContact || cleanContact.length < 10) {
      return res.status(400).json({ success: false, message: 'A valid contact number is required' });
    }

    const leadId = generateLeadId();
    console.log(`[AeroVillas API] Processing enquiry...`);
    console.log(`[AeroVillas API] Lead ID generated: ${leadId} | Name: ${name} | Contact: ${contact}`);

    const leadRecord = {
      leadId,
      name,
      contact,
      mail,
      interestedIn,
      message,
      leadType,
      source,
      page,
      visitDate,
      visitTime,
      visitGuests,
      createdAt: new Date().toISOString()
    };

    // Email dispatch via SMTP (Nodemailer)
    let emailSent = false;
    let emailErrorMsg = null;

    try {
      await sendLeadEmail(leadRecord);
      emailSent = true;
      console.log(`[AeroVillas Email] Email sent successfully to ${process.env.SALES_EMAIL || 'sales@aerovillas.in'} for Lead ${leadId}`);
    } catch (emailErr) {
      emailErrorMsg = emailErr.message;
      console.error(`[AeroVillas Email Error] Email dispatch failed for Lead ${leadId}:`, emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Enquiry received',
      leadId: leadId,
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
