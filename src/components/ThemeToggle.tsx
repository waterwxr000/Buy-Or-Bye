"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
      aria-label="切换主题"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-zinc-300" />
      ) : (
        <Moon className="w-5 h-5 text-zinc-600" />
      )}
    </button>
  );
}
