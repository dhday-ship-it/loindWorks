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

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "WAIT", label: "대기" },
  { status: "IN_PROGRESS", label: "진행중" },
  { status: "REVIEW", label: "검토" },
  { status: "FEEDBACK", label: "피드백" },
  { status: "DONE", label: "완료" },
];

const PRIORITY_DOT: Record<TaskPriority, string> = {
  HIGH: "bg-red-400",
  NORMAL: "bg-brand-light",
  LOW: "bg-white/20",
};

function dDay(iso: string | null) {
  if (!iso) return null;
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `D+${Math.abs(diff)}`;
  if (diff === 0) return "오늘";
  return `D-${diff}`;
}

export function ProjectKanban({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.project) {
          setProjectName(d.project.name);
          setTasks(d.project.tasks ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const changeStatus = async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-white/30">불러오는 중...</div>;
  }

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4 font-mono">
        <div className="flex items-center gap-2.5 text-xs font-bold tracking-widest text-brand-light">
          <span className="h-2 w-2 rounded-full bg-brand-light" />
          {projectName}
        </div>
        <span className="text-[10px] text-white/30">{tasks.length}개 작업</span>
      </div>

      {/* 칸반 컬럼 */}
      <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className="flex w-40 shrink-0 flex-col rounded-xl border border-white/8 bg-white/[0.03] xl:flex-1">
              {/* 컬럼 헤더 */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/45">
                  {col.label}
                </span>
                <span className="rounded-full bg-white/8 px-1.5 py-0.5 font-mono text-[9px] text-white/30">
                  {colTasks.length}
                </span>
              </div>

              {/* 카드 목록 */}
              <div className="flex-1 space-y-2 overflow-y-auto p-2">
                {colTasks.length === 0 && (
                  <div className="py-4 text-center text-[10px] text-white/15">비어 있음</div>
                )}
                {colTasks.map((task) => {
                  const due = dDay(task.dueDate);
                  // 다음 상태 계산
                  const currentIdx = COLUMNS.findIndex((c) => c.status === task.status);
                  const nextStatus = currentIdx < COLUMNS.length - 1 ? COLUMNS[currentIdx + 1] : null;
                  const prevStatus = currentIdx > 0 ? COLUMNS[currentIdx - 1] : null;

                  return (
                    <div key={task.id} className="rounded-xl border border-white/8 bg-white/5 p-3 transition-all hover:border-white/15">
                      {/* 우선순위 + 제목 */}
                      <div className="mb-2 flex items-start gap-2">
                        <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                        <span className="flex-1 text-[11px] font-medium leading-snug text-white/85">{task.title}</span>
                      </div>

                      {/* 담당자 + 마감 */}
                      <div className="mb-2 flex items-center justify-between text-[9px] text-white/35">
                        <span>👤 {task.assignee.name ?? task.assignee.email.split("@")[0]}</span>
                        {due && <span className={due.startsWith("D+") || due === "오늘" ? "font-bold text-red-400" : ""}>{due}</span>}
                      </div>

                      {/* 상태 이동 버튼 */}
                      <div className="flex gap-1">
                        {prevStatus && (
                          <button
                            onClick={() => changeStatus(task.id, prevStatus.status)}
                            className="flex-1 cursor-pointer rounded border border-white/10 py-1 text-[9px] font-bold text-white/30 transition-all hover:bg-white/10 hover:text-white"
                          >
                            ← {prevStatus.label}
                          </button>
                        )}
                        {nextStatus && (
                          <button
                            onClick={() => changeStatus(task.id, nextStatus.status)}
                            className="flex-1 cursor-pointer rounded border border-brand-light/20 bg-brand-light/5 py-1 text-[9px] font-bold text-brand-light transition-all hover:bg-brand-light/15"
                          >
                            {nextStatus.label} →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
