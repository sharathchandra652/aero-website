const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  // CORS Headers
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[SERVERLESS /api/send-email] Received POST lead request');

  const { name, phone, email, interested, message, sourcePage } = req.body || {};

  if (!name || !phone) {
    console.warn('[SERVERLESS /api/send-email] Missing required fields (name/phone)');
    return res.status(400).json({ error: 'Name and phone number are required.' });
  }

  // Environment Variable Check (Safe Logging - NEVER log SMTP_PASS or secret values)
  const host = process.env.SMTP_HOST || 'smtp.office365.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.SMTP_TO || 'sales@aerovillas.in';
  const from = process.env.SMTP_FROM || (user ? `"Aero Villas Web" <${user}>` : `"Aero Villas Web" <sales@aerovillas.in>`);

  console.log('[SMTP CONFIG DETECTED]:', {
    SMTP_HOST: host,
    SMTP_PORT: port,
    SMTP_SECURE: secure,
    SMTP_USER_PRESENT: !!user,
    SMTP_PASS_PRESENT: !!pass,
    SMTP_TO: to,
    SMTP_FROM: from
  });

  if (!user || !pass) {
    console.error('[SMTP CONFIG ERROR] Missing SMTP_USER or SMTP_PASS environment variables in Vercel');
    // Return 200 with warning if env vars missing so form submission succeeds on CRM side
    return res.status(200).json({
      success: false,
      warning: 'Email service unconfigured (SMTP_USER/SMTP_PASS missing in environment).'
    });
  }

  try {
    console.log('[SMTP] Creating Nodemailer transporter...');
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure, // false for 587 (STARTTLS)
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const pageName = sourcePage || 'Website Form';
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0b1f3a; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 22px;">New Lead Notification</h2>
          <p style="margin: 5px 0 0 0; color: #c9a96e; font-size: 14px;">Aero Villas — ${pageName}</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; width: 140px; color: #333;">Name:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #555;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #333;">Phone:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #555;"><a href="tel:${phone}" style="color: #0b1f3a; text-decoration: none;">${phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #333;">Email:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #555;">${email || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #333;">Interested In:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #555;">${interested || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #333;">Message:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #555;">${message || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #333;">Submitted At:</td>
              <td style="padding: 10px 0; color: #555;">${timestamp} IST</td>
            </tr>
          </table>
        </div>
        <div style="background-color: #f8f9fa; padding: 12px; text-align: center; font-size: 12px; color: #888;">
          Sent automatically from Aero Villas Website via Vercel SMTP Serverless API
        </div>
      </div>
    `;

    const mailOptions = {
      from,
      to,
      subject: `[New Lead] ${name} — ${phone} (${pageName})`,
      html: htmlBody,
      replyTo: email && email.includes('@') ? email : undefined
    };

    console.log('[SMTP] Attempting sendMail to:', to);
    const info = await transporter.sendMail(mailOptions);
    console.log('[SMTP SUCCESS] Email delivered successfully. Message ID:', info.messageId);

    return res.status(200).json({
      success: true,
      message: 'Email notification sent successfully.',
      messageId: info.messageId
    });
  } catch (err) {
    console.error('[SMTP ERROR] Send mail attempt failed:', {
      name: err.name,
      code: err.code,
      command: err.command,
      responseCode: err.responseCode,
      message: err.message
    });

    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to send lead notification email.',
      code: err.code || 'UNKNOWN_ERROR'
    });
  }
};
