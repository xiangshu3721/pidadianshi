"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CATEGORIES,
  countByCategory,
  CATEGORY_ORDER,
  classifyRevealLine,
} from "@/lib/categories";
import {
  formatDisplayDate,
  monthMatrix,
  todayKey,
  weekStrip,
} from "@/lib/dates";
import { datesInMonth, getDay, listDatesWithData } from "@/lib/storage";
import type { DayData } from "@/lib/types";

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

export default function DiaryPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);
  const [day, setDay] = useState<DayData | null>(null);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);

  const matrix = useMemo(() => monthMatrix(year, month), [year, month]);
  const strip = useMemo(() => {
    const base = selected || todayKey();
    return weekStrip(base);
  }, [selected]);

  // Init: select today once
  useEffect(() => {
    const t = todayKey();
    setSelected(t);
    const all = listDatesWithData();
    setMarked(new Set(all));
  }, []);

  useEffect(() => {
    setMarked((prev) => {
      const next = new Set(prev);
      for (const d of datesInMonth(year, month)) next.add(d);
      return next;
    });
  }, [year, month]);

  useEffect(() => {
    if (!selected) {
      setDay(null);
      return;
    }
    setDay(getDay(selected));
  }, [selected]);

  const selectDate = (cell: string) => {
    setSelected(cell);
    const [y, m] = cell.split("-").map(Number);
    if (y !== year || m - 1 !== month) {
      setYear(y);
      setMonth(m - 1);
    }
  };

  const prevMonth = () => {
    let y = year;
    let m = month;
    if (m === 0) {
      y -= 1;
      m = 11;
    } else m -= 1;
    setYear(y);
    setMonth(m);
  };

  const nextMonth = () => {
    let y = year;
    let m = month;
    if (m === 11) {
      y += 1;
      m = 0;
    } else m += 1;
    setYear(y);
    setMonth(m);
  };

  const counts = day ? countByCategory(day.events) : null;

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">日记</h1>
        <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
          点日期看事件 → 分类 → 洞见
        </p>
      </header>

      <section className={`card cal-card${expanded ? "" : " cal-compact"}`}>
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

        {!expanded ? (
          <div className="week-strip" role="listbox" aria-label="本周">
            {strip.map((cell) => {
              const dayNum = Number(cell.slice(-2));
              const has = marked.has(cell);
              const wd = WEEK[new Date(cell + "T12:00:00").getDay()];
              return (
                <button
                  key={cell}
                  type="button"
                  className={`week-cell${has ? " has" : ""}${
                    selected === cell ? " selected" : ""
                  }`}
                  onClick={() => selectDate(cell)}
                  aria-pressed={selected === cell}
                >
                  <span className="week-wd">{wd}</span>
                  <span className="week-num">{dayNum}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="cal-grid" role="grid" aria-label="月历">
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
                  onClick={() => selectDate(cell)}
                  aria-pressed={selected === cell}
                  aria-label={`${cell}${has ? " 有记录" : ""}`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          className="btn btn-ghost cal-toggle"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "收起" : "展开月历"}
        </button>
      </section>

      {selected && (
        <section className="card day-events" aria-live="polite">
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
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "16px 0 0",
                }}
              >
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
                      <div className="classify-reveal" style={{ marginTop: 6 }}>
                        {classifyRevealLine(ev.category, ev.why)}
                      </div>
                      <div style={{ marginTop: 8, lineHeight: 1.55 }}>
                        <strong style={{ fontSize: "0.85rem" }}>AI洞见</strong>
                        <div>{ev.insight}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
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
