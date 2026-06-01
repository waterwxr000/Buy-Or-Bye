import { NextRequest, NextResponse } from "next/server";

const CONCLUSION_SYSTEM_PROMPT = `你是一个理性的消费决策助手。
请根据以下正反双方的辩论内容，给出一个中立、客观的最终结论，帮助用户做出是否购买的决定。

【输出格式】
请用简洁明了的markdown格式，按照以下结构输出：

**📊 核心观点总结**
- 魔鬼种草机的主要论点：（总结魔鬼的核心观点，1-2句话）
- 钱包守护者的主要论点：（总结守护者的核心观点，1-2句话）

**🎯 最终建议**
（基于以上辩论，给出中立的建议，包括是否购买、购买时机、替代方案等，2-3句话）

**💡 决策参考**
- 如果购买：建议（比如等待打折、对比评测等）
- 如果不购买：建议（比如替代方案、延迟满足等）

注意：
1. 结论要中立客观，不要偏向任何一方
2. 要结合用户的冲动指数、商品价格、购买借口等因素
3. 语言要简洁有力，字数控制在400字以内
4. 使用emoji让结论更生动`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { debateHistory, productName, price, excuse, desireLevel } = body;

    if (!debateHistory || debateHistory.length === 0) {
      return NextResponse.json(
        { error: "辩论历史不能为空" },
        { status: 400 }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "DEEPSEEK_API_KEY 未配置，请在 .env.local 中填写" },
        { status: 500 }
      );
    }

    const userPrompt = `请根据以下辩论内容生成最终结论：

**商品信息**：
- 商品名称：${productName}
- 商品价格：${price} 元
- 用户的购买借口：${excuse || "无"}
- 用户的冲动指数（1-10）：${desireLevel}

**辩论历史**：
${debateHistory.map((h: any, i: number) => `${i + 1}. ${h.role === 'user' ? '🧑 用户' : '🤖 AI'}：\n${h.content}`).join('\n\n')}

请生成最终结论。`;

    const messages = [
      { role: "system", content: CONCLUSION_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ];

    const deepseekRes = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      console.error("DeepSeek API 错误：", errText);
      return NextResponse.json(
        { error: "DeepSeek API 调用失败", detail: errText },
        { status: deepseekRes.status }
      );
    }

    const data = await deepseekRes.json();
    const conclusion = data.choices?.[0]?.message?.content || "⚠️ 无法生成结论，请稍后再试。";

    return NextResponse.json({ conclusion });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    console.error("生成结论 API 错误：", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
