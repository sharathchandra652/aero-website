/**
 * Aero Villas – Website Enquiry Submission Client
 * ────────────────────────────────────────────────────────────────
 * Submits enquiry form payloads to the Vercel Serverless Function (/api/enquiry).
 * ────────────────────────────────────────────────────────────────
 */

/**
 * Submit enquiry data to /api/enquiry.
 *
 * @param {Object} params
 *   @param {string} params.name          - Visitor's full name (Required)
 *   @param {string} params.phone         - Visitor's phone number (Required)
 *   @param {string} params.email         - Visitor's email (Required)
 *   @param {string} params.interest      - Property of interest
 *   @param {string} params.preferredDate - Preferred visit date (Optional)
 *   @param {string} params.message       - Message text (Optional)
 *   @param {string} params.source        - Form / Source identifier
 *   @param {string} params.page          - Page title / URL
 * @returns {Promise<Object>} Promise resolving to API response { success: true, message: string }
 */
function submitEnquiry(params) {
  const payload = {
    name:          params.name          || "",
    phone:         params.phone         || params.mobileNo || "",
    email:         params.email         || "",
    interest:      params.interest      || params.interested || "",
    preferredDate: params.preferredDate || params.sitevisitDate || "",
    message:       params.message       || "",
    source:        params.source        || params.subSource || "Website Form",
    page:          params.page          || params.sourcePage || window.location.pathname
  };

  return fetch("/api/enquiry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then(async (res) => {
      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = { success: false, message: "Unable to send enquiry" };
      }

      if (!res.ok || !data || data.success !== true) {
        const errorMsg = (data && data.message) ? data.message : "Unable to send enquiry";
        return Promise.reject(new Error(errorMsg));
      }

      return data;
    });
}

// Helper aliases for existing form handlers across HTML pages
function submitLead(params) {
  return submitEnquiry(params);
}

function sendLeadEmail(params) {
  return submitEnquiry(params);
}
