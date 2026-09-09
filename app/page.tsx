"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORIES, classifyRevealLine } from "@/lib/categories";
import { todayKey } from "@/lib/dates";
import { eggForDate } from "@/lib/eggs";
import {
  appendEvents,
  appendRawInput,
  ensureDay,
  updateDay,
} from "@/lib/storage";
import type { AnalyzeResponse, EventItem } from "@/lib/types";

type Phase = "idle" | "listening" | "analyzing" | "revealed" | "error";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((ev: {
        results: {
          [i: number]: { [j: number]: { transcript: string }; isFinal: boolean };
          length: number;
        };
      }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function HomeChatPage() {
  const [date, setDate] = useState("");
  const [egg, setEgg] = useState("");
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [userBubbles, setUserBubbles] = useState<string[]>([]);
  const [newEvents, setNewEvents] = useState<EventItem[]>([]);
  const [pastReveals, setPastReveals] = useState<
    { events: EventItem[]; insight: string; deepen: string | null }[]
  >([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [deepen, setDeepen] = useState<string | null>(null);
  const [insightLine, setInsightLine] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const d = todayKey();
    setDate(d);
    setEgg(eggForDate(d));
    ensureDay(d);
  }, []);

  useEffect(() => {
    if (phase !== "revealed" || newEvents.length === 0) return;
    if (visibleCount < newEvents.length) {
      const t = setTimeout(() => setVisibleCount((n) => n + 1), 420);
      return () => clearTimeout(t);
    }
    // 动画播完：归档到对话，回到可继续录入
    const t = setTimeout(() => {
      setPastReveals((prev) => [
        ...prev,
        { events: newEvents, insight: insightLine, deepen },
      ]);
      setNewEvents([]);
      setDeepen(null);
      setPhase("idle");
    }, 600);
    return () => clearTimeout(t);
  }, [phase, visibleCount, newEvents, insightLine, deepen]);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (mediaRec.current && mediaRec.current.state !== "inactive") {
      mediaRec.current.stop();
    }
    mediaRec.current = null;
    setRecording(false);
    setPhase((p) => (p === "listening" ? "idle" : p));
  }, []);

  const startVoice = async () => {
    setError("");
    const SR = getSpeechRecognition();
    if (SR) {
      try {
        const rec = new SR();
        rec.lang = "zh-CN";
        rec.continuous = true;
        rec.interimResults = true;
        let finalText = text;
        rec.onresult = (ev) => {
          let interim = "";
          let finals = "";
          for (let i = 0; i < ev.results.length; i++) {
            const r = ev.results[i];
            if (r.isFinal) finals += r[0].transcript;
            else interim += r[0].transcript;
          }
          if (finals) finalText = (text ? text + " " : "") + finals;
          setText((finalText + (interim ? " " + interim : "")).trim());
        };
        rec.onerror = () => {
          setError("语音识别有点抽风，你可以改打字。");
          stopVoice();
        };
        rec.onend = () => {
          setRecording(false);
          setPhase((p) => (p === "listening" ? "idle" : p));
        };
        recognitionRef.current = rec;
        rec.start();
        setRecording(true);
        setPhase("listening");
        return;
      } catch {
        // fall through
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setError(
          "当前浏览器不支持语音转文字。录音已停，请直接打字倒吧（一样管用）。"
        );
        setRecording(false);
        setPhase("idle");
      };
      mediaRec.current = mr;
      mr.start();
      setRecording(true);
      setPhase("listening");
    } catch {
      setError("麦克风不可用。打字也完全 OK。");
      setPhase("idle");
    }
  };

  const analyze = async () => {
    const payload = text.trim();
    if (!payload) {
      setError("先随便说两句破事。");
      return;
    }
    stopVoice();
    setError("");
    setPhase("analyzing");
    setNewEvents([]);
    setVisibleCount(0);
    setDeepen(null);
    setInsightLine("");
    setUserBubbles((b) => [...b, payload]);
    appendRawInput(date || todayKey(), payload);
    setText("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "analyze",
          text: payload,
          date: date || todayKey(),
        }),
      });
      if (!res.ok) throw new Error("analyze failed");
      const data = (await res.json()) as AnalyzeResponse;
      const events = data.events || [];
      appendEvents(date || todayKey(), events);
      if (data.deepen) {
        updateDay(date || todayKey(), { deepen: data.deepen });
        setDeepen(data.deepen);
      }
      setNewEvents(events);
      setInsightLine(
        events[0]?.insight ||
          "底下多半有个没被点名的需要。叫出名字就算过了一半。"
      );
      setPhase("revealed");
      setVisibleCount(0);
    } catch {
      setError("鉴定失败了，可能是网络。再试一次？");
      setPhase("error");
    }
  };

  return (
    <>
      <header className="chat-header">
        <h1 className="title" style={{ fontSize: "1.35rem", margin: 0 }}>
          屁大点事
        </h1>
        {egg && (
          <p className="egg" style={{ margin: "4px 0 0", padding: 0 }}>
            {egg}
          </p>
        )}
      </header>

      <div className="chat-log" aria-live="polite">
        {userBubbles.length === 0 && phase === "idle" && (
          <div className="empty">
            说说今天发生了什么——一件小事也行。
            <br />
            <span style={{ fontSize: "0.85rem" }}>
              我会帮你拆开、归类，换个视角掂掂：到底是多大点事。
            </span>
          </div>
        )}

        {userBubbles.map((b, i) => (
          <div key={`u-${i}`} className="bubble bubble-user">
            {b}
          </div>
        ))}

        {pastReveals.map((batch, bi) => (
          <div key={`r-${bi}`} className="bubble bubble-ai" style={{ maxWidth: "100%" }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>拆好了：</div>
            {batch.events.map((ev) => {
              const cat = CATEGORIES[ev.category];
              return (
                <div key={ev.id} className="event-card" style={{ marginBottom: 8 }}>
                  <div className="classify-reveal">
                    {classifyRevealLine(ev.category, ev.why)}
                  </div>
                  <div style={{ fontSize: "1.05rem", marginTop: 6 }}>
                    <strong>
                      {cat.emoji} {ev.text}
                    </strong>
                  </div>
                  <div className="muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                    {cat.emoji} {cat.name} · 情绪 {ev.emotion}
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 12 }}>
              <strong>AI洞见</strong>
              <p style={{ margin: "6px 0 0", lineHeight: 1.55 }}>{batch.insight}</p>
            </div>
            {batch.deepen && (
              <div
                className="card"
                style={{ marginTop: 12, background: "#fff3e6", boxShadow: "none" }}
              >
                <div className="muted" style={{ fontSize: "0.8rem" }}>
                  可选深挖（不问第二遍）
                </div>
                <p style={{ margin: "6px 0 0" }}>{batch.deepen}</p>
              </div>
            )}
          </div>
        ))}

        {phase === "analyzing" && (
          <div className="bubble bubble-ai">
            <span className="status-pill">正在鉴定……</span>
            <div className="muted" style={{ marginTop: 8, fontSize: "0.9rem" }}>
              先听你讲完，再一件件看是多大点事。
            </div>
          </div>
        )}

        {phase === "revealed" && (
          <div className="bubble bubble-ai" style={{ maxWidth: "100%" }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>拆好了：</div>
            {newEvents.slice(0, visibleCount).map((ev) => {
              const cat = CATEGORIES[ev.category];
              return (
                <div
                  key={ev.id}
                  className="event-card"
                  style={{ marginBottom: 8 }}
                >
                  <div className="classify-reveal">
                    {classifyRevealLine(ev.category, ev.why)}
                  </div>
                  <div style={{ fontSize: "1.05rem", marginTop: 6 }}>
                    <strong>
                      {cat.emoji} {ev.text}
                    </strong>
                  </div>
                  <div
                    className="muted"
                    style={{ fontSize: "0.8rem", marginTop: 4 }}
                  >
                    {cat.emoji} {cat.name} · 情绪 {ev.emotion}
                  </div>
                </div>
              );
            })}
            {visibleCount >= newEvents.length && (
              <>
                <div style={{ marginTop: 12 }}>
                  <strong>AI洞见</strong>
                  <p style={{ margin: "6px 0 0", lineHeight: 1.55 }}>
                    {insightLine}
                  </p>
                </div>
                {deepen && (
                  <div
                    className="card"
                    style={{
                      marginTop: 12,
                      background: "#fff3e6",
                      boxShadow: "none",
                    }}
                  >
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      可选深挖（不问第二遍）
                    </div>
                    <p style={{ margin: "6px 0 0" }}>{deepen}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {error && <div className="error">{error}</div>}
      </div>

      <div className="composer">
        <label className="sr-only" htmlFor="dump">
          倒破事
        </label>
        <textarea
          id="dump"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="直接说发生了什么，比如：老板突然让改方案；刷到别人升职，心里堵……"
          disabled={phase === "analyzing"}
        />
        <div className="composer-actions">
          <button
            type="button"
            className="btn btn-soft"
            onClick={recording ? stopVoice : startVoice}
            disabled={phase === "analyzing"}
            aria-pressed={recording}
          >
            {recording ? "⏹ 停" : "🎙️ 语音"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={analyze}
            disabled={phase === "analyzing" || !text.trim()}
            style={{ width: "100%" }}
          >
            倒给 AI
          </button>
        </div>
      </div>
    </>
  );
}
