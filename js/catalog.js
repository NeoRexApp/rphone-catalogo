const config = window.RPHONE_CATALOG_CONFIG || {};
const FALLBACK_IMAGE = config.defaultImage || "assets/iphone-16-pro-max.png";
const ITEMS_PER_PAGE = Number(config.itemsPerPage) || 60;
const GOOGLE_SHEET_PLACEHOLDER = "PEGA_AQUI_EL_ID_DE_TU_GOOGLE_SHEET";
const ACCESSORY_CATEGORIES = new Set([
  "accesorios",
  "fundas",
  "protectores",
  "cargadores",
  "cables",
  "audifonos",
  "memorias",
  "adaptadores",
  "chips",
  "soportes",
  "gadgets"
]);
const CATEGORY_PRIORITY = ["todos", "pantallas", "baterias", "tapas", "accesorios", "esim"];
const MAX_SUGGESTIONS = 8;

const productosGrid = document.getElementById("productosGrid");
const buscador = document.getElementById("buscador");
const catalogFilterScroll = document.getElementById("catalogFilterScroll");
const catalogQuickMenu = document.getElementById("catalogQuickMenu");
const btnLoadMore = document.getElementById("catalogLoadMore");
const catalogMeta = document.getElementById("catalogMeta");
const catalogMenuToggle = document.getElementById("catalogMenuToggle");
const catalogSearchWrap = document.querySelector(".catalog-search-wrap");
const catalogSearchDropdown = document.getElementById("catalogSearchDropdown");

const state = {
  productos: [],
  categoriaActual: "todos",
  textoBusqueda: "",
  limite: ITEMS_PER_PAGE,
  origen: "local",
  sugerencias: [],
  sugerenciaActiva: -1
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatearEtiqueta(value = "") {
  if (!value) return "Sin categoría";

  const mapa = {
    todos: "Todos",
    pantallas: "Pantallas",
    baterias: "Baterías",
    tapas: "Tapas",
    accesorios: "Accesorios",
    esim: "eSIM",
    audifonos: "Audífonos"
  };

  if (mapa[value]) return mapa[value];

  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function parseNumber(value) {
  if (typeof value === "number") return value;
  const cleaned = String(value ?? "")
    .replace(/[^\d.,-]/g, "")
    .replace(/,/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatearPrecio(precio) {
  const numero = parseNumber(precio);
  return `$<span>${numero.toLocaleString("es-MX")}</span> MXN`;
}

function getWhatsappLink(producto) {
  if (producto.whatsapp) return producto.whatsapp;

  const telefono = String(config.whatsappE164 || "").replace(/\D/g, "");
  const mensaje = encodeURIComponent(
    producto.whatsapp_texto || `Hola, me interesa ${producto.nombre}`
  );

  if (!telefono) return `https://wa.me/?text=${mensaje}`;
  return `https://wa.me/${telefono}?text=${mensaje}`;
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").trim().toLowerCase();
  return !["false", "0", "no", "off", ""].includes(text);
}

function esCategoriaAccesorio(categoria = "") {
  return ACCESSORY_CATEGORIES.has(slugify(categoria));
}

function normalizarProducto(producto, index) {
  const categoria = slugify(producto.categoria || producto.category || "general");
  const nombre = String(producto.nombre || producto.name || "Producto sin nombre").trim();
  const detalle = String(producto.detalle || producto.descripcion || "").trim();
  const precio = parseNumber(producto.precio || producto.price || 0);
  const precioSeguidor = parseNumber(producto.precio_seguidor || producto.price_follower || 0);
  const imagen = String(producto.imagen || producto.image || "").trim();

  return {
    id: String(producto.id || `item-${index + 1}`),
    activo: parseBoolean(producto.activo ?? producto.active ?? true),
    tipo: slugify(producto.tipo || producto.kind || "servicio"),
    categoria,
    nombre,
    detalle,
    precio,
    precio_seguidor: Number.isFinite(precioSeguidor) && precioSeguidor > 0 ? precioSeguidor : null,
    imagen,
    stock: producto.stock ?? "",
    sku: String(producto.sku || "").trim(),
    marca: String(producto.marca || producto.brand || "").trim(),
    descripcion_larga: String(producto.descripcion_larga || producto.long_description || "").trim(),
    origen_hoja: String(producto.origen_hoja || producto.origen || "").trim(),
    whatsapp_texto: producto.whatsapp_texto || producto.whatsappText || "",
    orden: Number(producto.orden || index + 1)
  };
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      value = "";
      if (row.some((cell) => String(cell).trim() !== "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    value += char;
  }

  if (value !== "" || row.length) {
    row.push(value);
    if (row.some((cell) => String(cell).trim() !== "")) {
      rows.push(row);
    }
  }

  if (!rows.length) return [];

  const headers = rows[0].map((header) => slugify(header));
  return rows.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = cells[index] ?? "";
    });
    return obj;
  });
}

async function cargarDesdeGoogleSheets() {
  const sheetId = String(config.googleSheetId || "").trim();
  const sheetName = encodeURIComponent(config.googleSheetSheetName || "CATALOGO_WEB");

  if (!sheetId || sheetId === GOOGLE_SHEET_PLACEHOLDER) {
    throw new Error("Falta configurar el ID de Google Sheets.");
  }

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("No se pudo leer la hoja de Google Sheets.");
  }

  const csvText = await response.text();
  return parseCSV(csvText);
}

async function cargarDesdeLocal() {
  const response = await fetch(config.localJsonPath || "data/catalogo-local.json", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("No se pudo leer el catálogo local.");
  }

  return response.json();
}

async function cargarCatalogo() {
  try {
    if (String(config.mode || "").toLowerCase() === "googlesheets") {
      const rows = await cargarDesdeGoogleSheets();
      state.origen = "googleSheets";
      return rows;
    }
  } catch (error) {
    console.warn("Google Sheets no disponible, usando JSON local.", error);
  }

  state.origen = "local";
  return cargarDesdeLocal();
}

function obtenerCategorias(productos) {
  const categoriasBase = [...new Set(productos.map((producto) => producto.categoria).filter(Boolean))];
  const ordered = [];
  const restantes = [...categoriasBase];

  CATEGORY_PRIORITY.forEach((categoria) => {
    if (categoria === "accesorios") {
      if (categoriasBase.some((item) => esCategoriaAccesorio(item))) {
        ordered.push("accesorios");
      }
      return;
    }

    if (categoriasBase.includes(categoria) || categoria === "todos") {
      ordered.push(categoria);
    }
  });

  const extras = restantes
    .filter((categoria) => !ordered.includes(categoria) && !esCategoriaAccesorio(categoria))
    .sort((a, b) => formatearEtiqueta(a).localeCompare(formatearEtiqueta(b), "es"));

  return [...ordered, ...extras];
}

function sincronizarCategoriaUI() {
  document.querySelectorAll(".catalog-line-filter").forEach((boton) => {
    const activa = boton.dataset.category === state.categoriaActual;
    boton.classList.toggle("active", activa);
    boton.setAttribute("aria-selected", activa ? "true" : "false");
  });

  document.querySelectorAll(".catalog-quick-option").forEach((boton) => {
    boton.classList.toggle("active", boton.dataset.category === state.categoriaActual);
  });
}

function cerrarMenu() {
  if (!catalogQuickMenu || !catalogMenuToggle) return;
  catalogQuickMenu.classList.remove("is-open");
  catalogQuickMenu.setAttribute("aria-hidden", "true");
  catalogMenuToggle.classList.remove("is-open");
  catalogMenuToggle.setAttribute("aria-expanded", "false");
}

function abrirMenu() {
  if (!catalogQuickMenu || !catalogMenuToggle) return;
  catalogQuickMenu.classList.add("is-open");
  catalogQuickMenu.setAttribute("aria-hidden", "false");
  catalogMenuToggle.classList.add("is-open");
  catalogMenuToggle.setAttribute("aria-expanded", "true");
}

function cerrarSugerencias() {
  if (!catalogSearchDropdown) return;
  catalogSearchDropdown.classList.remove("is-open");
  catalogSearchDropdown.innerHTML = "";
  catalogSearchDropdown.hidden = true;
  state.sugerencias = [];
  state.sugerenciaActiva = -1;
}

function abrirSugerencias() {
  if (!catalogSearchDropdown) return;
  catalogSearchDropdown.hidden = false;
  catalogSearchDropdown.classList.add("is-open");
}

function coincideCategoria(producto) {
  if (state.categoriaActual === "todos") return true;
  if (state.categoriaActual === "accesorios") return esCategoriaAccesorio(producto.categoria);
  return producto.categoria === state.categoriaActual;
}

function construirFiltros() {
  const categorias = obtenerCategorias(state.productos);

  catalogFilterScroll.innerHTML = categorias.map((categoria, index) => `
    <button class="catalog-line-filter ${index === 0 ? "active" : ""}" data-category="${categoria}" role="tab" aria-selected="${index === 0 ? "true" : "false"}">
      ${formatearEtiqueta(categoria)}
    </button>
  `).join("");

  catalogFilterScroll.querySelectorAll(".catalog-line-filter").forEach((boton) => {
    boton.addEventListener("click", () => cambiarCategoria(boton.dataset.category));
  });

  if (catalogQuickMenu) {
    const categoriasMenu = [...new Set([
      ...categorias,
      ...state.productos
        .map((producto) => producto.categoria)
        .filter((categoria) => categoria && !categorias.includes(categoria))
        .sort((a, b) => formatearEtiqueta(a).localeCompare(formatearEtiqueta(b), "es"))
    ])];

    catalogQuickMenu.innerHTML = `
      ${categoriasMenu.map((categoria, index) => `
        <button class="catalog-quick-option ${index === 0 ? "active" : ""}" type="button" data-category="${categoria}">${formatearEtiqueta(categoria)}</button>
      `).join("")}
      <button id="btnLimpiarBusqueda" class="catalog-quick-clear" type="button">Limpiar búsqueda</button>
    `;

    catalogQuickMenu.querySelectorAll(".catalog-quick-option").forEach((boton) => {
      boton.addEventListener("click", () => cambiarCategoria(boton.dataset.category));
    });

    document.getElementById("btnLimpiarBusqueda")?.addEventListener("click", () => {
      if (buscador) buscador.value = "";
      state.textoBusqueda = "";
      state.limite = ITEMS_PER_PAGE;
      renderizarFiltrado();
      renderizarSugerencias();
      cerrarMenu();
    });
  }
}

function renderizarProductos(listaProductos) {
  productosGrid.innerHTML = "";

  if (listaProductos.length === 0) {
    productosGrid.innerHTML = `
      <div class="catalog-empty">
        <h3>Sin resultados</h3>
        <p>Prueba con otra categoría o escribe un nombre diferente.</p>
      </div>
    `;
    return;
  }

  listaProductos.forEach((producto, index) => {
    const card = document.createElement("article");
    card.className = "catalog-card";
    card.style.setProperty("--stagger", String(index));

    card.innerHTML = `
      <div class="catalog-card-media">
        <img
          src="${escapeHtml(producto.imagen || FALLBACK_IMAGE)}"
          alt="${escapeHtml(producto.nombre)}"
          class="catalog-card-image"
          loading="lazy"
        />
        <span class="catalog-card-badge">${escapeHtml(formatearEtiqueta(producto.categoria))}</span>
      </div>

      <div class="catalog-card-body">
        <h3 class="catalog-card-title">${escapeHtml(producto.nombre)}</h3>
        ${producto.detalle ? `<p class="catalog-card-detail">${escapeHtml(producto.detalle)}</p>` : ""}
        <p class="catalog-card-price">${formatearPrecio(producto.precio)}</p>
        ${producto.precio_seguidor ? `<p class="catalog-card-price-alt">Precio seguidor: <strong>$${Number(producto.precio_seguidor).toLocaleString("es-MX")} MXN</strong></p>` : ""}
        <button class="catalog-btn" type="button">
          <span>Preguntar por WhatsApp</span>
          <i class="fa-brands fa-whatsapp"></i>
        </button>
      </div>
    `;

    const img = card.querySelector(".catalog-card-image");
    img.addEventListener("error", () => {
      img.src = FALLBACK_IMAGE;
    }, { once: true });

    const boton = card.querySelector(".catalog-btn");
    boton.addEventListener("click", () => {
      window.open(getWhatsappLink(producto), "_blank", "noopener");
    });

    productosGrid.appendChild(card);

    requestAnimationFrame(() => {
      card.classList.add("is-visible");
    });
  });
}

function obtenerTextoBusqueda(producto) {
  return normalizeText([
    producto.nombre,
    producto.detalle,
    producto.categoria,
    producto.marca,
    producto.sku,
    producto.descripcion_larga,
    producto.origen_hoja
  ].filter(Boolean).join(" "));
}

function obtenerFiltradoCompleto() {
  let resultado = state.productos.filter(coincideCategoria);

  const texto = normalizeText(state.textoBusqueda);
  if (texto) {
    resultado = resultado.filter((producto) => obtenerTextoBusqueda(producto).includes(texto));
  }

  resultado.sort((a, b) => (a.orden - b.orden) || a.nombre.localeCompare(b.nombre, "es"));
  return resultado;
}

function actualizarMeta(totalFiltrado, totalMostrado) {
  const origen = state.origen === "googleSheets" ? "Google Sheets" : "archivo local";
  catalogMeta.textContent = `Mostrando ${totalMostrado} de ${totalFiltrado} resultados · Fuente: ${origen}`;
}

function renderizarFiltrado() {
  const resultado = obtenerFiltradoCompleto();
  const visibles = resultado.slice(0, state.limite);

  renderizarProductos(visibles);
  sincronizarCategoriaUI();
  actualizarMeta(resultado.length, visibles.length);

  btnLoadMore.hidden = visibles.length >= resultado.length;
}

function cambiarCategoria(nuevaCategoria) {
  state.categoriaActual = nuevaCategoria;
  state.limite = ITEMS_PER_PAGE;
  renderizarFiltrado();
  renderizarSugerencias();
  cerrarMenu();
}

function obtenerSugerencias() {
  if (!buscador) return [];
  const texto = normalizeText(buscador?.value || "");
  let base = state.productos.filter(coincideCategoria);

  if (texto) {
    const exactStarts = [];
    const includes = [];

    base.forEach((producto) => {
      const nombre = normalizeText(producto.nombre);
      const searchable = obtenerTextoBusqueda(producto);

      if (!searchable.includes(texto)) return;
      if (nombre.startsWith(texto)) {
        exactStarts.push(producto);
      } else {
        includes.push(producto);
      }
    });

    base = [...exactStarts, ...includes];
  }

  return base
    .sort((a, b) => (a.orden - b.orden) || a.nombre.localeCompare(b.nombre, "es"))
    .slice(0, MAX_SUGGESTIONS);
}

function renderizarSugerencias() {
  if (!catalogSearchDropdown) return;

  const sugerencias = obtenerSugerencias();
  state.sugerencias = sugerencias;
  state.sugerenciaActiva = -1;

  if (!sugerencias.length || document.activeElement !== buscador) {
    cerrarSugerencias();
    return;
  }

  catalogSearchDropdown.innerHTML = sugerencias.map((producto, index) => `
    <button
      class="catalog-search-option"
      type="button"
      data-index="${index}"
      data-name="${escapeHtml(producto.nombre)}"
    >
      <span class="catalog-search-option-main">${escapeHtml(producto.nombre)}</span>
      <span class="catalog-search-option-meta">${escapeHtml(formatearEtiqueta(producto.categoria))}${producto.detalle ? ` · ${escapeHtml(producto.detalle)}` : ""}</span>
    </button>
  `).join("");

  catalogSearchDropdown.querySelectorAll(".catalog-search-option").forEach((boton) => {
    boton.addEventListener("click", () => {
      const index = Number(boton.dataset.index);
      seleccionarSugerencia(index);
    });
  });

  abrirSugerencias();
}

function resaltarSugerencia(index) {
  const options = catalogSearchDropdown?.querySelectorAll(".catalog-search-option") || [];
  options.forEach((option, optionIndex) => {
    option.classList.toggle("active", optionIndex === index);
  });
  state.sugerenciaActiva = index;
}

function seleccionarSugerencia(index) {
  const producto = state.sugerencias[index];
  if (!producto) return;

  buscador.value = producto.nombre;
  state.textoBusqueda = producto.nombre;
  state.limite = ITEMS_PER_PAGE;
  renderizarFiltrado();
  cerrarSugerencias();
  buscador.blur();
}

async function initCatalogo() {
  catalogMeta.textContent = "Cargando catálogo...";

  try {
    const raw = await cargarCatalogo();
    state.productos = raw
      .map(normalizarProducto)
      .filter((producto) => producto.activo && producto.nombre && Number.isFinite(producto.precio));

    construirFiltros();
    renderizarFiltrado();
    renderizarSugerencias();
  } catch (error) {
    console.error(error);
    productosGrid.innerHTML = `
      <div class="catalog-empty">
        <h3>No se pudo cargar el catálogo</h3>
        <p>Revisa la configuración del archivo o intenta nuevamente.</p>
      </div>
    `;
    catalogMeta.textContent = "Error al cargar el catálogo.";
  }
}

if (buscador) {
  buscador.addEventListener("input", (event) => {
    state.textoBusqueda = event.target.value;
    state.limite = ITEMS_PER_PAGE;
    renderizarFiltrado();
    renderizarSugerencias();
  });

  buscador.addEventListener("focus", () => {
    renderizarSugerencias();
  });

  buscador.addEventListener("keydown", (event) => {
    if (!state.sugerencias.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = state.sugerenciaActiva < state.sugerencias.length - 1 ? state.sugerenciaActiva + 1 : 0;
      resaltarSugerencia(next);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = state.sugerenciaActiva > 0 ? state.sugerenciaActiva - 1 : state.sugerencias.length - 1;
      resaltarSugerencia(next);
      return;
    }

    if (event.key === "Enter" && state.sugerenciaActiva >= 0) {
      event.preventDefault();
      seleccionarSugerencia(state.sugerenciaActiva);
    }
  });
}

btnLoadMore.addEventListener("click", () => {
  state.limite += ITEMS_PER_PAGE;
  renderizarFiltrado();
});

if (catalogMenuToggle && catalogQuickMenu) {
  catalogMenuToggle.addEventListener("click", () => {
    if (catalogQuickMenu.classList.contains("is-open")) {
      cerrarMenu();
    } else {
      abrirMenu();
    }
  });
}

document.addEventListener("click", (event) => {
  const clickDentroBuscador = event.target.closest(".catalog-search-wrap");
  if (!clickDentroBuscador) {
    cerrarSugerencias();
  }

  if (!clickDentroBuscador && catalogQuickMenu.classList.contains("is-open")) {
    cerrarMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    cerrarMenu();
    cerrarSugerencias();
  }
});

initCatalogo();
