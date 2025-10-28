(function () {
  const KEY = "cookie-consent-v1";
  const $banner = document.getElementById("cookie-banner");
  const $prefsBtn = document.getElementById("cookie-preferences");
  const $analytics = document.getElementById("consent-analytics");
  const $marketing = document.getElementById("consent-marketing");
  const $openSettings = document.getElementById("cookie-open-settings");
  const $settings = document.getElementById("cookie-settings");
  const $acceptAll = document.getElementById("cookie-accept-all");
  const $acceptNec = document.getElementById("cookie-accept-necessary");
  const $save = document.getElementById("cookie-save");
  const $cancel = document.getElementById("cookie-cancel");

  function getConsent() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || null;
    } catch (e) {
      return null;
    }
  }
  function setConsent(obj) {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        necessary: true,
        analytics: !!obj.analytics,
        marketing: !!obj.marketing,
        ts: Date.now(),
      })
    );
  }

  function loadDeferredScripts(consent) {
    // Entsperre Skripte mit type="text/plain" + data-consent="analytics|marketing"
    document
      .querySelectorAll('script[type="text/plain"][data-consent]')
      .forEach((tag) => {
        const cat = tag.getAttribute("data-consent");
        const allowed =
          (cat === "analytics" && consent.analytics) ||
          (cat === "marketing" && consent.marketing);
        if (!allowed) return;

        const s = document.createElement("script");
        // übertrage Attribute außer type/data-consent
        for (const a of tag.attributes) {
          if (a.name === "type" || a.name === "data-consent") continue;
          s.setAttribute(a.name, a.value);
        }
        if (tag.src) {
          s.src = tag.src;
        } else {
          s.textContent = tag.textContent;
        }
        s.defer = tag.defer || false;
        s.async = tag.async || false;
        tag.replaceWith(s);
      });
  }

  function showBanner() {
    $banner.hidden = false;
    $settings.hidden = true;
    if ($analytics) $analytics.checked = false;
    if ($marketing) $marketing.checked = false;
  }
  function hideBanner() {
    $banner.hidden = true;
  }

  function applyConsent() {
    const c = getConsent();
    if (!c) {
      showBanner();
      return;
    }
    loadDeferredScripts(c);
    hideBanner();
  }

  // Respect Do Not Track: standardmäßig keine Analyse/Marketing ohne aktive Zustimmung
  const DNT = navigator.doNotTrack === "1" || window.doNotTrack === "1";
  if (DNT && !getConsent()) {
    setConsent({ analytics: false, marketing: false });
  }

  // Events
  $acceptAll?.addEventListener("click", () => {
    setConsent({ analytics: !DNT, marketing: !DNT });
    applyConsent();
  });
  $acceptNec?.addEventListener("click", () => {
    setConsent({ analytics: false, marketing: false });
    applyConsent();
  });
  $openSettings?.addEventListener("click", () => {
    $settings.hidden = false;
  });
  $cancel?.addEventListener("click", () => {
    $settings.hidden = true;
  });
  $save?.addEventListener("click", () => {
    setConsent({
      analytics: $analytics?.checked,
      marketing: $marketing?.checked,
    });
    applyConsent();
  });
  $prefsBtn?.addEventListener("click", () => {
    showBanner();
    $settings.hidden = false;
  });

  // Start
  applyConsent();
})();
