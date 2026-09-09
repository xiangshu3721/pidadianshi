import type { AnalyzeResponse, CategoryId, EventItem } from "./types";
import { countByCategory, emptyCounts } from "./categories";

const KEYWORDS: { cat: CategoryId; words: string[] }[] = [
  {
    cat: "zhima",
    words: ["后悔", "当初", "以前", "过去", "想起", "当年", "早知道", "怀念"],
  },
  {
    cat: "xigua",
    words: ["他", "她", "同事", "领导", "朋友", "别人", "隔壁", "同事", "室友", "老板"],
  },
  {
    cat: "guimao",
    words: ["万一", "如果", "害怕", "担心", "以后", "会不会", "要是", "未来", "焦虑"],
  },
  {
    cat: "laihama",
    words: ["烦", "气", "吵", "讨厌", "冲突", "怼", "恶心", "吵", "骂", "恶心人"],
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
  // merge tiny fragments if too many
  if (parts.length > 4) {
    const merged: string[] = [];
    for (let i = 0; i < parts.length; i += 2) {
      merged.push(parts.slice(i, i + 2).join("。"));
    }
    return merged.slice(0, 4);
  }
  return parts.slice(0, 4);
}

const INSIGHTS: Record<CategoryId, string[]> = {
  jimao: [
    "这事不大，但你脑内循环播放了。叫完名字，音量先调小一格。",
    "鸡毛蒜皮的特征：说出来有点尴尬——说明它确实不大。",
  ],
  zhima: [
    "芝麻绿豆翻炒八百遍，还是芝麻绿豆。过去不能改剧本，只能换观影姿势。",
    "你在跟一个已经结束的场景吵架。对手早退场了。",
  ],
  xigua: [
    "这瓜是别人家的。你吃得再认真，也不会变成你的营养。",
    "关心可以，承包不行。把遥控器还回去。",
  ],
  guimao: [
    "龟毛兔角：还没长出来的角，你已经开始拔了。先等它真长出来再说。",
    "担心是预演，不是事实。预演太久会把今天演没。",
  ],
  laihama: [
    "癞蛤蟆来了：烦是信号，不是任务清单。你可以不接这通电话。",
    "冲突感很重，但你不一定要当场赢。先保住今天的气。",
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
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % 997;
  return arr[h % arr.length];
}

export function mockAnalyze(text: string): AnalyzeResponse {
  const chunks = splitSentences(text);
  const events: EventItem[] = chunks.map((chunk) => {
    const category = guessCategory(chunk);
    const label =
      chunk.length > 18 ? chunk.slice(0, 16) + "…" : chunk;
    return {
      id: uid(),
      text: label,
      category,
      emotion: pick(EMOTIONS, chunk),
      thought: pick(THOUGHTS, chunk + "t"),
      insight: pick(INSIGHTS[category], chunk + "i"),
    };
  });

  const hasConflict = events.some((e) => e.category === "laihama" || e.category === "guimao");
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
const ONELINERS = [
  "今天的破事，已登记在案，准予释放。",
  "鉴定完毕：大多是屁大点事。",
  "倒完了。世界还在转，你也可以歇会儿。",
  "报告写完，你不用再当面审自己。",
];

export function mockReport(events: EventItem[]): AnalyzeResponse {
  const counts = events.length ? countByCategory(events) : emptyCounts();
  let blackHole: CategoryId = "jimao";
  let max = -1;
  (Object.keys(counts) as CategoryId[]).forEach((k) => {
    if (counts[k] > max) {
      max = counts[k];
      blackHole = k;
    }
  });
  if (max <= 0) blackHole = "jimao";

  const seed = events.map((e) => e.text).join("|") || "empty";
  return {
    counts,
    blackHole,
    summary:
      events.length === 0
        ? "今天啥也没倒？也行，空桶也是一种状态。"
        : `今天倒了 ${events.length} 件。最大能量黑洞在「${blackHole}」那一侧——别被它吸走整晚。`,
    tuneAction: pick(ACTIONS, seed),
    energyFrom: pick(ENERGY, seed + "from"),
    energyTo: pick(ENERGY, seed + "to"),
    energyTrend: pick(TRENDS, seed + "tr"),
    oneLiner: pick(ONELINERS, seed + "ol"),
    mock: true,
  };
}
