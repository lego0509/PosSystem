import express from "express";
import path from "path";
import url from "url";
import { promises as fs } from "fs";
import { DEFAULT_PRODUCTS, OPTION_TEMPLATES } from "./src/shared/catalogDefaults.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4173;
const DATA_DIR = path.join(__dirname, "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

const ORDER_STATUSES = ["queued", "in_progress", "ready", "picked_up"];

const app = express();
app.use(express.json({ limit: "10mb" }));

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

function cloneOption(option) {
  const cloned = { ...option };
  if (Array.isArray(option.options)) {
    cloned.options = option.options.map((opt) => ({ ...opt }));
  }
  return cloned;
}

function sanitizeProduct(product) {
  if (!product) return null;
  const price = Number.isFinite(Number(product.price))
    ? Math.max(0, Math.round(Number(product.price)))
    : 0;
  const optionTemplate = product.optionTemplate || optionTemplateForCategory(product.category);
  return {
    id: String(product.id || Date.now().toString()),
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
    return { products: DEFAULT_PRODUCTS.map((product) => sanitizeProduct(product)).filter(Boolean) };
  }
  const products = data.products.map((product) => sanitizeProduct(product)).filter(Boolean);
  return { products };
}

function sanitizeItem(item) {
  const quantity = Math.max(1, Math.round(Number(item?.quantity) || 0));
  const unitPrice = Math.max(0, Math.round(Number(item?.unitPrice) || 0));
  const options = item?.options && typeof item.options === "object" ? item.options : {};
  return {
    productId: String(item?.productId || ""),
    name: item?.name || "",
    category: item?.category || "pancake",
    unitPrice,
    quantity,
    options,
    optionSummary: Array.isArray(item?.optionSummary)
      ? item.optionSummary.map((entry) => String(entry))
      : [],
    note: item?.note ? String(item.note) : ""
  };
}

function sanitizeStatusHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .map((entry) => ({
      status: ORDER_STATUSES.includes(entry?.status) ? entry.status : "queued",
      at: Number(entry?.at) || Date.now()
    }))
    .sort((a, b) => a.at - b.at);
}

function sanitizeOrder(order) {
  if (!order) return null;
  const items = Array.isArray(order.items) ? order.items.map((item) => sanitizeItem(item)) : [];
  const history = sanitizeStatusHistory(order.statusHistory);
  const createdAt = Number(order.createdAt) || Date.now();
  const updatedAt = Number(order.updatedAt) || createdAt;
  const status = ORDER_STATUSES.includes(order.status) ? order.status : history.slice(-1)[0]?.status || "queued";
  const total = Number.isFinite(Number(order.total))
    ? Math.max(0, Math.round(Number(order.total)))
    : items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return {
    id: String(order.id || order.number || Date.now().toString()),
    number: String(order.number || order.id || "0000").padStart(4, "0"),
    status,
    createdAt,
    updatedAt,
    statusHistory: history.length
      ? history
      : [
          {
            status,
            at: createdAt
          }
        ],
    customerName: order.customerName ? String(order.customerName) : "",
    items,
    total,
    primaryCategory: order.primaryCategory || items[0]?.category || "pancake",
    readyAcknowledged: Boolean(order.readyAcknowledged),
    pickedUpAt: order.pickedUpAt ? Number(order.pickedUpAt) : null
  };
}

function sanitizeStore(data) {
  const catalog = sanitizeCatalog(data?.catalog);
  return {
    pause: Boolean(data?.pause),
    currentOrderNumber: Number.isFinite(Number(data?.currentOrderNumber))
      ? Number(data.currentOrderNumber) % 9999
      : 0,
    catalog,
    orders: Array.isArray(data?.orders)
      ? data.orders.map((order) => sanitizeOrder(order)).filter(Boolean)
      : []
  };
}

let store = null;

async function loadStore() {
  if (store) return store;
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    store = sanitizeStore(JSON.parse(raw));
  } catch (error) {
    store = sanitizeStore({ catalog: { products: DEFAULT_PRODUCTS } });
    await saveStore();
  }
  return store;
}

async function saveStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function attachOptions(product) {
  const template = OPTION_TEMPLATES.find((tpl) => tpl.id === product.optionTemplate) || OPTION_TEMPLATES[0];
  return {
    ...product,
    options: template.options.map((option) => cloneOption(option))
  };
}

function mapOrdersResponse(orders) {
  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({ ...item })),
    statusHistory: order.statusHistory.map((entry) => ({ ...entry }))
  }));
}

async function getCatalog() {
  const data = await loadStore();
  return {
    products: data.catalog.products.map((product) => ({ ...product }))
  };
}

app.get("/api/catalog", async (req, res) => {
  const catalog = await getCatalog();
  res.json(catalog);
});

app.put("/api/catalog", async (req, res) => {
  const data = await loadStore();
  data.catalog = sanitizeCatalog(req.body);
  data.orders = data.orders.map((order) => sanitizeOrder(order));
  await saveStore();
  res.json(await getCatalog());
});

app.post("/api/catalog/reset", async (req, res) => {
  const data = await loadStore();
  data.catalog = sanitizeCatalog(null);
  await saveStore();
  res.json(await getCatalog());
});

app.get("/api/state", async (req, res) => {
  const data = await loadStore();
  res.json({ pause: data.pause });
});

app.post("/api/state/pause", async (req, res) => {
  const data = await loadStore();
  data.pause = Boolean(req.body?.pause);
  await saveStore();
  res.json({ pause: data.pause });
});

function sanitizeIncomingOrder(payload) {
  const items = Array.isArray(payload.items) ? payload.items.map((item) => sanitizeItem(item)) : [];
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const now = Date.now();
  return {
    items,
    total,
    customerName: payload.customerName ? String(payload.customerName) : "",
    primaryCategory: payload.primaryCategory || items[0]?.category || "pancake",
    statusHistory: [
      {
        status: "queued",
        at: now
      }
    ],
    status: "queued",
    createdAt: now,
    updatedAt: now,
    readyAcknowledged: false,
    pickedUpAt: null
  };
}

app.get("/api/orders", async (req, res) => {
  const data = await loadStore();
  const orders = mapOrdersResponse(data.orders);
  res.json({ orders });
});

app.post("/api/orders", async (req, res) => {
  const data = await loadStore();
  const payload = sanitizeIncomingOrder(req.body || {});
  data.currentOrderNumber = (data.currentOrderNumber % 9999) + 1;
  const number = data.currentOrderNumber.toString().padStart(4, "0");
  const order = {
    id: number,
    number,
    ...payload
  };
  data.orders.push(order);
  await saveStore();
  res.status(201).json({ ...order, items: order.items.map((item) => ({ ...item })) });
});

app.patch("/api/orders/:id", async (req, res) => {
  const data = await loadStore();
  const order = data.orders.find((o) => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const updates = req.body || {};
  if (updates.status && ORDER_STATUSES.includes(updates.status)) {
    order.status = updates.status;
  }
  if (Array.isArray(updates.statusHistory)) {
    const history = sanitizeStatusHistory(updates.statusHistory);
    if (history.length) {
      order.statusHistory = history;
      order.status = history[history.length - 1].status;
    }
  }
  if (updates.readyAcknowledged !== undefined) {
    order.readyAcknowledged = Boolean(updates.readyAcknowledged);
  }
  if (updates.pickedUpAt !== undefined) {
    order.pickedUpAt = updates.pickedUpAt ? Number(updates.pickedUpAt) : null;
  }
  order.updatedAt = Date.now();
  await saveStore();
  res.json({ ...order, items: order.items.map((item) => ({ ...item })) });
});

app.post("/api/orders/:id/status", async (req, res) => {
  const data = await loadStore();
  const order = data.orders.find((o) => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const status = req.body?.status;
  if (!ORDER_STATUSES.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  order.status = status;
  const now = Date.now();
  order.updatedAt = now;
  order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  order.statusHistory.push({ status, at: now });
  if (status === "ready") {
    order.readyAcknowledged = false;
  }
  if (status === "picked_up") {
    order.readyAcknowledged = true;
    order.pickedUpAt = order.pickedUpAt || now;
  }
  await saveStore();
  res.json({ ...order, items: order.items.map((item) => ({ ...item })) });
});

app.delete("/api/orders/:id", async (req, res) => {
  const data = await loadStore();
  data.orders = data.orders.filter((order) => order.id !== req.params.id);
  await saveStore();
  res.status(204).end();
});

app.post("/api/orders/clear", async (req, res) => {
  const data = await loadStore();
  data.orders = [];
  await saveStore();
  res.status(204).end();
});

app.use(express.static(__dirname));

app.get(["/", "/pos", "/kds", "/call", "/catalog"], (req, res) => {
  const file = req.path === "/" ? "index.html" : `${req.path.slice(1)}.html`;
  res.sendFile(path.join(__dirname, file));
});

app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(PORT, () => {
  console.log(`POS system server running at http://localhost:${PORT}`);
});
