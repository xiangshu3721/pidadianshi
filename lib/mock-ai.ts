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

const WORRY = [
  "担心",
  "纠结",
  "不确定",
  "会不会",
  "万一",
  "如果",
  "要是",
  "以后",
  "未来",
  "焦虑",
  "害怕",
  "怕",
  "值不值",
  "符合预期",
  "学不到",
  "踩坑",
];
const PAST = ["后悔", "当初", "以前", "过去", "想起", "当年", "早知道", "怀念", "去年"];
const ANNOY = ["烦", "气死", "吵", "讨厌", "冲突", "怼", "恶心", "骂", "翻脸"];
/** 真正「别人的瓜」：盯着别人过得怎样，不是「我想学别人怎么做」 */
const OTHERS_DRAMA = [
  "朋友圈",
  "别人又",
  "别人升职",
  "别人融资",
  "别人结婚",
  "别人发财",
  "他们家",
  "八卦",
  "听说他",
  "听说她",
  "对比别人",
  "羡慕别人",
  "嫉妒",
];
const SELF_DOING = [
  "我报名",
  "我报了",
  "我去",
  "我想",
  "我准备",
  "我决定",
  "我自己",
  "刚来",
  "我的",
  "报名",
  "报了一个",
];

function scoreWords(t: string, words: string[]): number {
  let s = 0;
  for (const w of words) if (t.includes(w)) s += 1;
  return s;
}

function guessCategory(text: string): CategoryId {
  const t = text.toLowerCase();
  const self = scoreWords(t, SELF_DOING);
  const worry = scoreWords(t, WORRY);
  const past = scoreWords(t, PAST);
  const annoy = scoreWords(t, ANNOY);
  const drama = scoreWords(t, OTHERS_DRAMA);

  // 自己要办/已办的事 + 担心值不值 → 龟毛兔角（不是西瓜）
  if (worry >= 1 && (self >= 1 || t.includes("我"))) {
    return "guimao";
  }
  if (worry >= 2) return "guimao";
  if (annoy >= 1) return "laihama";
  if (past >= 1) return "zhima";
  // 只有明确「盯别人过得好」才算西瓜；「看看别人怎么用」算自己学习动机
  if (drama >= 1 && self === 0) return "xigua";
  if (t.includes("别人") && self === 0 && worry === 0 && !t.includes("学")) {
    return "xigua";
  }
  return "jimao";
}

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
    "其实就是日子里的小磕绊。你不是矫情，是想顺一点——说出来就算放下半截了。",
    "小事扎一下很正常。别把它开成大会，过一会儿往往就不算事了。",
  ],
  zhima: [
    "过去的事改不了，你现在反复想，多半是还想对自己说一句：那时候我也尽力了。",
    "旧账翻来覆去，累的是今天的你。承认『当时不容易』，比再审判一次自己管用。",
  ],
  xigua: [
    "你在盯别人的剧本，心却空了自己的。别人过得怎样，替不了你今天要过的日子。",
    "这瓜再甜也是别人桌上的。你真正缺的，多半是自己那一口踏实，不是旁观席。",
  ],
  guimao: [
    "事儿还没发生，脑子已经先把最差结果演完了。你真正怕的，是『到时候我应付不来』——这能练，但不用今晚把电影看完。",
    "纠结值不值、会不会踩坑，说明你在乎。把『担心』和『现在要做的一步』分开：现在能做的很小，担心可以晚点再约。",
  ],
  laihama: [
    "烦、想躲，常常是边界在报警。先把自己气顺住，比立刻赢一场更重要。",
    "冲突感上来时，你未必要马上开战。先问：我要的是赢，还是少受点伤？",
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
      ? "你现在最堵的，到底是哪一句？"
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
    return `${scope}还没记事儿。空着也挺好，想倒的时候再说。`;
  }
  const cat = CATEGORIES[blackHole];
  const needHint: Record<CategoryId, string> = {
    jimao: "你其实只是想日子顺一点",
    zhima: "你可能还想对自己说『当时我也尽力了』",
    xigua: "你把心放在别人身上了，自己这边反而空着",
    guimao: "你怕的是还没发生的结果，不是眼前这一步",
    laihama: "你可能更需要被尊重，或先安全离开",
  };
  return `${scope}一共记了 ${events.length} 件。最耗神的是 ${cat.emoji}${cat.name}——${needHint[blackHole]}。先认清它，别的可以明天再说。`;
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
