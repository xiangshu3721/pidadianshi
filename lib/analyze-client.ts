import { emptyCounts } from "./categories";
import { mockAnalyze, mockPeriodReport, mockReport } from "./mock-ai";
import type { AnalyzeRequest, AnalyzeResponse } from "./types";

/** Same five-category mock the server uses when no API key is set. */
function mockFor(body: AnalyzeRequest): AnalyzeResponse {
  if (body.mode === "period") {
    const counts = { ...emptyCounts(), ...(body.counts ?? {}) };
    return mockPeriodReport(
      counts,
      body.period || "week",
      Number(body.eventCount || 0),
      Number(body.dayCount || 0)
    );
  }
  if (body.mode === "report") {
    return mockReport(body.existingEvents || []);
  }
  return mockAnalyze(body.text || "");
}

/**
 * Prefer `/api/analyze` when a server is running.
 * Static GitHub Pages has no route handler, so the static build calls mock
 * directly. A failed fetch (404, offline, API error) uses the same mock.
 */
export async function requestAnalyze(
  body: AnalyzeRequest
): Promise<AnalyzeResponse> {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "1") {
    return mockFor(body);
  }

  try {
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const res = await fetch(`${base}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`analyze ${res.status}`);
    return (await res.json()) as AnalyzeResponse;
  } catch {
    return mockFor(body);
  }
}
