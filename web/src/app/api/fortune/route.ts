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

function getGanZhiThreeDays(dateStr: string) {
  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return { day1: "未知", day2: "未知", day3: "未知" };
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const base = Date.UTC(2000, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((current - base) / oneDay);
  const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const getGz = (offset: number) => {
    const totalDays = diffDays + offset;
    let sIdx = (4 + totalDays) % 10;
    let bIdx = (6 + totalDays) % 12;
    if (sIdx < 0) sIdx += 10;
    if (bIdx < 0) bIdx += 12;
    return `${stems[sIdx]}${branches[bIdx]}日`;
  };
  return { day1: getGz(0), day2: getGz(1), day3: getGz(2) };
}

function getZodiac(birthDateOrYear: string) {
  const match = safeStr(birthDateOrYear).match(/(19|20)\d{2}/);
  const year = match ? Number.parseInt(match[0], 10) : Number.NaN;
  if (Number.isNaN(year)) return "未知";
  const animals = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
  const idx = (year - 4) % 12;
  return animals[idx >= 0 ? idx : idx + 12];
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

async function callDashScope(prompt: string, apiKey: string, model: string) {
  const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: { prompt },
      parameters: {
        temperature: 0.3,
        top_p: 0.8,
        max_tokens: 3500,
      },
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DashScope HTTP ${response.status}: ${text.slice(0, 240)}`);
  }
  const data = (await response.json()) as { output?: { text?: string } };
  return data.output?.text || "";
}

const SYSTEM_PROMPT_FULL = `
你是一位融会贯通了《周易本义》《说卦传》《梅花易数》《金口诀》《六爻神断》《卜筮正宗》《增删卜易》《滴天髓》《渊海子平》《三命通会》的玄学算命推理大宗师。

请根据用户提供的准确排盘信息，严格按照以下要求进行断课。

【核心规则】
1. 文风要求：七成古文，三成白话，语气要威严、专业、老练。
2. 数据忠实：今日是【DAY1】，明日是【DAY2】，后日是【DAY3】。用户属【ZODIAC】。严禁更改这些数据。
3. 格式严格：必须完全遵守下方输出结构，禁止出现“正文：”。

【输出结构】
1、论性格
2、论本卦
3、论动爻
4、论变卦
5、论梅花
6、论六爻
7、金口诀
8、论决断

【今明后应事落点】
今日：宜忌 + 动向
明日：宜忌 + 动向
后日：宜忌 + 动向
`.trim();

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

    const birthStr = safeStr(body.birthDate || "");
    const birthYear = birthStr.match(/(19|20)\d{2}/)?.[0] || "";
    const zodiac = getZodiac(birthStr);
    const threeDays = getGanZhiThreeDays(safeStr(body.clickLocal || ""));

    const prompt = `
${SYSTEM_PROMPT_FULL}

用户所问: ${safeStr(body.message)}
用户姓名: ${safeStr(body.name || "缘主")}
用户年份: ${birthYear} (属${zodiac})
完整生辰: ${birthStr}
心中方位: ${safeStr(body.direction || "南方")}
起卦时间: ${safeStr(body.clickLocal || "")}
本卦: ${safeStr(body.gua?.hexagram || "")}
变卦: ${safeStr(body.gua?.changed?.hexagram || "")}
动爻位置: ${Array.isArray(body.gua?.movingLines) && body.gua?.movingLines?.length ? body.gua?.movingLines?.join("、") : "无"}

【物理排盘结果（必须严格执行）】
DAY1: ${threeDays.day1}
DAY2: ${threeDays.day2}
DAY3: ${threeDays.day3}
ZODIAC: ${zodiac}
HEXAGRAM: ${safeStr(body.gua?.hexagram || "")}
CHANGED_HEX: ${safeStr(body.gua?.changed?.hexagram || "")}
MOVING_LINES: ${Array.isArray(body.gua?.movingLines) && body.gua?.movingLines?.length ? body.gua?.movingLines?.join("、") : "无"}
DIRECTION: ${safeStr(body.direction || "南方")}
USER_YEAR: ${birthYear}
`.trim();

    let reportText = "";
    let modelUsed = "local-fallback";

    const dashscopeKey = process.env.DASHSCOPE_API_KEY || process.env.ALIYUN_API_KEY;
    const dashscopeModel = process.env.DASHSCOPE_MODEL || "qwen-turbo";
    if (dashscopeKey) {
      try {
        reportText = await callDashScope(prompt, dashscopeKey, dashscopeModel);
        modelUsed = `dashscope:${dashscopeModel}`;
      } catch {
        reportText = "";
      }
    }

    if (!reportText) {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        try {
          reportText = await callOpenAI(prompt, openaiKey);
          modelUsed = "openai:gpt-4.1-mini";
        } catch {
          reportText = "";
        }
      }
    }

    if (!reportText) {
      reportText = localFallback(body);
      modelUsed = "local-fallback";
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
        model: modelUsed,
        zodiac,
        ganzhi: threeDays,
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
