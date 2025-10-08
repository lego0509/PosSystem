const STORAGE_KEY = "school-fes-pos-state";

const defaultState = {
  currentOrderNumber: 0,
  orders: [],
  pause: false
};

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function getState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(defaultState);
    const parsed = JSON.parse(raw);
    return { ...clone(defaultState), ...parsed, orders: parsed.orders || [] };
  } catch (error) {
    console.warn("Failed to parse state", error);
    return clone(defaultState);
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getPause() {
  return getState().pause;
}

export function setPause(value) {
  const state = getState();
  state.pause = value;
  saveState(state);
}

export function getNextOrderNumber() {
  const state = getState();
  state.currentOrderNumber = (state.currentOrderNumber % 9999) + 1;
  saveState(state);
  return state.currentOrderNumber.toString().padStart(4, "0");
}

export function addOrder(order) {
  const state = getState();
  state.orders.push(order);
  saveState(state);
  return order;
}

export function getOrders() {
  const state = getState();
  return state.orders.sort((a, b) => a.createdAt - b.createdAt);
}

export function updateOrder(orderId, updater) {
  const state = getState();
  const idx = state.orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;
  const updated = typeof updater === "function" ? updater(state.orders[idx]) : { ...state.orders[idx], ...updater };
  state.orders[idx] = { ...state.orders[idx], ...updated };
  saveState(state);
  return state.orders[idx];
}

export function updateOrderStatus(orderId, status) {
  return updateOrder(orderId, (order) => {
    const history = Array.isArray(order.statusHistory) ? order.statusHistory.slice() : [];
    history.push({ status, at: Date.now() });
    const updates = { status, statusHistory: history };
    if (status === "ready") {
      updates.readyAcknowledged = false;
    }
    if (status === "picked_up") {
      updates.readyAcknowledged = true;
    }
    return { ...order, ...updates };
  });
}

export function bulkUpdateOrders(orders) {
  const state = getState();
  state.orders = orders;
  saveState(state);
}

export function markReadyAcknowledged(orderId) {
  return updateOrder(orderId, { readyAcknowledged: true });
}

export function removeOrder(orderId) {
  const state = getState();
  state.orders = state.orders.filter((order) => order.id !== orderId);
  saveState(state);
}

export function listenStorage(callback) {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      callback(getState());
    }
  });
}

export function clearAll() {
  saveState(clone(defaultState));
}
