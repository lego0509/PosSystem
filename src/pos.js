import { CATEGORIES, getAllProducts, listenCatalog, ensureCatalogReady } from "./data.js";
import { addOrder, getPause, setPause, listenStorage } from "./storage.js";
import {
  formatCurrency,
  summarizeOptions,
  createAudioPlayer,
  FEEDBACK_SOUND,
  initializeViewportUnits,
  disableViewportGestures,
} from "./utils.js";

initializeViewportUnits();
disableViewportGestures({ allowSelectors: ["[data-scroll-region='true']"] });

const categoryTabs = document.getElementById("category-tabs");
const productGrid = document.getElementById("product-grid");
const cartContainer = document.getElementById("cart-items");
const productPrevButton = document.getElementById("product-prev");
const productNextButton = document.getElementById("product-next");
const productPageIndicator = document.getElementById("product-page-indicator");
const undoButton = document.getElementById("undo-button");
const clearButton = document.getElementById("clear-button");
const totalDisplay = document.getElementById("cart-total");
const confirmButton = document.getElementById("confirm-button");
const errorMessage = document.getElementById("error-message");
const pauseToggle = document.getElementById("pause-toggle");
const pauseBanner = document.getElementById("pause-banner");
const quickQuantityLabel = document.getElementById("quick-quantity");
const optionModal = document.getElementById("option-modal");
const optionModalTitle = document.getElementById("option-modal-title");
const optionModalBody = document.getElementById("option-modal-body");
const optionClose = document.getElementById("option-close");
const optionCancel = document.getElementById("option-cancel");
const optionApply = document.getElementById("option-apply");
const orderNumberModal = document.getElementById("order-number-modal");
const orderNumberDisplay = document.getElementById("order-number-display");
const orderNumberClose = document.getElementById("order-number-close");
const feedbackAudio = document.getElementById("feedback-audio");

sessionStorage.setItem("pos-preferred-route", "/pos");

const playFeedback = createAudioPlayer(feedbackAudio, FEEDBACK_SOUND);

const PRODUCTS_PER_PAGE = 6;

let currentCategory = CATEGORIES[0].id;
let quickQuantity = 1;
let cartItems = [];
let historyStack = [];
let modalProduct = null;
let modalSelections = {};
let allProducts = [];
let productPage = 0;

function setQuickQuantity(qty) {
  quickQuantity = Math.max(1, Math.min(9, qty));
  quickQuantityLabel.textContent = `数量：${quickQuantity}`;
}

function pushHistory() {
  historyStack.push(JSON.stringify(cartItems));
  if (historyStack.length > 20) {
    historyStack.shift();
  }
}

function restoreHistory() {
  if (historyStack.length === 0) return;
  cartItems = JSON.parse(historyStack.pop());
  renderCart();
}

function buildCategoryTabs() {
  categoryTabs.innerHTML = "";
  CATEGORIES.forEach((category) => {
    const button = document.createElement("button");
    button.textContent = `${category.name} (${category.shortcut})`;
    button.className = "category-button";
    button.dataset.category = category.id;
    button.dataset.testid = `pos-category-${category.id}`;
    button.setAttribute("data-testid", `pos-category-${category.id}`);
    button.addEventListener("click", () => switchCategory(category.id));
    categoryTabs.appendChild(button);
  });
  updateCategoryButtons();
}

function updateCategoryButtons() {
  [...categoryTabs.children].forEach((button) => {
    button.classList.toggle("active", button.dataset.category === currentCategory);
  });
}

function getProductsByCategory(categoryId) {
  if (categoryId === "popular") {
    return allProducts.filter((product) => product.category === "popular");
  }
  return allProducts.filter((product) => product.category === categoryId);
}

function updateProductPager(totalProducts) {
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));
  productPage = Math.min(productPage, totalPages - 1);
  productPage = Math.max(0, productPage);
  if (totalProducts === 0) {
    productPageIndicator.textContent = "0 / 0";
  } else {
    productPageIndicator.textContent = `${productPage + 1} / ${totalPages}`;
  }
  const disablePrev = productPage <= 0 || totalProducts === 0;
  const disableNext = productPage >= totalPages - 1 || totalProducts === 0;
  productPrevButton.disabled = disablePrev;
  productNextButton.disabled = disableNext;
  productPrevButton.setAttribute("aria-disabled", String(disablePrev));
  productNextButton.setAttribute("aria-disabled", String(disableNext));
}

function renderProducts() {
  const products = getProductsByCategory(currentCategory);
  updateProductPager(products.length);
  productGrid.innerHTML = "";
  productGrid.classList.toggle("empty", products.length === 0);
  if (!products.length) {
    const empty = document.createElement("div");
    empty.textContent = "商品がありません";
    productGrid.appendChild(empty);
    return;
  }

  const start = productPage * PRODUCTS_PER_PAGE;
  const visible = products.slice(start, start + PRODUCTS_PER_PAGE);
  visible.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("data-testid", `pos-product-${product.id}`);
    button.addEventListener("click", () => handleProductSelect(product));

    const img = document.createElement("img");
    img.src = product.image;
    img.alt = product.name;
    img.loading = "lazy";

    const info = document.createElement("div");
    info.className = "product-info";
    const title = document.createElement("h3");
    title.textContent = product.name;
    const price = document.createElement("p");
    price.textContent = formatCurrency(product.price);

    info.appendChild(title);
    info.appendChild(price);
    button.appendChild(img);
    button.appendChild(info);
    card.appendChild(button);
    productGrid.appendChild(card);
  });

  for (let index = visible.length; index < PRODUCTS_PER_PAGE; index += 1) {
    const filler = document.createElement("div");
    filler.className = "grid-filler";
    productGrid.appendChild(filler);
  }
}

function setProductPage(nextPage) {
  const products = getProductsByCategory(currentCategory);
  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const newPage = Math.min(Math.max(nextPage, 0), Math.max(totalPages - 1, 0));
  if (newPage !== productPage) {
    productPage = newPage;
    renderProducts();
  }
}

productPrevButton.addEventListener("click", () => {
  setProductPage(productPage - 1);
});

productNextButton.addEventListener("click", () => {
  setProductPage(productPage + 1);
});

function switchCategory(categoryId) {
  currentCategory = categoryId;
  productPage = 0;
  updateCategoryButtons();
  renderProducts();
}

function refreshProducts(nextProducts) {
  allProducts = nextProducts ?? getAllProducts();
  if (!allProducts.some((product) => product.category === currentCategory)) {
    currentCategory = CATEGORIES[0].id;
    updateCategoryButtons();
  }
  updateProductPager(getProductsByCategory(currentCategory).length);
  renderProducts();
  syncCartWithProducts();
}

function syncCartWithProducts() {
  let changed = false;
  cartItems = cartItems.map((item) => {
    const product = allProducts.find((p) => p.id === item.productId);
    if (!product) {
      return item;
    }
    const summary = summarizeOptions(product, item.options);
    if (item.name !== product.name || item.price !== product.price || JSON.stringify(item.optionSummary) !== JSON.stringify(summary)) {
      changed = true;
      return {
        ...item,
        name: product.name,
        price: product.price,
        optionSummary: summary
      };
    }
    return item;
  });
  if (changed) {
    renderCart();
  }
}

function addCartItem(product, selections, quantity) {
  const summary = summarizeOptions(product, selections);
  const existing = cartItems.find(
    (item) => item.productId === product.id && JSON.stringify(item.options) === JSON.stringify(selections || {})
  );
  if (existing) {
    existing.quantity += quantity;
  } else {
    cartItems.push({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      quantity,
      options: selections || {},
      optionSummary: summary,
      note: ""
    });
  }
  playFeedback();
  renderCart();
}

function renderCart() {
  cartContainer.innerHTML = "";
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartContainer.classList.toggle("empty", cartItems.length === 0);

  if (!cartItems.length) {
    const empty = document.createElement("div");
    empty.textContent = "カートは空です";
    cartContainer.appendChild(empty);
    totalDisplay.textContent = formatCurrency(total);
    confirmButton.disabled = shouldDisableConfirm();
    return;
  }

  cartItems.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.setAttribute("data-testid", `pos-cart-item-${index}`);

    const header = document.createElement("div");
    header.className = "cart-item-header";
    const name = document.createElement("div");
    name.className = "cart-item-name";
    name.textContent = `${item.name} ×${item.quantity}`;
    header.appendChild(name);

    if (item.optionSummary.length) {
      const options = document.createElement("div");
      options.className = "cart-item-options";
      item.optionSummary.forEach((label) => {
        const badge = document.createElement("span");
        badge.className = "option-badge";
        badge.textContent = label;
        options.appendChild(badge);
      });
      header.appendChild(options);
    }

    const noteInput = document.createElement("textarea");
    noteInput.placeholder = "メモ (任意)";
    noteInput.value = item.note;
    noteInput.className = "item-note-input";
    noteInput.rows = 2;
    noteInput.setAttribute("data-testid", `pos-cart-note-${index}`);
    noteInput.addEventListener("input", (event) => {
      cartItems[index].note = event.target.value;
    });
    header.appendChild(noteInput);

    const controls = document.createElement("div");
    controls.className = "cart-item-controls";
    const qtyControl = document.createElement("div");
    qtyControl.className = "quantity-control";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "-";
    minus.setAttribute("aria-label", `${item.name} を1つ減らす`);
    minus.addEventListener("click", () => updateItemQuantity(index, cartItems[index].quantity - 1));

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", `${item.name} を1つ増やす`);
    plus.addEventListener("click", () => updateItemQuantity(index, cartItems[index].quantity + 1));

    const qtyLabel = document.createElement("span");
    qtyLabel.textContent = item.quantity.toString();

    qtyControl.appendChild(minus);
    qtyControl.appendChild(qtyLabel);
    qtyControl.appendChild(plus);

    const lineTotal = document.createElement("div");
    lineTotal.className = "cart-line-total";
    lineTotal.textContent = formatCurrency(item.price * item.quantity);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "削除";
    removeButton.className = "ghost";
    removeButton.addEventListener("click", () => removeItem(index));

    controls.appendChild(qtyControl);
    controls.appendChild(lineTotal);
    controls.appendChild(removeButton);

    row.appendChild(header);
    row.appendChild(controls);
    cartContainer.appendChild(row);
  });

  totalDisplay.textContent = formatCurrency(total);
  confirmButton.disabled = shouldDisableConfirm();
}

function updateItemQuantity(index, quantity) {
  const item = cartItems[index];
  if (!item) return;
  pushHistory();
  if (quantity <= 0) {
    cartItems.splice(index, 1);
  } else {
    item.quantity = quantity;
  }
  renderCart();
}

function removeItem(index) {
  pushHistory();
  cartItems.splice(index, 1);
  renderCart();
}

function handleProductSelect(product) {
  const defaultSelections = {};
  product.options?.forEach((option) => {
    if (option.type === "toggle") {
      defaultSelections[option.id] = option.default ?? false;
    } else if (option.type === "level") {
      defaultSelections[option.id] = option.default ?? "普";
    } else if (option.type === "choice") {
      defaultSelections[option.id] = option.default ?? option.options?.[0]?.value;
    }
  });

  if (product.options && product.options.length > 0) {
    modalProduct = product;
    modalSelections = { ...defaultSelections };
    openOptionModal(product);
  } else {
    pushHistory();
    addCartItem(product, defaultSelections, quickQuantity);
  }
}

function openOptionModal(product) {
  optionModalTitle.textContent = `${product.name} のオプション`;
  optionModalBody.innerHTML = "";

  product.options.forEach((option) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "option-group";
    const legend = document.createElement("legend");
    legend.textContent = option.label;
    fieldset.appendChild(legend);
    const list = document.createElement("div");
    list.className = "option-list";

    if (option.type === "toggle") {
      const pill = document.createElement("label");
      pill.className = "option-pill";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = modalSelections[option.id];
      input.addEventListener("change", (event) => {
        modalSelections[option.id] = event.target.checked;
      });
      pill.appendChild(input);
      const span = document.createElement("span");
      span.textContent = option.label;
      pill.appendChild(span);
      list.appendChild(pill);
    }

    if (option.type === "level") {
      option.levels.forEach((level) => {
        const pill = document.createElement("label");
        pill.className = "option-pill";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = option.id;
        input.value = level;
        input.checked = modalSelections[option.id] === level;
        input.addEventListener("change", () => {
          modalSelections[option.id] = level;
        });
        pill.appendChild(input);
        const span = document.createElement("span");
        span.textContent = level;
        pill.appendChild(span);
        list.appendChild(pill);
      });
    }

    if (option.type === "choice") {
      option.options.forEach((choice) => {
        const pill = document.createElement("label");
        pill.className = "option-pill";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = option.id;
        input.value = choice.value;
        input.checked = modalSelections[option.id] === choice.value;
        input.addEventListener("change", () => {
          modalSelections[option.id] = choice.value;
        });
        pill.appendChild(input);
        const span = document.createElement("span");
        span.textContent = choice.label;
        pill.appendChild(span);
        list.appendChild(pill);
      });
    }

    fieldset.appendChild(list);
    optionModalBody.appendChild(fieldset);
  });

  optionModal.hidden = false;
  optionApply.focus();
}

function closeOptionModal() {
  optionModal.hidden = true;
  modalProduct = null;
  modalSelections = {};
}

optionClose.addEventListener("click", closeOptionModal);
optionCancel.addEventListener("click", () => {
  closeOptionModal();
});

optionModal.addEventListener("click", (event) => {
  if (event.target === optionModal) {
    closeOptionModal();
  }
});

optionModal.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    optionApply.click();
  }
});

optionApply.addEventListener("click", () => {
  if (!modalProduct) return;
  pushHistory();
  addCartItem(modalProduct, modalSelections, quickQuantity);
  closeOptionModal();
});

orderNumberClose.addEventListener("click", () => {
  orderNumberModal.hidden = true;
  confirmButton.focus();
});

orderNumberModal.addEventListener("click", (event) => {
  if (event.target === orderNumberModal) {
    orderNumberModal.hidden = true;
    confirmButton.focus();
  }
});

orderNumberModal.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    orderNumberModal.hidden = true;
    confirmButton.focus();
  }
});

function shouldDisableConfirm() {
  const isPaused = pauseToggle.checked;
  if (isPaused) {
    errorMessage.textContent = "受付一時停止中です";
    return true;
  }
  if (!cartItems.length) {
    errorMessage.textContent = "商品がカートにありません";
    return true;
  }
  errorMessage.textContent = "";
  return false;
}

function resetCart() {
  cartItems = [];
  historyStack = [];
  renderCart();
}

async function handleConfirm() {
  if (shouldDisableConfirm()) return;
  confirmButton.disabled = true;
  confirmButton.setAttribute("aria-busy", "true");
  const now = Date.now();
  const orderItems = cartItems.map((item) => ({
    productId: item.productId,
    name: item.name,
    category: item.category,
    unitPrice: item.price,
    quantity: item.quantity,
    options: item.options,
    optionSummary: item.optionSummary,
    note: item.note
  }));
  const total = orderItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const primaryCategory = orderItems[0]?.category ?? "pancake";
  try {
    const created = await addOrder({
      items: orderItems,
      total,
      primaryCategory
    });
    playFeedback();
    orderNumberDisplay.textContent = created.number;
    orderNumberModal.hidden = false;
    resetCart();
    errorMessage.textContent = "";
  } catch (error) {
    console.error("注文の登録に失敗しました", error);
    errorMessage.textContent = "注文の登録に失敗しました。通信状況を確認してください。";
  } finally {
    confirmButton.removeAttribute("aria-busy");
    confirmButton.disabled = shouldDisableConfirm();
  }
}

confirmButton.addEventListener("click", () => {
  handleConfirm().catch((error) => console.error(error));
});

undoButton.addEventListener("click", () => {
  restoreHistory();
});

clearButton.addEventListener("click", () => {
  if (cartItems.length) {
    pushHistory();
  }
  cartItems = [];
  historyStack = [];
  renderCart();
});

pauseToggle.addEventListener("change", async (event) => {
  const desired = event.target.checked;
  pauseToggle.disabled = true;
  try {
    const updatedPause = await setPause(desired);
    pauseToggle.checked = updatedPause;
    pauseBanner.classList.toggle("active", updatedPause);
  } catch (error) {
    console.error("受付一時停止の更新に失敗しました", error);
    pauseToggle.checked = !desired;
    pauseBanner.classList.toggle("active", pauseToggle.checked);
  } finally {
    pauseToggle.disabled = false;
    confirmButton.disabled = shouldDisableConfirm();
  }
});

listenStorage((state) => {
  pauseToggle.checked = state.pause;
  pauseBanner.classList.toggle("active", state.pause);
  confirmButton.disabled = shouldDisableConfirm();
});

async function initPauseState() {
  try {
    const paused = await getPause();
    pauseToggle.checked = paused;
    pauseBanner.classList.toggle("active", paused);
  } catch (error) {
    console.error("休止状態の取得に失敗しました", error);
    pauseToggle.checked = false;
    pauseBanner.classList.remove("active");
  }
  confirmButton.disabled = shouldDisableConfirm();
}

function handleKeyShortcuts(event) {
  if (!optionModal.hidden || !orderNumberModal.hidden) {
    return;
  }
  const target = event.target;
  const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
  if (event.key === "Enter" && !event.shiftKey && !event.altKey && !event.ctrlKey) {
    event.preventDefault();
    handleConfirm().catch((error) => console.error(error));
    return;
  }

  if (event.key === "z" && event.ctrlKey) {
    event.preventDefault();
    restoreHistory();
    return;
  }

  if (!event.ctrlKey && !event.metaKey && !event.altKey) {
    if (event.key >= "1" && event.key <= "9" && !isTyping) {
      setQuickQuantity(Number(event.key));
      event.preventDefault();
      return;
    }
    if (!isTyping) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setProductPage(productPage - 1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setProductPage(productPage + 1);
        return;
      }
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        return;
      }
    }
  }

  if (event.key.startsWith("F")) {
    const match = CATEGORIES.find((c) => c.shortcut === event.key);
    if (match) {
      event.preventDefault();
      switchCategory(match.id);
    }
  }
}

document.addEventListener("keydown", handleKeyShortcuts);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!optionModal.hidden) {
      closeOptionModal();
    } else if (!orderNumberModal.hidden) {
      orderNumberModal.hidden = true;
      confirmButton.focus();
    }
  }
});

async function init() {
  buildCategoryTabs();
  await ensureCatalogReady();
  refreshProducts();
  renderCart();
  await initPauseState();
  listenCatalog((products) => {
    refreshProducts(products);
  });
}

init().catch((error) => {
  console.error("POS init failed", error);
});
