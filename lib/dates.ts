/** 本地日历日 YYYY-MM-DD（按用户时区） */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDisplayDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
}

export function parseDateKey(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: string, delta: number): string {
  const d = parseDateKey(date);
  d.setDate(d.getDate() + delta);
  return todayKey(d);
}

/** Monday-start week containing `date` → [start, end] inclusive YYYY-MM-DD */
export function weekRange(date = todayKey()): { start: string; end: string } {
  const d = parseDateKey(date);
  const day = d.getDay(); // 0 Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = addDays(date, mondayOffset);
  const end = addDays(start, 6);
  return { start, end };
}

export function monthRange(date = todayKey()): { start: string; end: string } {
  const d = parseDateKey(date);
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const last = new Date(y, m + 1, 0).getDate();
  const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { start, end };
}

/** Days of the week strip containing `date` (Mon–Sun) */
export function weekStrip(date = todayKey()): string[] {
  const { start } = weekRange(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function monthMatrix(year: number, month: number): (string | null)[][] {
  // month: 0-11
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = first.getDay(); // 0 Sun
  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(month + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    cells.push(`${year}-${m}-${day}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

export function dateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}
