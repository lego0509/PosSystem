import {
  CATEGORIES,
  getCatalog,
  saveCatalog,
  resetCatalog,
  getOptionTemplates,
  listenCatalog,
  ensureCatalogReady
} from "./data.js";
import {
  formatCurrency,
  createAudioPlayer,
  FEEDBACK_SOUND,
  initializeViewportUnits,
} from "./utils.js";

sessionStorage.setItem("pos-preferred-route", "/catalog");

initializeViewportUnits();

const categoryMap = new Map(CATEGORIES.map((category, index) => [category.id, { ...category, order: index }]));

const catalogItemsContainer = document.getElementById("catalog-items");
const catalogFilter = document.getElementById("catalog-filter");
const catalogSearch = document.getElementById("catalog-search");
const catalogForm = document.getElementById("catalog-form");
const catalogModeField = document.getElementById("catalog-mode");
const catalogEditorTitle = document.getElementById("catalog-editor-title");
const catalogFeedback = document.getElementById("catalog-feedback");
const addButton = document.getElementById("catalog-add");
const resetButton = document.getElementById("catalog-reset");
const deleteButton = document.getElementById("catalog-delete");
const duplicateButton = document.getElementById("catalog-duplicate");
const saveButton = document.getElementById("catalog-save");
const feedbackAudio = document.getElementById("catalog-feedback-audio");

const productIdInput = document.getElementById("product-id");
const productNameInput = document.getElementById("product-name");
const productCategorySelect = document.getElementById("product-category");
const productPriceInput = document.getElementById("product-price");
const productImageInput = document.getElementById("product-image");
const productImageFileInput = document.getElementById("product-image-file");
const productImageFileClear = document.getElementById("product-image-file-clear");
const productImageFileStatus = document.getElementById("product-image-file-status");
const productTemplateSelect = document.getElementById("product-template");
const productDescriptionInput = document.getElementById("product-description");
const previewImage = document.getElementById("product-preview-image");
const previewName = document.getElementById("product-preview-name");
const previewPrice = document.getElementById("product-preview-price");

const playFeedback = createAudioPlayer(feedbackAudio, FEEDBACK_SOUND);

let catalog = { products: [] };
let selectedProductId = null;
let optionTemplates = getOptionTemplates();
let feedbackTimeoutId = null;
let uploadedImageData = null;
let uploadedImageName = "";

async function loadCatalogState() {
  catalog = await ensureCatalogReady();
}

function defaultTemplateForCategory(category) {
  if (category === "pancake") return "pancake-standard";
  if (category === "crepe") return "crepe-standard";
  if (category === "sausage") return "sausage-standard";
  return "none";
}

function buildCategoryFilter() {
  catalogFilter.innerHTML = "<option value=\"all\">すべて</option>";
  CATEGORIES.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    catalogFilter.appendChild(option);
  });
}

function buildCategorySelect() {
  productCategorySelect.innerHTML = "";
  CATEGORIES.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    productCategorySelect.appendChild(option);
  });
}

function buildTemplateSelect() {
  productTemplateSelect.innerHTML = "";
  optionTemplates.forEach((template) => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = `${template.label}`;
    option.dataset.description = template.description || "";
    productTemplateSelect.appendChild(option);
  });
}

function categoryName(categoryId) {
  return categoryMap.get(categoryId)?.name || categoryId;
}

function categoryOrder(categoryId) {
  return categoryMap.get(categoryId)?.order ?? Number.MAX_SAFE_INTEGER;
}

function clearSelectionHighlight() {
  [...catalogItemsContainer.children].forEach((card) => {
    card.classList.remove("selected");
  });
}

function renderProductList() {
  catalogItemsContainer.innerHTML = "";
  const query = catalogSearch.value.trim().toLowerCase();
  const filter = catalogFilter.value;

  const filtered = catalog.products
    .slice()
    .sort((a, b) => {
      const orderDiff = categoryOrder(a.category) - categoryOrder(b.category);
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name, "ja");
    })
    .filter((product) => (filter === "all" ? true : product.category === filter))
    .filter((product) => {
      if (!query) return true;
      return (
        product.name.toLowerCase().includes(query) ||
        product.id.toLowerCase().includes(query)
      );
    });

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "catalog-empty";
    empty.textContent = "該当する商品がありません";
    catalogItemsContainer.appendChild(empty);
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement("article");
    card.className = "catalog-card";
    card.dataset.id = product.id;
    card.setAttribute("data-testid", `catalog-item-${product.id}`);
    if (product.id === selectedProductId) {
      card.classList.add("selected");
    }

    const header = document.createElement("header");
    const title = document.createElement("h3");
    title.textContent = product.name || "名称未設定";
    const categoryTag = document.createElement("span");
    categoryTag.className = "catalog-card-category";
    categoryTag.textContent = categoryName(product.category);
    header.appendChild(title);
    header.appendChild(categoryTag);

    const image = document.createElement("img");
    image.src = product.image || "https://placehold.co/400x300?text=No+Image";
    image.alt = `${product.name} の画像`;

    const price = document.createElement("div");
    price.className = "catalog-card-price";
    price.textContent = formatCurrency(product.price);

    const templateInfo = document.createElement("div");
    templateInfo.className = "catalog-card-template";
    const templateLabel = optionTemplates.find((template) => template.id === product.optionTemplate)?.label || "オプションなし";
    templateInfo.textContent = `オプション: ${templateLabel}`;

    const actions = document.createElement("div");
    actions.className = "catalog-card-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "primary";
    editButton.textContent = "編集";
    editButton.setAttribute("data-testid", `catalog-edit-${product.id}`);
    editButton.addEventListener("click", (event) => {
      event.stopPropagation();
      selectProduct(product.id);
    });

    const duplicateButton = document.createElement("button");
    duplicateButton.type = "button";
    duplicateButton.className = "ghost";
    duplicateButton.textContent = "複製";
    duplicateButton.setAttribute("data-testid", `catalog-duplicate-${product.id}`);
    duplicateButton.addEventListener("click", (event) => {
      event.stopPropagation();
      startDuplicate(product);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "ghost";
    deleteButton.textContent = "削除";
    deleteButton.setAttribute("data-testid", `catalog-delete-${product.id}`);
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      handleDelete(product.id);
    });

    actions.appendChild(editButton);
    actions.appendChild(duplicateButton);
    actions.appendChild(deleteButton);

    card.appendChild(header);
    card.appendChild(image);
    card.appendChild(price);
    card.appendChild(templateInfo);
    card.appendChild(actions);

    card.addEventListener("click", () => {
      selectProduct(product.id);
    });

    catalogItemsContainer.appendChild(card);
  });
}

function showFeedback(message, type = "success") {
  catalogFeedback.textContent = message;
  catalogFeedback.classList.remove("success", "error");
  catalogFeedback.classList.add(type === "error" ? "error" : "success");
  if (feedbackTimeoutId) {
    clearTimeout(feedbackTimeoutId);
  }
  feedbackTimeoutId = setTimeout(() => {
    catalogFeedback.textContent = "";
    catalogFeedback.classList.remove("success", "error");
  }, 4000);
}

function clearFeedback() {
  catalogFeedback.textContent = "";
  catalogFeedback.classList.remove("success", "error");
  if (feedbackTimeoutId) {
    clearTimeout(feedbackTimeoutId);
    feedbackTimeoutId = null;
  }
}

function setUploadedImage(data, name = "") {
  uploadedImageData = data || null;
  uploadedImageName = data ? name || "" : "";
  if (productImageFileInput) {
    productImageFileInput.value = "";
  }
  if (productImageFileStatus) {
    if (uploadedImageData) {
      const label = uploadedImageName ? `${uploadedImageName} を使用中` : "アップロード画像を使用中";
      productImageFileStatus.textContent = label;
      productImageFileStatus.classList.add("active");
    } else {
      productImageFileStatus.textContent = "ファイル未選択";
      productImageFileStatus.classList.remove("active");
    }
  }
  updatePreview();
}

function updatePreview() {
  const name = productNameInput.value.trim() || "商品名";
  const priceValue = Number(productPriceInput.value);
  const imageUrl = productImageInput.value.trim();
  const previewSource = uploadedImageData || imageUrl;
  previewName.textContent = name;
  previewPrice.textContent = Number.isFinite(priceValue) ? formatCurrency(Math.max(0, Math.round(priceValue))) : "¥0";
  previewImage.src = previewSource || "https://placehold.co/200x150?text=Preview";
}

previewImage.addEventListener("error", () => {
  previewImage.src = "https://placehold.co/200x150?text=Preview";
});

function setForm(product, mode) {
  clearFeedback();
  catalogModeField.value = mode;
  if (mode === "edit") {
    selectedProductId = product.id;
    productIdInput.value = product.id;
    productIdInput.disabled = true;
    catalogEditorTitle.textContent = `商品編集：${product.name || product.id}`;
    deleteButton.disabled = false;
    duplicateButton.disabled = false;
  } else {
    selectedProductId = null;
    productIdInput.disabled = false;
    catalogEditorTitle.textContent = product?.id ? "複製から追加" : "新規商品を追加";
    deleteButton.disabled = true;
    duplicateButton.disabled = true;
  }

  productIdInput.value = product?.id || "";
  productNameInput.value = product?.name || "";
  const category = product?.category || CATEGORIES[0].id;
  productCategorySelect.value = category;
  productPriceInput.value = product?.price ?? 0;
  const imageValue = product?.image || "";
  const isUploaded = typeof imageValue === "string" && imageValue.startsWith("data:");
  if (isUploaded) {
    productImageInput.value = "";
    setUploadedImage(imageValue, product?.imageName || "");
  } else {
    productImageInput.value = imageValue;
    setUploadedImage(null, "");
  }
  productTemplateSelect.value = product?.optionTemplate || defaultTemplateForCategory(category);
  productDescriptionInput.value = product?.description || "";
  saveButton.disabled = false;
  updatePreview();
  if (mode === "edit") {
    clearSelectionHighlight();
    const card = catalogItemsContainer.querySelector(`[data-id="${product.id}"]`);
    card?.classList.add("selected");
  }
}

function selectProduct(productId) {
  const product = catalog.products.find((item) => item.id === productId);
  if (!product) {
    startCreateProduct();
    return;
  }
  setForm(product, "edit");
}

function startCreateProduct(prefill = null) {
  setForm(prefill || {}, "new");
  clearSelectionHighlight();
}

function generateUniqueId(base) {
  const safeBase = base.replace(/\s+/g, "-").toLowerCase();
  const initial = safeBase || "product";
  let candidate = `${initial}-${Date.now()}`;
  let counter = 1;
  while (catalog.products.some((product) => product.id === candidate)) {
    candidate = `${initial}-${counter}`;
    counter += 1;
  }
  return candidate;
}

function startDuplicate(product) {
  const duplicate = { ...product };
  duplicate.id = generateUniqueId(`${product.id}-copy`);
  duplicate.name = `${product.name} (コピー)`;
  if (product.imageName) {
    duplicate.imageName = product.imageName;
  }
  startCreateProduct(duplicate);
  productIdInput.value = duplicate.id;
  updatePreview();
}

function validateProductId(id, isEditing) {
  if (!id) {
    showFeedback("商品IDを入力してください", "error");
    productIdInput.focus();
    return false;
  }
  const normalized = id.replace(/\s+/g, "-");
  productIdInput.value = normalized;
  if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) {
    showFeedback("商品IDは英数字とハイフン/アンダーバーのみ使用できます", "error");
    productIdInput.focus();
    return false;
  }
  if (!isEditing && catalog.products.some((product) => product.id === normalized)) {
    showFeedback("同じ商品IDが既に存在します", "error");
    productIdInput.focus();
    return false;
  }
  if (isEditing && normalized !== selectedProductId && catalog.products.some((product) => product.id === normalized)) {
    showFeedback("別の商品で使用されているIDです", "error");
    productIdInput.focus();
    return false;
  }
  return true;
}

function getProductFromForm() {
  const isEditing = catalogModeField.value === "edit";
  const id = productIdInput.value.trim();
  if (!validateProductId(id, isEditing)) {
    return null;
  }
  const name = productNameInput.value.trim();
  if (!name) {
    showFeedback("商品名を入力してください", "error");
    productNameInput.focus();
    return null;
  }
  const priceValue = Number(productPriceInput.value);
  if (!Number.isFinite(priceValue) || priceValue < 0) {
    showFeedback("価格は0以上の数値で入力してください", "error");
    productPriceInput.focus();
    return null;
  }

  const imageSource = uploadedImageData || productImageInput.value.trim();
  const fallbackImage = `https://placehold.co/400x300?text=${encodeURIComponent(name)}`;
  const product = {
    id: productIdInput.value.trim(),
    name,
    category: productCategorySelect.value,
    price: Math.round(priceValue),
    image: imageSource || fallbackImage,
    optionTemplate: productTemplateSelect.value || defaultTemplateForCategory(productCategorySelect.value),
    description: productDescriptionInput.value.trim()
  };
  if (uploadedImageData) {
    product.imageName = uploadedImageName;
  }
  return product;
}

function handleImageFileChange() {
  if (!productImageFileInput || !productImageFileInput.files || productImageFileInput.files.length === 0) {
    return;
  }
  const file = productImageFileInput.files[0];
  if (file && file.type && !file.type.startsWith("image/")) {
    showFeedback("画像ファイルを選択してください", "error");
    productImageFileInput.value = "";
    return;
  }
  if (!file) {
    return;
  }
  const previousData = uploadedImageData;
  const previousName = uploadedImageName;
  const reader = new FileReader();
  reader.onload = () => {
    const result = typeof reader.result === "string" ? reader.result : null;
    if (!result) {
      showFeedback("画像の読み込みに失敗しました", "error");
      setUploadedImage(previousData, previousName || "");
      return;
    }
    setUploadedImage(result, file.name || "");
    showFeedback("画像ファイルを読み込みました", "success");
  };
  reader.onerror = () => {
    showFeedback("画像の読み込みに失敗しました", "error");
    setUploadedImage(previousData, previousName || "");
  };
  reader.readAsDataURL(file);
}

function handleImageFileClear() {
  if (!uploadedImageData) {
    setUploadedImage(null, "");
    return;
  }
  setUploadedImage(null, "");
  showFeedback("アップロード画像を解除しました", "success");
}

async function handleSave(event) {
  event.preventDefault();
  const product = getProductFromForm();
  if (!product) return;
  const isEditing = catalogModeField.value === "edit";
  if (isEditing) {
    const index = catalog.products.findIndex((item) => item.id === selectedProductId);
    if (index === -1) {
      showFeedback("選択した商品が見つかりません", "error");
      return;
    }
    catalog.products[index] = product;
  } else {
    catalog.products.push(product);
  }
  try {
    catalog = await saveCatalog({ products: catalog.products });
    playFeedback();
    showFeedback("保存しました", "success");
    renderProductList();
    selectProduct(product.id);
  } catch (error) {
    console.error("商品の保存に失敗しました", error);
    showFeedback("保存に失敗しました。通信環境をご確認ください。", "error");
  }
}

async function handleDelete(productId = selectedProductId) {
  if (!productId) return;
  const product = catalog.products.find((item) => item.id === productId);
  if (!product) return;
  if (!window.confirm(`${product.name} を削除しますか？`)) {
    return;
  }
  catalog.products = catalog.products.filter((item) => item.id !== productId);
  try {
    catalog = await saveCatalog({ products: catalog.products });
    playFeedback();
    showFeedback("削除しました", "success");
    renderProductList();
    startCreateProduct();
  } catch (error) {
    console.error("商品の削除に失敗しました", error);
    showFeedback("削除に失敗しました。再度お試しください。", "error");
  }
}

async function handleReset() {
  if (!window.confirm("初期の商品構成に戻しますか？")) {
    return;
  }
  try {
    catalog = await resetCatalog();
    renderProductList();
    startCreateProduct();
    showFeedback("初期データを読み込みました", "success");
  } catch (error) {
    console.error("初期化に失敗しました", error);
    showFeedback("初期データの復元に失敗しました。", "error");
  }
}

function handleCategoryChange() {
  if (catalogModeField.value !== "edit") {
    productTemplateSelect.value = defaultTemplateForCategory(productCategorySelect.value);
  }
  updatePreview();
}

async function init() {
  await loadCatalogState();
  buildCategoryFilter();
  buildCategorySelect();
  buildTemplateSelect();
  renderProductList();
  startCreateProduct();
  catalogSearch.addEventListener("input", renderProductList);
  catalogFilter.addEventListener("change", renderProductList);
  catalogForm.addEventListener("submit", (event) => {
    handleSave(event).catch((error) => console.error(error));
  });
  productNameInput.addEventListener("input", updatePreview);
  productPriceInput.addEventListener("input", updatePreview);
  productImageInput.addEventListener("input", updatePreview);
  if (productImageFileInput) {
    productImageFileInput.addEventListener("change", handleImageFileChange);
  }
  if (productImageFileClear) {
    productImageFileClear.addEventListener("click", handleImageFileClear);
  }
  productCategorySelect.addEventListener("change", handleCategoryChange);
  productTemplateSelect.addEventListener("change", clearFeedback);
  addButton.addEventListener("click", () => {
    startCreateProduct();
    productIdInput.focus();
  });
  resetButton.addEventListener("click", () => {
    handleReset().catch((error) => console.error(error));
  });
  deleteButton.addEventListener("click", () => {
    handleDelete().catch((error) => console.error(error));
  });
  duplicateButton.addEventListener("click", () => {
    if (!selectedProductId) return;
    const product = catalog.products.find((item) => item.id === selectedProductId);
    if (product) {
      startDuplicate(product);
      productIdInput.focus();
    }
  });
  listenCatalog(() => {
    catalog = getCatalog();
    renderProductList();
    if (selectedProductId) {
      const exists = catalog.products.find((item) => item.id === selectedProductId);
      if (exists) {
        setForm(exists, "edit");
      } else {
        startCreateProduct();
      }
    }
  });
}

init().catch((error) => {
  console.error("Catalog init failed", error);
});
