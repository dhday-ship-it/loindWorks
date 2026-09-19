"use client";

import { useState } from "react";
import type { CalendarEventItem } from "@/types/shared";

const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CalendarPanelLight({
  initialEvents,
  workId,
}: {
  initialEvents: CalendarEventItem[];
  workId?: string;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [syncedEvents, setSyncedEvents] = useState(initialEvents);
  if (initialEvents !== syncedEvents) {
    setSyncedEvents(initialEvents);
    setEvents(initialEvents);
  }

  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(now.getDate());

  const viewBase = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const viewYear = viewBase.getFullYear();
  const viewMonth = viewBase.getMonth();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const today = now.getDate();

  const firstDayIdx = new Date(viewYear, viewMonth, 1).getDay();
  const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();

  const eventsByDay = new Map<number, CalendarEventItem[]>();
  for (const e of events) {
    const d = new Date(e.startAt);
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const list = eventsByDay.get(d.getDate()) ?? [];
      list.push(e);
      eventsByDay.set(d.getDate(), list);
    }
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );

  const submitEvent = async () => {
    if (!title.trim()) return;
    const startAt = new Date(viewYear, viewMonth, day, 9, 0).toISOString();
    const res = await fetch("/api/calendar-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, startAt, sharedWith: [], projectId: workId }),
    });
    if (res.ok) {
      const { event } = await res.json();
      setEvents((prev) => [...prev, event]);
      setShowForm(false);
      setTitle("");
    }
  };

  const removeEvent = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/calendar-events/${id}`, { method: "DELETE" });
  };

  const dayEvents = selectedDay !== null ? eventsByDay.get(selectedDay) ?? [] : [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMonthOffset((o) => o - 1)}
              className="cursor-pointer rounded px-1 text-slate-300 transition-all hover:bg-slate-50 hover:text-slate-500"
            >
              ‹
            </button>
            <span
              onClick={() => setMonthOffset(0)}
              className={`text-sm font-bold text-slate-700 ${isCurrentMonth ? "" : "cursor-pointer text-brand"}`}
            >
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              onClick={() => setMonthOffset((o) => o + 1)}
              className="cursor-pointer rounded px-1 text-slate-300 transition-all hover:bg-slate-50 hover:text-slate-500"
            >
              ›
            </button>
          </div>
          <button
            onClick={() => {
              setDay(isCurrentMonth ? now.getDate() : 1);
              setTitle("");
              setShowForm(true);
            }}
            className="cursor-pointer rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500 transition-all hover:bg-brand-light/12 hover:text-brand"
          >
            + 일정
          </button>
        </div>

        <div className="mb-1.5 grid grid-cols-7 text-center text-[10px] font-medium text-slate-300">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {Array.from({ length: firstDayIdx }).map((_, i) => (
            <div key={`b-${i}`} />
          ))}
          {Array.from({ length: lastDate }).map((_, i) => {
            const d = i + 1;
            const isToday = isCurrentMonth && d === today;
            const hasEvent = eventsByDay.has(d);
            return (
              <div
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`flex h-8 cursor-pointer flex-col items-center justify-center rounded-lg transition-all ${
                  isToday
                    ? "bg-brand font-bold text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{d}</span>
                {hasEvent && (
                  <div
                    className={`mt-0.5 h-1 w-1 rounded-full ${isToday ? "bg-white" : "bg-brand-light"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {showForm && (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <input
              type="number"
              min={1}
              max={31}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="mb-2 w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="일정 이름"
              className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none placeholder:text-slate-300"
            />
            <div className="flex gap-2">
              <button
                onClick={submitEvent}
                className="flex-1 cursor-pointer rounded-lg bg-brand py-1.5 text-xs font-bold text-white"
              >
                등록
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 cursor-pointer rounded-lg bg-white py-1.5 text-xs font-bold text-slate-400"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Total timeline
        </div>
        <div className="flex max-h-[220px] flex-col gap-1 overflow-y-auto">
          {sortedEvents.length === 0 && (
            <div className="py-4 text-center text-[11px] text-slate-300">
              등록된 일정이 없습니다
            </div>
          )}
          {sortedEvents.map((e) => {
            const d = new Date(e.startAt);
            return (
              <div
                key={e.id}
                className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[11px] transition-all hover:bg-slate-50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="shrink-0 font-mono text-slate-400">
                    {pad(d.getMonth() + 1)}.{pad(d.getDate())} {pad(d.getHours())}:{pad(d.getMinutes())}
                  </span>
                  <span className="truncate text-slate-600">{e.title}</span>
                </div>
                <button
                  onClick={() => removeEvent(e.id)}
                  className="shrink-0 cursor-pointer text-slate-200 opacity-0 transition-all hover:text-slate-400 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay !== null && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedDay(null); }}
        >
          <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h5 className="text-sm font-bold text-slate-700">
                {viewYear}.{pad(viewMonth + 1)}.{pad(selectedDay)}
              </h5>
              <button
                onClick={() => setSelectedDay(null)}
                className="cursor-pointer text-slate-300 hover:text-slate-500"
              >
                ✕
              </button>
            </div>
            <div className="flex max-h-[240px] flex-col gap-2 overflow-y-auto">
              {dayEvents.length === 0 && (
                <div className="py-4 text-center text-xs text-slate-300">일정이 없습니다.</div>
              )}
              {dayEvents.map((e) => (
                <div key={e.id} className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">
                  {e.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
