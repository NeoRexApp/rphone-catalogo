// ==== RPHONE SETTINGS (demo) ====
// Later: replace this with Firebase/Firestore read.
export const SITE = {
  brandName: "RPHONE",
  whatsappE164: "521000000000", // <-- cambia esto a tu número (solo dígitos)
  address: "Reynosa, Tamaulipas, MX",
  hours: "Lun–Sáb 10:00–20:00",
  mapsUrl: "https://maps.google.com",

  // Para index (secciones Sucursales)
  branches: [
    {
      name: "Puerta del Sol",
      address: "Puerta del Sol • Blvd. Puerta del Sol, Reynosa, Tamps.",
      mapsUrl: "https://maps.app.goo.gl/4dncr76sdmUyeBo98",
    },
    {
      name: "Matriz",
      address: "Matriz • Suc. Aztlán, Reynosa, Tamps.",
      mapsUrl: "https://maps.app.goo.gl/KRVU36jb3cCVDco79",
    },
  ],
};
