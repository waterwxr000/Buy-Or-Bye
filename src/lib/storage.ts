/* localStorage 工具函数 */

const KEY_WISHLIST = "impulse_wishlist";
const KEY_CONTRACTS = "impulse_contracts";
const KEY_DEBATES = "impulse_debates";

/** 愿望清单 */
export interface StoredWishItem {
  id: number;
  name: string;
  price: number;
  note: string;
  createdAt: string;
}

export function getWishlist(): StoredWishItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY_WISHLIST) ?? "[]");
  } catch {
    return [];
  }
}

export function saveWishlist(items: StoredWishItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_WISHLIST, JSON.stringify(items));
}

/** 冷静契约 */
export interface StoredContract {
  id: number;
  title: string;
  items: string[];
  deadline: string;
  done: boolean;
  createdAt: string;
}

export function getContracts(): StoredContract[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY_CONTRACTS) ?? "[]");
  } catch {
    return [];
  }
}

export function saveContracts(contracts: StoredContract[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_CONTRACTS, JSON.stringify(contracts));
}

export function addContract(contract: StoredContract) {
  const list = getContracts();
  saveContracts([contract, ...list]);
}

/** 辩论历史 */
export interface StoredDebate {
  id: number;
  product: string;
  price: number;
  result: "已购买" | "未购买";
  saved: number; // 未购买时为 price，已购买时为 0
  date: string;
}

export function getDebates(): StoredDebate[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY_DEBATES) ?? "[]");
  } catch {
    return [];
  }
}

export function saveDebates(debates: StoredDebate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_DEBATES, JSON.stringify(debates));
}

export function addDebate(debate: StoredDebate) {
  const list = getDebates();
  saveDebates([debate, ...list]);
}
