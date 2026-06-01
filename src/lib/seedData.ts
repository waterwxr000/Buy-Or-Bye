import { saveDebates, saveWishlist, saveContracts } from "./storage";

/** 种子数据：像真人使用过一样 */
export function seedAllData() {
  if (typeof window === "undefined") return;

  /* ── 辩论记录（消费报告）── */
  const debateList = [
    {
      id: 1716000000000,
      product: "Sony WH-1000XM5 降噪耳机",
      price: 1999,
      result: "未购买" as const,
      saved: 1999,
      date: "2026-05-10",
    },
    {
      id: 1716500000000,
      product: "iPad Air 第六代 256G",
      price: 4799,
      result: "未购买" as const,
      saved: 4799,
      date: "2026-05-13",
    },
    {
      id: 1717000000000,
      product: "Nike Dunk Low 限量配色",
      price: 899,
      result: "已购买" as const,
      saved: 0,
      date: "2026-05-15",
    },
    {
      id: 1717500000000,
      product: "MacBook Pro 支架 + 显示器臂",
      price: 399,
      result: "未购买" as const,
      saved: 399,
      date: "2026-05-18",
    },
    {
      id: 1718000000000,
      product: "DJI Osmo Mobile 7 手机云台",
      price: 699,
      result: "未购买" as const,
      saved: 699,
      date: "2026-05-20",
    },
    {
      id: 1718500000000,
      product: "Lego F1 赛车收藏款",
      price: 549,
      result: "已购买" as const,
      saved: 0,
      date: "2026-05-22",
    },
    {
      id: 1719000000000,
      product: "Switch 2 主机（传闻）",
      price: 2599,
      result: "未购买" as const,
      saved: 2599,
      date: "2026-05-25",
    },
    {
      id: 1719500000000,
      product: "Lululemon 瑜伽裤 3条装",
      price: 690,
      result: "未购买" as const,
      saved: 690,
      date: "2026-05-28",
    },
  ];
  saveDebates(debateList);

  /* ── 愿望清单 ── */
  const wishlist = [
    {
      id: 1715000000000,
      name: "Sony WH-1000XM5 降噪耳机",
      price: 1999,
      note: "等双11打折再买，现在先观望",
      createdAt: "2026-05-08",
    },
    {
      id: 1715200000000,
      name: "人体工学椅 Herman Miller 平替",
      price: 1299,
      note: "现在的椅子坐久了腰疼",
      createdAt: "2026-05-12",
    },
    {
      id: 1715400000000,
      name: "Kindle Paperwhite 签名版",
      price: 1199,
      note: "想重新培养阅读习惯",
      createdAt: "2026-05-20",
    },
    {
      id: 1715600000000,
      name: "咖啡机 De'Longhi 半自动",
      price: 2499,
      note: "每天买咖啡的钱都够买了",
      createdAt: "2026-05-25",
    },
  ];
  saveWishlist(wishlist);

  /* ── 冷静契约 ── */
  const contractList = [
    {
      id: 1715500000000,
      title: "72小时冷静契约 — 人体工学椅",
      items: [
        "不打开电商平台 App",
        "不搜索「人体工学椅 推荐」",
        "把商品页截图发给朋友劝阻",
      ],
      deadline: "06/15 18:00",
      done: true,
      createdAt: "2026-05-12",
    },
    {
      id: 1715800000000,
      title: "48小时冷静契约 — 咖啡机",
      items: [
        "不去线下门店试用",
        "不加入电商平台的「降价提醒」",
        "先喝一周速溶咖啡再说",
      ],
      deadline: "06/30 12:00",
      done: false,
      createdAt: "2026-05-25",
    },
  ];
  saveContracts(contractList);

  alert("🌱 种子数据已写入！页面即将刷新。");
  window.location.reload();
}

export function clearAllData() {
  if (typeof window === "undefined") return;
  saveDebates([]);
  saveWishlist([]);
  saveContracts([]);
  alert("🗑️ 所有数据已清除！页面即将刷新。");
  window.location.reload();
}
