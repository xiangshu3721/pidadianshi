export type CategoryId =
  | "jimao"
  | "zhima"
  | "xigua"
  | "guimao"
  | "laihama";

export type PeriodKind = "today" | "week" | "month";

export interface EventItem {
  id: string;
  text: string;
  category: CategoryId;
  emotion: string;
  thought: string;
  /** Deeper psychological/life insight (AI洞见) */
  insight: string;
  /** One-line reason why this fits the category bucket */
  why?: string;
}

export interface DayData {
  date: string; // YYYY-MM-DD
  rawInputs: string[];
  events: EventItem[];
  deepen?: string;
  tuneAction?: string;
  energyFrom?: string;
  energyTo?: string;
  energyTrend?: string;
  oneLiner?: string;
  blackHole?: CategoryId;
  summary?: string;
  dumpedVisualAt?: string;
  tuneDone?: boolean;
}

export interface AnalyzeRequest {
  mode: "analyze" | "report" | "period";
  text?: string;
  date: string;
  existingEvents?: EventItem[];
  rawInputs?: string[];
  /** For period mode */
  period?: PeriodKind;
  counts?: Record<CategoryId, number>;
  eventCount?: number;
  dayCount?: number;
}

export interface AnalyzeResponse {
  events?: EventItem[];
  deepen?: string | null;
  counts?: Record<CategoryId, number>;
  blackHole?: CategoryId;
  summary?: string;
  tuneAction?: string;
  energyFrom?: string;
  energyTo?: string;
  energyTrend?: string;
  oneLiner?: string;
  mock?: boolean;
}
