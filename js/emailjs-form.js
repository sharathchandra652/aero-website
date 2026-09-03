/**
 * Aero Villas – Form Email Sender
 * ────────────────────────────────────────────────────────────────
 * Sends lead/enquiry data to the SMTP mailer serverless API.
 * In production on Vercel, it calls /api/send-email.
 * During local dev (localhost), it calls http://localhost:3001/send-email.
 * ────────────────────────────────────────────────────────────────
 */

const MAILER_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:3001/send-email"
  : "/api/send-email";

/**
 * Send a lead notification email via the SMTP mailer API.
 * Dispatches the email notification asynchronously without blocking the user form submission UI.
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
      if (!res.ok) {
        console.warn("⚠️ Email notification API status:", res.status);
      } else {
        console.log("✅ Email notification sent to sales@aerovillas.in");
      }
      return res.json().catch(() => ({}));
    })
    .catch((err) => {
      console.warn("⚠️ Email notification dispatch warning:", err.message);
      return {};
    });
}
