"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CATEGORIES,
  CATEGORY_ORDER,
  countByCategory,
  emptyCounts,
} from "@/lib/categories";
import { formatDisplayDate, todayKey } from "@/lib/dates";
import { ensureDay, updateDay } from "@/lib/storage";
import type { AnalyzeResponse, CategoryId, DayData } from "@/lib/types";

export default function TodayPage() {
  const [day, setDay] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dumping, setDumping] = useState(false);

  const loadReport = useCallback(async (force = false) => {
    const date = todayKey();
    const local = ensureDay(date);
    setDay(local);

    if (
      !force &&
      local.summary &&
      local.oneLiner &&
      local.tuneAction &&
      local.events.length > 0
    ) {
      setLoading(false);
      return;
    }

    if (local.events.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "report",
          date,
          existingEvents: local.events,
          rawInputs: local.rawInputs,
        }),
      });
      if (!res.ok) throw new Error("report failed");
      const data = (await res.json()) as AnalyzeResponse;
      const next = updateDay(date, {
        blackHole: data.blackHole,
        summary: data.summary,
        tuneAction: data.tuneAction,
        energyFrom: data.energyFrom,
        energyTo: data.energyTo,
        energyTrend: data.energyTrend,
        oneLiner: data.oneLiner,
      });
      setDay(next);
    } catch {
      setError("报告生成失败，显示本地草稿。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(false);
  }, [loadReport]);

  const counts =
    day && day.events.length
      ? countByCategory(day.events)
      : emptyCounts();

  const blackHole: CategoryId = day?.blackHole || "jimao";
  const bh = CATEGORIES[blackHole];

  const onDump = () => {
    if (!day) return;
    setDumping(true);
    updateDay(day.date, { dumpedVisualAt: new Date().toISOString() });
    setTimeout(() => {
      setDumping(false);
      setDay(ensureDay(day.date));
    }, 1100);
  };

  const onTuneDone = () => {
    if (!day) return;
    const next = updateDay(day.date, { tuneDone: true });
    setDay(next);
  };

  return (
    <>
      <div className="nav-mini">
        <Link href="/">← 回家</Link>
        <strong>今日屁事报告</strong>
        <Link href="/diary">日记</Link>
      </div>

      <p className="muted" style={{ margin: 0, textAlign: "center" }}>
        {day ? formatDisplayDate(day.date) : "…"}
      </p>

      {error && <div className="error">{error}</div>}

      {!day || (day.events.length === 0 && !loading) ? (
        <div className="card empty">
          今天桶还是空的。
          <div style={{ marginTop: 14 }}>
            <Link href="/record" className="btn btn-primary">
              去倒一点
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className="card" aria-label="今日计数">
            <strong>今日分类</strong>
            <div className="counts" style={{ marginTop: 12 }}>
              {CATEGORY_ORDER.map((id) => (
                <div key={id} className="count-item">
                  <div className="emoji">{CATEGORIES[id].emoji}</div>
                  <div className="n">{counts[id]}</div>
                  <div className="label">{CATEGORIES[id].short}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="muted" style={{ fontSize: "0.8rem" }}>
              今日最大能量黑洞
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "1.25rem", fontWeight: 800 }}>
              {bh.emoji} {bh.name}
            </p>
            <p className="muted" style={{ margin: "6px 0 0", fontSize: "0.9rem" }}>
              {bh.desc}
            </p>
          </section>

          <section className="card">
            <strong>AI 说</strong>
            {loading ? (
              <p className="muted">正在写报告…</p>
            ) : (
              <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
                {day.summary || "今天就这些破事，先到这儿。"}
              </p>
            )}
          </section>

          <section className="card">
            <strong>今日状态</strong>
            <div className="energy-flow" style={{ marginTop: 12 }}>
              <span>{day.energyFrom || "😑平平"}</span>
              <span aria-hidden>→</span>
              <span>{day.energyTo || "🌤️回血中"}</span>
              {day.energyTrend && (
                <span className="trend-tag">{day.energyTrend}</span>
              )}
            </div>
            <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 0 }}>
              游戏感状态，不是体检报告。
            </p>
          </section>

          <section className="card">
            <strong>今天调一下</strong>
            <p style={{ margin: "8px 0 12px", lineHeight: 1.55 }}>
              {day.tuneAction || "喝口水，歇十秒。"}
            </p>
            {day.tuneDone ? (
              <div className="status-pill">✓ 完成（今天够了）</div>
            ) : (
              <button type="button" className="btn btn-soft" onClick={onTuneDone}>
                去做 → 完成
              </button>
            )}
          </section>

          <section className="card">
            <strong>今日屁事桶</strong>
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              「倒掉」只是视觉仪式，日记还在。
            </p>
            <div className={`bucket ${dumping ? "dumping" : ""}`} style={{ marginTop: 8 }}>
              {!dumping && !day.dumpedVisualAt && <span>🪣 满满的破事</span>}
              {!dumping && day.dumpedVisualAt && <span>已倒掉（日记仍在）</span>}
              {dumping && (
                <>
                  <span>倒——</span>
                  <span className="blob" style={{ left: "30%" }} />
                  <span className="blob" style={{ left: "48%", width: 20, height: 20 }} />
                  <span className="blob" style={{ left: "62%", width: 34, height: 34 }} />
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

          <section className="card" style={{ textAlign: "center" }}>
            <div className="muted" style={{ fontSize: "0.8rem" }}>
              今日一句话
            </div>
            <p style={{ fontSize: "1.1rem", fontWeight: 700, margin: "8px 0 0" }}>
              {day.oneLiner || "鉴定完毕：大多是屁大点事。"}
            </p>
          </section>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => loadReport(true)}
            disabled={loading}
          >
            重新生成报告
          </button>
        </>
      )}
    </>
  );
}
