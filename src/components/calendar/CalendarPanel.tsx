"use client";

import { useEffect, useState } from "react";

import type { TaskItem } from "@/components/staff-home/types";
import type { ProjectSummary } from "@/components/staff-home/types";
import type { CalendarEventItem } from "./types";

const MONTH_NAMES = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CalendarPanel({
  initialEvents,
  tasks = [],
  projectId,
  myProjects = [],
}: {
  initialEvents: CalendarEventItem[];
  tasks?: TaskItem[];
  projectId?: string;
  myProjects?: ProjectSummary[];
}) {
  const [events, setEvents] = useState(initialEvents);
  const [syncedEvents, setSyncedEvents] = useState(initialEvents);
  if (initialEvents !== syncedEvents) {
    setSyncedEvents(initialEvents);
    setEvents(initialEvents);
  }
  const [now, setNow] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [day, setDay] = useState(now.getDate());
  const [hour, setHour] = useState(now.getHours());
  const [minute, setMinute] = useState(0);
  const [share, setShare] = useState("");
  // 대시보드 모드(myProjects 있을 때)에서 선택한 프로젝트
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  const viewYear = now.getFullYear();
  const viewMonth = now.getMonth();
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

  const tasksDueByDay = new Map<number, TaskItem[]>();
  for (const t of tasks) {
    if (!t.dueDate || t.status === "DONE") continue;
    const d = new Date(t.dueDate);
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const list = tasksDueByDay.get(d.getDate()) ?? [];
      list.push(t);
      tasksDueByDay.set(d.getDate(), list);
    }
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );

  const openAddForm = (presetDay?: number) => {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setDay(presetDay ?? now.getDate());
    setHour(now.getHours());
    setMinute(0);
    setShare("");
    setTitle("");
    setSelectedProjectId(myProjects[0]?.id ?? "");
    setShowForm(true);
  };

  const submitEvent = async () => {
    if (!title.trim()) return;
    const startAt = new Date(year, month - 1, day, hour, minute).toISOString();
    const sharedWith = share
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // 대시보드 모드: selectedProjectId 우선, 프로젝트 페이지 모드: prop의 projectId 사용
    const resolvedProjectId =
      myProjects.length > 0
        ? selectedProjectId || undefined
        : projectId || undefined;

    const res = await fetch("/api/calendar-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        startAt,
        sharedWith,
        projectId: resolvedProjectId,
      }),
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

  const dayEvents =
    selectedDay !== null ? eventsByDay.get(selectedDay) ?? [] : [];
  const dayTasks =
    selectedDay !== null ? tasksDueByDay.get(selectedDay) ?? [] : [];

  return (
    <div className="flex flex-col justify-between pb-5 md:pb-0 md:pr-6">
      <div>
        <div className="mb-4 flex items-center justify-between pb-2.5">
          <div className="flex flex-col">
            <div
              className="font-mono text-2xl font-bold tracking-tight text-white"
              suppressHydrationWarning
            >
              {pad(now.getHours())}:{pad(now.getMinutes())}
            </div>
            <div className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-white/40">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
          </div>
          <button
            onClick={() => openAddForm()}
            className="cursor-pointer rounded-md border border-white/10 px-2 py-0.5 text-xs font-bold text-white/60 transition-all hover:text-white"
          >
            + 일정 생성
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-y-2 text-center text-xs font-medium text-white/50">
          <div className="font-bold text-red-400/50">S</div>
          <div>M</div>
          <div>T</div>
          <div>W</div>
          <div>T</div>
          <div>F</div>
          <div className="font-bold text-blue-400/50">S</div>
        </div>

        <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-medium text-white/70">
          {Array.from({ length: firstDayIdx }).map((_, i) => (
            <div key={`blank-${i}`} className="py-2" />
          ))}
          {Array.from({ length: lastDate }).map((_, i) => {
            const d = i + 1;
            const isToday = d === today;
            const dow = (firstDayIdx + d - 1) % 7;
            const hasEvent = eventsByDay.has(d);
            const hasDue = tasksDueByDay.has(d);

            return (
              <div
                key={d}
                onClick={() => setSelectedDay(d)}
                className={
                  isToday
                    ? "flex min-h-[38px] scale-105 flex-col items-center justify-center rounded-md bg-white font-bold text-slate-900 shadow-md"
                    : `flex min-h-[38px] cursor-pointer flex-col items-center justify-center rounded-md hover:bg-white/10 hover:text-white ${
                        dow === 0
                          ? "text-red-400/60"
                          : dow === 6
                            ? "text-blue-400/60"
                            : ""
                      }`
                }
              >
                <span>{d}</span>
                {(hasEvent || hasDue) && (
                  <div className="mt-0.5 flex items-center justify-center gap-0.5">
                    {hasEvent && (
                      <div
                        className={`h-1 w-1 rounded-full ${isToday ? "bg-slate-900" : "bg-brand-light"}`}
                      />
                    )}
                    {hasDue && (
                      <div
                        className={`h-1 w-1 rounded-full ${isToday ? "bg-indigo-950" : "bg-blue-400"}`}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showForm && (
          <div className="animate-fade-up mt-4 rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-brand-light">
              NEW SCHEDULE
            </div>
            <div className="mb-2 grid grid-cols-5 gap-1 text-center font-mono text-xs">
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded border border-white/10 bg-white/5 py-0.5 text-white outline-none"
                placeholder="년"
              />
              <input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="rounded border border-white/10 bg-white/5 py-0.5 text-white outline-none"
                placeholder="월"
              />
              <input
                type="number"
                min={1}
                max={31}
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="rounded border border-white/10 bg-white/5 py-0.5 text-white outline-none"
                placeholder="일"
              />
              <input
                type="number"
                min={0}
                max={23}
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                className="rounded border border-white/10 bg-white/5 py-0.5 text-white outline-none"
                placeholder="시"
              />
              <input
                type="number"
                min={0}
                max={59}
                value={minute}
                onChange={(e) => setMinute(Number(e.target.value))}
                className="rounded border border-white/10 bg-white/5 py-0.5 text-white outline-none"
                placeholder="분"
              />
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none placeholder:text-white/20"
              placeholder="일정 명칭 및 세부 내용..."
            />
            {/* 대시보드 모드: 프로젝트 선택 */}
            {myProjects.length > 0 && (
              <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-white/5 bg-black/30 px-2 py-1.5">
                <span className="shrink-0 text-[10px] font-medium text-white/40">
                  📁 프로젝트:
                </span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="flex-1 border-none bg-transparent text-xs text-white outline-none"
                >
                  <option value="">연결 안 함</option>
                  {myProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-black/30 px-2 py-1">
              <span className="shrink-0 text-[10px] font-medium text-white/40">
                공유 대상:
              </span>
              <input
                value={share}
                onChange={(e) => setShare(e.target.value)}
                className="w-full border-none bg-transparent text-xs text-white outline-none placeholder:text-white/20"
                placeholder="이름 입력 (쉼표로 구분 예: 이현린, 박책임)"
              />
            </div>
            <div className="mt-2.5 flex gap-2 text-xs font-bold">
              <button
                onClick={submitEvent}
                className="flex-1 cursor-pointer rounded-md bg-white py-1 text-slate-900"
              >
                등록
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 cursor-pointer rounded-md bg-white/5 py-1 text-white/40"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex max-h-[110px] flex-1 flex-col gap-1.5 overflow-y-auto border-t border-white/5 pt-3">
        <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-white/30">
          TOTAL TIMELINE
        </span>
        {sortedEvents.length === 0 && (
          <div className="py-4 text-center font-mono text-[10px] text-white/20">
            등록된 일정이 없습니다
          </div>
        )}
        {sortedEvents.map((e) => {
          const d = new Date(e.startAt);
          const projName = myProjects.find((p) => p.id === e.projectId)?.name;
          return (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-lg border border-transparent px-2 py-1 text-[11px] transition-all hover:border-white/5 hover:bg-white/5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 truncate font-mono">
                <span className="shrink-0 rounded border border-brand-light/20 bg-brand-light/5 px-1 text-[9px] font-bold text-brand-light">
                  {pad(d.getMonth() + 1)}.{pad(d.getDate())} {pad(d.getHours())}:{pad(d.getMinutes())}
                </span>
                {projName && (
                  <span className="shrink-0 rounded border border-blue-400/20 bg-blue-400/5 px-1 text-[9px] font-bold text-blue-300">
                    {projName}
                  </span>
                )}
                <span className="flex-1 truncate font-medium text-white/80">
                  {e.title}
                </span>
              </div>
              <button
                onClick={() => removeEvent(e.id)}
                className="shrink-0 cursor-pointer pl-1.5 text-white/20 hover:text-white"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {selectedDay !== null && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDay(null);
          }}
        >
          <div className="glass-card animate-fade-up flex w-full max-w-sm flex-col overflow-hidden rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-3.5">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-light">
                  Workstation Scheduler
                </span>
                <h5 className="mt-0.5 font-mono text-xs font-bold text-white">
                  {viewYear}.{pad(viewMonth + 1)}.{pad(selectedDay)}
                </h5>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="cursor-pointer p-1 text-sm text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[300px] space-y-3 overflow-y-auto p-5">
              {dayEvents.length === 0 && dayTasks.length === 0 && (
                <div className="py-6 text-center text-xs font-medium text-white/30">
                  기록된 일정 및 마감 업무가 없습니다.
                </div>
              )}
              {dayEvents.map((e) => {
                const d = new Date(e.startAt);
                const projName = myProjects.find((p) => p.id === e.projectId)?.name;
                return (
                  <div
                    key={e.id}
                    className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/5 p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-brand-light">
                        {pad(d.getHours())}:{pad(d.getMinutes())}
                      </div>
                      {projName && (
                        <span className="rounded border border-blue-400/20 bg-blue-400/5 px-1.5 text-[9px] font-bold text-blue-300">
                          📁 {projName}
                        </span>
                      )}
                    </div>
                    <div className="break-all text-xs font-medium leading-relaxed text-white/90">
                      {e.title}
                    </div>
                    {e.sharedWith.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.sharedWith.map((s) => (
                          <span
                            key={s}
                            className="rounded-sm bg-white/10 px-1 text-[8px] text-white/60"
                          >
                            👥 {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {dayTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col gap-1 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-2.5"
                >
                  <div className="flex items-center justify-between font-mono text-[9px] font-bold text-blue-400">
                    <span>WORK STATION DUE TASK</span>
                    {t.tag && (
                      <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1">
                        #{t.tag}
                      </span>
                    )}
                  </div>
                  <div className="break-all text-xs font-medium leading-relaxed text-blue-100/90">
                    {t.title}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-1.5 border-t border-white/10 bg-black/20 px-5 py-3 text-xs font-bold">
              <button
                onClick={() => {
                  const d = selectedDay;
                  setSelectedDay(null);
                  openAddForm(d ?? undefined);
                }}
                className="cursor-pointer rounded bg-white/10 px-3 py-1 text-white hover:bg-white/20"
              >
                + 일정 추가
              </button>
              <button
                onClick={() => setSelectedDay(null)}
                className="cursor-pointer rounded bg-white px-3 py-1 text-slate-900"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
