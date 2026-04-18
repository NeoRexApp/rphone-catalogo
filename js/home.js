import { SITE } from "./settings.js";
import { CATALOG, FAQ } from "./demo-data.js";
import { waLink, $, setActiveNav } from "./utils.js";

function productCard(p){
  const price = (p.priceFrom && p.priceFrom > 0) ? `Desde $${p.priceFrom}` : "Pregunta precio";
  const tags = [
    p.offer ? `<span class="badge">Oferta</span>` : "",
    p.featured ? `<span class="badge">Destacado</span>` : "",
    p.category ? `<span class="badge">${p.category}</span>` : "",
  ].filter(Boolean).join("");

  const msg = `Hola 👋 Me interesa: ${p.name}. ¿Precio y disponibilidad?`;
  const href = waLink(SITE.whatsappE164, msg);

  return `
    <div class="card soft">
      <div class="prod">
        <div class="thumb"><img src="${p.image}" alt="${p.name}"></div>
        <div class="title">${p.name}</div>
        <div class="meta">${tags}</div>
        <div class="price">${price}</div>
        <a class="pill primary" href="${href}" target="_blank" rel="noopener">Preguntar</a>
      </div>
    </div>
  `;
}

function faqItem(x){
  return `
    <div class="faq-item">
      <p class="faq-q">${x.q}</p>
      <p class="faq-a">${x.a}</p>
    </div>
  `;
}

(function init(){
  // Brand/logo
  $(".brand-name").textContent = SITE.brandName;
  $("#siteMeta").textContent = `${SITE.address} • ${SITE.hours}`;

  // Floating WA
  $("#floatWa").href = waLink(SITE.whatsappE164, "Hola 👋 Quiero información.");
  $("#waTop").href = waLink(SITE.whatsappE164, "Hola 👋 Quiero info de RPHONE.");

  // Quick quote
  $("#btnQuote").addEventListener("click", () => {
    const device = $("#qDevice").value.trim() || "(equipo sin especificar)";
    const issue = $("#qIssue").value;
    const msg = `Hola 👋 Quiero cotizar.\nEquipo: ${device}\nFalla: ${issue}\n¿Precio y tiempo estimado?`;
    window.open(waLink(SITE.whatsappE164, msg), "_blank", "noopener");
  });

  // Offers (top 3)
  const offers = CATALOG.filter(x => x.offer).slice(0,3);
  $("#offers").innerHTML = offers.map(productCard).join("") || `<p class="p">Aún no hay ofertas publicadas.</p>`;

  // FAQ
  $("#faq").innerHTML = FAQ.map(faqItem).join("");

  setActiveNav();
})();
