// Site interactions and utilities
(function () {
  const $ = (s, d = document) => d.querySelector(s);
  const $$ = (s, d = document) => Array.from(d.querySelectorAll(s));

  // Current year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  const navToggle = $(".nav-toggle");
  const navMenu = $("#nav-menu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      navMenu.classList.toggle("open");
    });
  }

  // Dropdowns
  $$(".has-dropdown").forEach((item) => {
    const btn = item.querySelector(".dropdown-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isOpen = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });
  });

  // Smooth scroll for internal links
  $$("a[href^='#']").forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Theme toggle
  const themeToggle = $("#theme-toggle");
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.dataset.theme = savedTheme;
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next =
        document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("theme", next);
      toast(`Theme: ${next}`);
    });
  }

  // Lightbox for gallery
  const lightbox = $("#lightbox");
  const lightboxImg = $(".lightbox-image", lightbox);
  const lightboxCaption = $(".lightbox-caption", lightbox);
  const lightboxClose = $(".lightbox-close", lightbox);
  if (lightbox) {
    $$(".lightbox").forEach((a) => {
      a.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() === "img") return; // allow image clicks inside figure
      });
    });
    $$("a.lightbox").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const href = a.getAttribute("href");
        const caption = a.getAttribute("data-caption") || "";
        lightboxImg.src = href;
        lightboxCaption.textContent = caption;
        lightbox.classList.add("open");
        lightbox.setAttribute("aria-hidden", "false");
      });
    });
    function closeLightbox() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      lightboxImg.src = "";
      lightboxCaption.textContent = "";
    }
    lightboxClose?.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("open"))
        closeLightbox();
    });
  }

  // Share button
  const shareBtn = $("#share-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const shareData = {
        title: document.title,
        text: "Check out Samuel Benardo's profile",
        url: window.location.href,
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(shareData.url);
          toast("Link copied to clipboard");
        }
      } catch (_) {
        await navigator.clipboard.writeText(shareData.url);
        toast("Link copied to clipboard");
      }
    });
  }

  // Back to top
  $("#back-to-top")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Toast utility
  const toastEl = $("#toast");
  let toastTimer = null;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2000);
  }

  // Cookies & consent
  function setCookie(name, value, days) {
    const maxAge = days ? `; max-age=${days * 24 * 60 * 60}` : "";
    document.cookie = `${name}=${encodeURIComponent(
      value
    )}; path=/; SameSite=Lax${maxAge}`;
  }
  function getCookie(name) {
    const row = document.cookie
      .split("; ")
      .find((r) => r.startsWith(name + "="));
    return row ? decodeURIComponent(row.split("=")[1]) : "";
  }
  function hasConsent() {
    return getCookie("site_consent") === "granted";
  }
  window.hasConsent = hasConsent;

  function showCookieBanner() {
    if (document.querySelector(".cookie-banner")) return;
    const banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.innerHTML = `
      <div class="cookie-content">
        <div class="cookie-text">
          <strong>Cookies & Data</strong>
          <div>We use cookies to save your settings and (optionally) enable the global leaderboard.</div>
        </div>
        <div class="cookie-actions">
          <button class="btn btn-primary" id="cookie-accept">Accept</button>
          <button class="btn" id="cookie-decline">Decline</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    const accept = banner.querySelector("#cookie-accept");
    const decline = banner.querySelector("#cookie-decline");
    const finish = (value) => {
      setCookie("site_consent", value, 365);
      localStorage.setItem("site_consent", value);
      banner.remove();
      window.dispatchEvent(new Event("consent-changed"));
      toast(
        value === "granted"
          ? "Thanks! Leaderboard enabled."
          : "Consent declined"
      );
    };
    accept.addEventListener("click", () => finish("granted"));
    decline.addEventListener("click", () => finish("denied"));
  }

  if (!getCookie("site_consent")) {
    setTimeout(showCookieBanner, 0);
  }
})();
