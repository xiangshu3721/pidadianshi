import type { CategoryId } from "./types";

export const CATEGORIES: Record<
  CategoryId,
  {
    emoji: string;
    name: string;
    short: string;
    desc: string;
    /** Crystal-clear one-liner: why something fits this bucket */
    why: string;
    /** Playful reveal verb phrase */
    reveal: string;
  }
> = {
  jimao: {
    emoji: "🪶",
    name: "鸡毛蒜皮",
    short: "小事",
    desc: "日常琐碎，过了就忘那种",
    why: "这是日常琐碎的『小事』——说过就该放过。",
    reveal: "捡起一根🪶 鸡毛蒜皮",
  },
  zhima: {
    emoji: "🫘",
    name: "芝麻绿豆",
    short: "过去",
    desc: "旧账、后悔、翻来覆去的回忆",
    why: "这是已经过去的『旧账』——翻炒八百遍还是芝麻绿豆。",
    reveal: "翻出一颗🫘 芝麻绿豆",
  },
  xigua: {
    emoji: "🍉",
    name: "西瓜",
    short: "别人的事",
    desc: "别人家的瓜，你吃着还操心",
    why: "这是别人家的『瓜』——你吃得再认真也不会变你的营养。",
    reveal: "切开一只🍉 西瓜",
  },
  guimao: {
    emoji: "🐢",
    name: "龟毛兔角",
    short: "未知",
    desc: "还没发生的担心、万一、如果",
    why: "这是还没发生的『万一』——角还没长出来，你已经开始拔了。",
    reveal: "发现一只🐢 龟毛兔角",
  },
  laihama: {
    emoji: "🐸",
    name: "癞蛤蟆",
    short: "排斥",
    desc: "冲突、烦人、不想碰又绕不开",
    why: "这是烦人/冲突的『癞蛤蟆』——烦是信号，不是任务清单。",
    reveal: "踩到一只🐸 癞蛤蟆",
  },
};

export const CATEGORY_ORDER: CategoryId[] = [
  "jimao",
  "zhima",
  "xigua",
  "guimao",
  "laihama",
];

export function categoryLabel(id: CategoryId): string {
  const c = CATEGORIES[id];
  return `${c.emoji} ${c.name}`;
}

/** Witty + crystal-clear classify reveal line */
export function classifyRevealLine(id: CategoryId, why?: string): string {
  const c = CATEGORIES[id];
  return `${c.reveal}！——${why || c.why}`;
}

export function emptyCounts(): Record<CategoryId, number> {
  return { jimao: 0, zhima: 0, xigua: 0, guimao: 0, laihama: 0 };
}

export function countByCategory(
  events: { category: CategoryId }[]
): Record<CategoryId, number> {
  const counts = emptyCounts();
  for (const e of events) {
    if (counts[e.category] !== undefined) counts[e.category] += 1;
  }
  return counts;
}

export function mergeCounts(
  a: Record<CategoryId, number>,
  b: Record<CategoryId, number>
): Record<CategoryId, number> {
  const out = emptyCounts();
  for (const id of CATEGORY_ORDER) out[id] = (a[id] || 0) + (b[id] || 0);
  return out;
}

export function blackHoleFromCounts(
  counts: Record<CategoryId, number>
): CategoryId {
  let best: CategoryId = "jimao";
  let max = -1;
  for (const id of CATEGORY_ORDER) {
    if (counts[id] > max) {
      max = counts[id];
      best = id;
    }
  }
  return best;
}
