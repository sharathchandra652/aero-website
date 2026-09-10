/**
 * Aero Villas — Unified Client Lead Submission Helper
 * Submits Enquiry Form payloads to POST /api/leads
 */

function getApiUrl() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const port = window.location.port;
    if ((host === 'localhost' || host === '127.0.0.1') && port && port !== '3000') {
      return 'http://localhost:3000/api/leads';
    }
  }
  return '/api/leads';
}

function submitEnquiry(params) {
  const payload = {
    name:         (params.name || "").trim(),
    contact:      (params.contact || params.phone || params.mobileNo || "").trim(),
    mail:         (params.mail || params.email || "").trim(),
    interestedIn: (params.interestedIn || params.interested || "").trim(),
    message:      (params.message || "").trim(),
    leadType:     params.leadType || "enquiry",
    source:       params.source || params.subSource || "website",
    page:         params.page || params.sourcePage || (typeof window !== 'undefined' ? window.location.pathname : '/')
  };

  // Client-side validations
  if (!payload.name) {
    return Promise.reject(new Error("Please enter your name."));
  }

  const cleanContact = payload.contact.replace(/\D/g, "");
  if (!cleanContact || cleanContact.length < 10) {
    return Promise.reject(new Error("Please enter a valid 10-digit phone number."));
  }

  if (payload.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.mail)) {
    return Promise.reject(new Error("Please enter a valid email address."));
  }

  const apiUrl = getApiUrl();

  return fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then(async (response) => {
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { success: false, message: "Unable to process enquiry" };
      }

      if (!response.ok || !data || data.success !== true) {
        const userMsg = (data && data.message && data.message !== "Unable to process enquiry") 
          ? data.message 
          : "We encountered an issue submitting your enquiry. Please try again.";
        return Promise.reject(new Error(userMsg));
      }

      return {
        success: true,
        message: "Thank you. Your enquiry has been received. Our sales team will contact you shortly."
      };
    })
    .catch((err) => {
      // If network fetch fails (e.g. backend server down), handle error gracefully
      console.error("[AeroVillas Form Error]:", err.message);
      return Promise.reject(new Error("Unable to connect to the enquiry service. Please ensure the backend server is running or try again later."));
    });
}

// Helper aliases for compatibility
function submitLead(params) {
  return submitEnquiry(params);
}

function sendLeadEmail(params) {
  return submitEnquiry(params);
}
