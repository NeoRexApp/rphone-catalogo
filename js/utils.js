export function waLink(e164Digits, message) {
  const msg = encodeURIComponent(message);
  const phone = (e164Digits || "").replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${msg}`;
}

export function $(sel){ return document.querySelector(sel); }

export function setActiveNav() {
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("[data-nav]").forEach(a => {
    const target = (a.getAttribute("href") || "").toLowerCase();
    if (target === path) a.classList.add("active");
  });
}
