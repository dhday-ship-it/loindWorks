"use client";

import { useMemo, useState } from "react";

import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import type { ProjectSummary, TaskItem } from "./types";

const STATUS_LABEL: Record<TaskStatus, string> = {
  WAIT: "대기",
  IN_PROGRESS: "진행",
  REVIEW: "검토",
  FEEDBACK: "피드백",
  DONE: "완료",
};

const STATUS_STYLE: Record<TaskStatus, string> = {
  WAIT:        "badge-wait",
  IN_PROGRESS: "badge-progress",
  REVIEW:      "badge-review",
  FEEDBACK:    "badge-feedback",
  DONE:        "badge-done",
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  HIGH:   "bg-red-400",
  NORMAL: "bg-brand-light",
  LOW:    "bg-white/20",
};

const STATUS_ORDER: TaskStatus[] = ["WAIT", "IN_PROGRESS", "REVIEW", "FEEDBACK", "DONE"];

function fmtDue(iso: string | null): { label: string; urgent: boolean } | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: "오버듀", urgent: true };
  if (diff === 0) return { label: "오늘 마감", urgent: true };
  if (diff <= 3) return { label: `D-${diff}`, urgent: true };
  return { label: `D-${diff}`, urgent: false };
}

export function WorkStationPanel({
  tasks,
  onTasksChange,
  currentUserId,
  myProjects = [],
}: {
  tasks: TaskItem[];
  onTasksChange: (next: TaskItem[]) => void;
  currentUserId: string;
  myProjects?: ProjectSummary[];
}) {
  const myTasks = useMemo(
    () => tasks.filter((t) => t.assignee.id === currentUserId),
    [tasks, currentUserId]
  );

  const filterOptions = useMemo(
    () => myProjects.filter((p) => myTasks.some((t) => t.projectId === p.id)),
    [myProjects, myTasks]
  );

  const [filterProjectId, setFilterProjectId] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(myProjects[0]?.id ?? "");
  const [dueDay, setDueDay] = useState(new Date().getDate());
  const [priority, setPriority] = useState<TaskPriority>("NORMAL");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const visible = myTasks.filter(
    (t) => t.status !== "DONE" &&
      (filterProjectId === "all" || t.projectId === filterProjectId)
  );

  const total = myTasks.length;
  const done = myTasks.filter((t) => t.status === "DONE").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const addTask = async () => {
    if (!text.trim()) return;
    if (!selectedProjectId) return;

    const now = new Date();
    const due = new Date(now.getFullYear(), now.getMonth(), dueDay);

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: text,
        projectId: selectedProjectId,
        priority,
        dueDate: due.toISOString(),
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
    onTasksChange(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
    setOpenDropdownId(null);
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  return (
    <div className="relative flex flex-col pt-5 md:px-6 md:pt-0">
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between pb-2.5">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">
            WORK STATION
          </h4>
          <span className="font-mono text-[10px] text-white/30">
            MY TASKS
          </span>
        </div>
        <button
          onClick={() => {
            setSelectedProjectId(myProjects[0]?.id ?? "");
            setShowForm((v) => !v);
          }}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white transition-all hover:bg-white/10"
        >
          +
        </button>
      </div>

      {/* 프로젝트 필터 */}
      {filterOptions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1 font-mono text-[10px]">
          <button
            onClick={() => setFilterProjectId("all")}
            className={`cursor-pointer rounded-full border px-2.5 py-0.5 font-bold transition-all ${
              filterProjectId === "all"
                ? "border-white/10 bg-white text-slate-900"
                : "border-white/5 bg-white/5 text-white/40 hover:text-white"
            }`}
          >
            ALL
          </button>
          {filterOptions.map((p) => (
            <button
              key={p.id}
              onClick={() => setFilterProjectId(p.id)}
              className={`cursor-pointer rounded-full border px-2.5 py-0.5 font-bold transition-all ${
                filterProjectId === p.id
                  ? "border-brand/30 bg-brand text-white"
                  : "border-brand-light/15 bg-brand-light/5 text-brand-light/60 hover:text-brand-light"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* 생성 폼 */}
      {showForm && (
        <div className="glass-input animate-fade-up mb-3 rounded-xl p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            className="mb-2.5 w-full border-none bg-transparent text-xs text-white outline-none placeholder:text-white/20"
            placeholder="업무 내용..."
            autoFocus
          />
          <div className="mb-2 grid grid-cols-2 gap-2 font-mono text-[10px]">
            {/* 프로젝트 */}
            <div className="flex flex-col gap-0.5">
              <span className="text-white/30">프로젝트</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="rounded border border-white/10 bg-black/40 px-1.5 py-1 text-white outline-none"
              >
                {myProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {/* 마감일 */}
            <div className="flex flex-col gap-0.5">
              <span className="text-white/30">마감일 (일)</span>
              <input
                type="number" min={1} max={31} value={dueDay}
                onChange={(e) => setDueDay(Number(e.target.value))}
                className="rounded border border-white/10 bg-black/40 px-1.5 py-1 font-bold text-brand-light outline-none"
              />
            </div>
          </div>
          {/* 우선순위 */}
          <div className="mb-2.5 flex gap-1.5">
            {(["HIGH", "NORMAL", "LOW"] as TaskPriority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`flex-1 cursor-pointer rounded border py-0.5 text-[10px] font-bold transition-all ${
                  priority === p
                    ? p === "HIGH" ? "badge-high" : p === "NORMAL" ? "badge-normal" : "badge-low"
                    : "border-white/5 bg-white/5 text-white/30"
                }`}
              >
                {p === "HIGH" ? "🔴 긴급" : p === "NORMAL" ? "🔵 보통" : "⚪ 낮음"}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-1.5 text-xs font-bold">
            <button onClick={() => setShowForm(false)} className="cursor-pointer rounded border border-white/10 px-2 py-0.5 text-white/50">취소</button>
            <button onClick={addTask} className="cursor-pointer rounded bg-brand px-3 py-0.5 text-white">배정</button>
          </div>
        </div>
      )}

      {/* 태스크 목록 */}
      <div className="max-h-[260px] flex-1 space-y-1.5 overflow-y-auto pr-1">
        {visible.length === 0 && (
          <div className="select-none py-6 text-center text-xs text-white/20">
            진행 중인 업무가 없습니다.
          </div>
        )}
        {visible.map((t) => {
          const due = fmtDue(t.dueDate);
          const projName = myProjects.find((p) => p.id === t.projectId)?.name;
          return (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded-xl p-2 transition-all hover:bg-white/5"
            >
              {/* 우선순위 dot */}
              <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`} />

              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-white/90">{t.title}</div>
                <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px]">
                  {projName && (
                    <span className="text-brand-light/60">{projName}</span>
                  )}
                  {due && (
                    <span className={due.urgent ? "text-red-400 font-bold" : "text-white/30"}>
                      {due.label}
                    </span>
                  )}
                </div>
              </div>

              {/* 상태 버튼 */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setOpenDropdownId((cur) => cur === t.id ? null : t.id)}
                  className={`cursor-pointer select-none rounded-full border px-2 py-0.5 text-[9px] font-bold transition-all ${STATUS_STYLE[t.status]}`}
                >
                  {STATUS_LABEL[t.status]}
                </button>
                {openDropdownId === t.id && (
                  <div className="glass-card absolute right-0 top-7 z-30 flex flex-col gap-0.5 rounded-xl p-1.5 shadow-2xl">
                    {STATUS_ORDER.map((s) => (
                      <button
                        key={s}
                        onClick={() => changeStatus(t.id, s)}
                        className={`cursor-pointer whitespace-nowrap rounded px-3 py-1 text-left text-[10px] font-bold hover:bg-white/10 ${
                          s === t.status ? "text-white" : "text-white/50"
                        } ${s === "DONE" ? "border-t border-white/10 pt-1.5" : ""}`}
                      >
                        {STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 진행률 */}
      <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[10px] text-white/30">{pct}%</span>
      </div>
    </div>
  );
}
