"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import Markdown from "react-markdown";

/* ───── SSE 流解析 ───── */
async function* readSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // ignore
      }
    }
  }
}

export default function NBall() {
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [input, setInput] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const dragOffset = useRef({ x: 0, y: 0 });
  const ballRef = useRef<HTMLDivElement>(null);
  const hasDragged = useRef(false);

  // 确保只在客户端渲染
  useEffect(() => {
    setIsClient(true);
    const savedPos = localStorage.getItem("nball-position");
    if (savedPos) {
      setPosition(JSON.parse(savedPos));
    }
  }, []);

  // 拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    hasDragged.current = false; // 重置拖拽标记
    const rect = ballRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  // 拖拽移动
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      hasDragged.current = true; // 标记为已拖拽
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      const maxX = window.innerWidth - 64;
      const maxY = window.innerHeight - 64;

      const clampedX = Math.max(0, Math.min(newX, maxX));
      const clampedY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem("nball-position", JSON.stringify(position));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, position]);

  // 调用商品调研 API
  const handleSearch = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setReport("");

    try {
      const res = await fetch("/api/product-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: input }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API 错误 ${res.status}: ${errText}`);
      }

      if (!res.body) throw new Error("响应体为空");

      const reader = res.body.getReader();
      let fullText = "";

      for await (const delta of readSSEStream(reader)) {
        fullText += delta;
        setReport(fullText);
      }
    } catch (err) {
      console.error("调用商品调研 API 失败：", err);
      setReport("❌ 生成报告失败，请重试。");
    } finally {
      setLoading(false);
    }
  };

  // 防止服务端渲染
  if (!isClient) return null;

  return (
    <>
      {/* 可拖拽小球 - 美观设计（无N字母） */}
      <div
        ref={ballRef}
        onMouseDown={handleMouseDown}
        onClick={() => !hasDragged.current && setShowDialog(true)}
        className={`fixed z-50 w-16 h-16 rounded-full cursor-move hover:scale-110 active:scale-95 transition ${
          isDragging ? "opacity-80" : ""
        } flex items-center justify-center`}
        style={{
          left: position.x,
          top: position.y,
          background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)",
          boxShadow: "0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)",
          animation: "pulse-glow 2s ease-in-out infinite",
        }}
      >
        {/* 内部光晕效果 */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

        {/* 搜索图标 */}
        <Search className="relative z-10 w-7 h-7 text-white drop-shadow-lg" />
      </div>

      {/* 对话框 */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 animate-fade-in max-h-[80vh] overflow-hidden flex flex-col dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-cyan-500 dark:text-cyan-400">
                🔍 购物情报助手
              </h3>
              <button
                onClick={() => {
                  setShowDialog(false);
                  setReport("");
                  setInput("");
                }}
                className="p-1 rounded-lg hover:bg-zinc-100 transition dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              </button>
            </div>

            <p className="text-sm text-zinc-500 mb-4 dark:text-zinc-400">
              输入商品名称，我会帮你生成购物调研报告，包括价格分析、评测摘要、替代品推荐等。
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="例如：Sony WH-1000XM5 降噪耳机"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                disabled={loading}
                className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-cyan-500/60 transition disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <button
                onClick={handleSearch}
                disabled={loading || !input.trim()}
                className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-500 transition disabled:opacity-40 flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "生成报告"
                )}
              </button>
            </div>

            {/* 报告展示区 */}
            {report && (
              <div className="flex-1 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="prose prose-sm max-w-none
                  prose-headings:text-cyan-500 prose-headings:font-bold dark:prose-headings:text-cyan-400
                  prose-strong:text-zinc-800 dark:prose-strong:text-zinc-200
                  prose-li:text-zinc-700 prose-li:marker:text-cyan-500 dark:prose-li:text-zinc-300 dark:prose-li:marker:text-cyan-500
                  prose-table:text-sm prose-th:text-cyan-500 prose-td:text-zinc-700
                  dark:prose-table:text-sm dark:prose-th:text-cyan-400 dark:prose-td:text-zinc-300
                ">
                  <Markdown>{report}</Markdown>
                </div>
              </div>
            )}

            {loading && !report && (
              <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                正在调研中，请稍候...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 全局动画样式 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(59, 130, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(6, 182, 212, 0.6), 0 0 60px rgba(59, 130, 246, 0.3);
          }
        }
      `}} />
    </>
  );
}
