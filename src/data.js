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

export const PRODUCTS = [
  {
    id: "pancake-classic",
    category: "pancake",
    name: "クラシック",
    price: 350,
    image: "https://placehold.co/400x300?text=Classic",
    options: pancakeOptions
  },
  {
    id: "pancake-choco",
    category: "pancake",
    name: "チョコソース",
    price: 400,
    image: "https://placehold.co/400x300?text=Choco",
    options: pancakeOptions
  },
  {
    id: "pancake-strawberry",
    category: "pancake",
    name: "いちご＆ホイップ",
    price: 450,
    image: "https://placehold.co/400x300?text=Strawberry",
    options: pancakeOptions
  },
  {
    id: "pancake-maple",
    category: "pancake",
    name: "メープルバター",
    price: 420,
    image: "https://placehold.co/400x300?text=Maple",
    options: pancakeOptions
  },
  {
    id: "pancake-banana",
    category: "pancake",
    name: "バナナチョコ",
    price: 430,
    image: "https://placehold.co/400x300?text=Banana",
    options: pancakeOptions
  },
  {
    id: "pancake-berry",
    category: "pancake",
    name: "ベリーミックス",
    price: 480,
    image: "https://placehold.co/400x300?text=Berry",
    options: pancakeOptions
  },
  {
    id: "crepe-sugar",
    category: "crepe",
    name: "シュガーバター",
    price: 300,
    image: "https://placehold.co/400x300?text=Sugar",
    options: crepeOptions
  },
  {
    id: "crepe-custard",
    category: "crepe",
    name: "カスタード＆いちご",
    price: 450,
    image: "https://placehold.co/400x300?text=Custard",
    options: crepeOptions
  },
  {
    id: "crepe-choco",
    category: "crepe",
    name: "チョコバナナ",
    price: 420,
    image: "https://placehold.co/400x300?text=ChocoBanana",
    options: crepeOptions
  },
  {
    id: "crepe-tuna",
    category: "crepe",
    name: "ツナマヨ",
    price: 430,
    image: "https://placehold.co/400x300?text=Tuna",
    options: crepeOptions
  },
  {
    id: "crepe-ham",
    category: "crepe",
    name: "ハムチーズ",
    price: 440,
    image: "https://placehold.co/400x300?text=Ham",
    options: crepeOptions
  },
  {
    id: "crepe-matcha",
    category: "crepe",
    name: "抹茶クリーム",
    price: 460,
    image: "https://placehold.co/400x300?text=Matcha",
    options: crepeOptions
  },
  {
    id: "sausage-large",
    category: "sausage",
    name: "ソーセージ（大）",
    price: 350,
    image: "https://placehold.co/400x300?text=Sausage",
    options: sausageOptions
  },
  {
    id: "drink-ice-coffee",
    category: "drink",
    name: "アイスコーヒー",
    price: 200,
    image: "https://placehold.co/400x300?text=Iced+Coffee",
    options: []
  },
  {
    id: "drink-orange",
    category: "drink",
    name: "オレンジジュース",
    price: 200,
    image: "https://placehold.co/400x300?text=Orange",
    options: []
  },
  {
    id: "drink-ice-tea",
    category: "drink",
    name: "アイスティー",
    price: 200,
    image: "https://placehold.co/400x300?text=Iced+Tea",
    options: []
  },
  {
    id: "drink-oolong",
    category: "drink",
    name: "ウーロン茶",
    price: 200,
    image: "https://placehold.co/400x300?text=Oolong",
    options: []
  }
];

export const POPULAR_SETS = [
  {
    id: "set-pancake-drink",
    category: "popular",
    name: "クラシック＋ドリンクセット",
    price: 520,
    image: "https://placehold.co/400x300?text=Set+A",
    description: "クラシックパンケーキ＋お好きなドリンク",
    options: []
  },
  {
    id: "set-berry-coffee",
    category: "popular",
    name: "ベリー＋アイスコーヒー",
    price: 650,
    image: "https://placehold.co/400x300?text=Set+B",
    description: "ベリーミックスとアイスコーヒーのお得セット",
    options: []
  },
  {
    id: "set-crepe-drink",
    category: "popular",
    name: "クレープ＋ドリンクセット",
    price: 580,
    image: "https://placehold.co/400x300?text=Set+C",
    description: "クレープ＋ドリンクの定番コンビ",
    options: []
  }
];

export const ALL_PRODUCTS = [...PRODUCTS, ...POPULAR_SETS];

export function findProduct(productId) {
  return ALL_PRODUCTS.find((product) => product.id === productId);
}
