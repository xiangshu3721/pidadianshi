import type {
  AnalyzeResponse,
  CategoryId,
  EventItem,
  PeriodKind,
} from "./types";
import {
  CATEGORIES,
  blackHoleFromCounts,
  countByCategory,
  emptyCounts,
} from "./categories";

const KEYWORDS: { cat: CategoryId; words: string[] }[] = [
  {
    cat: "zhima",
    words: ["后悔", "当初", "以前", "过去", "想起", "当年", "早知道", "怀念"],
  },
  {
    cat: "xigua",
    words: [
      "他",
      "她",
      "同事",
      "领导",
      "朋友",
      "别人",
      "隔壁",
      "室友",
      "老板",
    ],
  },
  {
    cat: "guimao",
    words: [
      "万一",
      "如果",
      "害怕",
      "担心",
      "以后",
      "会不会",
      "要是",
      "未来",
      "焦虑",
    ],
  },
  {
    cat: "laihama",
    words: ["烦", "气", "吵", "讨厌", "冲突", "怼", "恶心", "骂", "恶心人"],
  },
];

function uid(): string {
  return `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function guessCategory(text: string): CategoryId {
  const t = text.toLowerCase();
  let best: CategoryId = "jimao";
  let score = 0;
  for (const { cat, words } of KEYWORDS) {
    let s = 0;
    for (const w of words) if (t.includes(w)) s += 1;
    if (s > score) {
      score = s;
      best = cat;
    }
  }
  return best;
}

function splitSentences(text: string): string[] {
  const parts = text
    .split(/[\n。！？!?；;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
  if (parts.length === 0 && text.trim()) return [text.trim()];
  if (parts.length > 4) {
    const merged: string[] = [];
    for (let i = 0; i < parts.length; i += 2) {
      merged.push(parts.slice(i, i + 2).join("。"));
    }
    return merged.slice(0, 4);
  }
  return parts.slice(0, 4);
}

/** Deeper insight: surface underlying need/belief, playfully */
const INSIGHTS: Record<CategoryId, string[]> = {
  jimao: [
    "底下其实是『我想把日子过得顺一点』——小事反复播，是大脑在要掌控感。叫出名就行，不用审判自己。",
    "你不是矫情：鸡毛蒜皮攒着，是在找『我有没有被好好对待』的证据。证据够了，就别再开庭。",
  ],
  zhima: [
    "芝麻绿豆翻炒八百遍，底层信念常是『当初选错就永久失格』。过去不能改剧本，只能换观影姿势——你还活着，资格还在。",
    "你在跟一个已退场的场景要公道。真正想要的，多半是『那时的我其实尽力了』这句话，先自己签收。",
  ],
  xigua: [
    "操心别人的瓜，底下常是『如果我够好，关系就不会乱』。关心可以，承包不行——别人的剧本，不是你的 KPI。",
    "你吃这瓜吃得认真，像在练『我能预判一切』。可遥控器不在你手里；把能量省给自己那一集。",
  ],
  guimao: [
    "龟毛兔角的角还没长出来，你已经开始拔——底下是『不确定=危险』的旧协议。先改成：不确定只是还没到场。",
    "担心是预演，不是事实。你真正想要的是『到时候的我能应付』——今天练应付感，比预演灾难片划算。",
  ],
  laihama: [
    "癞蛤蟆跳上来时，烦是边界警报，不是你必须立刻赢的考试。底层需求多半是『我想被尊重 / 想安全离开』——先保住气，再谈要不要开战。",
    "冲突感很重时，脑内常播『我要是软了就输了』。其实你可以把『今天不接电话』也算赢——赢的是你自己的气。",
  ],
};

const EMOTIONS = ["闷", "烦", "轻慌", "憋屈", "无语", "焦", "丧", "刺"];
const THOUGHTS = [
  "好像不处理就不行",
  "我是不是反应过度",
  "对方怎么这样",
  "万一搞砸了",
  "我早该怎样怎样",
];

function pick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++)
    h = (h + seed.charCodeAt(i) * (i + 1)) % 997;
  return arr[h % arr.length];
}

export function mockAnalyze(text: string): AnalyzeResponse {
  const chunks = splitSentences(text);
  const events: EventItem[] = chunks.map((chunk) => {
    const category = guessCategory(chunk);
    const label = chunk.length > 18 ? chunk.slice(0, 16) + "…" : chunk;
    return {
      id: uid(),
      text: label,
      category,
      emotion: pick(EMOTIONS, chunk),
      thought: pick(THOUGHTS, chunk + "t"),
      insight: pick(INSIGHTS[category], chunk + "i"),
      why: CATEGORIES[category].why,
    };
  });

  const hasConflict = events.some(
    (e) => e.category === "laihama" || e.category === "guimao"
  );
  const deepen =
    hasConflict && events.length === 1
      ? "这事里，你最想立刻扔掉的是哪一小块？"
      : null;

  return { events, deepen, mock: true };
}

const ENERGY = ["🔋漏电", "🪫半格", "😑平平", "🌤️回血中", "✨略爽"];
const TRENDS = ["小幅回血", "稳住了", "从别扭挪开一点", "气压下降", "破事降级"];
const ACTIONS = [
  "站起来喝半杯水，看窗外十秒",
  "把手机扣桌上，深呼吸三次",
  "把这件事的标题改短到五个字以内，写在便签上",
  "给自己放一首不带歌词的歌，听完再决定要不要继续想",
  "把「明天再说」写进备忘录，今天就到这",
];

function deeperSummary(
  events: EventItem[],
  blackHole: CategoryId,
  scope: string
): string {
  if (events.length === 0) {
    return `${scope}啥也没倒？也行——空桶说明你没被逼着开庭。空着也是一种松。`;
  }
  const cat = CATEGORIES[blackHole];
  const needHint: Record<CategoryId, string> = {
    jimao: "底层在要一点可控与顺畅",
    zhima: "底层在要一句『那时的我也算尽力』",
    xigua: "底层在练预判，其实是在找安全感",
    guimao: "底层在跟不确定谈判，想先拿到『我能应付』",
    laihama: "底层警报在响：想被尊重，或想安全离开",
  };
  return `${scope}倒了 ${events.length} 件。最大能量黑洞在 ${cat.emoji}${cat.name}——${needHint[blackHole]}。叫出名就不算白耗；剩下的，不必今晚结案。`;
}

export function mockReport(events: EventItem[]): AnalyzeResponse {
  const counts = events.length ? countByCategory(events) : emptyCounts();
  const blackHole = blackHoleFromCounts(counts);
  const seed = events.map((e) => e.text).join("|") || "empty";
  return {
    counts,
    blackHole,
    summary: deeperSummary(events, blackHole, "今天"),
    tuneAction: pick(ACTIONS, seed),
    energyFrom: pick(ENERGY, seed + "from"),
    energyTo: pick(ENERGY, seed + "to"),
    energyTrend: pick(TRENDS, seed + "tr"),
    mock: true,
  };
}

const PERIOD_LABEL: Record<PeriodKind, string> = {
  today: "今天",
  week: "本周",
  month: "本月",
};

const PERIOD_ACTIONS: Record<CategoryId, string[]> = {
  jimao: [
    "本周选一天，把三件鸡毛蒜皮写成五个字便签，贴完就撕",
    "给自己定个『小事下班点』：晚饭后不再复盘琐碎",
  ],
  zhima: [
    "写一句给过去的自己：『那时你已经尽力了』，看一眼就收起来",
    "本周只允许翻炒一次旧账，计时三分钟，到点停",
  ],
  xigua: [
    "别人的瓜出现时，默念『遥控器不在我这儿』再决定要不要点开",
    "本周少追一条别人的剧情，把那十分钟留给散步",
  ],
  guimao: [
    "把『万一』清单改成『到时候再说』清单，本周只留一项真要准备的",
    "担心冒头时，先问：这是事实还是预演？预演就先关灯",
  ],
  laihama: [
    "冲突前先问：我要的是赢，还是保住气？选后者也算赢",
    "本周给自己一次合法『不接』：短信回复『稍后再说』即可",
  ],
};

export function mockPeriodReport(
  counts: Record<CategoryId, number>,
  period: PeriodKind,
  eventCount: number,
  dayCount: number
): AnalyzeResponse {
  const blackHole = blackHoleFromCounts(counts);
  const cat = CATEGORIES[blackHole];
  const label = PERIOD_LABEL[period];
  const seed = `${period}|${eventCount}|${JSON.stringify(counts)}`;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  let summary: string;
  if (total === 0) {
    summary = `${label}桶还空着。空不是失败——说明这段日子你没被逼着天天开庭。想倒的时候再来。`;
  } else {
    const topBits = (Object.keys(counts) as CategoryId[])
      .filter((k) => counts[k] > 0)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 2)
      .map((k) => `${CATEGORIES[k].emoji}${CATEGORIES[k].name}×${counts[k]}`)
      .join("、");
    summary = `${label}共 ${dayCount || 1} 天有记录、${eventCount || total} 件破事。主旋律偏 ${cat.emoji}${cat.name}（${topBits}）。底层多半不是「你太矫情」，而是某块需求没被点名——点名了，黑洞就没那么能吸人。`;
  }

  return {
    counts,
    blackHole,
    summary,
    tuneAction: pick(PERIOD_ACTIONS[blackHole], seed),
    energyFrom: pick(ENERGY, seed + "from"),
    energyTo: pick(ENERGY, seed + "to"),
    energyTrend: pick(TRENDS, seed + "tr"),
    mock: true,
  };
}
