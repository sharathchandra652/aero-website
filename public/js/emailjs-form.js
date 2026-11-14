
function isValidPhone(value) {
  if (!value || typeof value !== 'string') return false;
  const cleaned = value.trim().replace(/^\+/, '').replace(/[\s\-\(\)\[\]\.]/g, '');
  return /^\d{10,15}$/.test(cleaned);
}

if (typeof window !== 'undefined') {
  window.isValidPhone = isValidPhone;
}

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
    return Promise.reject(new Error("Please enter a valid phone number with country code if outside India."));
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
    .catch((err) => {
      console.error("[AeroVillas Form Network Error]:", err.message);
      throw new Error("Unable to connect to the enquiry service. Please try again later.");
    })
    .then(async (response) => {
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { success: false, message: "Unable to process enquiry" };
      }

      if (!response.ok || !data || data.success !== true || data.emailSent === false) {
        const userMsg = (data && data.message && data.message !== "Unable to process enquiry" && data.message !== "Enquiry received")
          ? data.message
          : "We encountered an issue submitting your enquiry. Please try again.";
        throw new Error(userMsg);
      }

      // Preserve GA4 lead tracking event (Only on success, strictly no PII)
      if (typeof window !== 'undefined' && typeof window.trackLeadGeneration === 'function') {
        window.trackLeadGeneration({
          formName: payload.leadType || payload.source || 'enquiry',
          villaType: payload.interestedIn || 'General',
          page: payload.page
        });
      }

      return {
        success: true,
        message: "Thank you. Your enquiry has been received. Our sales team will contact you shortly."
      };
    });
}

// Helper aliases for compatibility
function submitLead(params) {
  return submitEnquiry(params);
}

function sendLeadEmail(params) {
  return submitEnquiry(params);
}
