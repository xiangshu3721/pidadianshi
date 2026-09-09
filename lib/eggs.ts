/** 首页随机彩蛋文案（每日固定一条） */
export const DAILY_EGGS = [
  "先别急，看看是不是屁大点事。",
  "破事也配有名字，叫完就轻一点。",
  "今天的瓜，不一定是你的份。",
  "倒出来就不堵了，堵着才像事。",
  "鸡毛蒜皮攒多了，也会假装很重要。",
  "AI 不看病，只帮你把破事分个类。",
  "三分钟够了，别把自己开会开久了。",
  "癞蛤蟆也是一种心情，认了就行。",
  "龟毛的事，先放桌上晾晾。",
  "芝麻绿豆翻炒八百遍，还是芝麻绿豆。",
];

/** 基于日期选一条，当天不变 */
export function eggForDate(date: string): string {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
  }
  return DAILY_EGGS[hash % DAILY_EGGS.length];
}
