"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Shield,
  Send,
  FileSignature,
  ArrowRight,
  ShoppingBag,
  Loader2,
  CheckCircle,
  XCircle,
  Brain,
} from "lucide-react";
import Markdown from "react-markdown";
import { addDebate, addContract } from "@/lib/storage";

/* ───── 类型 ───── */
interface FormData {
  name: string;
  price: string;
  excuse: string;
  impulse: number;
}

interface Message {
  role: "user" | "devil" | "angel";
  text: string;
}

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

/* ───── 解析辩论文本 ───── */
function parseDebateText(fullText: string): {
  devilText: string;
  angelText: string;
} {
  const devilMatch = fullText.match(
    /【魔鬼种草机[^】]*】\s*[:：]\s*([\s\S]*?)(?=【钱包守护者|【结束】|$)/
  );
  const angelMatch = fullText.match(
    /【钱包守护者[^】]*】\s*[:：]\s*([\s\S]*?)(?=【结束】|$)/
  );

  let devilText = devilMatch?.[1]?.trim() ?? "";
  let angelText = angelMatch?.[1]?.trim() ?? "";

  if (!devilText || !angelText) {
    const splitIdx = fullText.indexOf("【钱包守护者");
    if (splitIdx !== -1) {
      devilText = fullText.slice(0, splitIdx).replace(/【魔鬼种草机[^】]*】\s*[:：]?\s*/g, "").trim();
      angelText = fullText.slice(splitIdx).replace(/【钱包守护者[^】]*】\s*[:：]?\s*/g, "").replace(/【结束】.*/g, "").trim();
    }
  }

  return { devilText, angelText };
}

/* ───── 组件 ───── */
export default function Home() {
  const router = useRouter();
  const [stage, setStage] = useState<"form" | "battle" | "result">("form");
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
  const [showResultModal, setShowResultModal] = useState(false);
  const [showConclusion, setShowConclusion] = useState(false);
  const [conclusion, setConclusion] = useState("");
  const [loadingConclusion, setLoadingConclusion] = useState(false);

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

  const callDebateAPI = async (history: { role: 'user' | 'assistant'; content: string }[]) => {
    setLoading(true);
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

      if (!res.body) throw new Error("响应体为空");

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
      alert(`调用失败：${err instanceof Error ? err.message : "未知错误"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price) {
      alert("请填写商品名称和价格！");
      return;
    }
    setStage("battle");
    setMessages([]);
    setShowResultModal(false);

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

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    const userMessage = { role: 'user' as const, content: userText };
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    await callDebateAPI(updatedHistory);
  };

  const handleFinishDebate = () => setShowResultModal(true);

  const generateConclusion = async () => {
    setLoadingConclusion(true);
    setShowConclusion(true);
    try {
      const res = await fetch("/api/debate-conclusion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debateHistory: chatHistory,
          productName: form.name,
          price: form.price,
          excuse: form.excuse,
          desireLevel: form.impulse,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API 错误 ${res.status}: ${errText}`);
      }

      const data = await res.json();
      setConclusion(data.conclusion || "⚠️ 无法生成结论，请稍后再试。");
    } catch (err) {
      console.error("生成结论失败：", err);
      setConclusion(`⚠️ 生成失败：${err instanceof Error ? err.message : "未知错误"}`);
    } finally {
      setLoadingConclusion(false);
    }
  };

  const saveResult = (result: "已购买" | "未购买") => {
    addDebate({
      id: Date.now(),
      product: form.name,
      price: Number(form.price),
      result,
      saved: result === "未购买" ? Number(form.price) : 0,
      date: new Date().toISOString().slice(0, 10),
    });
    setShowResultModal(false);
    setStage("result");
  };

  const goHome = () => {
    setStage("form");
    setMessages([]);
    setInput("");
    setShowResultModal(false);
    setForm({ name: "", price: "", excuse: "", impulse: 5 });
  };

  /* ───── 渲染 ───── */
  return (
    <div className="flex flex-col min-h-screen w-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {stage === "form" ? (
        <main className="flex-1 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white/70 backdrop-blur-xl p-8 shadow-2xl shadow-rose-500/5 animate-slide-up dark:border-zinc-800 dark:bg-zinc-900/70">
            <h2 className="text-center text-2xl font-bold mb-1 text-zinc-900 dark:text-zinc-100">
              你又想买什么？
            </h2>
            <p className="text-center text-sm text-zinc-500 mb-8 dark:text-zinc-400">
              填写信息，让「魔鬼」和「天使」替你辩论一场
            </p>

            <label className="block mb-4">
              <span className="text-sm font-medium text-zinc-500 mb-1 block dark:text-zinc-400">商品名称</span>
              <input
                type="text"
                placeholder="例如：Sony WH-1000XM5 降噪耳机"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100 dark:placeholder:text-zinc-600"
              />
            </label>

            <label className="block mb-4">
              <span className="text-sm font-medium text-zinc-500 mb-1 block dark:text-zinc-400">商品价格（元）</span>
              <input
                type="number"
                placeholder="例如：1999"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100 dark:placeholder:text-zinc-600"
              />
            </label>

            <label className="block mb-5">
              <span className="text-sm font-medium text-zinc-500 mb-1 block dark:text-zinc-400">你的购买借口</span>
              <input
                type="text"
                placeholder="例如：打折促销、奖励自己、朋友都有"
                value={form.excuse}
                onChange={(e) => setForm({ ...form, excuse: e.target.value })}
                className="w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100 dark:placeholder:text-zinc-600"
              />
            </label>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">冲动指数</span>
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
                className="w-full accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
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
      ) : stage === "battle" ? (
        <div className="flex flex-col h-[calc(100vh-56px)]">
          {/* 左右辩论区域 - 占据除底部外的所有空间 */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* 左栏：魔鬼种草机 */}
            <div className="flex-1 flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-zinc-200 bg-gradient-to-b from-rose-100/40 via-white to-white dark:border-zinc-800 dark:bg-gradient-to-b dark:from-rose-950/30 dark:via-zinc-950 dark:to-zinc-950">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-rose-200/50 bg-rose-50/50 shrink-0 dark:border-rose-900/30 dark:bg-rose-950/20">
                <Flame className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                <h2 className="text-sm font-bold text-rose-500 tracking-wide dark:text-rose-400">魔鬼种草机</h2>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-500 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
                  诱惑模式
                </span>
              </div>
              <div ref={leftPanelRef} onScroll={() => handleScroll(leftPanelRef)} className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-200 text-xs mb-3 dark:bg-zinc-800/50 dark:border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{form.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
                    <span>💰 价格: <span className="text-rose-500 font-bold dark:text-rose-400">{form.price}元</span></span>
                    <span>🔥 冲动: <span className={`font-bold ${form.impulse <= 3 ? "text-green-500 dark:text-green-400" : form.impulse <= 6 ? "text-yellow-500 dark:text-yellow-400" : "text-rose-500 dark:text-rose-400"}`}>{form.impulse}/10</span></span>
                  </div>
                  {form.excuse && <div className="mt-2 text-zinc-500 italic dark:text-zinc-400">借口: {form.excuse}</div>}
                </div>

                {messages.map((m, i) => {
                  if (m.role === "angel") return null;
                  return (
                    <div
                      key={i}
                      className={`${
                        m.role === "user"
                          ? "ml-auto max-w-[85%] p-3 rounded-xl rounded-tr-none bg-zinc-200 border border-zinc-300 text-sm text-zinc-700 dark:bg-zinc-700/30 dark:border-zinc-600/30 dark:text-zinc-300"
                          : "animate-slide-up rounded-2xl rounded-tl-md border border-rose-200 bg-rose-50 p-4 text-sm leading-relaxed text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/5 dark:text-rose-100/90"
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
            <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-cyan-100/40 via-white to-white dark:bg-gradient-to-b dark:from-cyan-950/30 dark:via-zinc-950 dark:to-zinc-950">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-cyan-200/50 bg-cyan-50/50 shrink-0 dark:border-cyan-900/30 dark:bg-cyan-950/20">
                <Shield className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                <h2 className="text-sm font-bold text-cyan-500 tracking-wide dark:text-cyan-400">理性钱包守护者</h2>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-500 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20">
                  理性模式
                </span>
              </div>
              <div ref={rightPanelRef} onScroll={() => handleScroll(rightPanelRef)} className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-200 text-xs mb-3 dark:bg-zinc-800/50 dark:border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{form.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
                    <span>💰 价格: <span className="text-cyan-500 font-bold dark:text-cyan-400">{form.price}元</span></span>
                    <span>🔥 冲动: <span className={`font-bold ${form.impulse <= 3 ? "text-green-500 dark:text-green-400" : form.impulse <= 6 ? "text-yellow-500 dark:text-yellow-400" : "text-rose-500 dark:text-rose-400"}`}>{form.impulse}/10</span></span>
                  </div>
                  {form.excuse && <div className="mt-2 text-zinc-500 italic dark:text-zinc-400">借口: {form.excuse}</div>}
                </div>

                {messages.map((m, i) => {
                  if (m.role === "devil") return null;
                  return (
                    <div
                      key={i}
                      className={`${
                        m.role === "user"
                          ? "ml-auto max-w-[85%] p-3 rounded-xl rounded-tl-none bg-zinc-200 border border-zinc-300 text-sm text-zinc-700 dark:bg-zinc-700/30 dark:border-zinc-600/30 dark:text-zinc-300"
                          : "animate-slide-up rounded-2xl rounded-tr-md border border-cyan-200 bg-cyan-50 p-4 text-sm leading-relaxed text-cyan-800 dark:border-cyan-500/20 dark:bg-cyan-500/5 dark:text-cyan-100/90"
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

          {/* 底部输入区 - 响应式布局 */}
          <div className="shrink-0 border-t border-zinc-200 bg-white/95 backdrop-blur-md p-3 dark:border-zinc-800 dark:bg-zinc-900/95">
            {/* 桌面端：输入框、发送按钮、功能按钮都在一行 */}
            <div className="hidden md:flex items-center gap-2">
              <input
                type="text"
                placeholder="你还有什么想狡辩的吗？"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={loading}
                className="flex-1 rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="rounded-xl bg-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-300 transition disabled:opacity-40 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                onClick={handleFinishDebate}
                className="whitespace-nowrap rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition hover:scale-[1.03] active:scale-[0.97] flex items-center gap-1.5"
              >
                结束辩论
              </button>
              <button
                onClick={generateConclusion}
                disabled={loadingConclusion}
                className="whitespace-nowrap rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition hover:scale-[1.03] active:scale-[0.97] flex items-center gap-1.5 disabled:opacity-50"
              >
                {loadingConclusion ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />生成中...</>
                ) : (
                  <><Brain className="w-4 h-4" />生成最终结论</>
                )}
              </button>
              <button
                onClick={() => {
                  const hours = 72;
                  const deadlineDate = new Date(Date.now() + hours * 3600 * 1000);
                  const deadline = deadlineDate.toLocaleString("zh-CN", {
                    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
                  });
                  
                  // 保存到 localStorage
                  addContract({
                    id: Date.now(),
                    title: `72小时冷静期 - ${form.name}`,
                    items: [
                      `商品：${form.name}`,
                      `价格：¥${form.price}`,
                      `冲动指数：${form.impulse}/10`,
                      form.excuse ? `购买借口：${form.excuse}` : "",
                    ].filter(Boolean),
                    deadline: deadlineDate.toISOString(),
                    done: false,
                    createdAt: new Date().toISOString(),
                  });
                  
                  alert(`🎉 72小时冷静契约已签署！\n截止时间：${deadline}\n我们会在这期间替你盯着钱包的。`);
                }}
                className="whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition hover:scale-[1.03] active:scale-[0.97] flex items-center gap-1.5"
              >
                <FileSignature className="w-4 h-4" />
                签署冷静契约
              </button>
            </div>

            {/* 移动端：输入框和功能按钮分两行显示 */}
            <div className="md:hidden">
              {/* 第一行：输入框 + 发送按钮 */}
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="你还有什么想狡辩的吗？"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="rounded-xl bg-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-300 transition disabled:opacity-40 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              
              {/* 第二行：功能按钮横向滚动 */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={handleFinishDebate}
                  className="flex-shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition hover:scale-[1.03] active:scale-[0.97] flex items-center gap-1.5"
                >
                  结束辩论
                </button>
                <button
                  onClick={generateConclusion}
                  disabled={loadingConclusion}
                  className="flex-shrink-0 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-3 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition hover:scale-[1.03] active:scale-[0.97] flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loadingConclusion ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />生成中</>
                  ) : (
                    <><Brain className="w-4 h-4" />生成结论</>
                  )}
                </button>
                <button
                  onClick={() => {
                    const hours = 72;
                    const deadlineDate = new Date(Date.now() + hours * 3600 * 1000);
                    const deadline = deadlineDate.toLocaleString("zh-CN", {
                      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
                    });
                    
                    // 保存到 localStorage
                    addContract({
                      id: Date.now(),
                      title: `72小时冷静期 - ${form.name}`,
                      items: [
                        `商品：${form.name}`,
                        `价格：¥${form.price}`,
                        `冲动指数：${form.impulse}/10`,
                        form.excuse ? `购买借口：${form.excuse}` : "",
                      ].filter(Boolean),
                      deadline: deadlineDate.toISOString(),
                      done: false,
                      createdAt: new Date().toISOString(),
                    });
                    
                    alert(`🎉 72小时冷静契约已签署！\n截止时间：${deadline}\n我们会在这期间替你盯着钱包的。`);
                  }}
                  className="flex-shrink-0 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition hover:scale-[1.03] active:scale-[0.97] flex items-center gap-1.5"
                >
                  <FileSignature className="w-4 h-4" />
                  签署契约
                </button>
              </div>
            </div>
          </div>

          {/* 结果选择弹窗 - 响应式 */}
          {showResultModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-zinc-100 mb-1 text-center">辩论结束！</h3>
                <p className="text-sm text-zinc-500 text-center mb-6">
                  经过这场辩论，你最终决定——
                </p>
                <div className="font-medium text-zinc-300 text-sm mb-4 text-center break-words">
                  {form.name} <span className="text-rose-400">¥{form.price}</span>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => saveResult("未购买")}
                    className="w-full flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 hover:bg-emerald-500/20 transition"
                  >
                    <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div className="text-left">
                      <div className="font-bold text-sm text-emerald-400">成功克制，不买了！</div>
                      <div className="text-xs text-zinc-500 mt-0.5">节省 ¥{Number(form.price).toLocaleString()}，已记录到消费报告</div>
                    </div>
                  </button>
                  <button
                    onClick={() => saveResult("已购买")}
                    className="w-full flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 hover:bg-rose-500/20 transition"
                  >
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                    <div className="text-left">
                      <div className="font-bold text-sm text-rose-400">好吧，还是买了</div>
                      <div className="text-xs text-zinc-500 mt-0.5">已记录到消费报告，下次继续努力</div>
                    </div>
                  </button>
                </div>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="mt-4 w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition"
                >
                  暂不决定，继续辩论
                </button>
              </div>
            </div>
          )}

          {/* 最终结论弹窗 */}
          {showConclusion && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    AI 最终结论
                  </h3>
                  <button
                    onClick={() => setShowConclusion(false)}
                    className="text-zinc-400 hover:text-zinc-200 transition"
                  >
                    ✕
                  </button>
                </div>
                <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 text-sm leading-relaxed text-zinc-300">
                  {loadingConclusion ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                      <span className="ml-2 text-zinc-400">AI 正在分析辩论内容...</span>
                    </div>
                  ) : (
                    <Markdown>{conclusion}</Markdown>
                  )}
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setShowConclusion(false)}
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition"
                  >
                    关闭
                  </button>
                  <button
                    onClick={() => {
                      setShowConclusion(false);
                      handleFinishDebate();
                    }}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white transition"
                  >
                    去记录结果
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 结果页 */
        <div className="flex-1 flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-zinc-100 mb-2">已记录到消费报告！</h2>
            <p className="text-sm text-zinc-500 mb-6">
              你可以去「消费报告」页面查看完整记录
            </p>
            <div className="flex gap-3">
              <button
                onClick={goHome}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition"
              >
                再来一次
              </button>
              <button
                onClick={() => router.push("/stats")}
                className="flex-1 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-zinc-900 hover:bg-cyan-400 transition"
              >
                查看报告
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
