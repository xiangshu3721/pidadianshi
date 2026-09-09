import type { CategoryId } from "./types";

export const CATEGORIES: Record<
  CategoryId,
  {
    emoji: string;
    name: string;
    short: string;
    desc: string;
    /** 白话：为什么算这一类 */
    why: string;
    /** 口语化揭晓 */
    reveal: string;
  }
> = {
  jimao: {
    emoji: "🪶",
    name: "鸡毛蒜皮",
    short: "小事",
    desc: "日常琐碎，过了就忘那种",
    why: "说白了就是日常小插曲，过会儿可能就忘了。",
    reveal: "归到 🪶 鸡毛蒜皮",
  },
  zhima: {
    emoji: "🫘",
    name: "芝麻绿豆",
    short: "过去",
    desc: "旧账、后悔、翻来覆去的回忆",
    why: "说白了是已经过去的事，你还在脑子里翻炒。",
    reveal: "归到 🫘 芝麻绿豆",
  },
  xigua: {
    emoji: "🍉",
    name: "西瓜",
    short: "别人的事",
    desc: "主要在盯别人的生活/评价，不是你自己要办的事",
    why: "说白了是别人的事占了你的心——跟你自己要办的那件，不是一回事。",
    reveal: "归到 🍉 西瓜",
  },
  guimao: {
    emoji: "🐢",
    name: "龟毛兔角",
    short: "未知",
    desc: "还没发生的担心、万一、值不值",
    why: "说白了是还没发生的担心：值不值、会不会踩坑，事情本身还没落地。",
    reveal: "归到 🐢 龟毛兔角",
  },
  laihama: {
    emoji: "🐸",
    name: "癞蛤蟆",
    short: "排斥",
    desc: "冲突、烦人、不想碰又绕不开",
    why: "说白了是让你烦、让你想躲开的冲突感。",
    reveal: "归到 🐸 癞蛤蟆",
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

/** 口语化揭晓：类别名 + 大白话理由 */
export function classifyRevealLine(id: CategoryId, why?: string): string {
  const c = CATEGORIES[id];
  return `${c.reveal}。${why || c.why}`;
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
