"use client";

import { useMemo, useState } from "react";

import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import { colorForId, initials, type Person } from "./types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PMTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignee: Person;
  projectId: string;
  projectName: string;
}

interface Props {
  tasks: PMTask[];
  onTaskClick?: (taskId: string, projectId: string) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<TaskStatus, string> = {
  WAIT: "대기",
  IN_PROGRESS: "진행",
  REVIEW: "검토",
  FEEDBACK: "피드백",
  DONE: "완료",
};

const STATUS_STYLE: Record<TaskStatus, string> = {
  WAIT: "badge-wait",
  IN_PROGRESS: "badge-progress",
  REVIEW: "badge-review",
  FEEDBACK: "badge-feedback",
  DONE: "badge-done",
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  HIGH: "bg-[#c9595a]",
  NORMAL: "bg-[#8fa8c4]",
  LOW: "bg-white/20",
};

type FilterStatus = TaskStatus | "ALL";
type SortBy = "dueDate" | "priority" | "project";

function fmtDue(iso: string | null): { label: string; urgent: boolean } | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: `${Math.abs(diff)}일 초과`, urgent: true };
  if (diff === 0) return { label: "오늘 마감", urgent: true };
  if (diff <= 3) return { label: `D-${diff}`, urgent: true };
  return { label: `D-${diff}`, urgent: false };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PMOverviewPanel({ tasks, onTaskClick }: Props) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("dueDate");

  // 통계
  const total = tasks.length;
  const activeTasks = tasks.filter((t) => t.status !== "DONE");
  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, number> = {
      WAIT: 0, IN_PROGRESS: 0, REVIEW: 0, FEEDBACK: 0, DONE: 0,
    };
    for (const t of tasks) map[t.status]++;
    return map;
  }, [tasks]);

  const overdue = activeTasks.filter((t) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
  }).length;

  // 필터 + 정렬
  const filtered = useMemo(() => {
    let list = filterStatus === "ALL"
      ? activeTasks
      : tasks.filter((t) => t.status === filterStatus);

    list = [...list].sort((a, b) => {
      if (sortBy === "dueDate") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === "priority") {
        const order = { HIGH: 0, NORMAL: 1, LOW: 2 };
        return order[a.priority] - order[b.priority];
      }
      return a.projectName.localeCompare(b.projectName);
    });

    return list;
  }, [tasks, activeTasks, filterStatus, sortBy]);

  return (
    <div className="flex flex-col gap-5">
      {/* 헤더 */}
      <div>
        <h3 className="text-sm font-bold text-white">전체 현황</h3>
        <p className="mt-0.5 font-mono text-[10px] text-white/30">
          내 프로젝트 전체 작업 · {total}건
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {(Object.entries(byStatus) as [TaskStatus, number][]).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? "ALL" : status)}
            className={`flex cursor-pointer flex-col items-center rounded-xl border px-2 py-2.5 transition-all ${
              filterStatus === status
                ? "border-white/20 bg-white/10"
                : "border-white/5 bg-white/[0.02] hover:bg-white/5"
            }`}
          >
            <span className="font-mono text-lg font-bold text-white/85">{count}</span>
            <span className={`mt-0.5 rounded-full border px-1.5 py-0.5 text-[8px] font-bold ${STATUS_STYLE[status]}`}>
              {STATUS_LABEL[status]}
            </span>
          </button>
        ))}
        {overdue > 0 && (
          <div className="flex flex-col items-center rounded-xl border border-[#c9595a]/20 bg-[#c9595a]/5 px-2 py-2.5">
            <span className="font-mono text-lg font-bold text-[#c9595a]">{overdue}</span>
            <span className="mt-0.5 text-[8px] font-bold text-[#c9595a]/70">오버듀</span>
          </div>
        )}
      </div>

      {/* 정렬 */}
      <div className="flex items-center gap-2 font-mono text-[10px]">
        <span className="text-white/30">정렬:</span>
        {([
          { id: "dueDate", label: "마감일순" },
          { id: "priority", label: "우선순위" },
          { id: "project", label: "프로젝트" },
        ] as { id: SortBy; label: string }[]).map((s) => (
          <button
            key={s.id}
            onClick={() => setSortBy(s.id)}
            className={`cursor-pointer rounded-full border px-2 py-0.5 font-bold transition-all ${
              sortBy === s.id
                ? "border-brand-light/30 bg-brand-light/10 text-brand-light"
                : "border-white/5 bg-white/5 text-white/35 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 태스크 리스트 */}
      <div className="space-y-1.5">
        {filtered.length === 0 && (
          <div className="py-8 text-center font-mono text-xs text-white/20">
            {filterStatus === "ALL" ? "진행 중인 작업이 없습니다" : `'${STATUS_LABEL[filterStatus]}' 상태의 작업이 없습니다`}
          </div>
        )}
        {filtered.map((t) => {
          const due = fmtDue(t.dueDate);
          return (
            <div
              key={t.id}
              onClick={() => onTaskClick?.(t.id, t.projectId)}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/5"
            >
              {/* Priority */}
              <div className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`} />

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-white/90">{t.title}</div>
                <div className="mt-0.5 flex items-center gap-2 font-mono text-[9px] text-white/35">
                  <span className="text-brand-light/60">{t.projectName}</span>
                  {due && (
                    <span className={due.urgent ? "font-bold text-[#c9595a]" : ""}>
                      {due.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Assignee */}
              <div className="flex shrink-0 items-center gap-1.5">
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                  style={{ background: colorForId(t.assignee.id) }}
                >
                  {initials(t.assignee)}
                </div>
              </div>

              {/* Status */}
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold ${STATUS_STYLE[t.status]}`}>
                {STATUS_LABEL[t.status]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
