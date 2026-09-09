"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CATEGORIES,
  CATEGORY_ORDER,
  blackHoleFromCounts,
  emptyCounts,
} from "@/lib/categories";
import {
  formatDisplayDate,
  monthRange,
  todayKey,
  weekRange,
} from "@/lib/dates";
import { aggregateRange, ensureDay, updateDay } from "@/lib/storage";
import type {
  AnalyzeResponse,
  CategoryId,
  DayData,
  PeriodKind,
} from "@/lib/types";

const PERIODS: { id: PeriodKind; label: string }[] = [
  { id: "today", label: "今日" },
  { id: "week", label: "本周" },
  { id: "month", label: "本月" },
];

function rangeFor(period: PeriodKind, date: string) {
  if (period === "week") return weekRange(date);
  if (period === "month") return monthRange(date);
  return { start: date, end: date };
}

export default function ReportPage() {
  const [period, setPeriod] = useState<PeriodKind>("today");
  const [date, setDate] = useState("");
  const [day, setDay] = useState<DayData | null>(null);
  const [counts, setCounts] = useState<Record<CategoryId, number>>(emptyCounts());
  const [eventCount, setEventCount] = useState(0);
  const [dayCount, setDayCount] = useState(0);
  const [summary, setSummary] = useState("");
  const [tuneAction, setTuneAction] = useState("");
  const [energyFrom, setEnergyFrom] = useState("");
  const [energyTo, setEnergyTo] = useState("");
  const [energyTrend, setEnergyTrend] = useState("");
  const [blackHole, setBlackHole] = useState<CategoryId>("jimao");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dumping, setDumping] = useState(false);

  const rangeLabel = useMemo(() => {
    if (!date) return "…";
    const r = rangeFor(period, date);
    if (period === "today") return formatDisplayDate(date);
    return `${formatDisplayDate(r.start)} – ${formatDisplayDate(r.end)}`;
  }, [period, date]);

  const load = useCallback(
    async (p: PeriodKind, force = false) => {
      const d = todayKey();
      setDate(d);
      const local = ensureDay(d);
      setDay(local);

      const { start, end } = rangeFor(p, d);
      const agg = aggregateRange(start, end);
      setCounts(agg.counts);
      setEventCount(agg.events.length);
      setDayCount(agg.dayCount);

      if (agg.events.length === 0) {
        setSummary("");
        setTuneAction("");
        setEnergyFrom("");
        setEnergyTo("");
        setEnergyTrend("");
        setBlackHole("jimao");
        setLoading(false);
        return;
      }

      // Today: reuse cached day report when available
      if (
        p === "today" &&
        !force &&
        local.summary &&
        local.tuneAction &&
        local.events.length > 0
      ) {
        setSummary(local.summary);
        setTuneAction(local.tuneAction);
        setEnergyFrom(local.energyFrom || "");
        setEnergyTo(local.energyTo || "");
        setEnergyTrend(local.energyTrend || "");
        setBlackHole(local.blackHole || blackHoleFromCounts(agg.counts));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const body =
          p === "today"
            ? {
                mode: "report" as const,
                date: d,
                existingEvents: local.events,
                rawInputs: local.rawInputs,
              }
            : {
                mode: "period" as const,
                date: d,
                period: p,
                counts: agg.counts,
                eventCount: agg.events.length,
                dayCount: agg.dayCount,
              };

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("report failed");
        const data = (await res.json()) as AnalyzeResponse;

        setSummary(data.summary || "");
        setTuneAction(data.tuneAction || "");
        setEnergyFrom(data.energyFrom || "");
        setEnergyTo(data.energyTo || "");
        setEnergyTrend(data.energyTrend || "");
        setBlackHole(data.blackHole || blackHoleFromCounts(agg.counts));
        if (data.counts) setCounts(data.counts);

        if (p === "today") {
          const next = updateDay(d, {
            blackHole: data.blackHole,
            summary: data.summary,
            tuneAction: data.tuneAction,
            energyFrom: data.energyFrom,
            energyTo: data.energyTo,
            energyTrend: data.energyTrend,
          });
          setDay(next);
        }
      } catch {
        setError("报告生成失败，显示本地计数。");
        setBlackHole(blackHoleFromCounts(agg.counts));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(period, false);
  }, [period, load]);

  const bh = CATEGORIES[blackHole];

  const onDump = () => {
    if (!day || period !== "today") return;
    setDumping(true);
    updateDay(day.date, { dumpedVisualAt: new Date().toISOString() });
    setTimeout(() => {
      setDumping(false);
      setDay(ensureDay(day.date));
    }, 1100);
  };

  const onTuneDone = () => {
    if (!day || period !== "today") return;
    const next = updateDay(day.date, { tuneDone: true });
    setDay(next);
  };

  const empty = eventCount === 0 && !loading;

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">报告</h1>
        <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
          {rangeLabel}
        </p>
      </header>

      <div className="segment" role="tablist" aria-label="统计范围">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={period === p.id}
            className={`segment-item${period === p.id ? " active" : ""}`}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      {empty ? (
        <div className="card empty">
          {period === "today"
            ? "今天桶还是空的。"
            : period === "week"
              ? "本周还没有倒破事。"
              : "本月还没有倒破事。"}
          <div style={{ marginTop: 14 }}>
            <Link href="/" className="btn btn-primary">
              去倒一点
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className="card" aria-label="分类计数">
            <strong>
              {period === "today"
                ? "今日分类"
                : period === "week"
                  ? "本周分类"
                  : "本月分类"}
            </strong>
            <div className="counts" style={{ marginTop: 12 }}>
              {CATEGORY_ORDER.map((id) => (
                <div key={id} className="count-item">
                  <div className="emoji">{CATEGORIES[id].emoji}</div>
                  <div className="n">{counts[id]}</div>
                  <div className="label">{CATEGORIES[id].short}</div>
                </div>
              ))}
            </div>
            {period !== "today" && (
              <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 0 }}>
                共 {dayCount} 天有记录 · {eventCount} 件
              </p>
            )}
          </section>

          <section className="card">
            <div className="muted" style={{ fontSize: "0.8rem" }}>
              {period === "today"
                ? "今日最大能量黑洞"
                : period === "week"
                  ? "本周最大能量黑洞"
                  : "本月最大能量黑洞"}
            </div>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: "1.25rem",
                fontWeight: 800,
              }}
            >
              {bh.emoji} {bh.name}
            </p>
            <p className="muted" style={{ margin: "6px 0 0", fontSize: "0.9rem" }}>
              {bh.desc}
            </p>
          </section>

          <section className="card">
            <strong>AI洞见</strong>
            {loading ? (
              <p className="muted">正在写洞见…</p>
            ) : (
              <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
                {summary || "这段日子就这些破事，先到这儿。"}
              </p>
            )}
          </section>

          <section className="card">
            <strong>
              {period === "today"
                ? "今日状态"
                : period === "week"
                  ? "本周状态"
                  : "本月状态"}
            </strong>
            <div className="energy-flow" style={{ marginTop: 12 }}>
              <span>{energyFrom || "😑平平"}</span>
              <span aria-hidden>→</span>
              <span>{energyTo || "🌤️回血中"}</span>
              {energyTrend && (
                <span className="trend-tag">{energyTrend}</span>
              )}
            </div>
            <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 0 }}>
              游戏感状态，不是体检报告。
            </p>
          </section>

          <section className="card">
            <strong>
              {period === "today"
                ? "今天调一下"
                : period === "week"
                  ? "本周调一下"
                  : "本月调一下"}
            </strong>
            <p style={{ margin: "8px 0 12px", lineHeight: 1.55 }}>
              {tuneAction || "喝口水，歇十秒。"}
            </p>
            {period === "today" &&
              (day?.tuneDone ? (
                <div className="status-pill">✓ 完成（今天够了）</div>
              ) : (
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={onTuneDone}
                >
                  去做 → 完成
                </button>
              ))}
          </section>

          {period === "today" && (
            <section className="card">
              <strong>今日屁事桶</strong>
              <p className="muted" style={{ fontSize: "0.85rem" }}>
                「倒掉」只是视觉仪式，日记还在。
              </p>
              <div
                className={`bucket ${dumping ? "dumping" : ""}`}
                style={{ marginTop: 8 }}
              >
                {!dumping && !day?.dumpedVisualAt && <span>🪣 满满的破事</span>}
                {!dumping && day?.dumpedVisualAt && (
                  <span>已倒掉（日记仍在）</span>
                )}
                {dumping && (
                  <>
                    <span>倒——</span>
                    <span className="blob" style={{ left: "30%" }} />
                    <span
                      className="blob"
                      style={{ left: "48%", width: 20, height: 20 }}
                    />
                    <span
                      className="blob"
                      style={{ left: "62%", width: 34, height: 34 }}
                    />
                  </>
                )}
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ marginTop: 12 }}
                onClick={onDump}
                disabled={dumping}
              >
                倒掉
              </button>
            </section>
          )}

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => load(period, true)}
            disabled={loading}
          >
            重新生成
          </button>
        </>
      )}
    </>
  );
}
