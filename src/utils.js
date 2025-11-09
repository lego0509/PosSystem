let viewportInitialized = false;

function updateViewportUnits() {
  const height = window.innerHeight;
  document.documentElement.style.setProperty("--viewport-height", `${height}px`);
}

export function initializeViewportUnits() {
  if (viewportInitialized) return;
  viewportInitialized = true;
  updateViewportUnits();
  window.addEventListener("resize", updateViewportUnits);
  window.addEventListener("orientationchange", updateViewportUnits);
  window.addEventListener("pageshow", updateViewportUnits);
  window.addEventListener("pagehide", () => {
    window.removeEventListener("resize", updateViewportUnits);
    window.removeEventListener("orientationchange", updateViewportUnits);
    window.removeEventListener("pageshow", updateViewportUnits);
    viewportInitialized = false;
  });
}

export function formatCurrency(value) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

export function formatElapsed(start) {
  const diff = Math.max(0, Date.now() - start);
  const minutes = Math.floor(diff / 60000)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor((diff % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function summarizeOptions(product, selections) {
  if (!product.options?.length) return [];
  const summary = [];
  for (const option of product.options) {
    const value = selections?.[option.id];
    if (option.type === "toggle") {
      const active = value ?? option.default;
      if (active) {
        summary.push(option.short || option.label);
      }
    } else if (option.type === "level") {
      const chosen = value || option.default;
      if (chosen !== "普") {
        summary.push(`${option.short || option.label}:${chosen}`);
      }
    } else if (option.type === "choice") {
      const chosen = value || option.default;
      const found = option.options.find((o) => o.value === chosen);
      if (found) {
        summary.push(found.short || found.label);
      }
    }
  }
  return summary;
}

export function shortCategoryLabel(categoryId) {
  switch (categoryId) {
    case "pancake":
      return "パンケーキ";
    case "crepe":
      return "クレープ";
    case "sausage":
      return "ソーセージ";
    case "drink":
      return "ドリンク";
    case "popular":
      return "セット";
    default:
      return categoryId;
  }
}

export function createAudioPlayer(audioElement, dataUrl) {
  audioElement.src = dataUrl;
  return () => {
    try {
      audioElement.currentTime = 0;
      audioElement.play().catch(() => {});
    } catch (error) {
      console.warn("audio playback failed", error);
    }
  };
}

export const FEEDBACK_SOUND =
  "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
  "AAAAAAAAAAAA";
