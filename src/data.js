export const CATEGORIES = [
  { id: "pancake", name: "パンケーキ", shortcut: "F1" },
  { id: "crepe", name: "クレープ", shortcut: "F2" },
  { id: "sausage", name: "ソーセージ", shortcut: "F3" },
  { id: "drink", name: "ドリンク", shortcut: "F4" },
  { id: "popular", name: "よく出るセット", shortcut: "F5" }
];

const pancakeOptions = [
  {
    id: "extra-whip",
    label: "追いホイップ",
    type: "toggle",
    default: false,
    short: "追ホ"
  },
  {
    id: "choco",
    label: "チョコソース",
    type: "level",
    levels: ["少", "普", "多"],
    default: "普",
    short: "チョコ"
  },
  {
    id: "maple",
    label: "メープル",
    type: "level",
    levels: ["少", "普", "多"],
    default: "普",
    short: "メープル"
  },
  {
    id: "powder",
    label: "粉糖",
    type: "toggle",
    default: true,
    short: "粉糖"
  }
];

const crepeOptions = [
  {
    id: "whip",
    label: "ホイップ",
    type: "level",
    levels: ["少", "普", "多"],
    default: "普",
    short: "ホイップ"
  },
  {
    id: "sauce",
    label: "ソース",
    type: "level",
    levels: ["少", "普", "多"],
    default: "普",
    short: "ソース"
  },
  {
    id: "wrap",
    label: "包みかた",
    type: "choice",
    options: [
      { value: "tight", label: "タイト", short: "タイト" },
      { value: "loose", label: "ゆるめ", short: "ゆるめ" }
    ],
    default: "tight"
  }
];

const sausageOptions = [
  {
    id: "ketchup",
    label: "ケチャップ",
    type: "toggle",
    default: true,
    short: "ケチャップ"
  },
  {
    id: "mustard",
    label: "マスタード",
    type: "toggle",
    default: true,
    short: "マスタード"
  }
];

const OPTION_TEMPLATES = [
  {
    id: "none",
    label: "オプションなし",
    description: "追加オプションを設定しない商品",
    options: []
  },
  {
    id: "pancake-standard",
    label: "パンケーキ標準",
    description: "追いホイップやソース濃度など",
    options: pancakeOptions
  },
  {
    id: "crepe-standard",
    label: "クレープ標準",
    description: "ホイップ量・ソース量・包みかた",
    options: crepeOptions
  },
  {
    id: "sausage-standard",
    label: "ソーセージ標準",
    description: "ケチャップとマスタードの有無",
    options: sausageOptions
  }
];

const DEFAULT_PRODUCTS = [
  {
    id: "pancake-classic",
    category: "pancake",
    name: "クラシック",
    price: 350,
    image: "https://placehold.co/400x300?text=Classic",
    optionTemplate: "pancake-standard"
  },
  {
    id: "pancake-choco",
    category: "pancake",
    name: "チョコソース",
    price: 400,
    image: "https://placehold.co/400x300?text=Choco",
    optionTemplate: "pancake-standard"
  },
  {
    id: "pancake-strawberry",
    category: "pancake",
    name: "いちご＆ホイップ",
    price: 450,
    image: "https://placehold.co/400x300?text=Strawberry",
    optionTemplate: "pancake-standard"
  },
  {
    id: "pancake-maple",
    category: "pancake",
    name: "メープルバター",
    price: 420,
    image: "https://placehold.co/400x300?text=Maple",
    optionTemplate: "pancake-standard"
  },
  {
    id: "pancake-banana",
    category: "pancake",
    name: "バナナチョコ",
    price: 430,
    image: "https://placehold.co/400x300?text=Banana",
    optionTemplate: "pancake-standard"
  },
  {
    id: "pancake-berry",
    category: "pancake",
    name: "ベリーミックス",
    price: 480,
    image: "https://placehold.co/400x300?text=Berry",
    optionTemplate: "pancake-standard"
  },
  {
    id: "crepe-sugar",
    category: "crepe",
    name: "シュガーバター",
    price: 300,
    image: "https://placehold.co/400x300?text=Sugar",
    optionTemplate: "crepe-standard"
  },
  {
    id: "crepe-custard",
    category: "crepe",
    name: "カスタード＆いちご",
    price: 450,
    image: "https://placehold.co/400x300?text=Custard",
    optionTemplate: "crepe-standard"
  },
  {
    id: "crepe-choco",
    category: "crepe",
    name: "チョコバナナ",
    price: 420,
    image: "https://placehold.co/400x300?text=ChocoBanana",
    optionTemplate: "crepe-standard"
  },
  {
    id: "crepe-tuna",
    category: "crepe",
    name: "ツナマヨ",
    price: 430,
    image: "https://placehold.co/400x300?text=Tuna",
    optionTemplate: "crepe-standard"
  },
  {
    id: "crepe-ham",
    category: "crepe",
    name: "ハムチーズ",
    price: 440,
    image: "https://placehold.co/400x300?text=Ham",
    optionTemplate: "crepe-standard"
  },
  {
    id: "crepe-matcha",
    category: "crepe",
    name: "抹茶クリーム",
    price: 460,
    image: "https://placehold.co/400x300?text=Matcha",
    optionTemplate: "crepe-standard"
  },
  {
    id: "sausage-large",
    category: "sausage",
    name: "ソーセージ（大）",
    price: 350,
    image: "https://placehold.co/400x300?text=Sausage",
    optionTemplate: "sausage-standard"
  },
  {
    id: "drink-ice-coffee",
    category: "drink",
    name: "アイスコーヒー",
    price: 200,
    image: "https://placehold.co/400x300?text=Iced+Coffee",
    optionTemplate: "none"
  },
  {
    id: "drink-orange",
    category: "drink",
    name: "オレンジジュース",
    price: 200,
    image: "https://placehold.co/400x300?text=Orange",
    optionTemplate: "none"
  },
  {
    id: "drink-ice-tea",
    category: "drink",
    name: "アイスティー",
    price: 200,
    image: "https://placehold.co/400x300?text=Iced+Tea",
    optionTemplate: "none"
  },
  {
    id: "drink-oolong",
    category: "drink",
    name: "ウーロン茶",
    price: 200,
    image: "https://placehold.co/400x300?text=Oolong",
    optionTemplate: "none"
  },
  {
    id: "set-pancake-drink",
    category: "popular",
    name: "クラシック＋ドリンクセット",
    price: 520,
    image: "https://placehold.co/400x300?text=Set+A",
    description: "クラシックパンケーキ＋お好きなドリンク",
    optionTemplate: "none"
  },
  {
    id: "set-berry-coffee",
    category: "popular",
    name: "ベリー＋アイスコーヒー",
    price: 650,
    image: "https://placehold.co/400x300?text=Set+B",
    description: "ベリーミックスとアイスコーヒーのお得セット",
    optionTemplate: "none"
  },
  {
    id: "set-crepe-drink",
    category: "popular",
    name: "クレープ＋ドリンクセット",
    price: 580,
    image: "https://placehold.co/400x300?text=Set+C",
    description: "クレープ＋ドリンクの定番コンビ",
    optionTemplate: "none"
  }
];

const PRODUCT_STORAGE_KEY = "school-fes-pos-products-v1";

let cachedCatalog = null;
const globalCrypto = typeof crypto !== "undefined" ? crypto : null;

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

export function getOptionTemplates() {
  return OPTION_TEMPLATES.map(cloneTemplate);
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
  let optionTemplate = product.optionTemplate || product.optionSet;
  if (!optionTemplate) {
    optionTemplate = optionTemplateForCategory(product.category);
  }
  return {
    id: String(product.id || globalCrypto?.randomUUID?.() || Date.now().toString()),
    category: product.category || "pancake",
    name: product.name || "",
    price,
    image: product.image || "https://placehold.co/400x300?text=No+Image",
    optionTemplate,
    description: product.description || "",
    imageName: product.imageName ? String(product.imageName) : ""
  };
}

function sanitizeCatalog(data) {
  if (!data || !Array.isArray(data.products)) {
    return { products: DEFAULT_PRODUCTS.map((product) => sanitizeProduct(product)) };
  }
  const products = data.products
    .map((product) => sanitizeProduct(product))
    .filter(Boolean);
  return { products };
}

function loadFromStorage() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(PRODUCT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return sanitizeCatalog(parsed);
  } catch (error) {
    console.warn("Failed to load product catalog", error);
    return null;
  }
}

function ensureCatalog() {
  if (!cachedCatalog) {
    cachedCatalog = loadFromStorage() || sanitizeCatalog(null);
  }
  return {
    products: cachedCatalog.products.map((product) => ({ ...product }))
  };
}

function getTemplateById(id) {
  return OPTION_TEMPLATES.find((template) => template.id === id) || OPTION_TEMPLATES[0];
}

function attachOptions(product) {
  const template = getTemplateById(product.optionTemplate);
  return {
    ...product,
    options: template.options.map(cloneOption)
  };
}

export function getCatalog() {
  return ensureCatalog();
}

export function getAllProducts() {
  const catalog = ensureCatalog();
  return catalog.products.map((product) => attachOptions(product));
}

export function saveCatalog(catalog) {
  cachedCatalog = sanitizeCatalog(catalog);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(cachedCatalog));
  }
  window.dispatchEvent(new CustomEvent("catalog:updated"));
}

export function resetCatalog() {
  cachedCatalog = sanitizeCatalog(null);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(cachedCatalog));
  }
  window.dispatchEvent(new CustomEvent("catalog:updated"));
}

export function findProduct(productId) {
  return getAllProducts().find((product) => product.id === productId);
}

export function listenCatalog(callback) {
  const handler = () => callback(getAllProducts());
  const storageHandler = (event) => {
    if (event.key === PRODUCT_STORAGE_KEY) {
      cachedCatalog = null;
      handler();
    }
  };
  window.addEventListener("catalog:updated", handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener("catalog:updated", handler);
    window.removeEventListener("storage", storageHandler);
  };
}
