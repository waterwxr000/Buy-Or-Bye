"use client";

import { useState, useRef, useEffect } from "react";
import {
  Flame,
  Shield,
  Send,
  FileSignature,
  ArrowRight,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import Markdown from "react-markdown";

/* ───── 类型 ───── */
interface FormData {
  name: string;
  price: string;
  excuse: string;
  impulse: number; // 1-10
}

interface Message {
  role: "user" | "devil" | "angel";
  text: string;
}

/* ───── SSE 流解析：提取 DeepSeek 的 delta content ───── */
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
        // 忽略无法解析的行
      }
    }
  }
}

/* ───── 从完整文本中解析出魔鬼和守护者的话术 ───── */
function parseDebateText(fullText: string): {
  devilText: string;
  angelText: string;
} {
  const devilMatch = fullText.match(
    /【魔鬼种草机[】:]+\s*[:：]\s*([\s\S]*?)(?=【钱包守护者|【结束】|$)/
  );
  const angelMatch = fullText.match(
    /【钱包守护者[】:]+\s*[:：]\s*([\s\S]*?)(?=【结束】|$)/
  );

  let devilText = devilMatch?.[1]?.trim() ?? "";
  let angelText = angelMatch?.[1]?.trim() ?? "";

  if (!devilText || !angelText) {
    const splitIdx = fullText.indexOf("【钱包守护者");
    if (splitIdx !== -1) {
      devilText = fullText.slice(0, splitIdx).replace(/【魔鬼种草机[】:]+\s*[:：]?\s*/g, "").trim();
      angelText = fullText.slice(splitIdx).replace(/【钱包守护者[】:]+\s*[:：]?\s*/g, "").replace(/【结束】.*/g, "").trim();
    }
  }

  return { devilText, angelText };
}

/* ───── 组件 ───── */
export default function Home() {
  const [stage, setStage] = useState<"form" | "battle">("form");
  const [form, setForm] = useState<FormData>({
    name: "",
    price: "",
    excuse: "",
    impulse: 5,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  /* 滚动控制 */
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const [userScrolling, setUserScrolling] = useState(false);
  const messagesLengthRef = useRef(messages.length);

  const handleScroll = (panelRef: React.RefObject<HTMLDivElement | null>) => {
    if (!panelRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = panelRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    if (!isNearBottom) {
      shouldAutoScroll.current = false;
      setUserScrolling(true);
    } else {
      shouldAutoScroll.current = true;
      setUserScrolling(false);
    }
  };

  /* 自动滚动到底部（仅在用户未手动滚动时） */
  useEffect(() => {
    messagesLengthRef.current = messages.length;
    if (shouldAutoScroll.current) {
      const timeoutId = setTimeout(() => {
        leftPanelRef.current?.scrollTo({ top: leftPanelRef.current.scrollHeight, behavior: "smooth" });
        rightPanelRef.current?.scrollTo({ top: rightPanelRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages]);

  /* ── 通用：调用 /api/debate SSE 流 ── */
  const callDebateAPI = async (history: { role: 'user' | 'assistant'; content: string }[]) => {
    setLoading(true);
    console.log("开始调用 API，历史记录：", history);

    const placeholder: Message[] = [
      { role: "devil", text: "⌛ 魔鬼正在煽风点火..." },
      { role: "angel", text: "⌛ 守护者正在冷静分析..." },
    ];
    setMessages((prev) => [...prev, ...placeholder]);

    try {
      const requestBody = {
        history,
        productName: form.name,
        price: form.price,
        excuse: form.excuse,
        desireLevel: form.impulse,
      };

      const res = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API 错误 ${res.status}: ${errText}`);
      }

      if (!res.body) {
        throw new Error("响应体为空，无法读取流");
      }

      const reader = res.body.getReader();
      let fullText = "";

      for await (const delta of readSSEStream(reader)) {
        fullText += delta;
        const { devilText, angelText } = parseDebateText(fullText);
        if (devilText || angelText) {
          setMessages((prev) => {
            const base = prev.slice(0, -2);
            return [
              ...base,
              { role: "devil", text: devilText || placeholder[0].text },
              { role: "angel", text: angelText || placeholder[1].text },
            ];
          });
        }
      }

      const { devilText, angelText } = parseDebateText(fullText);
      setMessages((prev) => {
        const base = prev.slice(0, -2);
        return [
          ...base,
          { role: "devil", text: devilText || "（魔鬼似乎无话可说）" },
          { role: "angel", text: angelText || "（守护者似乎无话可说）" },
        ];
      });

      setChatHistory((prev) => [...prev, { role: 'assistant', content: fullText }]);
    } catch (err) {
      console.error("调用辩论 API 失败：", err);
      setMessages((prev) => prev.slice(0, -2));
      alert(`调用失败：${err instanceof Error ? err.message : "未知错误"}\n\n请检查浏览器控制台（F12）查看详细错误信息。`);
    } finally {
      setLoading(false);
    }
  };

  /* 提交表单 → 进入对战（第一轮）*/
  const handleSubmit = async () => {
    if (!form.name || !form.price) {
      alert("请填写商品名称和价格！");
      return;
    }
    
    setStage("battle");
    setMessages([]);
    
    const firstUserPrompt = `
请开始第一轮辩论！

商品名称：${form.name}
商品价格：${form.price} 元
用户的购买借口：${form.excuse}
用户的冲动指数（1-10）：${form.impulse}

请分别扮演【魔鬼种草机】和【钱包守护者】，按照指定格式输出你们的辩论开场白。
`.trim();

    const initialHistory: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: firstUserPrompt }
    ];
    
    setChatHistory(initialHistory);
    await callDebateAPI(initialHistory);
  };

  /* 发送用户消息（后续回合）*/
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");

    const userMsg: Message = { role: "user", text: userText };
    setMessages((prev) => [...prev, userMsg]);

    const userMessage = { role: 'user' as const, content: userText };
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);

    await callDebateAPI(updatedHistory);
  };

  /* ───── 渲染 ───── */
  return (
    <div className="flex flex-col min-h-screen w-screen bg-zinc-950 text-zinc-100">
      {/* ======== 顶部标题栏 ======== */}
      <header className="flex items-center justify-center gap-3 h-16 shrink-0 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md z-10">
        <ShoppingBag className="w-7 h-7 text-rose-400" />
        <h1 className="text-xl md:text-2xl font-extrabold tracking-wide bg-gradient-to-r from-rose-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
          冲动购物阻击站
        </h1>
        <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
          BETA
        </span>
      </header>

      {/* ======== 主体区域 ======== */}
      {stage === "form" ? (
        <main className="flex-1 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-8 shadow-2xl shadow-rose-500/5 animate-slide-up">
            <h2 className="text-center text-2xl font-bold mb-1 text-zinc-100">
              你又想买什么？
            </h2>
            <p className="text-center text-sm text-zinc-500 mb-8">
              填写信息，让「魔鬼」和「天使」替你辩论一场
            </p>

            <label className="block mb-4">
              <span className="text-sm font-medium text-zinc-400 mb-1 block">商品名称</span>
              <input
                type="text"
                placeholder="例如：Sony WH-1000XM5 降噪耳机"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition"
              />
            </label>

            <label className="block mb-4">
              <span className="text-sm font-medium text-zinc-400 mb-1 block">商品价格（元）</span>
              <input
                type="number"
                placeholder="例如：1999"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition"
              />
            </label>

            <label className="block mb-5">
              <span className="text-sm font-medium text-zinc-400 mb-1 block">你的购买借口</span>
              <input
                type="text"
                placeholder="例如：打折促销、奖励自己、朋友都有"
                value={form.excuse}
                onChange={(e) => setForm({ ...form, excuse: e.target.value })}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition"
              />
            </label>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-zinc-400">冲动指数</span>
                <span
                  className="text-lg font-black tabular-nums"
                  style={{
                    color: form.impulse <= 3 ? "#4ade80" : form.impulse <= 6 ? "#fbbf24" : "#f43f5e",
                  }}
                >
                  {form.impulse}/10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={form.impulse}
                onChange={(e) => setForm({ ...form, impulse: Number(e.target.value) })}
                className="w-full"
                style={{ background: `linear-gradient(to right, #22c55e, #eab308, #f43f5e)` }}
              />
              <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                <span>冷静</span>
                <span>疯狂</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!form.name || !form.price || loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />对线中...</>
              ) : (
                <><ArrowRight className="w-4 h-4" />开战！让双方辩论</>
              )}
            </button>
          </div>
        </main>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 双栏区域 */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* 左栏：魔鬼种草机 */}
            <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-zinc-800 bg-gradient-to-b from-rose-950/30 via-zinc-950 to-zinc-950">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-rose-900/30 bg-rose-950/20 shrink-0">
                <Flame className="w-5 h-5 text-rose-400" />
                <h2 className="text-sm font-bold text-rose-400 tracking-wide">魔鬼种草机</h2>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  诱惑模式
                </span>
              </div>
              <div ref={leftPanelRef} onScroll={() => handleScroll(leftPanelRef)} className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-xs mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-zinc-200">{form.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-zinc-400">
                    <span>💰 价格: <span className="text-rose-400 font-bold">{form.price}元</span></span>
                    <span>🔥 冲动: <span className={`font-bold ${form.impulse <= 3 ? "text-green-400" : form.impulse <= 6 ? "text-yellow-400" : "text-rose-400"}`}>{form.impulse}/10</span></span>
                  </div>
                  {form.excuse && <div className="mt-2 text-zinc-500 italic">借口: {form.excuse}</div>}
                </div>

                {messages.map((m, i) => {
                  if (m.role === "angel") return null;
                  return (
                    <div
                      key={i}
                      className={`${
                        m.role === "user"
                          ? "ml-auto max-w-[85%] p-3 rounded-xl rounded-tr-none bg-zinc-700/30 border border-zinc-600/30 text-sm text-zinc-300"
                          : `animate-slide-up rounded-2xl rounded-tl-md border border-rose-500/20 bg-rose-500/5 p-4 text-sm leading-relaxed text-rose-100/90 ${m.text.includes("⌛") ? "animate-pulse" : ""}`
                      }`}
                    >
                      {m.role === "user" ? (
                        <><div className="text-xs text-zinc-500 mb-1">你说:</div>{m.text}</>
                      ) : (
                        <Markdown>{m.text}</Markdown>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 右栏：理性钱包守护者 */}
            <div className="flex-1 flex flex-col bg-gradient-to-b from-cyan-950/30 via-zinc-950 to-zinc-950">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-cyan-900/30 bg-cyan-950/20 shrink-0">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-bold text-cyan-400 tracking-wide">理性钱包守护者</h2>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  理性模式
                </span>
              </div>
              <div ref={rightPanelRef} onScroll={() => handleScroll(rightPanelRef)} className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-xs mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-zinc-200">{form.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-zinc-400">
                    <span>💰 价格: <span className="text-cyan-400 font-bold">{form.price}元</span></span>
                    <span>🔥 冲动: <span className={`font-bold ${form.impulse <= 3 ? "text-green-400" : form.impulse <= 6 ? "text-yellow-400" : "text-rose-400"}`}>{form.impulse}/10</span></span>
                  </div>
                  {form.excuse && <div className="mt-2 text-zinc-500 italic">借口: {form.excuse}</div>}
                </div>

                {messages.map((m, i) => {
                  if (m.role === "devil") return null;
                  return (
                    <div
                      key={i}
                      className={`${
                        m.role === "user"
                          ? "ml-auto max-w-[85%] p-3 rounded-xl rounded-tl-none bg-zinc-700/30 border border-zinc-600/30 text-sm text-zinc-300"
                          : `animate-slide-up rounded-2xl rounded-tr-md border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm leading-relaxed text-cyan-100/90 ${m.text.includes("⌛") ? "animate-pulse" : ""}`
                      }`}
                    >
                      {m.role === "user" ? (
                        <><div className="text-xs text-zinc-500 mb-1">你说:</div>{m.text}</>
                      ) : (
                        <Markdown>{m.text}</Markdown>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 底部输入区 */}
          <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-md p-3 flex items-center gap-3">
            <input
              type="text"
              placeholder="你还有什么想狡辩的吗？"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-600 transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={() => alert("🎉 72小时冷静契约已签署！我们会在这期间替你盯着钱包的。")}
              className="whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition hover:scale-[1.03] active:scale-[0.97] flex items-center gap-1.5"
            >
              <FileSignature className="w-4 h-4" />
              签署72小时冷静契约
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
