"use client";

import { useMemo, useState } from "react";

import type { TaskStatus } from "@/generated/prisma/enums";
import type { TaskItem } from "./types";

const DEFAULT_TAGS = [
  "LOIND_Web",
  "Platform_App",
  "Brand_Identity",
  "NAS_System",
];

const STATUS_LABEL: Record<TaskStatus, string> = {
  PENDING: "대기",
  IN_PROGRESS: "진행",
  REVIEW: "컨펌",
  DONE: "완료",
};

const STATUS_STYLE: Record<TaskStatus, string> = {
  PENDING: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  IN_PROGRESS: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  REVIEW: "border-blue-500/40 text-blue-400 bg-blue-500/10",
  DONE: "border-purple-500/40 text-purple-400 bg-purple-500/10",
};

const STATUS_ORDER: TaskStatus[] = ["PENDING", "IN_PROGRESS", "REVIEW", "DONE"];

function fmtDay(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).getDate();
}

export function WorkStationPanel({
  tasks,
  onTasksChange,
  currentUserId,
}: {
  tasks: TaskItem[];
  onTasksChange: (next: TaskItem[]) => void;
  currentUserId: string;
}) {
  const myTasks = useMemo(
    () => tasks.filter((t) => t.assignee.id === currentUserId),
    [tasks, currentUserId]
  );

  const tags = useMemo(() => {
    const set = new Set<string>(DEFAULT_TAGS);
    for (const t of myTasks) if (t.tag) set.add(t.tag);
    return Array.from(set);
  }, [myTasks]);

  const [filterTag, setFilterTag] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [tag, setTag] = useState(DEFAULT_TAGS[0]);
  const [startDay, setStartDay] = useState(new Date().getDate());
  const [dueDay, setDueDay] = useState(new Date().getDate());
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const visible = myTasks.filter(
    (t) => t.status !== "DONE" && (filterTag === "all" || t.tag === filterTag)
  );

  const total = myTasks.length;
  const done = myTasks.filter((t) => t.status === "DONE").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const dayToDate = (day: number) => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), day).toISOString();
  };

  const addTask = async () => {
    if (!text.trim()) return;

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: text,
        tag,
        startDate: dayToDate(startDay),
        dueDate: dayToDate(dueDay),
      }),
    });

    if (res.ok) {
      const { task } = await res.json();
      onTasksChange([task, ...tasks]);
      setText("");
      setShowForm(false);
    }
  };

  const changeStatus = async (id: string, status: TaskStatus) => {
    onTasksChange(
      tasks.map((t) => (t.id === id ? { ...t, status } : t))
    );
    setOpenDropdownId(null);
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  return (
    <div className="relative flex flex-col pt-5 md:px-6 md:pt-0">
      <div className="mb-3 flex items-center justify-between pb-2.5">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">
            WORK STATION
          </h4>
          <span className="font-mono text-[10px] text-white/30">
            PROJECT WORKSPACE
          </span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white transition-all hover:bg-white/10"
        >
          +
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1 font-mono text-[10px]">
        <button
          onClick={() => setFilterTag("all")}
          className={`cursor-pointer rounded border px-2.5 py-0.5 font-bold ${
            filterTag === "all"
              ? "border-white/10 bg-white text-slate-900"
              : "border-white/5 bg-white/5 font-medium text-white/40 hover:text-white"
          }`}
        >
          #ALL
        </button>
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => setFilterTag(t)}
            className={`cursor-pointer rounded border px-2.5 py-0.5 font-bold ${
              filterTag === t
                ? "border-white/10 bg-white text-slate-900"
                : "border-white/5 bg-white/5 font-medium text-white/40 hover:text-white"
            }`}
          >
            #{t}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="glass-input animate-fade-up mb-3 rounded-xl p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mb-2.5 w-full border-none bg-transparent text-xs text-white outline-none placeholder:text-white/20"
            placeholder="업무 태스크를 입력하세요..."
          />
          <div className="mb-2.5 grid grid-cols-2 gap-2 font-mono text-[10px]">
            <div className="rounded border border-white/5 bg-black/30 p-1">
              <span className="mb-0.5 block text-white/30">시작일 (Day):</span>
              <input
                type="number"
                min={1}
                max={31}
                value={startDay}
                onChange={(e) => setStartDay(Number(e.target.value))}
                className="w-full border-none bg-transparent font-bold text-white outline-none"
              />
            </div>
            <div className="rounded border border-white/5 bg-black/30 p-1">
              <span className="mb-0.5 block text-white/30">마감일 (Due Day):</span>
              <input
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(Number(e.target.value))}
                className="w-full border-none bg-transparent font-bold text-emerald-400 outline-none"
              />
            </div>
          </div>
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-[10px] text-white/40">배정 프로젝트:</span>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="rounded border border-white/10 bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80 outline-none"
            >
              {DEFAULT_TAGS.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-1.5 text-xs font-bold">
            <button
              onClick={() => setShowForm(false)}
              className="cursor-pointer rounded border border-white/10 px-2 py-0.5 text-white/50"
            >
              취소
            </button>
            <button
              onClick={addTask}
              className="cursor-pointer rounded bg-white px-2 py-0.5 text-slate-900"
            >
              배정
            </button>
          </div>
        </div>
      )}

      <div className="max-h-[250px] flex-1 space-y-1.5 overflow-y-auto pr-1">
        {visible.length === 0 && (
          <div className="select-none py-5 text-center text-xs text-white/20">
            No active tasks in this scope
          </div>
        )}
        {visible.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-xl p-2 transition-all hover:bg-white/5"
          >
            <div className="flex flex-1 items-start gap-3 min-w-0">
              <button
                onClick={() =>
                  setOpenDropdownId((cur) => (cur === t.id ? null : t.id))
                }
                className={`cursor-pointer select-none whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-bold transition-all ${STATUS_STYLE[t.status]}`}
              >
                {STATUS_LABEL[t.status]} ▾
              </button>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  {t.tag && (
                    <span className="rounded border border-white/5 bg-white/5 px-1.5 py-[1px] font-mono text-[9px] font-bold text-white/40">
                      #{t.tag}
                    </span>
                  )}
                  {t.dueDate && (
                    <span className="rounded border border-emerald-500/10 bg-emerald-500/5 px-1 font-mono text-[9px] font-medium text-emerald-400">
                      📅 {fmtDay(t.startDate)}일 ~ {fmtDay(t.dueDate)}일
                    </span>
                  )}
                </div>
                <div className="truncate text-xs font-medium text-white/90">
                  {t.title}
                </div>
              </div>
            </div>

            {openDropdownId === t.id && (
              <div className="glass-card absolute right-4 z-30 mt-1 flex flex-col gap-0.5 rounded-xl p-1.5 shadow-2xl">
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(t.id, s)}
                    className={`cursor-pointer whitespace-nowrap rounded px-3 py-1 text-left text-[10px] font-bold hover:bg-white/10 ${
                      s === "DONE" ? "border-t border-white/10 pt-1.5" : ""
                    }`}
                  >
                    {STATUS_LABEL[s]}
                    {s === "DONE" ? " (목록 제외)" : ""}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <div className="mr-3 h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-blue-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="whitespace-nowrap font-mono text-[10px] text-white/30">
          {pct}% 완료
        </span>
      </div>
    </div>
  );
}
