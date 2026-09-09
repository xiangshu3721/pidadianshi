import type { DayData, EventItem } from "./types";
import { todayKey } from "./dates";

const PREFIX = "pdds:";
const INDEX_KEY = "pdds:index";

function dayKey(date: string): string {
  return `${PREFIX}day:${date}`;
}

function readIndex(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(dates: string[]) {
  const uniq = Array.from(new Set(dates)).sort();
  localStorage.setItem(INDEX_KEY, JSON.stringify(uniq));
}

export function getDay(date: string): DayData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(dayKey(date));
    if (!raw) return null;
    return JSON.parse(raw) as DayData;
  } catch {
    return null;
  }
}

export function saveDay(data: DayData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(dayKey(data.date), JSON.stringify(data));
  const idx = readIndex();
  if (!idx.includes(data.date)) {
    idx.push(data.date);
    writeIndex(idx);
  }
}

export function ensureDay(date = todayKey()): DayData {
  const existing = getDay(date);
  if (existing) return existing;
  const fresh: DayData = {
    date,
    rawInputs: [],
    events: [],
  };
  saveDay(fresh);
  return fresh;
}

export function appendRawInput(date: string, text: string): DayData {
  const day = ensureDay(date);
  day.rawInputs = [...day.rawInputs, text];
  saveDay(day);
  return day;
}

export function appendEvents(date: string, events: EventItem[]): DayData {
  const day = ensureDay(date);
  day.events = [...day.events, ...events];
  saveDay(day);
  return day;
}

export function updateDay(date: string, patch: Partial<DayData>): DayData {
  const day = ensureDay(date);
  const next = { ...day, ...patch, date };
  saveDay(next);
  return next;
}

export function listDatesWithData(): string[] {
  return readIndex();
}

export function datesInMonth(year: number, month: number): Set<string> {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  return new Set(readIndex().filter((d) => d.startsWith(prefix)));
}
