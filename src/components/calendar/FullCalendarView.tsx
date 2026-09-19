"use client";

import { useState } from "react";
import type { CalendarEventItem } from "@/types/shared";
import { Icon } from "@/components/ui/Icon";

const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function FullCalendarView({
  initialEvents,
  workId,
}: {
  initialEvents: CalendarEventItem[];
  workId?: string;
}) {
  const [events, setEvents] = useState(initialEvents);
  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [formHour, setFormHour] = useState("09:00");

  const viewBase = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const viewYear = viewBase.getFullYear();
  const viewMonth = viewBase.getMonth();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const firstDayIdx = new Date(viewYear, viewMonth, 1).getDay();
  const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate();

  const eventsByKey = new Map<string, CalendarEventItem[]>();
  for (const e of events) {
    const d = new Date(e.startAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const list = eventsByKey.get(key) ?? [];
    list.push(e);
    eventsByKey.set(key, list);
  }

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = firstDayIdx - 1; i >= 0; i--) {
    cells.push({ date: new Date(viewYear, viewMonth - 1, prevMonthLastDate - i), inMonth: false });
  }
  for (let d = 1; d <= lastDate; d++) {
    cells.push({ date: new Date(viewYear, viewMonth, d), inMonth: true });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }

  const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const isToday = (d: Date) =>
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const selectedEvents = selectedDate ? eventsByKey.get(keyOf(selectedDate)) ?? [] : [];

  const submitEvent = async () => {
    if (!title.trim() || !selectedDate) return;
    const [h, m] = formHour.split(":").map(Number);
    const startAt = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      h || 9,
      m || 0
    ).toISOString();
    const res = await fetch("/api/calendar-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, startAt, sharedWith: [], projectId: workId }),
    });
    if (res.ok) {
      const { event } = await res.json();
      setEvents((prev) => [...prev, event]);
      setTitle("");
      setShowForm(false);
    }
  };

  const removeEvent = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/calendar-events/${id}`, { method: "DELETE" });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600"
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
          </button>
          <h2 className="w-[120px] text-center text-lg font-bold text-slate-800">
            {viewYear}. {MONTH_NAMES[viewMonth]}
          </h2>
          <button
            onClick={() => setMonthOffset((o) => o + 1)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600"
          >
            <Icon name="chevronRight" className="h-4 w-4" />
          </button>
          {!isCurrentMonth && (
            <button
              onClick={() => setMonthOffset(0)}
              className="ml-1 cursor-pointer rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:bg-brand-light/12 hover:text-brand"
            >
              오늘
            </button>
          )}
        </div>
        <button
          onClick={() => {
            setSelectedDate(isCurrentMonth ? now : new Date(viewYear, viewMonth, 1));
            setTitle("");
            setShowForm(true);
          }}
          className="cursor-pointer rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-brand-deep"
        >
          + 일정 추가
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 pb-2 text-center text-[11px] font-semibold text-slate-400">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 gap-px overflow-hidden rounded-xl bg-slate-100">
        {cells.map(({ date, inMonth }, i) => {
          const dayEvents = eventsByKey.get(keyOf(date)) ?? [];
          const today = isToday(date);
          return (
            <div
              key={i}
              onClick={() => {
                setSelectedDate(date);
                setShowForm(false);
              }}
              className={`flex min-h-[92px] cursor-pointer flex-col gap-1 bg-white p-1.5 transition-all hover:bg-slate-50 ${
                inMonth ? "" : "opacity-40"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  today ? "bg-brand font-bold text-white" : "text-slate-500"
                }`}
              >
                {date.getDate()}
              </span>
              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className="truncate rounded bg-brand-light/15 px-1.5 py-[1px] text-[10px] font-medium text-brand-deep"
                  >
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="px-1.5 text-[9.5px] font-semibold text-slate-400">
                    +{dayEvents.length - 3}개 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDate(null);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h5 className="text-sm font-bold text-slate-700">
                {selectedDate.getFullYear()}.{pad(selectedDate.getMonth() + 1)}.
                {pad(selectedDate.getDate())}
              </h5>
              <button
                onClick={() => setSelectedDate(null)}
                className="cursor-pointer text-slate-300 hover:text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="mb-3 flex max-h-[240px] flex-col gap-2 overflow-y-auto">
              {selectedEvents.length === 0 && !showForm && (
                <div className="py-4 text-center text-xs text-slate-300">일정이 없습니다.</div>
              )}
              {selectedEvents.map((e) => (
                <div
                  key={e.id}
                  className="group flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10px] text-slate-400">
                      {pad(new Date(e.startAt).getHours())}:{pad(new Date(e.startAt).getMinutes())}
                    </div>
                    <div className="truncate">{e.title}</div>
                  </div>
                  <button
                    onClick={() => removeEvent(e.id)}
                    className="shrink-0 cursor-pointer text-slate-300 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {showForm ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="mb-2 flex gap-2">
                  <input
                    type="time"
                    value={formHour}
                    onChange={(e) => setFormHour(e.target.value)}
                    className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none"
                  />
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="일정 이름"
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none placeholder:text-slate-300"
                  />
                </div>
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
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="w-full cursor-pointer rounded-lg bg-slate-50 py-2 text-xs font-semibold text-slate-500 hover:bg-brand-light/12 hover:text-brand"
              >
                + 이 날짜에 일정 추가
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
