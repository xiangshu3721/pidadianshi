"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, countByCategory, CATEGORY_ORDER } from "@/lib/categories";
import { formatDisplayDate, monthMatrix, todayKey } from "@/lib/dates";
import { datesInMonth, getDay } from "@/lib/storage";
import type { DayData } from "@/lib/types";

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

export default function DiaryPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);
  const [day, setDay] = useState<DayData | null>(null);
  const [marked, setMarked] = useState<Set<string>>(new Set());

  const matrix = useMemo(() => monthMatrix(year, month), [year, month]);

  useEffect(() => {
    setMarked(datesInMonth(year, month));
    const t = todayKey();
    const [ty, tm] = t.split("-").map(Number);
    if (ty === year && tm === month + 1) {
      setSelected(t);
    }
  }, [year, month]);

  useEffect(() => {
    if (!selected) {
      setDay(null);
      return;
    }
    setDay(getDay(selected));
  }, [selected]);

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
    setSelected(null);
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
    setSelected(null);
  };

  const counts = day ? countByCategory(day.events) : null;

  return (
    <>
      <div className="nav-mini">
        <Link href="/">← 回家</Link>
        <strong>日记</strong>
        <Link href="/today">报告</Link>
      </div>

      <section className="card">
        <div className="nav-mini" style={{ marginBottom: 8 }}>
          <button type="button" onClick={prevMonth} aria-label="上个月">
            ‹
          </button>
          <strong>
            {year}年{month + 1}月
          </strong>
          <button type="button" onClick={nextMonth} aria-label="下个月">
            ›
          </button>
        </div>

        <div className="cal-grid" role="grid" aria-label="日历">
          {WEEK.map((w) => (
            <div key={w} className="cal-head">
              {w}
            </div>
          ))}
          {matrix.flat().map((cell, idx) => {
            if (!cell) {
              return <button key={`e-${idx}`} className="cal-cell" disabled />;
            }
            const dayNum = Number(cell.slice(-2));
            const has = marked.has(cell);
            return (
              <button
                key={cell}
                type="button"
                className={`cal-cell${has ? " has" : ""}${
                  selected === cell ? " selected" : ""
                }`}
                onClick={() => setSelected(cell)}
                aria-pressed={selected === cell}
                aria-label={`${cell}${has ? " 有记录" : ""}`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </section>

      {selected && (
        <section className="card" aria-live="polite">
          <strong>{formatDisplayDate(selected)}</strong>
          {!day || day.events.length === 0 ? (
            <p className="empty" style={{ padding: "16px 0" }}>
              这天没有倒破事。
            </p>
          ) : (
            <>
              <div className="counts" style={{ marginTop: 12 }}>
                {CATEGORY_ORDER.map((id) => (
                  <div key={id} className="count-item">
                    <div className="emoji">{CATEGORIES[id].emoji}</div>
                    <div className="n">{counts?.[id] ?? 0}</div>
                  </div>
                ))}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0" }}>
                {day.events.map((ev) => {
                  const cat = CATEGORIES[ev.category];
                  return (
                    <li
                      key={ev.id}
                      className="event-card"
                      style={{ marginBottom: 10 }}
                    >
                      <div>
                        <strong>
                          {cat.emoji} {ev.text}
                        </strong>
                      </div>
                      <div className="muted" style={{ fontSize: "0.85rem", marginTop: 4 }}>
                        分类 · {cat.name}
                      </div>
                      <div style={{ marginTop: 6, lineHeight: 1.5 }}>
                        洞见 · {ev.insight}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {day.oneLiner && (
                <p
                  className="muted"
                  style={{
                    marginTop: 12,
                    textAlign: "center",
                    fontStyle: "italic",
                  }}
                >
                  「{day.oneLiner}」
                </p>
              )}
            </>
          )}
        </section>
      )}

      <p className="muted" style={{ textAlign: "center", fontSize: "0.8rem" }}>
        数据只存在本机浏览器，无账号、无云同步。
      </p>
    </>
  );
}
