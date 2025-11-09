import { getOrders, updateOrderStatus, updateOrder, listenStorage, markReadyAcknowledged } from "./storage.js";
import { createAudioPlayer, FEEDBACK_SOUND } from "./utils.js";

const readyGrid = document.getElementById("call-ready-grid");
const historyContainer = document.getElementById("call-history");
const reannounceButton = document.getElementById("call-reannounce");
const fullscreenButton = document.getElementById("call-fullscreen");
const feedbackAudio = document.getElementById("call-feedback");

sessionStorage.setItem("pos-preferred-route", "/call");

const playFeedback = createAudioPlayer(feedbackAudio, FEEDBACK_SOUND);

let selectedOrders = new Set();

async function loadOrders() {
  try {
    return await getOrders();
  } catch (error) {
    console.error("受け渡し表示の注文取得に失敗しました", error);
    return [];
  }
}

function renderReadyOrders(orders) {
  readyGrid.innerHTML = "";
  const readyOrders = orders.filter((order) => order.status === "ready");
  readyOrders.forEach((order) => {
    const card = document.createElement("div");
    card.className = "ready-card";
    card.dataset.id = order.id;
    card.setAttribute("data-testid", `call-ready-${order.id}`);
    card.setAttribute("tabindex", "0");
    if (selectedOrders.has(order.id)) {
      card.classList.add("selected");
    }

    const number = document.createElement("div");
    number.className = "ready-number";
    number.textContent = order.number;
    card.appendChild(number);

    if (order.customerName) {
      const name = document.createElement("div");
      name.className = "ready-name";
      name.textContent = order.customerName;
      card.appendChild(name);
    }

    const button = document.createElement("button");
    button.className = "ghost";
    button.type = "button";
    button.textContent = "受け渡し完了";
    button.setAttribute("aria-label", `注文 ${order.number} を受け渡し完了にする`);
    button.setAttribute("data-testid", `call-ready-complete-${order.id}`);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      markPickedUp(order).catch((error) => console.error(error));
    });
    card.appendChild(button);

    card.addEventListener("click", () => toggleSelect(order.id));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleSelect(order.id);
      }
    });

    readyGrid.appendChild(card);

    if (!order.readyAcknowledged) {
      requestAnimationFrame(() => {
        card.classList.add("highlight");
        setTimeout(() => card.classList.remove("highlight"), 2600);
      });
      playFeedback();
      markReadyAcknowledged(order.id).catch((error) => console.error(error));
    }
  });

  selectedOrders = new Set([...selectedOrders].filter((id) => readyOrders.some((order) => order.id === id)));
}

function renderHistory(orders) {
  historyContainer.innerHTML = "";
  const recent = orders
    .filter((order) => order.status === "picked_up")
    .sort((a, b) => (b.pickedUpAt || 0) - (a.pickedUpAt || 0))
    .slice(0, 10);

  recent.forEach((order) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.setAttribute("data-testid", `call-history-${order.id}`);
    const number = document.createElement("span");
    number.textContent = order.number;
    const time = document.createElement("small");
    const pickedTime = order.pickedUpAt || order.statusHistory?.find((s) => s.status === "picked_up")?.at;
    if (pickedTime) {
      time.textContent = new Date(pickedTime).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } else {
      time.textContent = "";
    }
    item.appendChild(number);
    item.appendChild(time);
    historyContainer.appendChild(item);
  });
}

async function render() {
  const orders = await loadOrders();
  renderReadyOrders(orders);
  renderHistory(orders);
}

function toggleSelect(orderId) {
  if (selectedOrders.has(orderId)) {
    selectedOrders.delete(orderId);
  } else {
    selectedOrders.add(orderId);
  }
  render().catch((error) => console.error(error));
}

async function markPickedUp(order) {
  const now = Date.now();
  try {
    await updateOrderStatus(order.id, "picked_up");
    await updateOrder(order.id, { pickedUpAt: now });
    selectedOrders.delete(order.id);
    playFeedback();
    await render();
  } catch (error) {
    console.error("受け渡し完了の更新に失敗しました", error);
  }
}

function reannounce() {
  if (!selectedOrders.size) return;
  selectedOrders.forEach((orderId) => {
    const card = readyGrid.querySelector(`[data-id="${orderId}"]`);
    if (card) {
      card.classList.add("highlight");
      setTimeout(() => card.classList.remove("highlight"), 2600);
    }
  });
  playFeedback();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function updateFullscreenLabel() {
  const isFullscreen = Boolean(document.fullscreenElement);
  fullscreenButton.textContent = isFullscreen ? "全画面解除" : "全画面";
}

reannounceButton.addEventListener("click", reannounce);
fullscreenButton.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", updateFullscreenLabel);

listenStorage(() => {
  render().catch((error) => console.error(error));
});

render().catch((error) => console.error(error));
updateFullscreenLabel();
