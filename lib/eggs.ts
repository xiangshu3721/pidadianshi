/** 首页每日提示：引导表达「发生了什么」 */
export const DAILY_EGGS = [
  "今天发生了什么？随便说说就行。",
  "心里堵着的那件事，倒出来看看有多大。",
  "说清楚发生了什么，换个视角看看是不是屁大点事。",
  "从早到晚哪一刻让你不爽？先说出来。",
  "一件就够：刚才/今天，到底发生了什么？",
  "别人的事、还没发生的事，也都可以倒这儿。",
  "不用写漂亮，说人话就行——发生了啥？",
  "烦、慌、气，背后通常有一件具体的事。",
  "先讲事实，大小之后再帮你掂量。",
  "一句话也行：「老板改方案」「又刷到别人炫耀」。",
];

/** 基于日期选一条，当天不变 */
export function eggForDate(date: string): string {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
  }
  return DAILY_EGGS[hash % DAILY_EGGS.length];
}
