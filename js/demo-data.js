// ==== DEMO DATA ====
// Later: pull from Firestore (catalogItems, faq, repairTickets).
export const CATALOG = [
  { id:"p1", name:"Pantalla iPhone 11 (Calidad AAA)", category:"Pantallas", priceFrom: 1299, offer:true, featured:true, image:"https://picsum.photos/seed/rp1/800/500" },
  { id:"p2", name:"Batería iPhone XR / 11", category:"Baterías", priceFrom: 699, offer:false, featured:true, image:"https://picsum.photos/seed/rp2/800/500" },
  { id:"p3", name:"Centro de carga Samsung A52", category:"Centro de carga", priceFrom: 799, offer:true, featured:false, image:"https://picsum.photos/seed/rp3/800/500" },
  { id:"p4", name:"Mica Hydrogel (instalación)", category:"Accesorios", priceFrom: 149, offer:false, featured:false, image:"https://picsum.photos/seed/rp4/800/500" },
  { id:"p5", name:"Cargador 20W + Cable", category:"Accesorios", priceFrom: 299, offer:true, featured:true, image:"https://picsum.photos/seed/rp5/800/500" },
  { id:"p6", name:"Diagnóstico (se descuenta si reparas)", category:"Servicio", priceFrom: 0, offer:false, featured:false, image:"https://picsum.photos/seed/rp6/800/500" },
];

export const FAQ = [
  { q:"¿Pierdo mis datos si cambio pantalla o batería?", a:"Normalmente no. Aun así, si tu equipo está muy dañado, siempre recomendamos respaldo previo." },
  { q:"¿Cuánto tarda una reparación?", a:"Depende del daño y la refacción. Pantallas y baterías suelen ser el mismo día. Mojado requiere diagnóstico (24–48h)." },
  { q:"¿Dan garantía?", a:"Sí. La garantía depende del servicio/refacción. Te la explicamos antes de iniciar y queda registrada." },
];

export const TICKETS = {
  "RP-482193": { status:"En diagnóstico", notes:"Te confirmamos precio y refacción hoy por la tarde." },
  "RP-991204": { status:"Listo para entrega", notes:"Tu equipo ya está probado. Pasa cuando gustes 🙌" },
};
