"use client";

import { Info, Heart, ExternalLink, Sparkles, Shield, Flame, FileSignature, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
          <Info className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
          关于与帮助
        </h2>
        <p className="text-sm text-zinc-500 mt-1 dark:text-zinc-400">了解冲动购物阻击站</p>
      </div>

      {/* 项目介绍 */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-5 mb-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h3 className="text-sm font-bold text-zinc-800 mb-3 flex items-center gap-2 dark:text-zinc-200">
          <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          项目介绍
        </h3>
        <p className="text-sm text-zinc-500 leading-relaxed mb-3 dark:text-zinc-400">
          <strong className="text-zinc-700 dark:text-zinc-300">冲动购物阻击站</strong> 是一个用 AI 帮你克制冲动消费的趣味工具。
          当你想买东西时，让「魔鬼种草机」和「钱包守护者」展开辩论，
          帮你从两个角度审视购买决策，避免后悔。
        </p>
        <p className="text-sm text-zinc-500 leading-relaxed dark:text-zinc-400">
          除了 AI 辩论，你还可以在这里管理愿望清单、签署冷静契约、
          查看消费报告，全方位提升理性消费能力。
        </p>
      </div>

      {/* 使用指南 */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-5 mb-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h3 className="text-sm font-bold text-zinc-800 mb-4 dark:text-zinc-200">使用指南</h3>
        <div className="space-y-4">
          {[
            {
              step: "1",
              icon: Flame,
              color: "text-rose-500 bg-rose-100 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20",
              title: "填写商品信息",
              desc: "在辩论战场页面输入商品名称、价格、购买借口，设定冲动指数。",
            },
            {
              step: "2",
              icon: Shield,
              color: "text-cyan-500 bg-cyan-100 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-500/10 dark:border-cyan-500/20",
              title: "观看 AI 辩论",
              desc: "魔鬼种草机会想方设法说服你买，钱包守护者则帮你理性分析。你还可以继续「狡辩」！",
            },
            {
              step: "3",
              icon: FileSignature,
              color: "text-emerald-500 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20",
              title: "签署冷静契约",
              desc: "如果还没决定，可以签署 72 小时冷静契约，给自己一个缓冲期。",
            },
            {
              step: "4",
              icon: BarChart3,
              color: "text-amber-500 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20",
              title: "查看消费报告",
              desc: "在消费报告页面回顾你的理性消费成果，看看省了多少钱！",
            },
          ].map(({ step, icon: Icon, color, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{title}</div>
                <div className="text-xs text-zinc-500 mt-0.5 dark:text-zinc-400">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 小提示 */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-5 mb-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h3 className="text-sm font-bold text-zinc-800 mb-3 dark:text-zinc-200">💡 小提示</h3>
        <ul className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
          <li>· 冲动指数越高，魔鬼的说服力越强，守护者的警告也越严厉</li>
          <li>· 愿望清单里的商品满 72 小时后，会标注「可购买」</li>
          <li>· 签署冷静契约后，建议把购物 App 删掉或隐藏</li>
          <li>· 消费报告的数据会保存在本地，刷新页面不会丢失</li>
        </ul>
      </div>

      {/* 数据管理（演示用） */}
      <div className="rounded-2xl border border-zinc-300 bg-zinc-200 p-5 mb-6 dark:border-zinc-700 dark:bg-zinc-900/60">
        <h3 className="text-sm font-bold text-zinc-700 mb-3 dark:text-zinc-300">⚙️ 数据管理（演示用）</h3>
        <p className="text-xs text-zinc-500 mb-4 dark:text-zinc-400">一键生成模拟数据，让页面像被真人使用过一样。</p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const debateList = [
                { id: 1716000000000, product: "Sony WH-1000XM5 降噪耳机", price: 1999, result: "未购买" as const, saved: 1999, date: "2026-05-10" },
                { id: 1716500000000, product: "iPad Air 第六代 256G", price: 4799, result: "未购买" as const, saved: 4799, date: "2026-05-13" },
                { id: 1717000000000, product: "Nike Dunk Low 限量配色", price: 899, result: "已购买" as const, saved: 0, date: "2026-05-15" },
                { id: 1717500000000, product: "MacBook Pro 支架 + 显示器臂", price: 399, result: "未购买" as const, saved: 399, date: "2026-05-18" },
                { id: 1718000000000, product: "DJI Osmo Mobile 7 手机云台", price: 699, result: "未购买" as const, saved: 699, date: "2026-05-20" },
                { id: 1718500000000, product: "Lego F1 赛车收藏款", price: 549, result: "已购买" as const, saved: 0, date: "2026-05-22" },
                { id: 1719000000000, product: "Switch 2 主机（传闻）", price: 2599, result: "未购买" as const, saved: 2599, date: "2026-05-25" },
                { id: 1719500000000, product: "Lululemon 瑜伽裤 3条装", price: 690, result: "未购买" as const, saved: 690, date: "2026-05-28" },
              ];
              localStorage.setItem("impulse_debates", JSON.stringify(debateList));
              const wishlist = [
                { id: 1715000000000, name: "Sony WH-1000XM5 降噪耳机", price: 1999, note: "等双11打折再买，现在先观望", createdAt: "2026-05-08" },
                { id: 1715200000000, name: "人体工学椅 Herman Miller 平替", price: 1299, note: "现在的椅子坐久了腰疼", createdAt: "2026-05-12" },
                { id: 1715400000000, name: "Kindle Paperwhite 签名版", price: 1199, note: "想重新培养阅读习惯", createdAt: "2026-05-20" },
                { id: 1715600000000, name: "咖啡机 De'Longhi 半自动", price: 2499, note: "每天买咖啡的钱都够买了", createdAt: "2026-05-25" },
              ];
              localStorage.setItem("impulse_wishlist", JSON.stringify(wishlist));
              const contractList = [
                { id: 1715500000000, title: "72小时冷静契约 — 人体工学椅", items: ["不打开电商平台 App", "不搜索「人体工学椅 推荐」", "把商品页截图发给朋友劝阻"], deadline: "06/15 18:00", done: true, createdAt: "2026-05-12" },
                { id: 1715800000000, title: "48小时冷静契约 — 咖啡机", items: ["不去线下门店试用", "不加入电商平台的「降价提醒」", "先喝一周速溶咖啡再说"], deadline: "06/30 12:00", done: false, createdAt: "2026-05-25" },
              ];
              localStorage.setItem("impulse_contracts", JSON.stringify(contractList));
              alert("🌱 种子数据已写入！页面即将刷新。");
              window.location.reload();
            }}
            className="px-4 py-2 rounded-lg bg-rose-100 border border-rose-300 text-rose-600 text-xs font-bold hover:bg-rose-200 transition dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/30"
          >
            🌱 生成模拟数据
          </button>
          <button
            onClick={() => {
              localStorage.setItem("impulse_debates", JSON.stringify([]));
              localStorage.setItem("impulse_wishlist", JSON.stringify([]));
              localStorage.setItem("impulse_contracts", JSON.stringify([]));
              alert("🗑️ 所有数据已清除！页面即将刷新。");
              window.location.reload();
            }}
            className="px-4 py-2 rounded-lg bg-zinc-300 border border-zinc-400 text-zinc-600 text-xs font-bold hover:bg-zinc-400 transition dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700"
          >
            🗑️ 清除所有数据
          </button>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-5 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-xs text-zinc-400 mb-3 dark:text-zinc-500">
          Made with <Heart className="w-3 h-3 inline text-rose-500" /> · 冲动购物阻击站 v1.0 BETA
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="https://github.com"
            target="_blank"
            className="text-xs text-zinc-500 hover:text-zinc-700 transition flex items-center gap-1 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5 5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
            GitHub
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            href="https://deepseek.com"
            target="_blank"
            className="text-xs text-zinc-500 hover:text-zinc-700 transition flex items-center gap-1 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Powered by DeepSeek
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
