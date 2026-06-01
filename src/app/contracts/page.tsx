"use client";

import { useState, useEffect } from "react";
import { FileSignature, CheckCircle, Circle, Trash2, Plus } from "lucide-react";
import { getContracts, saveContracts, type StoredContract } from "@/lib/storage";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<StoredContract[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [itemInput, setItemInput] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [hours, setHours] = useState(72);

  useEffect(() => {
    setContracts(getContracts());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveContracts(contracts);
  }, [contracts, loaded]);

  const addItem = () => {
    if (!itemInput.trim()) return;
    setItems((prev) => [...prev, itemInput.trim()]);
    setItemInput("");
  };

  const createContract = () => {
    if (!title.trim() || items.length === 0) return;
    const deadline = new Date(Date.now() + hours * 3600 * 1000).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    setContracts((prev) => [
      { id: Date.now(), title: title.trim(), items: [...items], deadline, done: false, createdAt: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
    setTitle("");
    setItems([]);
    setShowForm(false);
  };

  const toggleDone = (id: number) => {
    setContracts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
    );
  };

  const removeContract = (id: number) => {
    setContracts((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <FileSignature className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
            冷静契约
          </h2>
          <p className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">签署契约，给自己一个冷静期</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-400 transition"
        >
          <Plus className="w-4 h-4" />
          签署新契约
        </button>
      </div>

      {/* 新建契约表单 */}
      {showForm && (
        <div className="rounded-2xl border border-zinc-300 bg-zinc-100 p-5 mb-6 animate-fade-in dark:border-zinc-700 dark:bg-zinc-900/80">
          <h3 className="text-sm font-bold text-zinc-800 mb-4 dark:text-zinc-200">新建冷静契约</h3>
          <input
            type="text"
            placeholder="契约名称，如：72小时不买耳机"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/60 transition mb-3 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="添加一条约定，如：不打开购物 App"
              value={itemInput}
              onChange={(e) => setItemInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/60 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            />
            <button
              onClick={addItem}
              className="rounded-xl bg-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-400 transition dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              添加
            </button>
          </div>
          {items.length > 0 && (
            <ul className="mb-3 space-y-1">
              {items.map((it, i) => (
                <li key={i} className="text-xs text-zinc-600 flex items-center gap-2 dark:text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 dark:bg-emerald-400" />
                  {it}
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-zinc-500 dark:text-zinc-400">冷静时长：</label>
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value={24}>24 小时</option>
              <option value={48}>48 小时</option>
              <option value={72}>72 小时</option>
              <option value={168}>7 天</option>
              <option value={336}>14 天</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createContract}
              disabled={!title || items.length === 0}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-400 transition disabled:opacity-40"
            >
              确认签署
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl bg-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800 transition dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 契约列表 */}
      {contracts.length === 0 && !showForm ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 py-20 dark:text-zinc-600">
          <FileSignature className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm">还没有契约，点击「签署新契约」开始</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((c) => (
            <div
              key={c.id}
              className={`rounded-2xl border p-5 transition ${
                c.done
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                  : "border-zinc-200 bg-zinc-100 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleDone(c.id)} className="mt-0.5">
                    {c.done ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-400 hover:text-zinc-500 transition dark:text-zinc-600 dark:hover:text-zinc-400" />
                    )}
                  </button>
                  <div>
                    <h4 className={`text-sm font-bold ${c.done ? "text-zinc-500 line-through dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-100"}`}>
                      {c.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5 dark:text-zinc-600">
                      截止：{c.deadline} · 创建于 {c.createdAt}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeContract(c.id)}
                  className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-rose-500 transition dark:hover:bg-zinc-800 dark:text-zinc-600 dark:hover:text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <ul className="ml-8 space-y-1">
                {c.items.map((it, i) => (
                  <li
                    key={i}
                    className={`text-xs ${c.done ? "text-zinc-500 line-through dark:text-zinc-600" : "text-zinc-600 dark:text-zinc-400"}`}
                  >
                    · {it}
                  </li>
                ))}
              </ul>
              {c.done && (
                <div className="ml-8 mt-3 text-[11px] text-emerald-600 flex items-center gap-1 dark:text-emerald-400">
                  <CheckCircle className="w-3 h-3" />
                  契约已完成！你成功克制了冲动消费 🎉
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
