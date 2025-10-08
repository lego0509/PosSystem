import { CATEGORIES, findProduct } from "./data.js";
import { getOrders, updateOrderStatus, updateOrder, listenStorage } from "./storage.js";
import { formatElapsed, createAudioPlayer, FEEDBACK_SOUND, shortCategoryLabel } from "./utils.js";

const STATUS_FLOW = ["queued", "in_progress", "ready"];

const columnElements = {
  queued: document.getElementById("kds-queued"),
  in_progress: document.getElementById("kds-in-progress"),
  ready: document.getElementById("kds-ready")
};

const searchInput = document.getElementById("kds-search");
const filterSelect = document.getElementById("kds-category-filter");
const refreshButton = document.getElementById("kds-refresh");
const cardTemplate = document.getElementById("kds-card-template");
const feedbackAudio = document.getElementById("kds-feedback");

sessionStorage.setItem("pos-preferred-route", "/kds");

const playFeedback = createAudioPlayer(feedbackAudio, FEEDBACK_SOUND);

let currentOrders = [];
let timerInterval = null;

function buildFilterOptions() {
  CATEGORIES.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    filterSelect.appendChild(option);
  });
}

function loadOrders() {
  currentOrders = getOrders().filter((order) => order.status !== "picked_up");
}

function formatOptionBadges(item) {
  const product = findProduct(item.productId) || { options: [] };
  const fragment = document.createDocumentFragment();
  product.options.forEach((option) => {
    const value = item.options?.[option.id];
    if (option.type === "toggle") {
      const active = value ?? option.default ?? false;
      const badge = document.createElement("span");
      badge.className = `option-badge ${active ? "toggle-on" : "toggle-off"}`;
      badge.textContent = `${active ? "☑" : "☐"}${option.short || option.label}`;
      fragment.appendChild(badge);
    } else if (option.type === "level") {
      const chosen = value || option.default || "普";
      const classMap = { 少: "level-low", 普: "level-medium", 多: "level-high" };
      const badge = document.createElement("span");
      badge.className = `option-badge ${classMap[chosen] || ""}`;
      badge.textContent = `${option.short || option.label}:${chosen}`;
      fragment.appendChild(badge);
    } else if (option.type === "choice") {
      const chosen = value || option.default;
      const found = option.options?.find((o) => o.value === chosen);
      if (found) {
        const badge = document.createElement("span");
        badge.className = "option-badge toggle-on";
        badge.textContent = found.short || found.label;
        fragment.appendChild(badge);
      }
    }
  });
  return fragment;
}

function renderOrderCard(order) {
  const clone = cardTemplate.content.firstElementChild.cloneNode(true);
  clone.dataset.id = order.id;
  clone.dataset.status = order.status;
  clone.dataset.category = order.primaryCategory || order.items[0]?.category || "pancake";
  clone.setAttribute("tabindex", "0");

  const numberEl = clone.querySelector("[data-testid='kds-card-number']");
  const elapsedEl = clone.querySelector("[data-testid='kds-card-elapsed']");
  const nameEl = clone.querySelector("[data-testid='kds-card-name']");
  const itemsEl = clone.querySelector("[data-testid='kds-card-items']");
  const undoBtn = clone.querySelector("[data-testid='kds-card-undo']");

  numberEl.textContent = `#${order.number}`;
  elapsedEl.textContent = formatElapsed(order.createdAt);
  if (order.customerName) {
    nameEl.textContent = order.customerName;
  } else {
    nameEl.style.display = "none";
  }

  itemsEl.innerHTML = "";
  order.items.forEach((item) => {
    const li = document.createElement("li");
    const line = document.createElement("div");
    line.textContent = `${shortCategoryLabel(item.category)}：${item.name} ×${item.quantity}`;
    const badges = document.createElement("span");
    badges.className = "option-badges";
    badges.appendChild(formatOptionBadges(item));
    line.appendChild(badges);
    li.appendChild(line);
    if (item.note) {
      const note = document.createElement("div");
      note.className = "item-note";
      note.textContent = item.note;
      li.appendChild(note);
    }
    itemsEl.appendChild(li);
  });

  clone.addEventListener("click", () => advanceStatus(order));
  clone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      advanceStatus(order);
    }
  });

  clone.addEventListener("dragstart", (event) => {
    clone.classList.add("dragging");
    event.dataTransfer.setData("text/plain", order.id);
  });
  clone.addEventListener("dragend", () => {
    clone.classList.remove("dragging");
  });

  undoBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    revertStatus(order);
  });

  return clone;
}

function clearColumns() {
  Object.values(columnElements).forEach((column) => {
    column.innerHTML = "";
  });
}

function renderBoard() {
  clearColumns();
  const searchValue = searchInput.value.trim();
  const filter = filterSelect.value;

  const filtered = currentOrders.filter((order) => {
    const matchesSearch = !searchValue
      ? true
      : order.number.includes(searchValue) || (order.customerName || "").includes(searchValue);
    const matchesFilter = filter === "all" ? true : order.items.some((item) => item.category === filter);
    return matchesSearch && matchesFilter;
  });

  filtered.forEach((order) => {
    const column = columnElements[order.status];
    if (!column) return;
    const card = renderOrderCard(order);
    column.appendChild(card);
  });
}

function advanceStatus(order) {
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) {
    return;
  }
  const nextStatus = STATUS_FLOW[currentIndex + 1];
  updateOrderStatus(order.id, nextStatus);
  playFeedback();
  loadOrders();
  renderBoard();
}

function revertStatus(order) {
  if (!order.statusHistory || order.statusHistory.length < 2) return;
  updateOrder(order.id, (data) => {
    const history = data.statusHistory.slice(0, -1);
    const previous = history[history.length - 1];
    return {
      ...data,
      status: previous.status,
      statusHistory: history
    };
  });
  playFeedback();
  loadOrders();
  renderBoard();
}

function setupDragAndDrop() {
  Object.entries(columnElements).forEach(([status, column]) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      column.classList.add("drop-target");
    });
    column.addEventListener("dragleave", () => {
      column.classList.remove("drop-target");
    });
    column.addEventListener("drop", (event) => {
      event.preventDefault();
      column.classList.remove("drop-target");
      const orderId = event.dataTransfer.getData("text/plain");
      const order = currentOrders.find((o) => o.id === orderId);
      if (!order || order.status === status) return;
      const allowedIndex = STATUS_FLOW.indexOf(status);
      const currentIndex = STATUS_FLOW.indexOf(order.status);
      if (allowedIndex === currentIndex + 1 || allowedIndex === currentIndex - 1 || status === "queued") {
        updateOrderStatus(order.id, status);
        playFeedback();
        loadOrders();
        renderBoard();
      }
    });
  });
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    document.querySelectorAll("[data-testid='kds-card-elapsed']").forEach((el) => {
      const card = el.closest(".kds-card");
      const orderId = card?.dataset.id;
      const order = currentOrders.find((o) => o.id === orderId);
      if (order) {
        el.textContent = formatElapsed(order.createdAt);
      }
    });
  }, 1000);
}

function refreshBoard() {
  loadOrders();
  renderBoard();
}

searchInput.addEventListener("input", renderBoard);
filterSelect.addEventListener("change", renderBoard);
refreshButton.addEventListener("click", refreshBoard);

listenStorage(() => {
  refreshBoard();
});

function init() {
  buildFilterOptions();
  setupDragAndDrop();
  refreshBoard();
  startTimer();
}

init();
