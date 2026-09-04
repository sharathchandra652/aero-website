/**
 * Aero Villas — Unified Client Lead Submission Helper
 * Submits form payloads to the central backend API (/api/leads).
 */

function submitLead(params) {
  const payload = {
    leadType: params.leadType || (params.subSource && params.subSource.toLowerCase().includes("visit") ? "schedule_visit" : "enquiry"),
    name: (params.name || "").trim(),
    phone: (params.phone || params.mobileNo || "").trim(),
    email: (params.email || "").trim(),
    interestedIn: (params.interestedIn || params.interested || "").trim(),
    budget: (params.budget || "").trim(),
    preferredDate: (params.preferredDate || params.sitevisitDate || "").trim(),
    preferredTime: (params.preferredTime || "").trim(),
    visitors: (params.visitors || "").trim(),
    message: (params.message || "").trim(),
    source: params.source || params.subSource || "website",
    page: params.page || params.sourcePage || window.location.pathname
  };

  // Client Validation
  if (!payload.name) {
    return Promise.reject(new Error("Please enter your name."));
  }

  const cleanPhone = payload.phone.replace(/\D/g, "");
  if (!cleanPhone || cleanPhone.length < 10) {
    return Promise.reject(new Error("Please enter a valid 10-digit phone number."));
  }

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return Promise.reject(new Error("Please enter a valid email address."));
  }

  return fetch("/api/leads", {
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
        data = { success: false, message: "Unable to submit your request at this time." };
      }

      if (!res.ok || !data || data.success !== true) {
        const userMsg = (data && data.message && !data.message.toLowerCase().includes("error") && !data.message.toLowerCase().includes("server") && !data.message.toLowerCase().includes("microsoft") && !data.message.toLowerCase().includes("oauth"))
          ? data.message
          : "We encountered an issue submitting your request. Please try again.";
        return Promise.reject(new Error(userMsg));
      }

      return data;
    });
}

function submitEnquiry(params) {
  params.leadType = "enquiry";
  return submitLead(params);
}

function sendLeadEmail(params) {
  return submitLead(params);
}
