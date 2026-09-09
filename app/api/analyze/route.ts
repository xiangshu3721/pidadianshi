import { NextRequest, NextResponse } from "next/server";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  CategoryId,
  EventItem,
  PeriodKind,
} from "@/lib/types";
import { mockAnalyze, mockPeriodReport, mockReport } from "@/lib/mock-ai";
import { CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";

export const runtime = "nodejs";

function uid(): string {
  return `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function getProvider(): {
  key: string;
  base: string;
  model: string;
  name: string;
} | null {
  const deepseek = process.env.DEEPSEEK_API_KEY?.trim();
  if (deepseek) {
    return {
      key: deepseek,
      base: (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(
        /\/$/,
        ""
      ),
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      name: "deepseek",
    };
  }
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) {
    return {
      key: openai,
      base: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
        /\/$/,
        ""
      ),
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      name: "openai",
    };
  }
  return null;
}

const SYSTEM_ANALYZE = `你是「屁大点事」里说话直白的损友。必须口语化、通俗易懂，像当面聊天，禁止文言、隐喻堆砌、心理咨询腔、鸡汤。

把用户的话拆成 1–4 个事件，每件只能归一类（英文 id）：
- jimao 🪶鸡毛蒜皮：已经发生的日常小插曲
- zhima 🫘芝麻绿豆：翻旧账、后悔、纠结过去
- xigua 🍉西瓜：主要在盯「别人过得好不好 / 八卦评价」，不是你自己要办的事
- guimao 🐢龟毛兔角：还没发生的担心——值不值、会不会踩坑、符不符合预期
- laihama 🐸癞蛤蟆：冲突、被惹毛、想躲开的烦

硬规则：
1) 用户说「我报名/我去/我纠结/我担心会不会……」——这是用户自己的事。若核心是担心结果→guimao；若只是小插曲→jimao。绝不要判成 xigua。
2) 「我想看看别人怎么做、学点视角」是学习动机，不算西瓜。
3) 只有主要在羡慕/比较/八卦别人生活时，才用 xigua。

每个事件字段：
- why：大白话一句，说清「为什么是这一类」（例：你在担心还没去的活动值不值，事还没发生。）
- insight：大白话 1–2 句，点出真正卡点，让人一听就懂。禁止「切开西瓜」「吃得再认真也不会变营养」这类抽象比喻当主句。

只输出 JSON：
{
  "events": [{"text":"短标签≤20字","category":"jimao|zhima|xigua|guimao|laihama","emotion":"口语情绪","thought":"脑内一句人话","why":"归类理由大白话","insight":"洞见大白话"}],
  "deepen": "可选一句追问；不需要就 null"
}`;

const SYSTEM_REPORT = `你是「屁大点事」损友 AI。根据今日事件生成收工报告。语气轻松游戏感，禁止医学/治疗/霍金斯能量科学表述。
五类 id：jimao / zhima / xigua / guimao / laihama。
summary 字段标题语义是「AI洞见」：要写更深——点出这段破事底下的需要/信念，玩味一点，禁止浅层「你今天很焦虑」。
不要生成 oneLiner（已取消该模块）。
只输出 JSON：
{
  "counts": {"jimao":0,"zhima":0,"xigua":0,"guimao":0,"laihama":0},
  "blackHole": "能量消耗最多的 category id",
  "summary": "AI洞见，2–4句，点出底层需要/信念",
  "tuneAction": "一个今天就能做的微动作（一句）",
  "energyFrom": "游戏感状态词",
  "energyTo": "游戏感状态词",
  "energyTrend": "短趋势标签如「小幅回血」"
}`;

const SYSTEM_PERIOD = `你是「屁大点事」损友 AI。根据一段时期（今日/本周/本月）的分类计数，写时期洞见。语气轻松，禁止鸡汤与治疗腔。
summary =「AI洞见」：综合计数点出主旋律类别，以及底下反复出现的需要/信念；玩味、清晰。
不要 oneLiner。
只输出 JSON：
{
  "blackHole": "jimao|zhima|xigua|guimao|laihama",
  "summary": "时期AI洞见 2–4句",
  "tuneAction": "适合该时期跨度的一个微动作",
  "energyFrom": "游戏感状态词",
  "energyTo": "游戏感状态词",
  "energyTrend": "短趋势标签"
}`;

async function callLLM(
  provider: { key: string; base: string; model: string },
  system: string,
  user: string
): Promise<string> {
  const url = `${provider.base}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`LLM ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty LLM content");
  return content;
}

function parseJson(raw: string): unknown {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

function normalizeCategory(c: unknown): CategoryId {
  const s = String(c || "").toLowerCase();
  if ((CATEGORY_ORDER as string[]).includes(s)) return s as CategoryId;
  const map: Record<string, CategoryId> = {
    鸡毛蒜皮: "jimao",
    芝麻绿豆: "zhima",
    西瓜: "xigua",
    龟毛兔角: "guimao",
    癞蛤蟆: "laihama",
  };
  return map[String(c)] || "jimao";
}

function normalizeEvents(raw: unknown): EventItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 4).map((item) => {
    const o = item as Record<string, unknown>;
    const category = normalizeCategory(o.category);
    return {
      id: uid(),
      text: String(o.text || "未命名破事").slice(0, 40),
      category,
      emotion: String(o.emotion || "闷").slice(0, 8),
      thought: String(o.thought || "好像有点事").slice(0, 40),
      why: String(o.why || CATEGORIES[category].why).slice(0, 80),
      insight: String(
        o.insight ||
          "底下多半有个没被点名的需要——先叫出名字，再决定要不要继续想。"
      ).slice(0, 160),
    };
  });
}

function emptyCounts(): Record<CategoryId, number> {
  return { jimao: 0, zhima: 0, xigua: 0, guimao: 0, laihama: 0 };
}

export async function POST(req: NextRequest) {
  let body: AnalyzeRequest;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const provider = getProvider();

  try {
    if (body.mode === "period") {
      const period = (body.period || "week") as PeriodKind;
      const counts = body.counts || emptyCounts();
      for (const k of CATEGORY_ORDER) counts[k] = Number(counts[k] || 0);
      const eventCount = Number(body.eventCount || 0);
      const dayCount = Number(body.dayCount || 0);
      if (!provider) {
        return NextResponse.json(
          mockPeriodReport(counts, period, eventCount, dayCount)
        );
      }
      const user = JSON.stringify({
        period,
        date: body.date,
        counts,
        eventCount,
        dayCount,
      });
      const raw = await callLLM(provider, SYSTEM_PERIOD, user);
      const parsed = parseJson(raw) as AnalyzeResponse;
      const res: AnalyzeResponse = {
        counts,
        blackHole: normalizeCategory(parsed.blackHole),
        summary: String(parsed.summary || "这段日子就这些。"),
        tuneAction: String(parsed.tuneAction || "喝口水，歇十秒。"),
        energyFrom: String(parsed.energyFrom || "😑平平"),
        energyTo: String(parsed.energyTo || "🌤️回血中"),
        energyTrend: String(parsed.energyTrend || "稳住了"),
        mock: false,
      };
      return NextResponse.json(res);
    }

    if (body.mode === "report") {
      const events = body.existingEvents || [];
      if (!provider) {
        return NextResponse.json(mockReport(events));
      }
      const user = JSON.stringify({
        date: body.date,
        events: events.map((e) => ({
          text: e.text,
          category: e.category,
          emotion: e.emotion,
          why: e.why,
        })),
      });
      const raw = await callLLM(provider, SYSTEM_REPORT, user);
      const parsed = parseJson(raw) as AnalyzeResponse;
      const counts = parsed.counts || emptyCounts();
      for (const k of CATEGORY_ORDER) {
        counts[k] = Number(counts[k] || 0);
      }
      const res: AnalyzeResponse = {
        counts,
        blackHole: normalizeCategory(parsed.blackHole),
        summary: String(parsed.summary || "今天就这些。"),
        tuneAction: String(parsed.tuneAction || "喝口水，歇十秒。"),
        energyFrom: String(parsed.energyFrom || "😑平平"),
        energyTo: String(parsed.energyTo || "🌤️回血中"),
        energyTrend: String(parsed.energyTrend || "稳住了"),
        mock: false,
      };
      return NextResponse.json(res);
    }

    // analyze
    const text = (body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }
    if (!provider) {
      return NextResponse.json(mockAnalyze(text));
    }
    const raw = await callLLM(
      provider,
      SYSTEM_ANALYZE,
      `日期 ${body.date}\n用户说：\n${text}`
    );
    const parsed = parseJson(raw) as {
      events?: unknown;
      deepen?: string | null;
    };
    const events = normalizeEvents(parsed.events);
    const deepen =
      typeof parsed.deepen === "string" && parsed.deepen.trim()
        ? parsed.deepen.trim().slice(0, 60)
        : null;
    return NextResponse.json({
      events: events.length ? events : mockAnalyze(text).events,
      deepen,
      mock: false,
    } satisfies AnalyzeResponse);
  } catch (err) {
    console.error("[analyze] fallback to mock", err);
    if (body.mode === "period") {
      const period = (body.period || "week") as PeriodKind;
      const counts = body.counts || emptyCounts();
      return NextResponse.json(
        mockPeriodReport(
          counts,
          period,
          Number(body.eventCount || 0),
          Number(body.dayCount || 0)
        )
      );
    }
    if (body.mode === "report") {
      return NextResponse.json(mockReport(body.existingEvents || []));
    }
    return NextResponse.json(mockAnalyze(body.text || ""));
  }
}
