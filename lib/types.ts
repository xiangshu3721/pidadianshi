export type CategoryId =
  | "jimao"
  | "zhima"
  | "xigua"
  | "guimao"
  | "laihama";

export interface EventItem {
  id: string;
  text: string;
  category: CategoryId;
  emotion: string;
  thought: string;
  insight: string;
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
  mode: "analyze" | "report";
  text?: string;
  date: string;
  existingEvents?: EventItem[];
  rawInputs?: string[];
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
