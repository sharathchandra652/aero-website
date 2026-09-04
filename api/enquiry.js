const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  // Set CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Only POST requests are accepted.'
    });
  }

  try {
    const {
      name = '',
      phone = '',
      email = '',
      interest = '',
      preferredDate = '',
      message = '',
      source = '',
      page = ''
    } = req.body || {};

    // Sanitize values
    const cleanName = String(name).trim();
    const cleanPhone = String(phone).trim();
    const cleanEmail = String(email).trim();
    const cleanInterest = String(interest).trim();
    const cleanPreferredDate = String(preferredDate).trim();
    const cleanMessage = String(message).trim();
    const cleanSource = String(source || 'Website Form').trim();
    const cleanPage = String(page || 'Aero Villas Website').trim();

    // Validate Required Fields (name, phone, email)
    if (!cleanName || !cleanPhone || !cleanEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, phone, and email are required.'
      });
    }

    // Basic email format check
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // Check required environment variables
    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.ENQUIRY_TO_EMAIL;
    const fromEmail = process.env.ENQUIRY_FROM_EMAIL;

    if (!apiKey || !toEmail || !fromEmail) {
      console.error('[ENQUIRY API ERROR] Missing Resend environment variables:', {
        hasApiKey: !!apiKey,
        hasToEmail: !!toEmail,
        hasFromEmail: !!fromEmail
      });
      return res.status(500).json({
        success: false,
        message: 'Unable to send enquiry (Server environment unconfigured).'
      });
    }

    const resend = new Resend(apiKey);
    const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

    // HTML Email Body
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #0b1f3a; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px; color: #ffffff;">AERO VILLAS</h1>
          <p style="margin: 6px 0 0 0; color: #c9a96e; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">New Website Enquiry</p>
        </div>
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; width: 140px; color: #333333;">Name:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #555555;">${cleanName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #333333;">Phone:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #555555;"><a href="tel:${cleanPhone}" style="color: #0b1f3a; text-decoration: none; font-weight: bold;">${cleanPhone}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #333333;">Email:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #555555;"><a href="mailto:${cleanEmail}" style="color: #0b1f3a; text-decoration: none;">${cleanEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #333333;">Interested In:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #555555;">${cleanInterest || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #333333;">Preferred Date:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #555555;">${cleanPreferredDate || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #333333;">Message:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #555555;">${cleanMessage || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #333333;">Source:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #555555;">${cleanSource}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #333333;">Page:</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; color: #555555;">${cleanPage}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: bold; color: #333333;">Submitted At:</td>
              <td style="padding: 12px 0; color: #555555;">${submittedAt}</td>
            </tr>
          </table>
        </div>
        <div style="background-color: #f8f9fa; padding: 14px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #e0e0e0;">
          Sent automatically from Aero Villas Website via Vercel Serverless Function & Resend API
        </div>
      </div>
    `;

    // Plain Text Email Body
    const textContent =
      `AERO VILLAS\n` +
      `NEW WEBSITE ENQUIRY\n\n` +
      `Name:           ${cleanName}\n` +
      `Phone:          ${cleanPhone}\n` +
      `Email:          ${cleanEmail}\n` +
      `Interested In:  ${cleanInterest || 'N/A'}\n` +
      `Preferred Date: ${cleanPreferredDate || 'N/A'}\n` +
      `Source:         ${cleanSource}\n` +
      `Page:           ${cleanPage}\n` +
      `Submitted At:   ${submittedAt}\n\n` +
      `Message:\n${cleanMessage || 'N/A'}\n`;

    console.log(`[ENQUIRY API] Sending Resend email to ${toEmail} for lead ${cleanName}...`);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: cleanEmail,
      subject: `New AERO VILLAS Website Enquiry – ${cleanName}`,
      html: htmlContent,
      text: textContent
    });

    if (error || !data || !data.id) {
      console.error('[RESEND API ERROR] Failed to send email via Resend:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to send enquiry'
      });
    }

    console.log(`[RESEND API SUCCESS] Email accepted by Resend. Email ID: ${data.id}`);

    return res.status(200).json({
      success: true,
      message: 'Enquiry submitted successfully'
    });
  } catch (err) {
    console.error('[ENQUIRY API EXCEPTION] Unexpected error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to send enquiry'
    });
  }
};
