import { SITE } from "./settings.js";
import { TICKETS } from "./demo-data.js";
import { waLink, $, setActiveNav } from "./utils.js";

function lookup(codeRaw){
  const code = (codeRaw || "").trim().toUpperCase();
  if (!code) return null;
  return TICKETS[code] ? { code, ...TICKETS[code] } : null;
}

(function init(){
  $(".brand-name").textContent = SITE.brandName;
  $("#waHelp").href = waLink(SITE.whatsappE164, "Hola 👋 No encuentro mi código, ¿me ayudas?");

  const run = () => {
    const t = lookup($("#code").value);
    if (!t){
      $("#result").innerHTML = `
        <div class="card soft">
          <div class="section-title">
            <h2>No encontrado</h2>
            <span class="badge">Tip: prueba RP-482193</span>
          </div>
          <p class="p">Revisa tu código o escríbenos por WhatsApp.</p>
          <div class="actions">
            <a class="pill primary" href="${waLink(SITE.whatsappE164, "Hola 👋 Quiero rastrear mi reparación pero no tengo el código.")}" target="_blank" rel="noopener">Pedir ayuda</a>
          </div>
        </div>
      `;
      return;
    }

    $("#result").innerHTML = `
      <div class="card soft">
        <div class="section-title">
          <h2>Estatus</h2>
          <span class="badge">Código: ${t.code}</span>
        </div>
        <div style="font-size:22px;font-weight:900;margin-top:6px">${t.status || "Sin estatus"}</div>
        ${t.notes ? `<p class="p" style="margin-top:8px">${t.notes}</p>` : ``}
      </div>
    `;
  };

  $("#btn").addEventListener("click", run);
  $("#code").addEventListener("keydown", (e)=>{ if(e.key === "Enter") run(); });

  setActiveNav();
})();
