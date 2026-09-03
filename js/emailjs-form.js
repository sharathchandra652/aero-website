/**
 * Aero Villas – Form Email Sender
 * ────────────────────────────────────────────────────────────────
 * Sends lead/enquiry data to the local SMTP mailer server.
 * The mailer server (mailer/server.js) forwards it as an email
 * to sales@aerovillas.in using your own SMTP credentials.
 *
 * Change MAILER_URL if your backend is hosted on a different URL/port.
 * ────────────────────────────────────────────────────────────────
 */

// URL of the mailer backend.
// In production, point this to your hosted server, e.g.:
//   "https://mail.aerovillas.in/send-email"
//   "https://aerovillas.in:3001/send-email"
// During local dev it defaults to localhost:3001
const MAILER_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:3001/send-email"
  : "https://mail.aerovillas.in/send-email"; // ← UPDATE THIS for production

/**
 * Send a lead notification email via the SMTP mailer server.
 * Silently logs errors to console — never blocks the UI.
 *
 * @param {Object} params
 *   @param {string} params.name       - Visitor's full name
 *   @param {string} params.phone      - Visitor's phone number
 *   @param {string} params.email      - Visitor's email (optional)
 *   @param {string} params.interested - Property / product of interest
 *   @param {string} params.message    - Message text (optional)
 *   @param {string} params.sourcePage - Which page/form submitted
 */
function sendLeadEmail(params) {
  return fetch(MAILER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name:       params.name       || "",
      phone:      params.phone      || "",
      email:      params.email      || "",
      interested: params.interested || "",
      message:    params.message    || "",
      sourcePage: params.sourcePage || "Aero Villas Website",
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      console.log("✅ Email notification sent to sales@aerovillas.in");
    })
    .catch((err) => {
      // Non-blocking — the CRM lead is still saved even if email fails
      console.error("⚠️ Email notification failed:", err.message);
    });
}
