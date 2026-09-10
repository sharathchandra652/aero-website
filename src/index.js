/**
 * Aero Villas — Cloudflare Worker
 *
 * - Serves the static website from the repository root (Workers Static Assets,
 *   configured in wrangler.jsonc).
 * - Handles POST /api/leads and emails the enquiry to the sales inbox over SMTP
 *   using worker-mailer (Cloudflare TCP sockets; port 25 is not allowed, use 587/465).
 *
 * Required secrets (Dashboard → Worker → Settings → Variables and Secrets,
 * or `npx wrangler secret put <NAME>`):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * Optional: SALES_EMAIL (defaults to sales@aerovillas.in)
 */

import { WorkerMailer } from 'worker-mailer';
import {
  DEFAULT_SALES_EMAIL,
  buildLeadRecord,
  buildSubject,
  buildEnquiryEmailText,
  buildEnquiryEmailHTML
} from '../api/lead-core.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS }
  });
}

// Accept both JSON and classic form encodings, like the Express server does.
async function readBody(request) {
  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    return request.json();
  }
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }
  const text = await request.text();
  return text ? JSON.parse(text) : {};
}

async function sendLeadEmail(env, lead) {
  const host = env.SMTP_HOST;
  const port = parseInt(env.SMTP_PORT || '587', 10);
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'SMTP configuration missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS as Worker secrets.'
    );
  }

  const salesEmail = env.SALES_EMAIL || DEFAULT_SALES_EMAIL;

  await WorkerMailer.send(
    {
      host,
      port,
      secure: port === 465,        // implicit TLS on 465
      startTls: port !== 465,      // STARTTLS upgrade on 587
      credentials: { username: user, password: pass },
      authType: ['login', 'plain'],
      socketTimeoutMs: 20000,
      responseTimeoutMs: 20000
    },
    {
      from: { name: 'Aero Villas Leads', email: user },
      to: salesEmail,
      subject: buildSubject(lead),
      text: buildEnquiryEmailText(lead),
      html: buildEnquiryEmailHTML(lead)
    }
  );

  return salesEmail;
}

async function handleLeads(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method Not Allowed' }, 405);
  }

  try {
    let body;
    try {
      body = await readBody(request);
    } catch (parseErr) {
      return json({ success: false, message: 'Invalid request body' }, 400);
    }

    const { error, lead } = buildLeadRecord(body);
    if (error) {
      return json({ success: false, message: error }, 400);
    }

    console.log(`[AeroVillas API] Lead ID generated: ${lead.leadId} | Name: ${lead.name} | Contact: ${lead.contact}`);

    let emailSent = false;
    let emailErrorMsg = null;

    try {
      const to = await sendLeadEmail(env, lead);
      emailSent = true;
      console.log(`[AeroVillas Email] Email sent successfully to ${to} for Lead ${lead.leadId}`);
    } catch (emailErr) {
      emailErrorMsg = emailErr && emailErr.message ? emailErr.message : String(emailErr);
      console.error(`[AeroVillas Email Error] Email dispatch failed for Lead ${lead.leadId}:`, emailErrorMsg);
    }

    return json({
      success: true,
      message: 'Enquiry received',
      leadId: lead.leadId,
      emailSent,
      ...(emailErrorMsg ? { emailError: emailErrorMsg } : {})
    });
  } catch (err) {
    console.error('[AeroVillas API Server Error]:', err);
    return json({ success: false, message: 'Unable to process enquiry' }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/leads') {
      return handleLeads(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ success: false, message: 'Not Found' }, 404);
    }

    // Everything else is a static asset (html, css, js, images, videos...).
    return env.ASSETS.fetch(request);
  }
};
