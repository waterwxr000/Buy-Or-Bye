"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingDown, ShieldCheck, Flame, ShoppingBag } from "lucide-react";
import { getDebates, type StoredDebate } from "@/lib/storage";

function buildMonthlyData(debates: StoredDebate[]) {
  const map: Record<string, { saved: number; spent: number }> = {};
  debates.forEach((d) => {
    const month = d.date.slice(0, 7);
    if (!map[month]) map[month] = { saved: 0, spent: 0 };
    if (d.result === "未购买") map[month].saved += d.saved;
    else map[month].spent += d.price;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, vals]) => {
      const [, m] = month.split("-");
      return { month: `${Number(m)}月`, saved: vals.saved, spent: vals.spent };
    });
}

export default function StatsPage() {
  const [debates, setDebates] = useState<StoredDebate[]>([]);

  useEffect(() => {
    setDebates(getDebates());
  }, []);

  const monthlyData = buildMonthlyData(debates);
  const totalSaved = debates.filter((d) => d.result === "未购买").reduce((s, d) => s + d.saved, 0);
  const totalSpent = debates.filter((d) => d.result === "已购买").reduce((s, d) => s + d.price, 0);
  const winRate = debates.length === 0 ? 0 : Math.round(
    ((debates.length - debates.filter((d) => d.result === "已购买").length) / debates.length) * 100
  );
  const maxVal = monthlyData.length > 0
    ? Math.max(...monthlyData.flatMap((d) => [d.saved, d.spent]))
    : 100;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
          <BarChart3 className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />
          消费报告
        </h2>
        <p className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">回顾你的理性消费之路</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "成功拦截", value: `¥${totalSaved.toLocaleString()}`, sub: "避免冲动消费", icon: TrendingDown, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20" },
          { label: "自律胜率", value: `${winRate}%`, sub: "战胜冲动的比例", icon: ShieldCheck, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 border-cyan-200 dark:bg-cyan-500/10 dark:border-cyan-500/20" },
          { label: "实际支出", value: `¥${totalSpent.toLocaleString()}`, sub: "经辩论后购买", icon: ShoppingBag, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20" },
          { label: "辩论场次", value: String(debates.length), sub: "使用阻击站次数", icon: Flame, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20" },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-4 ${bg}`}>
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <div className={`text-xl font-black ${color}`}>{value}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5 dark:text-zinc-500">{label}</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-600">{sub}</div>
          </div>
        ))}
      </div>

      {/* 月度图表 */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-5 mb-8 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h3 className="text-sm font-bold text-zinc-800 mb-4 dark:text-zinc-300">月度节省 vs 支出</h3>
        <div className="flex items-end gap-3 h-40">
          {monthlyData.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-1 items-end h-36">
                <div
                  className="flex-1 rounded-t-md bg-emerald-400 dark:bg-emerald-500/60"
                  style={{ height: `${maxVal > 0 ? (d.saved / maxVal) * 100 : 0}%` }}
                  title={`节省 ¥${d.saved}`}
                />
                <div
                  className="flex-1 rounded-t-md bg-rose-400 dark:bg-rose-500/60"
                  style={{ height: `${maxVal > 0 ? (d.spent / maxVal) * 100 : 0}%` }}
                  title={`支出 ¥${d.spent}`}
                />
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-500">{d.month}</span>
            </div>
          ))}
        </div>
        {monthlyData.length === 0 && (
          <p className="text-center text-xs text-zinc-400 py-4 dark:text-zinc-600">暂无数据，去辩论战场开始第一场辩论吧！</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-[11px] text-zinc-500 dark:text-zinc-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-500/60 inline-block" />拦截金额</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-rose-400 dark:bg-rose-500/60 inline-block" />实际支出</span>
        </div>
      </div>

      {/* 辩论历史 */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h3 className="text-sm font-bold text-zinc-800 mb-4 dark:text-zinc-300">辩论历史</h3>
        {debates.length === 0 ? (
          <p className="text-center text-xs text-zinc-400 py-4 dark:text-zinc-600">暂无辩论记录</p>
        ) : (
          <div className="space-y-2">
            {debates.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 hover:border-zinc-300 transition dark:border-zinc-800 dark:hover:border-zinc-700"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${b.result === "未购买" ? "bg-emerald-500 dark:bg-emerald-400" : "bg-rose-500 dark:bg-rose-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-800 truncate dark:text-zinc-200">{b.product}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-600">{b.date}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-sm font-bold ${b.result === "未购买" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {b.result === "未购买" ? `节省 ¥${b.saved}` : `支出 ¥${b.price}`}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-600">{b.result}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
