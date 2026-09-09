import { NextRequest, NextResponse } from "next/server";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  CategoryId,
  EventItem,
} from "@/lib/types";
import { mockAnalyze, mockReport } from "@/lib/mock-ai";
import { CATEGORY_ORDER } from "@/lib/categories";

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

const SYSTEM_ANALYZE = `你是「屁大点事」里一个嘴硬心软的损友 AI。语气轻松吐槽，不要鸡汤、不要心理咨询腔、不要课程感。
用户倒出一段破事，你要拆成 1–4 个事件。每个事件必须归入且只能归入以下五类之一（用英文 id）：
- jimao 🪶鸡毛蒜皮（日常小事）
- zhima 🫘芝麻绿豆（过去/后悔）
- xigua 🍉西瓜（别人的事）
- guimao 🐢龟毛兔角（未来担心/万一）
- laihama 🐸癞蛤蟆（烦人/冲突）

只输出 JSON，不要 markdown。格式：
{
  "events": [{"text":"短标签≤20字","category":"jimao|zhima|xigua|guimao|laihama","emotion":"二字情绪","thought":"脑内一句","insight":"一句损友洞察"}],
  "deepen": "可选，最多一句追问；不值得就 null。绝不连环提问。"
}`;

const SYSTEM_REPORT = `你是「屁大点事」损友 AI。根据今日事件生成收工报告。语气轻松游戏感，禁止医学/治疗/霍金斯能量科学表述。
五类 id：jimao / zhima / xigua / guimao / laihama。
只输出 JSON：
{
  "counts": {"jimao":0,"zhima":0,"xigua":0,"guimao":0,"laihama":0},
  "blackHole": "能量消耗最多的 category id",
  "summary": "AI说，2–3句",
  "tuneAction": "一个今天就能做的微动作（一句）",
  "energyFrom": "游戏感状态词",
  "energyTo": "游戏感状态词",
  "energyTrend": "短趋势标签如「小幅回血」",
  "oneLiner": "今日一句话"
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
    return {
      id: uid(),
      text: String(o.text || "未命名破事").slice(0, 40),
      category: normalizeCategory(o.category),
      emotion: String(o.emotion || "闷").slice(0, 8),
      thought: String(o.thought || "好像有点事").slice(0, 40),
      insight: String(o.insight || "先叫出名字，再决定要不要继续想。").slice(
        0,
        80
      ),
    };
  });
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
        })),
      });
      const raw = await callLLM(provider, SYSTEM_REPORT, user);
      const parsed = parseJson(raw) as AnalyzeResponse;
      const counts = parsed.counts || {
        jimao: 0,
        zhima: 0,
        xigua: 0,
        guimao: 0,
        laihama: 0,
      };
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
        oneLiner: String(parsed.oneLiner || "鉴定完毕：大多是屁大点事。"),
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
    if (body.mode === "report") {
      return NextResponse.json(mockReport(body.existingEvents || []));
    }
    return NextResponse.json(mockAnalyze(body.text || ""));
  }
}
