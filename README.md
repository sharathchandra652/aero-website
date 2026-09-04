# Aero Villas — Website & Lead Management System

Welcome to the **Aero Villas** web repository. This document serves as the complete developer guide for onboarding, understanding the codebase architecture, setting up local development environments, configuring Microsoft Graph API email authentication, and deploying to Vercel or custom server hosts.

---

## 📌 Architectural Overview

The application architecture consists of two main components:

1. **Static Frontend**: Built using HTML5, CSS3, JavaScript (Bootstrap 5, Swiper, jQuery).
2. **Unified Backend Lead API (`POST /api/leads`)**:
   - Vercel Serverless Function / Node Express API ([`api/leads.js`](file:///c:/Users/USER/Desktop/aero-website/api/leads.js)).
   - Generates unique Lead IDs in format `AV-YYYYMMDD-XXXX`.
   - Sends formatted HTML email notifications directly to `sales@aerovillas.in` via **Microsoft Graph API**.

```
[ Visitor Form Submission ]
         │
         ▼
 ┌───────────────────────┐
 │   POST /api/leads     │  (Vercel Serverless / Express)
 └───────────┬───────────┘
             │
             ├──► 1. Generate Unique Lead ID (AV-YYYYMMDD-XXXX)
             │
             └──► 2. Microsoft Graph API ───► sales@aerovillas.in
```

---

## 📁 Repository Structure

```
aero-website/
├── index.html                   # Homepage with Villa hero, features, and Enquiry forms
├── aerovillas-267sq.yrds.html   # Floor plans & details for 267 sq. yards villas
├── aerovillas-567sq.yrds.html   # Floor plans & details for 567 sq. yards villas
├── aerovillas-600sq.yrds.html   # Floor plans & details for 600 sq. yards villas
├── aerovillas-clubhouse.html    # Clubhouse amenities & enquiry forms
├── aerovillas_media.html        # Media gallery & floor plan access forms
├── api/
│   └── leads.js                 # Unified serverless lead handler (POST /api/leads)
├── css/                         # Custom CSS stylesheets
├── js/
│   ├── emailjs-form.js          # Shared JS helper sending form submissions to /api/leads
│   ├── designesia.js            # Main template interaction scripts
│   ├── vendors.js               # Bundled vendor scripts (Bootstrap, jQuery, etc.)
│   └── swiper.js                # Slider animations
├── .env.example                 # Template environment configuration
├── .htaccess                    # Apache web server rules (HTTPS & clean URLs)
├── package.json                 # Node dependencies for local server & serverless
├── server.js                    # Local Express test server (serves site + mounts /api/leads)
└── README.md                    # Developer documentation
```

---

## ⚙️ Environment Configuration (`.env`)

The backend lead service requires environment variables for Microsoft Graph API email delivery:

```env
# Target Recipient Email
SALES_EMAIL=sales@aerovillas.in

# Microsoft Graph API Authentication (Azure Entra ID)
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_TENANT_ID=your_microsoft_tenant_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here
MICROSOFT_REDIRECT_URI=http://localhost:3000

# Server Port (Local testing)
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

## 🌐 Production Deployment Guide

### Deploying to Vercel
1. Connect your GitHub repository (`sharathchandra652/aero-website`) to Vercel.
2. In Vercel Project Settings → **Environment Variables**, add:
   - `SALES_EMAIL`
   - `MICROSOFT_CLIENT_ID`
   - `MICROSOFT_TENANT_ID`
   - `MICROSOFT_CLIENT_SECRET`
3. Vercel automatically detects [`api/leads.js`](file:///c:/Users/USER/Desktop/aero-website/api/leads.js) as a Serverless Function handling `POST /api/leads`.

---

## 📞 Support & Maintenance
For questions or issues regarding form submission handlers or Microsoft Graph API setup, check logs via `npm start` or contact the lead web developer.
