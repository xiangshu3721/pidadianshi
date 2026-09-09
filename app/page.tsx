"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CATEGORIES, CATEGORY_ORDER, countByCategory } from "@/lib/categories";
import { todayKey } from "@/lib/dates";
import { eggForDate } from "@/lib/eggs";
import { ensureDay } from "@/lib/storage";
import type { CategoryId } from "@/lib/types";

export default function HomePage() {
  const [date, setDate] = useState("");
  const [counts, setCounts] = useState<Record<CategoryId, number> | null>(null);
  const [egg, setEgg] = useState("");

  useEffect(() => {
    const d = todayKey();
    setDate(d);
    setEgg(eggForDate(d));
    const day = ensureDay(d);
    setCounts(countByCategory(day.events));
  }, []);

  return (
    <>
      <header style={{ textAlign: "center", paddingTop: 28 }}>
        <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
          MVP · 本地日记
        </p>
        <h1 className="title" style={{ marginTop: 8 }}>
          屁大点事
        </h1>
        <p className="subtitle">今天又有什么破事？</p>
      </header>

      <p className="egg" aria-live="polite">
        {egg || "…"}
      </p>

      <Link href="/record" className="btn btn-primary" style={{ textDecoration: "none" }}>
        🎙️ 随便说说
      </Link>

      <p className="muted" style={{ textAlign: "center", fontSize: "0.88rem", margin: 0 }}>
        1–3 分钟倒完就行。AI 帮你分类、看透、调回来——不看病、不开课。
      </p>

      <section className="card" aria-label="今日分类计数">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <strong>今日桶</strong>
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            {date || "—"}
          </span>
        </div>
        <div className="counts">
          {CATEGORY_ORDER.map((id) => {
            const c = CATEGORIES[id];
            return (
              <div key={id} className="count-item">
                <div className="emoji" aria-hidden>
                  {c.emoji}
                </div>
                <div className="n">{counts ? counts[id] : "·"}</div>
                <div className="label">{c.short}</div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="link-row" style={{ display: "flex", gap: 20, justifyContent: "center" }}>
        <Link href="/today">今日报告</Link>
        <Link href="/diary">📅 日记</Link>
      </div>
    </>
  );
}
