import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `你是一个能够同时扮演两个对立角色的辩论助手。

【角色A：魔鬼种草机】
- 人设：消费主义推手，亢奋、煽动、极具诱惑力。
- 话术风格：用"提升生活品质"、"你值得更好的"、"人生苦短"等话术洗脑，疯狂支持用户的购买借口。
- 必须极力劝说用户买买买，把商品描述得非买不可。

【角色B：钱包守护者（理性钱包守护者）】
- 人设：毒舌理财专家，冷酷、理性、毫不留情。
- 话术风格：把价格换算成"打工N小时"、"等于N杯奶茶"、"够交一个月水电费"；戳破"精致生活"的焦虑营销；指出商品买回来吃灰的高概率。
- 必须极力劝阻用户，用数据和冷笑话泼冷水。

【输出格式 — 严格遵守】
你必须严格按照以下格式输出，每个角色一段话，中间用分隔符隔开：

【魔鬼种草机】：（这里写魔鬼的诱惑话术，极尽煽情，支持用户的借口）

【钱包守护者】：（这里写钱包守护者的无情吐槽，疯狂泼冷水，算经济账，指出吃灰概率）

【结束】

注意：
1. 两个角色的内容都要精彩、有梗、有说服力。
2. 如果是第一轮辩论，根据商品信息开场；如果是后续回合，针对用户的最新发言继续互相拆台。
3. 不要输出格式以外的任何内容。`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("收到请求体：", JSON.stringify(body, null, 2));

    const { history = [], productName, price, excuse, desireLevel } = body;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (history.length > 0) {
      history.forEach((h: { role: string; content: string }) => {
        messages.push({ role: h.role as "user" | "assistant", content: h.content });
      });
    } else {
      const firstUserPrompt = `请开始第一轮辩论！\n\n商品名称：${productName}\n商品价格：${price}元\n用户的购买借口：${excuse}\n用户的冲动指数（1-10）：${desireLevel}\n\n请分别扮演【魔鬼种草机】和【钱包守护者】，按照指定格式输出你们的辩论开场白。`;
      messages.push({ role: "user", content: firstUserPrompt });
    }

    console.log("发送给 DeepSeek 的消息：", JSON.stringify(messages, null, 2));

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error("DEEPSEEK_API_KEY 未配置");
      return NextResponse.json(
        { error: "DEEPSEEK_API_KEY 未配置，请在 .env.local 中填写" },
        { status: 500 }
      );
    }

    console.log("正在调用 DeepSeek API...");
    const deepseekRes = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        stream: true,
        temperature: 0.9,
      }),
    });

    console.log("DeepSeek API 响应状态：", deepseekRes.status, deepseekRes.statusText);

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      console.error("DeepSeek API 错误：", errText);
      return NextResponse.json(
        { error: "DeepSeek API 调用失败", detail: errText },
        { status: deepseekRes.status }
      );
    }

    console.log("DeepSeek API 调用成功，正在转发流...");
    return new NextResponse(deepseekRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知错误";
    console.error("API 路由错误：", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
