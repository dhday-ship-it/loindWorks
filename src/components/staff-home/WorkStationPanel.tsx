"use client";

import { useMemo, useState } from "react";

import type { TaskStatus } from "@/generated/prisma/enums";
import { STATUS_LABEL, STATUS_STYLE, PRIORITY_DOT, STATUS_ORDER } from "@/lib/constants";
import type { ProjectSummary, TaskItem } from "./types";

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
  onTaskClick,
}: {
  tasks: TaskItem[];
  onTasksChange: (next: TaskItem[]) => void;
  currentUserId: string;
  myProjects?: ProjectSummary[];
  onTaskClick?: (projectId: string) => void;
}) {
  const myTasks = useMemo(
    () => tasks.filter((t) => t.assignee.id === currentUserId),
    [tasks, currentUserId]
  );

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const visible = myTasks.filter((t) => t.status !== "DONE");

  // Group visible tasks by project
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; tasks: typeof visible }>();
    for (const t of visible) {
      const projId = t.projectId ?? "none";
      const projName = myProjects.find((p) => p.id === projId)?.name ?? "기타";
      if (!map.has(projId)) {
        map.set(projId, { name: projName, tasks: [] });
      }
      map.get(projId)!.tasks.push(t);
    }
    return Array.from(map.values());
  }, [visible, myProjects]);

  const total = myTasks.length;
  const done = myTasks.filter((t) => t.status === "DONE").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

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
          <span className="font-mono text-[10px] text-white/45">
            MY TASKS
          </span>
        </div>
      </div>

      {/* 태스크 목록 (프로젝트별 그룹) */}
      <div className="max-h-[260px] flex-1 space-y-3 overflow-y-auto pr-1">
        {visible.length === 0 && (
          <div className="select-none py-6 text-center text-xs text-white/40">
            진행 중인 업무가 없습니다.
          </div>
        )}
        {grouped.map((group) => (
          <div key={group.name}>
            {/* Project name header */}
            <div className="mb-1 font-mono text-[10px] font-bold text-brand-light/70">
              {group.name}
            </div>
            {/* Tasks in this project */}
            <div className="space-y-1">
              {group.tasks.map((t) => {
                const due = fmtDue(t.dueDate);
                return (
                  <div
                    key={t.id}
                    onClick={() => t.projectId && onTaskClick?.(t.projectId)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl p-2 transition-all hover:bg-white/5"
                  >
                    {/* 우선순위 dot */}
                    <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`} />

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-white/90">{t.title}</div>
                      {due && (
                        <div className="mt-0.5 font-mono text-[9px]">
                          <span className={due.urgent ? "text-red-400 font-bold" : "text-white/45"}>
                            {due.label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 상태 버튼 */}
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenDropdownId((cur) => cur === t.id ? null : t.id); }}
                        className={`cursor-pointer select-none rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all ${STATUS_STYLE[t.status]}`}
                      >
                        {STATUS_LABEL[t.status]}
                      </button>
                      {openDropdownId === t.id && (
                        <div className="glass-card absolute right-0 top-7 z-30 flex flex-col gap-0.5 rounded-xl p-1.5 shadow-2xl">
                          {STATUS_ORDER.map((s) => (
                            <button
                              key={s}
                              onClick={(e) => { e.stopPropagation(); changeStatus(t.id, s); }}
                              className={`cursor-pointer whitespace-nowrap rounded py-2 px-4 text-left text-[10px] font-bold hover:bg-white/10 ${
                                s === t.status ? "text-white" : "text-white/50 hover:text-white"
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
          </div>
        ))}
      </div>

      {/* 하단 진행률 */}
      <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[10px] text-white/45">{pct}%</span>
      </div>
    </div>
  );
}
