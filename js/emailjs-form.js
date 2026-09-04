/**
 * Aero Villas – Website Client Form Script
 * ────────────────────────────────────────────────────────────────
 * Pure static frontend handler for Aero Villas enquiry forms.
 * ────────────────────────────────────────────────────────────────
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

  console.log("Form Submission Received (Static Frontend):", payload);

  return Promise.resolve({
    success: true,
    message: "Thank you! Your enquiry has been received."
  });
}

// Helper aliases for existing form handlers across HTML pages
function submitLead(params) {
  return submitEnquiry(params);
}

function sendLeadEmail(params) {
  return submitEnquiry(params);
}

