export const CATEGORIES = [
  { id: "pancake", name: "パンケーキ", shortcut: "F1" },
  { id: "crepe", name: "クレープ", shortcut: "F2" },
  { id: "sausage", name: "ソーセージ", shortcut: "F3" },
  { id: "drink", name: "ドリンク", shortcut: "F4" },
  //{ id: "popular", name: "よく出るセット", shortcut: "F5" }
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

const pancakeSimpleOptions = [
  {
    id: "syrup",
    label: "シロップ",
    type: "choice",
    options: [
      { value: "choco", label: "チョコ", short: "チョコ" },
      { value: "cream", label: "クリーム", short: "クリーム" }
    ],
    default: "choco"
  }
];

const crepeSimpleOptions = [
  {
    id: "syrup",
    label: "シロップ",
    type: "choice",
    options: [
      { value: "choco", label: "チョコ", short: "チョコ" },
      { value: "cream", label: "クリーム", short: "クリーム" }
    ],
    default: "choco"
  }
];

const crepeSavoryOptions = [
  {
    id: "sauce",
    label: "ソース",
    type: "choice",
    options: [
      { value: "mayo", label: "マヨネーズ", short: "マヨ" },
      { value: "ketchup", label: "ケチャップ", short: "ケチャ" }
    ],
    default: "mayo"
  }
];

export const OPTION_TEMPLATES = [
  {
    id: "none",
    label: "オプションなし",
    description: "追加オプションを設定しない商品",
    options: []
  },
  {
    id: "pancake-standard",
    label: "パンケーキ標準",
    description: "追いホイップやソース濃度など",
    options: pancakeOptions
  },
  {
    id: "crepe-standard",
    label: "クレープ標準",
    description: "ホイップ量・ソース量・包みかた",
    options: crepeOptions
  },
  {
    id: "sausage-standard",
    label: "ソーセージ標準",
    description: "ケチャップとマスタードの有無",
    options: sausageOptions
  },
  {
    id: "pancake-simple",
    label: "パンケーキ（シンプル）",
    description: "チョコ or クリームシロップを選択",
    options: pancakeSimpleOptions
  },
  {
    id: "crepe-simple",
    label: "クレープ（シンプル）",
    description: "チョコ or クリームシロップを選択",
    options: crepeSimpleOptions
  },
  {
    id: "crepe-savory-simple",
    label: "クレープ（おかず系）",
    description: "マヨネーズ or ケチャップを選択",
    options: crepeSavoryOptions
  }
];

export const DEFAULT_PRODUCTS = [
  {
    id: "pancake-orange",
    category: "pancake",
    name: "オレンジ（パンケーキ）",
    price: 0,
    image: "https://placehold.co/400x300?text=Orange",
    optionTemplate: "pancake-simple",
    description: "",
    imageName: ""
  },
  {
    id: "pancake-blueberry",
    category: "pancake",
    name: "ブルーベリー（パンケーキ）",
    price: 0,
    image: "https://placehold.co/400x300?text=Blueberry",
    optionTemplate: "pancake-simple",
    description: "",
    imageName: ""
  },
  {
    id: "pancake-strawberry",
    category: "pancake",
    name: "いちご（パンケーキ）",
    price: 0,
    image: "https://placehold.co/400x300?text=Strawberry",
    optionTemplate: "pancake-simple",
    description: "",
    imageName: ""
  },
  {
    id: "crepe-strawberry",
    category: "crepe",
    name: "いちご（クレープ）",
    price: 0,
    image: "https://placehold.co/400x300?text=Strawberry",
    optionTemplate: "crepe-simple",
    description: "",
    imageName: ""
  },
  {
    id: "crepe-orange",
    category: "crepe",
    name: "オレンジ（クレープ）",
    price: 0,
    image: "https://placehold.co/400x300?text=Orange",
    optionTemplate: "crepe-simple",
    description: "",
    imageName: ""
  },
  {
    id: "crepe-blueberry",
    category: "crepe",
    name: "ブルーベリー（クレープ）",
    price: 0,
    image: "https://placehold.co/400x300?text=Blueberry",
    optionTemplate: "crepe-simple",
    description: "",
    imageName: ""
  },
  {
    id: "crepe-savory",
    category: "crepe",
    name: "おかず（クレープ）",
    price: 0,
    image: "https://placehold.co/400x300?text=Savory",
    optionTemplate: "crepe-savory-simple",
    description: "",
    imageName: ""
  },
  {
    id: "sausage-large",
    category: "sausage",
    name: "ソーセージ",
    price: 0,
    image: "https://placehold.co/400x300?text=Sausage",
    optionTemplate: "none",
    description: "",
    imageName: ""
  },
  {
    id: "drink-coffee",
    category: "drink",
    name: "コーヒー",
    price: 0,
    image: "https://placehold.co/400x300?text=Coffee",
    optionTemplate: "none",
    description: "",
    imageName: ""
  },
  {
    id: "drink-ice-tea",
    category: "drink",
    name: "アイスティー",
    price: 0,
    image: "https://placehold.co/400x300?text=Iced+Tea",
    optionTemplate: "none",
    description: "",
    imageName: ""
  },
  {
    id: "drink-milk-tea",
    category: "drink",
    name: "ミルクティー",
    price: 0,
    image: "https://placehold.co/400x300?text=Milk+Tea",
    optionTemplate: "none",
    description: "",
    imageName: ""
  }
];

