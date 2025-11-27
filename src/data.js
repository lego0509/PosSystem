import { CATEGORIES, OPTION_TEMPLATES, DEFAULT_PRODUCTS } from "./shared/catalogDefaults.js";

export { CATEGORIES };

const API_BASE = "";
const globalCrypto = typeof crypto !== "undefined" ? crypto : null;

let cachedCatalog = null;
let pendingLoad = null;
let pollTimerId = null;
const catalogListeners = new Set();

function cloneOption(option) {
  const cloned = { ...option };
  if (Array.isArray(option.options)) {
    cloned.options = option.options.map((opt) => ({ ...opt }));
  }
  return cloned;
}

function cloneTemplate(template) {
  return {
    ...template,
    options: template.options.map(cloneOption)
  };
}

function optionTemplateForCategory(category) {
  switch (category) {
    case "pancake":
      return "pancake-standard";
    case "crepe":
      return "crepe-standard";
    case "sausage":
      return "sausage-standard";
    default:
      return "none";
  }
}

function sanitizeProduct(product) {
  if (!product) return null;
  const price = Number.isFinite(Number(product.price))
    ? Math.max(0, Math.round(Number(product.price)))
    : 0;
  const image = product.image || "https://placehold.co/400x300?text=No+Image";
  const optionTemplate = product.optionTemplate || product.optionSet || optionTemplateForCategory(product.category);
  return {
    id: String(product.id || globalCrypto?.randomUUID?.() || Date.now().toString()),
    category: product.category || "pancake",
    name: product.name || "",
    price,
    image,
    optionTemplate,
    description: product.description || "",
    imageName: product.imageName ? String(product.imageName) : ""
  };
}

function sanitizeCatalog(data) {
  if (!data || !Array.isArray(data.products)) {
    return { products: DEFAULT_PRODUCTS.map((product) => sanitizeProduct(product)).filter(Boolean) };
  }
  const products = data.products.map((product) => sanitizeProduct(product)).filter(Boolean);
  return { products };
}

function attachOptions(product) {
  const template = OPTION_TEMPLATES.find((item) => item.id === product.optionTemplate) || OPTION_TEMPLATES[0];
  return {
    ...product,
    options: template.options.map(cloneOption)
  };
}

function notifyListeners() {
  const products = getAllProducts();
  catalogListeners.forEach((listener) => {
    try {
      listener(products);
    } catch (error) {
      console.error("catalog listener failed", error);
    }
  });
}

async function fetchCatalogFromServer() {
  try {
    const response = await fetch(`${API_BASE}/api/catalog`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`Failed to load catalog: ${response.status}`);
    }
    const payload = await response.json();
    return sanitizeCatalog(payload);
  } catch (error) {
    console.error("Failed to fetch catalog", error);
    return cachedCatalog || sanitizeCatalog(null);
  }
}

async function ensureCatalogLoaded() {
  if (cachedCatalog) return cachedCatalog;
  if (!pendingLoad) {
    pendingLoad = (async () => {
      cachedCatalog = await fetchCatalogFromServer();
      notifyListeners();
      startPolling();
      return cachedCatalog;
    })().finally(() => {
      pendingLoad = null;
    });
  }
  await pendingLoad;
  return cachedCatalog;
}

function startPolling() {
  if (typeof window === "undefined") return;
  if (pollTimerId) return;
  pollTimerId = window.setInterval(async () => {
    const next = await fetchCatalogFromServer();
    if (!catalogsEqual(cachedCatalog, next)) {
      cachedCatalog = next;
      notifyListeners();
    }
  }, 5000);
}

function catalogsEqual(a, b) {
  const jsonA = JSON.stringify(a);
  const jsonB = JSON.stringify(b);
  return jsonA === jsonB;
}

export function getOptionTemplates() {
  return OPTION_TEMPLATES.map((template) => cloneTemplate(template));
}

export async function ensureCatalogReady() {
  await ensureCatalogLoaded();
  return getCatalog();
}

export function getCatalog() {
  if (!cachedCatalog) {
    return {
      products: DEFAULT_PRODUCTS.map((product) => ({ ...product }))
    };
  }
  return {
    products: cachedCatalog.products.map((product) => ({ ...product }))
  };
}

export function getAllProducts() {
  if (!cachedCatalog) {
    return DEFAULT_PRODUCTS.map((product) => attachOptions(sanitizeProduct(product)));
  }
  return cachedCatalog.products.map((product) => attachOptions(product));
}

export async function saveCatalog(catalog) {
  const payload = sanitizeCatalog(catalog);
  const response = await fetch(`${API_BASE}/api/catalog`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Failed to save catalog: ${response.status}`);
  }
  const data = await response.json();
  cachedCatalog = sanitizeCatalog(data);
  notifyListeners();
  return getCatalog();
}

export async function resetCatalog() {
  const response = await fetch(`${API_BASE}/api/catalog/reset`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error(`Failed to reset catalog: ${response.status}`);
  }
  const data = await response.json();
  cachedCatalog = sanitizeCatalog(data);
  notifyListeners();
  return getCatalog();
}

export function findProduct(productId) {
  return getAllProducts().find((product) => product.id === productId);
}

export function listenCatalog(callback) {
  catalogListeners.add(callback);
  ensureCatalogLoaded().then(() => {
    callback(getAllProducts());
  });
  return () => {
    catalogListeners.delete(callback);
  };
}
