import { CATEGORIES, getAllProducts, listenCatalog, ensureCatalogReady } from "./data.js";
import { getOrders, updateOrderStatus, updateOrder, listenStorage } from "./storage.js";
import {
  formatElapsed,
  createAudioPlayer,
  FEEDBACK_SOUND,
  shortCategoryLabel,
  initializeViewportUnits,
} from "./utils.js";

const STATUS_FLOW = ["queued", "in_progress", "ready"];
const STATUS_LABELS = {
  queued: "待ち",
  in_progress: "調理中",
  ready: "完成"
};
const ACTION_LABELS = {
  queued: "調理開始",
  in_progress: "完成",
  ready: "完了済"
};

initializeViewportUnits();

const searchInput = document.getElementById("kds-search");
const filterSelect = document.getElementById("kds-category-filter");
const refreshButton = document.getElementById("kds-refresh");
const boardElement = document.getElementById("kds-board");
const gridElement = document.getElementById("kds-grid");
const visibleCountInput = document.getElementById("kds-visible-count");
const paginationElement = document.getElementById("kds-pagination");
const pagePrevButton = document.getElementById("kds-page-prev");
const pageNextButton = document.getElementById("kds-page-next");
const pageIndicator = document.getElementById("kds-page-indicator");
const cardTemplate = document.getElementById("kds-card-template");
const feedbackAudio = document.getElementById("kds-feedback");

sessionStorage.setItem("pos-preferred-route", "/kds");

const playFeedback = createAudioPlayer(feedbackAudio, FEEDBACK_SOUND);

let currentOrders = [];
let timerInterval = null;
let productMap = new Map();
let itemsPerPage = 8;
let currentPage = 0;

function clampVisibleCount(value) {
  if (!Number.isFinite(value)) return itemsPerPage;
  return Math.min(32, Math.max(1, Math.floor(value)));
}

function updateGridLayout(count) {
  const target = Math.max(1, count);
  const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(target))));
  gridElement?.style.setProperty("--kds-columns", columns);
}

if (visibleCountInput) {
  const initial = Number.parseInt(visibleCountInput.value, 10);
  itemsPerPage = clampVisibleCount(Number.isNaN(initial) ? 8 : initial);
  visibleCountInput.value = String(itemsPerPage);
  updateGridLayout(itemsPerPage);
}

function refreshProductMap(products) {
  const source = products ?? getAllProducts();
  productMap = new Map(source.map((product) => [product.id, product]));
}

function buildFilterOptions() {
  CATEGORIES.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    filterSelect.appendChild(option);
  });
}

async function loadOrders() {
  try {
    const orders = await getOrders();
    currentOrders = orders.filter((order) => order.status !== "picked_up");
  } catch (error) {
    console.error("注文情報の取得に失敗しました", error);
    currentOrders = [];
  }
}

function formatOptionBadges(item) {
  const product = productMap.get(item.productId) || { options: [] };
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
  const statusEl = clone.querySelector("[data-testid='kds-card-status']");
  const elapsedEl = clone.querySelector("[data-testid='kds-card-elapsed']");
  const nameEl = clone.querySelector("[data-testid='kds-card-name']");
  const itemsEl = clone.querySelector("[data-testid='kds-card-items']");
  const advanceBtn = clone.querySelector("[data-testid='kds-card-advance']");
  const undoBtn = clone.querySelector("[data-testid='kds-card-undo']");

  numberEl.textContent = `#${order.number}`;
  statusEl.textContent = STATUS_LABELS[order.status] || order.status;
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

  const advanceDisabled = STATUS_FLOW.indexOf(order.status) === STATUS_FLOW.length - 1;
  advanceBtn.textContent = ACTION_LABELS[order.status] || "次へ";
  advanceBtn.disabled = advanceDisabled;
  clone.classList.toggle("no-advance", advanceDisabled);

  advanceBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!advanceDisabled) {
      advanceStatus(order).catch((error) => console.error(error));
    }
  });

  clone.addEventListener("click", (event) => {
    if (event.target.closest("button")) {
      return;
    }
    if (!advanceDisabled) {
      advanceStatus(order).catch((error) => console.error(error));
    }
  });

  clone.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && !advanceDisabled) {
      event.preventDefault();
      advanceStatus(order).catch((error) => console.error(error));
    }
  });

  undoBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    revertStatus(order).catch((error) => console.error(error));
  });

  return clone;
}

function renderBoard() {
  if (!gridElement || !boardElement) return;
  const searchValue = searchInput.value.trim();
  const filter = filterSelect.value;

  const filtered = currentOrders
    .filter((order) => {
      const matchesSearch = !searchValue
        ? true
        : order.number.includes(searchValue) || (order.customerName || "").includes(searchValue);
      const matchesFilter = filter === "all" ? true : order.items.some((item) => item.category === filter);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => a.createdAt - b.createdAt);

  gridElement.innerHTML = "";
  const totalOrders = filtered.length;
  const hasOrders = totalOrders > 0;
  boardElement.classList.toggle("empty", !hasOrders);

  const totalPages = hasOrders ? Math.ceil(totalOrders / itemsPerPage) : 1;
  if (currentPage >= totalPages) {
    currentPage = Math.max(0, totalPages - 1);
  }

  const startIndex = currentPage * itemsPerPage;
  const pageItems = hasOrders ? filtered.slice(startIndex, startIndex + itemsPerPage) : [];

  updateGridLayout(hasOrders ? Math.min(itemsPerPage, Math.max(pageItems.length, 1)) : 1);

  if (!hasOrders) {
    const empty = document.createElement("div");
    empty.className = "kds-empty";
    empty.textContent = "現在表示する注文はありません";
    gridElement.appendChild(empty);
    if (paginationElement && pageIndicator && pagePrevButton && pageNextButton) {
      pageIndicator.textContent = "0 / 0";
      pagePrevButton.disabled = true;
      pageNextButton.disabled = true;
      paginationElement.hidden = true;
    }
    return;
  }

  if (paginationElement && pageIndicator && pagePrevButton && pageNextButton) {
    paginationElement.hidden = false;
    pageIndicator.textContent = `${currentPage + 1} / ${totalPages}`;
    pagePrevButton.disabled = currentPage === 0;
    pageNextButton.disabled = currentPage >= totalPages - 1;
  }

  pageItems.forEach((order) => {
    const card = renderOrderCard(order);
    gridElement.appendChild(card);
  });
}

async function advanceStatus(order) {
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) {
    return;
  }
  const nextStatus = STATUS_FLOW[currentIndex + 1];
  try {
    await updateOrderStatus(order.id, nextStatus);
    playFeedback();
    await loadOrders();
    renderBoard();
  } catch (error) {
    console.error("状態更新に失敗しました", error);
  }
}

async function revertStatus(order) {
  if (!order.statusHistory || order.statusHistory.length < 2) return;
  const history = order.statusHistory.slice(0, -1);
  const previous = history[history.length - 1];
  try {
    await updateOrder(order.id, {
      status: previous.status,
      statusHistory: history
    });
    playFeedback();
    await loadOrders();
    renderBoard();
  } catch (error) {
    console.error("状態を戻せませんでした", error);
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    gridElement.querySelectorAll("[data-testid='kds-card-elapsed']").forEach((el) => {
      const card = el.closest(".kds-card");
      const orderId = card?.dataset.id;
      const order = currentOrders.find((o) => o.id === orderId);
      if (order) {
        el.textContent = formatElapsed(order.createdAt);
      }
    });
  }, 1000);
}

async function refreshBoard() {
  await loadOrders();
  renderBoard();
}

searchInput.addEventListener("input", () => {
  currentPage = 0;
  renderBoard();
});

filterSelect.addEventListener("change", () => {
  currentPage = 0;
  renderBoard();
});
refreshButton.addEventListener("click", () => {
  refreshBoard().catch((error) => console.error(error));
});

visibleCountInput?.addEventListener("change", () => {
  const next = clampVisibleCount(Number.parseInt(visibleCountInput.value, 10));
  itemsPerPage = next;
  visibleCountInput.value = String(next);
  currentPage = 0;
  updateGridLayout(itemsPerPage);
  renderBoard();
});

visibleCountInput?.addEventListener("blur", () => {
  visibleCountInput.value = String(itemsPerPage);
});

pagePrevButton?.addEventListener("click", () => {
  if (pagePrevButton.disabled) return;
  if (currentPage > 0) {
    currentPage -= 1;
    renderBoard();
  }
});

pageNextButton?.addEventListener("click", () => {
  if (pageNextButton.disabled) return;
  currentPage += 1;
  renderBoard();
});

listenStorage(() => {
  refreshBoard().catch((error) => console.error(error));
});

async function init() {
  buildFilterOptions();
  await ensureCatalogReady();
  refreshProductMap();
  await refreshBoard();
  startTimer();
  listenCatalog((products) => {
    refreshProductMap(products);
    renderBoard();
  });
}

init().catch((error) => {
  console.error("KDS init failed", error);
});
