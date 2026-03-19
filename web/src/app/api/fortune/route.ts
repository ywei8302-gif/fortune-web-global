import { NextResponse } from "next/server";

type ReqBody = {
  name?: string;
  birthDate?: string;
  message?: string;
  direction?: string;
  clickLocal?: string;
  gua?: {
    hexagram?: string;
    changed?: { hexagram?: string };
    movingLines?: number[];
  };
};

function safeStr(x: unknown) {
  if (typeof x === "object") {
    try {
      return JSON.stringify(x);
    } catch {
      return "";
    }
  }
  return String(x ?? "");
}

async function callOpenAI(prompt: string, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
  }
  const data = (await response.json()) as { output_text?: string };
  return data.output_text || "";
}

function localFallback(body: ReqBody) {
  const name = safeStr(body.name || "缘主");
  const question = safeStr(body.message || "未提供");
  const direction = safeStr(body.direction || "南方");
  const hexagram = safeStr(body.gua?.hexagram || "未知");
  return `1、论性格：
你所问之事在“${question}”，心神已定，行动宜稳。

2、论本卦：
本卦为【${hexagram}】。此卦主先难后易，切忌躁进。

3、论动爻：
动爻有变，变中有机。先守后攻，方见转机。

4、论决断：
综上，${name}当前最宜“聚焦一事，连续三日推进”。

【今明后应事落点】
今日：先做一件确定可落地的小事。
明日：沟通关键人，争取明确反馈。
后日：复盘取舍，砍掉低价值动作。

（方位提示：${direction}）`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReqBody;
    if (!body.message) {
      return NextResponse.json({ ok: false, error: "question 不能为空" }, { status: 400 });
    }
    if (!body.gua?.hexagram) {
      return NextResponse.json({ ok: false, error: "缺少卦象数据" }, { status: 400 });
    }

    const prompt = `
你是一位玄学推演文案助手。
请输出中文报告，结构尽量接近以下章节：
1、论性格
2、论本卦
3、论动爻
4、论变卦
5、论梅花
6、论六爻
7、金口诀
8、论决断
最后输出【今明后应事落点】（今日/明日/后日）。

用户所问: ${safeStr(body.message)}
用户姓名: ${safeStr(body.name || "缘主")}
完整生辰: ${safeStr(body.birthDate || "")}
心中方位: ${safeStr(body.direction || "南方")}
起卦时间: ${safeStr(body.clickLocal || "")}
本卦: ${safeStr(body.gua?.hexagram || "")}
变卦: ${safeStr(body.gua?.changed?.hexagram || "")}
动爻位置: ${Array.isArray(body.gua?.movingLines) && body.gua?.movingLines?.length ? body.gua?.movingLines?.join("、") : "无"}
`.trim();

    let reportText = "";
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        reportText = await callOpenAI(prompt, apiKey);
      } catch {
        reportText = localFallback(body);
      }
    } else {
      reportText = localFallback(body);
    }

    return NextResponse.json({
      ok: true,
      reportText,
      text: reportText,
      content: reportText,
      ai: {
        guaXiangXiangPi: reportText,
        daysText: { today: "", tomorrow: "", after: "" },
        disclaimer: "命自我立，福自己求。本推演仅供参考。",
      },
      gua: body.gua || {},
      meta: {
        version: "WEB-Replica-1.0",
        model: apiKey ? "openai:gpt-4.1-mini" : "local-fallback",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: String((err as Error)?.message || err || "unknown"),
        reportText: `宗师正在凝神推演，请稍后重试。(${String((err as Error)?.message || err || "unknown")})`,
      },
      { status: 500 },
    );
  }
}
