/**
 * Aero Villas — Unified Lead API (/api/leads)
 * Handlers for Enquiry & Schedule Visit Form Submissions
 */

const fs = require('fs');
const path = require('path');

// Helper: Sanitize string input to prevent XSS / injection
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

// Helper: Generate Lead ID in format AV-YYYYMMDD-XXXX
function generateLeadId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSeq = Math.floor(1000 + Math.random() * 9000);
  return `AV-${dateStr}-${randomSeq}`;
}

// Helper: Save Lead Record to local storage
function saveLeadRecord(leadRecord) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}
    }
    const filePath = fs.existsSync(dataDir) 
      ? path.join(dataDir, 'leads.json') 
      : path.join('/tmp', 'leads.json');

    let leads = [];
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        leads = JSON.parse(content);
      } catch (e) {
        leads = [];
      }
    }
    leads.push(leadRecord);
    fs.writeFileSync(filePath, JSON.stringify(leads, null, 2));
  } catch (err) {
    console.error('[AeroVillas Lead Storage Error]:', err.message);
  }
}

// Helper: Get Microsoft OAuth Access Token
async function getMicrosoftToken() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const refreshToken = process.env.MICROSOFT_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error('Microsoft Graph API credentials missing from environment variables');
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  let bodyParams;
  if (refreshToken) {
    bodyParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: 'https://graph.microsoft.com/Mail.Send offline_access'
    });
  } else {
    bodyParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: 'https://graph.microsoft.com/.default'
    });
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: bodyParams.toString()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Failed to acquire Microsoft Graph token');
  }

  return {
    accessToken: data.access_token,
    isDelegated: !!refreshToken
  };
}

// Helper: Build HTML Email Template
function buildLeadEmailHTML(lead) {
  const isVisit = lead.leadType === 'schedule_visit';
  const leadTitle = isVisit ? 'Site Visit Request' : 'New Website Enquiry';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #222; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
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
      <p>${leadTitle} — Lead ID: <strong>${lead.leadId}</strong></p>
    </div>
    
    <div class="section">
      <div class="section-title">LEAD INFORMATION</div>
      <div class="grid">
        <div class="row"><div class="cell-label">Lead ID</div><div class="cell-value"><strong>${lead.leadId}</strong></div></div>
        <div class="row"><div class="cell-label">Lead Type</div><div class="cell-value"><span class="badge">${isVisit ? 'SITE VISIT REQUEST' : 'ENQUIRY'}</span></div></div>
        <div class="row"><div class="cell-label">Submitted Date & Time</div><div class="cell-value">${new Date(lead.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">CUSTOMER DETAILS</div>
      <div class="grid">
        <div class="row"><div class="cell-label">Name</div><div class="cell-value"><strong>${lead.name}</strong></div></div>
        <div class="row"><div class="cell-label">Mobile Number</div><div class="cell-value"><a href="tel:${lead.phone}">${lead.phone}</a></div></div>
        <div class="row"><div class="cell-label">Email</div><div class="cell-value"><a href="mailto:${lead.email}">${lead.email || 'N/A'}</a></div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">INTEREST DETAILS</div>
      <div class="grid">
        <div class="row"><div class="cell-label">Interested Villa / Type</div><div class="cell-value">${lead.interestedIn || 'N/A'}</div></div>
        <div class="row"><div class="cell-label">Budget</div><div class="cell-value">${lead.budget || 'N/A'}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">VISIT DETAILS</div>
      <div class="grid">
        <div class="row"><div class="cell-label">Preferred Date</div><div class="cell-value">${lead.preferredDate || 'N/A'}</div></div>
        <div class="row"><div class="cell-label">Preferred Time</div><div class="cell-value">${lead.preferredTime || 'N/A'}</div></div>
        <div class="row"><div class="cell-label">Number of Visitors</div><div class="cell-value">${lead.visitors || 'N/A'}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">MESSAGE</div>
      <p style="margin: 0; color: #2d3748; line-height: 1.5; white-space: pre-wrap;">${lead.message || 'No additional message provided.'}</p>
    </div>

    <div class="section">
      <div class="section-title">SOURCE</div>
      <div class="grid">
        <div class="row"><div class="cell-label">Source</div><div class="cell-value">${lead.source || 'website'}</div></div>
        <div class="row"><div class="cell-label">Website Page</div><div class="cell-value">${lead.page || 'Homepage'}</div></div>
      </div>
    </div>

    <div class="footer">
      STATUS: <strong>NEW</strong> &nbsp;|&nbsp; Aero Villas Official Sales Enquiry System
    </div>
  </div>
</body>
</html>`;
}

// Helper: Dispatch Email via Microsoft Graph API
async function sendLeadEmail(lead) {
  const salesEmail = process.env.SALES_EMAIL || 'sales@aerovillas.in';
  const isVisit = lead.leadType === 'schedule_visit';
  const subject = isVisit 
    ? `[AERO VILLAS] Site Visit Request — ${lead.name}` 
    : `[AERO VILLAS] New Enquiry — ${lead.name}`;

  const { accessToken, isDelegated } = await getMicrosoftToken();

  const sendMailEndpoint = isDelegated
    ? 'https://graph.microsoft.com/v1.0/me/sendMail'
    : `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(salesEmail)}/sendMail`;

  const payload = {
    message: {
      subject: subject,
      body: {
        contentType: 'HTML',
        content: buildLeadEmailHTML(lead)
      },
      toRecipients: [
        {
          emailAddress: {
            address: salesEmail
          }
        }
      ]
    },
    saveToSentItems: 'true'
  };

  const res = await fetch(sendMailEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let errBody = '';
    try { errBody = await res.text(); } catch (e) {}
    throw new Error(`Microsoft Graph API error [HTTP ${res.status}]: ${errBody}`);
  }
}

// Main Vercel / Express Handler Function
module.exports = async function handler(req, res) {
  // CORS Headers
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
    const {
      leadType = 'enquiry',
      name,
      phone,
      email,
      interestedIn,
      budget,
      preferredDate,
      preferredTime,
      visitors,
      message,
      source = 'website',
      page = '/'
    } = body;

    // Server-side validations
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'A valid 10-digit mobile number is required.' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    // Generate unique Lead ID
    const leadId = generateLeadId();

    // Construct Lead Record
    const leadRecord = {
      leadId,
      leadType: leadType === 'schedule_visit' ? 'schedule_visit' : 'enquiry',
      name: sanitize(name),
      phone: sanitize(phone),
      email: sanitize(email),
      interestedIn: sanitize(interestedIn),
      budget: sanitize(budget),
      preferredDate: sanitize(preferredDate),
      preferredTime: sanitize(preferredTime),
      visitors: sanitize(visitors),
      message: sanitize(message),
      source: sanitize(source),
      page: sanitize(page),
      status: 'NEW',
      createdAt: new Date().toISOString(),
      emailStatus: 'PENDING',
      emailSentAt: null,
      emailError: null
    };

    // Save lead record first (Fault Tolerance)
    saveLeadRecord(leadRecord);

    // Attempt Email Dispatch via Microsoft Graph API
    try {
      await sendLeadEmail(leadRecord);
      leadRecord.emailStatus = 'SENT';
      leadRecord.emailSentAt = new Date().toISOString();
      console.log(`[AeroVillas Lead API Success]: Lead ${leadId} processed & email sent to sales@aerovillas.in`);
    } catch (emailErr) {
      leadRecord.emailStatus = 'FAILED';
      leadRecord.emailError = emailErr.message;
      console.error(`[AeroVillas Email Error] Lead ${leadId} saved but email failed:`, emailErr.message);
    }

    // Response message matching requirement specification
    const successMsg = leadType === 'schedule_visit'
      ? 'Your site visit request has been received. Our sales team will contact you to confirm the visit.'
      : 'Thank you. Your enquiry has been received. Our sales team will contact you shortly.';

    return res.status(200).json({
      success: true,
      leadId: leadId,
      message: successMsg
    });

  } catch (error) {
    console.error('[AeroVillas Lead API Server Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred. Please try again later.'
    });
  }
};
