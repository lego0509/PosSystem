const API_BASE = "";

let pauseState = false;
let ordersState = [];
let initialized = false;
let initPromise = null;
let pollTimerId = null;
const storageListeners = new Set();

async function requestJSON(path, options = {}) {
  const { headers, ...rest } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", Accept: "application/json", ...(headers || {}) },
    ...rest
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${text}`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}

function cloneOrders() {
  return ordersState.map((order) => ({
    ...order,
    items: (order.items || []).map((item) => ({ ...item })),
    statusHistory: Array.isArray(order.statusHistory)
      ? order.statusHistory.map((entry) => ({ ...entry }))
      : []
  }));
}

function notifyListeners() {
  const snapshot = {
    pause: pauseState,
    orders: cloneOrders()
  };
  storageListeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (error) {
      console.error("storage listener failed", error);
    }
  });
}

async function refreshPause() {
  const data = await requestJSON("/api/state", { method: "GET" });
  const nextPause = Boolean(data?.pause);
  if (nextPause !== pauseState) {
    pauseState = nextPause;
    notifyListeners();
  } else if (!initialized) {
    pauseState = nextPause;
  }
}

function ordersEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function refreshOrders() {
  const data = await requestJSON("/api/orders", { method: "GET" });
  const sorted = (data?.orders || []).slice().sort((a, b) => a.createdAt - b.createdAt);
  if (!ordersEqual(ordersState, sorted)) {
    ordersState = sorted;
    notifyListeners();
  } else if (!initialized) {
    ordersState = sorted;
  }
}

async function ensureInitialized() {
  if (initialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      await Promise.all([refreshPause(), refreshOrders()]);
      initialized = true;
      startPolling();
    })().finally(() => {
      initPromise = null;
    });
  }
  await initPromise;
}

function startPolling() {
  if (typeof window === "undefined") return;
  if (pollTimerId) return;
  pollTimerId = window.setInterval(() => {
    refreshPause().catch((error) => console.error(error));
    refreshOrders().catch((error) => console.error(error));
  }, 1500);
}

export async function getPause() {
  await ensureInitialized();
  return pauseState;
}

export async function setPause(value) {
  await requestJSON("/api/state/pause", {
    method: "POST",
    body: JSON.stringify({ pause: Boolean(value) })
  });
  await refreshPause();
  return pauseState;
}

export async function addOrder(orderPayload) {
  const created = await requestJSON("/api/orders", {
    method: "POST",
    body: JSON.stringify(orderPayload)
  });
  await refreshOrders();
  return created;
}

export async function getOrders() {
  await ensureInitialized();
  return cloneOrders();
}

export async function updateOrder(orderId, updates) {
  const updated = await requestJSON(`/api/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  });
  await refreshOrders();
  return updated;
}

export async function updateOrderStatus(orderId, status) {
  const updated = await requestJSON(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: "POST",
    body: JSON.stringify({ status })
  });
  await refreshOrders();
  return updated;
}

export async function markReadyAcknowledged(orderId) {
  return updateOrder(orderId, { readyAcknowledged: true });
}

export async function removeOrder(orderId) {
  await requestJSON(`/api/orders/${encodeURIComponent(orderId)}`, { method: "DELETE" });
  await refreshOrders();
}

export function listenStorage(callback) {
  storageListeners.add(callback);
  ensureInitialized().then(() => {
    callback({ pause: pauseState, orders: cloneOrders() });
  });
  return () => {
    storageListeners.delete(callback);
  };
}

export async function clearAll() {
  await requestJSON("/api/orders/clear", { method: "POST" });
  await refreshOrders();
}
