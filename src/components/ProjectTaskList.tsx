"use client";

import { useEffect, useState } from "react";
import type { TaskStatus, TaskPriority } from "@/generated/prisma/enums";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignee: { id: string; name: string | null; email: string };
}

const STATUS_ORDER: TaskStatus[] = ["WAIT", "IN_PROGRESS", "REVIEW", "FEEDBACK", "DONE"];
const STATUS_LABEL: Record<TaskStatus, string> = {
  WAIT: "대기",
  IN_PROGRESS: "진행",
  REVIEW: "검토",
  FEEDBACK: "피드백",
  DONE: "완료",
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  HIGH: "bg-red-400",
  NORMAL: "bg-[#55689b]",
  LOW: "bg-white/20",
};

function dDay(iso: string | null) {
  if (!iso) return null;
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: `D+${Math.abs(diff)}`, urgent: true };
  if (diff === 0) return { label: "오늘", urgent: true };
  if (diff <= 3) return { label: `D-${diff}`, urgent: true };
  return { label: `D-${diff}`, urgent: false };
}

interface Props {
  projectId: string;
  projectName: string;
}

export function ProjectTaskList({ projectId, projectName }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        setTasks(d.project?.tasks ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  const changeStatus = async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-white/30">불러오는 중...</div>;
  }

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5 font-mono text-xs font-bold tracking-widest text-brand-light">
          <span className="h-2 w-2 rounded-full bg-brand-light" />
          {projectName}
        </div>
        <span className="font-mono text-[10px] text-white/30">{tasks.length}개 작업</span>
      </div>

      {/* 작업 리스트 */}
      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {tasks.length === 0 && (
          <div className="py-12 text-center text-sm text-white/25">
            작업이 없습니다
          </div>
        )}
        {tasks.map((t) => {
          const due = dDay(t.dueDate);
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 transition-all hover:border-white/10"
            >
              {/* 우선순위 */}
              <div className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`} />

              {/* 제목 + 담당자 + 마감 */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-white/85">{t.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/35">
                  <span>👤 {t.assignee.name ?? t.assignee.email.split("@")[0]}</span>
                  {due && (
                    <span className={due.urgent ? "font-bold text-red-400" : ""}>
                      {due.label}
                    </span>
                  )}
                </div>
              </div>

              {/* 상태 버튼 */}
              <div className="flex shrink-0 gap-1">
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(t.id, s)}
                    className={`cursor-pointer rounded-full border px-2 py-0.5 text-[9px] font-bold transition-all ${
                      t.status === s
                        ? s === "WAIT" ? "border-white/20 bg-white/10 text-white/70"
                          : s === "IN_PROGRESS" ? "border-[#55689b]/40 bg-[#55689b]/15 text-[#8fa8c4]"
                          : s === "REVIEW" ? "border-[#8fa8c4]/30 bg-[#8fa8c4]/10 text-[#8fa8c4]"
                          : s === "FEEDBACK" ? "border-[#e8956d]/30 bg-[#e8956d]/10 text-[#e8956d]"
                          : "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                        : "border-white/5 text-white/20 hover:border-white/15 hover:text-white/50"
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
