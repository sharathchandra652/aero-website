# Aero Villas — Website & Lead Management System

Welcome to the **Aero Villas** web repository. This document serves as the complete developer guide for onboarding, understanding the codebase architecture, setting up local development environments, configuring SMTP email delivery, and deploying to Cloudflare Workers.

---

## 📌 Architectural Overview

The application architecture consists of two main components:

1. **Static Frontend** (`public/`): Built using HTML5, CSS3, JavaScript (Bootstrap 5, Swiper, jQuery).
2. **Unified Backend Lead API (`POST /api/leads`)**:
   - Production: Cloudflare Worker (`src/index.js`) that also serves the static site.
   - Local: Node Express handler (`api/leads.js`, mounted by `server.js`).
   - Shared validation + email template logic lives in `api/lead-core.js`.
   - Generates unique Lead IDs in format `AV-YYYYMMDD-XXXX`.
   - Sends formatted HTML email notifications to `sales@aerovillas.in` over **SMTP**.

```
[ Visitor Form Submission ]
         │
         ▼
 ┌───────────────────────┐
 │   POST /api/leads     │  (Cloudflare Worker / Express locally)
 └───────────┬───────────┘
             │
             ├──► 1. Generate Unique Lead ID (AV-YYYYMMDD-XXXX)
             │
             └──► 2. SMTP (port 587/465) ───► sales@aerovillas.in
```

---

## 📁 Repository Structure

```
aero-website/
├── public/                      # Static website — uploaded to Cloudflare as-is
│   ├── index.html               # Homepage with Villa hero, features, and Enquiry forms
│   ├── aerovillas-267sq.yrds.html   # Floor plans & details for 267 sq. yards villas
│   ├── aerovillas-567sq.yrds.html   # Floor plans & details for 567 sq. yards villas
│   ├── aerovillas-600sq.yrds.html   # Floor plans & details for 600 sq. yards villas
│   ├── aerovillas-clubhouse.html    # Clubhouse amenities & enquiry forms
│   ├── aerovillas_media.html    # Media gallery & floor plan access forms
│   ├── css/                     # Custom CSS stylesheets
│   ├── js/
│   │   ├── emailjs-form.js      # Shared JS helper sending form submissions to /api/leads
│   │   ├── designesia.js        # Main template interaction scripts
│   │   ├── vendors.js           # Bundled vendor scripts (Bootstrap, jQuery, etc.)
│   │   └── swiper.js            # Slider animations
│   ├── images/, videos/, fonts/, webfonts/
│   ├── robots.txt, sitemap.xml
│   └── .assetsignore            # Files inside public/ excluded from upload
├── src/
│   └── index.js                 # Cloudflare Worker: static assets + POST /api/leads (production)
├── api/
│   ├── lead-core.js             # Shared validation, Lead ID + email template helpers
│   └── leads.js                 # Express lead handler for local development
├── wrangler.jsonc               # Cloudflare Workers configuration
├── .dev.vars.example            # Template secrets for `wrangler dev`
├── .env.example                 # Template environment configuration (local Express server)
├── .htaccess                    # Legacy Apache rules (not used on Cloudflare)
├── package.json                 # Node dependencies for local server & Worker
├── server.js                    # Local Express test server (serves site + mounts /api/leads)
└── README.md                    # Developer documentation
```

---

## ⚙️ Environment Configuration

The lead API needs SMTP credentials. Locally they come from `.env` (Express) or `.dev.vars` (Wrangler); in production they are Worker secrets.

```env
# Target Recipient Email (optional, defaults to sales@aerovillas.in)
SALES_EMAIL=sales@aerovillas.in

# SMTP credentials — port 587 (STARTTLS) or 465 (TLS). Port 25 is blocked on Cloudflare.
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username@example.com
SMTP_PASS=your_smtp_password_here

# Server Port (local Express server only)
PORT=3000
```

---

## 🚀 Local Development Setup

Follow these steps to run the complete website and backend API locally:

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Local Development Server
```bash
npm start
```

Console output:
```
🚀 Aero Villas Local Server running on http://localhost:3000
   POST http://localhost:3000/api/leads
```

Open `http://localhost:3000` in your browser.

---

## 🧪 Lead Submission Format

Both Enquiry and Schedule Visit forms submit to:

`POST /api/leads`

### JSON Payload:
```json
{
  "name": "Customer Name",
  "contact": "9876543210",
  "mail": "customer@example.com",
  "interestedIn": "567 sq.yards",
  "message": "Enquiry message here",
  "leadType": "enquiry",
  "source": "website",
  "page": "/"
}
```

### Expected Success Response:
```json
{
  "success": true,
  "message": "Enquiry received",
  "leadId": "AV-20260904-1234"
}
```

---

## 🌐 Production Deployment Guide (Cloudflare Workers)

The site is deployed as a single Cloudflare Worker: static files are uploaded as
[Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) and
`src/index.js` handles `/api/leads`. Everything is driven by `wrangler.jsonc`.

### 1. Connect the GitHub repository
1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Workers** → **Import a repository**.
2. Pick `sharathchandra652/aero-website` and the production branch.
3. Build settings:
   - **Build command**: leave empty (there is nothing to build).
   - **Deploy command**: `npx wrangler deploy`
   - **Root directory**: `/`
4. Save. Every push to the production branch now deploys automatically.

### 2. Add the SMTP secrets
Worker → **Settings** → **Variables and Secrets** → add as **Secret**:
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (and optionally `SALES_EMAIL`).

Or from a terminal (after `npx wrangler login`):
```bash
npx wrangler secret put SMTP_HOST
npx wrangler secret put SMTP_PORT
npx wrangler secret put SMTP_USER
npx wrangler secret put SMTP_PASS
```

### 3. Custom domain
Worker → **Settings** → **Domains & Routes** → **Add** → `aerovillas.in` (and `www.aerovillas.in`).

### Deploy from your machine (optional)
```bash
npm install
npx wrangler login
npm run deploy
```

### Preview the Worker locally
```bash
cp .dev.vars.example .dev.vars   # fill in SMTP values
npm run preview                  # http://localhost:8787
```

### Things to know
- Cloudflare rejects any single static file larger than **25 MiB**. Keep images, videos and PDFs under that limit (the brochure PDF is compressed for this reason).
- Only `public/` is uploaded. Put new pages, images and videos there; server code and config stay at the repo root.
- `index.html` → `/` and `page.html` → `/page` redirects are handled by Cloudflare automatically, so `.htaccess` is not needed.

---

## 📞 Support & Maintenance
For questions or issues regarding form submission handlers or SMTP setup, check logs via `npm start`, the Worker's **Logs** tab in the Cloudflare dashboard, or contact the lead web developer.
