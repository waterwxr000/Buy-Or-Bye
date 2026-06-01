"use client";

import { useState, useEffect } from "react";
import { List, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getWishlist, saveWishlist, type StoredWishItem } from "@/lib/storage";

export default function WishlistPage() {
  const [items, setItems] = useState<StoredWishItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    setItems(getWishlist());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveWishlist(items);
  }, [items, loaded]);

  const addItem = () => {
    if (!name.trim() || !price) return;
    setItems((prev) => [
      {
        id: Date.now(),
        name: name.trim(),
        price: Number(price),
        note: note.trim(),
        createdAt: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
    setName("");
    setPrice("");
    setNote("");
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const total = items.reduce((s, i) => s + i.price, 0);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
          <List className="w-6 h-6 text-amber-500 dark:text-amber-400" />
          愿望清单
        </h2>
        <p className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">记录你想买的东西，冷静后再决定</p>
      </div>

      {/* 添加表单 */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-5 mb-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h3 className="text-sm font-bold text-zinc-800 mb-4 dark:text-zinc-300">添加新物品</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            type="text"
            placeholder="商品名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500/60 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
          <input
            type="number"
            placeholder="价格（元）"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500/60 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
          <input
            type="text"
            placeholder="备注（可选）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500/60 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
        </div>
        <button
          onClick={addItem}
          disabled={!name || !price}
          className="w-full md:w-auto rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-zinc-900 hover:bg-amber-400 transition disabled:opacity-40"
        >
          加入清单
        </button>
      </div>

      {/* 清单列表 */}
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 py-20 dark:text-zinc-600">
          <ShoppingBag className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm">清单为空，快去添加你想买的东西吧</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-rose-500 hover:text-rose-400 transition"
          >
            或去辩论战场让 AI 帮你分析 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-100 p-4 hover:border-zinc-300 transition dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-zinc-800 truncate dark:text-zinc-100">{item.name}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>💰 {item.price} 元</span>
                    {item.note && <span>📝 {item.note}</span>}
                    <span>📅 {item.createdAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                    冷静中
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-rose-500 transition dark:hover:bg-zinc-800 dark:text-zinc-500 dark:hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 合计 */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-100 p-4 flex items-center justify-between dark:border-zinc-800 dark:bg-zinc-900/60">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">总计 {items.length} 件，合计</span>
            <span className="text-xl font-black text-rose-500 dark:text-rose-400">¥ {total.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  );
}
