import type { CategoryId } from "./types";

export const CATEGORIES: Record<
  CategoryId,
  { emoji: string; name: string; short: string; desc: string }
> = {
  jimao: {
    emoji: "🪶",
    name: "鸡毛蒜皮",
    short: "小事",
    desc: "日常琐碎，过了就忘那种",
  },
  zhima: {
    emoji: "🫘",
    name: "芝麻绿豆",
    short: "过去",
    desc: "旧账、后悔、翻来覆去的回忆",
  },
  xigua: {
    emoji: "🍉",
    name: "西瓜",
    short: "别人的事",
    desc: "别人家的瓜，你吃着还操心",
  },
  guimao: {
    emoji: "🐢",
    name: "龟毛兔角",
    short: "未知",
    desc: "还没发生的担心、万一、如果",
  },
  laihama: {
    emoji: "🐸",
    name: "癞蛤蟆",
    short: "排斥",
    desc: "冲突、烦人、不想碰又绕不开",
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
