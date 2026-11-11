/**
 * Aero Villas — Reusable GA4 Analytics Utility
 * Measurement ID: G-PZ8S6B50M8
 *
 * Implements comprehensive event tracking while preserving privacy:
 * - NO customer PII (names, phone numbers, emails, messages) transmitted
 * - call_click does NOT send phone_number parameter
 * - generate_lead fires only after successful submission
 * - Tracks scroll depth (25%, 50%, 75%) and engagement milestones (30s, 60s, 120s, 300s)
 */

(function () {
  'use strict';

  var GA4_ID = 'G-PZ8S6B50M8';

  // Ensure gtag and dataLayer exist
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }

  // Safe event tracking helper
  function sendEvent(eventName, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    } else {
      gtag('event', eventName, params || {});
    }
  }

  function getPagePath() {
    return window.location.pathname || '/';
  }

  function getButtonLocation(element) {
    if (!element) return 'unknown';
    if (element.closest('header')) return 'header';
    if (element.closest('footer')) return 'footer';
    if (element.closest('#section-hero')) return 'hero';
    if (element.closest('#section-villas, #section-villas1')) return 'villas_section';
    if (element.closest('#section-contact')) return 'contact_section';
    if (element.closest('#enquiryOffcanvas, #enquiryModal')) return 'enquiry_modal';
    if (element.closest('#brochureModal')) return 'brochure_modal';
    if (element.closest('.whatsapp-float')) return 'floating_button';
    if (element.closest('#siteMasterplan')) return 'masterplan';
    return 'page_body';
  }

  // 1. WhatsApp Click Tracking
  function trackWhatsAppClicks() {
    document.addEventListener('click', function (e) {
      var target = e.target.closest('a[href*="wa.me"], a[href*="whatsapp.com"], .whatsapp-float');
      if (target) {
        sendEvent('whatsapp_click', {
          button_name: target.getAttribute('aria-label') || target.innerText.trim() || 'WhatsApp',
          button_location: getButtonLocation(target),
          page_path: getPagePath()
        });
      }
    }, true);
  }

  // 2. Call Click Tracking (Strictly NO phone_number parameter sent)
  function trackCallClicks() {
    document.addEventListener('click', function (e) {
      var target = e.target.closest('a[href^="tel:"]');
      if (target) {
        sendEvent('call_click', {
          button_name: target.innerText.trim() || 'Call Us',
          button_location: getButtonLocation(target),
          page_path: getPagePath()
        });
      }
    }, true);
  }

  // 3. Enquiry Button Clicks
  function trackEnquiryClicks() {
    document.addEventListener('click', function (e) {
      var target = e.target.closest('[data-bs-target="#enquiryOffcanvas"], [data-bs-target="#enquiryModal"], [href="#section-contact"]');
      if (target) {
        var text = target.innerText.trim();
        var isSchedule = /schedule|visit/i.test(text);
        sendEvent(isSchedule ? 'book_visit_click' : 'enquiry_click', {
          button_name: text || (isSchedule ? 'Schedule Visit' : 'Enquiry Now'),
          button_location: getButtonLocation(target),
          page_path: getPagePath()
        });
      }
    }, true);
  }

  // 4. Brochure Clicks
  function trackBrochureClicks() {
    document.addEventListener('click', function (e) {
      var target = e.target.closest('[data-bs-target="#brochureModal"], a[href*="Brochure"]');
      if (target) {
        sendEvent('brochure_click', {
          button_name: target.innerText.trim() || 'Download Brochure',
          button_location: getButtonLocation(target),
          page_path: getPagePath()
        });
      }
    }, true);
  }

  // 5. Villa Selection & Navigation
  function trackVillaSelections() {
    document.addEventListener('click', function (e) {
      var target = e.target.closest('a[href*="sq.yrds"], a[href*="clubhouse"]');
      if (target) {
        var href = target.getAttribute('href') || '';
        var villaType = 'unknown';
        if (href.indexOf('267') !== -1) villaType = '267 sq.yards (Regent)';
        else if (href.indexOf('567') !== -1) villaType = '567 sq.yards (Orlov)';
        else if (href.indexOf('600') !== -1) villaType = '600 sq.yards (Cullinan)';
        else if (href.indexOf('clubhouse') !== -1) villaType = 'Clubhouse (Club Infinite)';

        sendEvent('villa_select', {
          villa_type: villaType,
          button_name: target.innerText.trim() || 'View Details',
          button_location: getButtonLocation(target),
          page_path: getPagePath()
        });
      }
    }, true);
  }

  // 6. Location & Map Clicks
  function trackLocationClicks() {
    document.addEventListener('click', function (e) {
      var target = e.target.closest('a[href*="maps.app.goo.gl"], a[href*="google.com/maps"]');
      if (target) {
        sendEvent('location_click', {
          button_name: target.innerText.trim() || 'Location Map',
          button_location: getButtonLocation(target),
          page_path: getPagePath()
        });
      }
    }, true);
  }

  // 6b. Virtual Tour Clicks
  function trackVirtualTourClicks() {
    document.addEventListener('click', function (e) {
      var target = e.target.closest('a[href*="digitour.housing.com"], #virtualTourBtn');
      if (target) {
        sendEvent('virtual_tour_click', {
          button_name: target.innerText.trim() || 'Virtual Tour',
          button_location: getButtonLocation(target),
          page_path: getPagePath()
        });
      }
    }, true);
  }

  // 7. Navigation Menu Clicks
  function trackNavigationClicks() {
    document.addEventListener('click', function (e) {
      var target = e.target.closest('#mainmenu a, .menu-item');
      if (target) {
        sendEvent('navigation_click', {
          button_name: target.innerText.trim() || 'Menu Link',
          button_location: 'navigation_bar',
          page_path: getPagePath()
        });
      }
    }, true);
  }

  // 8. Social Media Clicks
  function trackSocialClicks() {
    document.addEventListener('click', function (e) {
      var target = e.target.closest('.social-icons a, a[href*="facebook.com"], a[href*="instagram.com"], a[href*="youtube.com"]');
      if (target) {
        var href = target.getAttribute('href') || '';
        var platform = 'social';
        if (href.indexOf('facebook') !== -1) platform = 'facebook';
        else if (href.indexOf('instagram') !== -1) platform = 'instagram';
        else if (href.indexOf('youtube') !== -1) platform = 'youtube';

        sendEvent('social_media_click', {
          platform: platform,
          page_path: getPagePath()
        });
      }
    }, true);
  }

  // 9. Scroll Depth Tracking (25%, 50%, 75%)
  function trackScrollDepth() {
    var thresholds = [25, 50, 75];
    var tracked = {};

    function checkScroll() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) return;
      var scrollPercent = Math.round((scrollTop / docHeight) * 100);

      thresholds.forEach(function (threshold) {
        if (scrollPercent >= threshold && !tracked[threshold]) {
          tracked[threshold] = true;
          sendEvent('scroll_depth', {
            percent_scrolled: threshold,
            page_path: getPagePath()
          });
        }
      });
    }

    window.addEventListener('scroll', checkScroll, { passive: true });
  }

  // 10. Engagement Time Milestones (30s, 60s, 120s, 300s)
  function trackEngagementMilestones() {
    var milestones = [30, 60, 120, 300];
    milestones.forEach(function (sec) {
      setTimeout(function () {
        if (!document.hidden) {
          sendEvent('engagement_milestone', {
            engagement_time_sec: sec,
            page_path: getPagePath()
          });
        }
      }, sec * 1000);
    });
  }

  // 11. Lead Generation (Called ONLY after successful form submission; NO PII sent)
  window.trackLeadGeneration = function (params) {
    params = params || {};
    sendEvent('generate_lead', {
      form_name: params.formName || 'lead_form',
      villa_type: params.villaType || 'not_specified',
      page_path: params.page || getPagePath()
    });
  };

  // 12. Brochure Download Success Event
  window.trackBrochureDownload = function (params) {
    params = params || {};
    sendEvent('brochure_download', {
      villa_type: params.villaType || 'all_villas',
      page_path: params.page || getPagePath()
    });
  };

  // Initialize all listeners when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalytics);
  } else {
    initAnalytics();
  }

  function initAnalytics() {
    trackWhatsAppClicks();
    trackCallClicks();
    trackEnquiryClicks();
    trackBrochureClicks();
    trackVillaSelections();
    trackLocationClicks();
    trackVirtualTourClicks();
    trackNavigationClicks();
    trackSocialClicks();
    trackScrollDepth();
    trackEngagementMilestones();
  }
})();

