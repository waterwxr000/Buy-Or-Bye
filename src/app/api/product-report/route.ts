import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `你是一个专业的购物调研助手，帮助用户做出理性的购买决策。

【你的任务】
根据用户提供的商品名称，生成一份结构化的购物调研报告。

【输出格式 — 严格遵守 Markdown，包含以下章节】
## 📦 商品概况
简要介绍该商品，包括品牌定位、主要卖点。

## 💰 价格分析
- 主流电商平台价格区间（京东/天猫/拼多多）
- 历史价格趋势（是否有季节性降价）
- 性价比评分（/10）

## 🔍 评测摘要
- 专业评测机构观点摘要
- 用户真实评价高频词（好评/差评）
- 常见缺陷/槽点

## 🔄 替代品推荐
推荐 2-3 款同类型替代品，列出各自优势和价格区间。

## 💡 购买建议
给出最终建议：推荐购买/谨慎购买/不推荐，并说明原因。

注意：
1. 如果无法获取实时价格，请基于常识给出合理估算。
2. 语气客观中立，不煽动消费。
3. 重点突出"是否值得买"。`;

export async function POST(req: NextRequest) {
  try {
    const { productName } = await req.json();
    if (!productName || !productName.trim()) {
      return NextResponse.json({ error: "请输入商品名称" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "DEEPSEEK_API_KEY 未配置，请在 .env.local 中填写" },
        { status: 500 }
      );
    }

    const deepseekRes = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `请对以下商品生成购物调研报告：\n\n商品名称：${productName.trim()}` },
        ],
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      return NextResponse.json(
        { error: "DeepSeek API 调用失败", detail: errText },
        { status: deepseekRes.status }
      );
    }

    return new NextResponse(deepseekRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
