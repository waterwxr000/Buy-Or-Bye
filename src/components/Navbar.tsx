"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Flame,
  Shield,
  List,
  FileSignature,
  BarChart3,
  Info,
  Menu,
  X,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { href: "/", label: "辩论战场", icon: ShoppingBag },
  { href: "/wishlist", label: "愿望清单", icon: List },
  { href: "/contracts", label: "冷静契约", icon: FileSignature },
  { href: "/stats", label: "消费报告", icon: BarChart3 },
  { href: "/about", label: "关于帮助", icon: Info },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* 顶部导航栏（桌面 + 移动端通用） */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 shrink-0 border-b border-zinc-200 bg-white/95 backdrop-blur-md px-4 dark:border-zinc-800 dark:bg-zinc-900/95">
        {/* 左侧 Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-rose-400" />
          <span className="text-base font-bold bg-gradient-to-r from-rose-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent hidden sm:inline">
            冲动购物阻击站
          </span>
        </Link>

        {/* 中间导航链接（仅桌面端显示） */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  active
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 右侧：主题切换 + 移动端菜单按钮 */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <Menu className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
          </button>
        </div>
      </header>

      {/* 移动端侧边抽屉 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden dark:bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-zinc-200 transform transition-transform duration-300 md:hidden dark:bg-zinc-900 dark:border-zinc-800 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-base font-bold bg-gradient-to-r from-rose-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
            冲动购物阻击站
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-rose-400" : "text-zinc-400 dark:text-zinc-500"}`} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
