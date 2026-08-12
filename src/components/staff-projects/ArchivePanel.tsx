"use client";

import { useEffect, useState } from "react";

import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import { colorForId, initials, type Person } from "./types";

interface ArchivedTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  archivedAt: string | null;
  createdAt: string;
  assignee: Person;
  project: { id: string; name: string };
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  WAIT: "대기",
  IN_PROGRESS: "진행",
  REVIEW: "검토",
  FEEDBACK: "피드백",
  DONE: "완료",
};

export function ArchivePanel({
  projectId,
  onRestore,
}: {
  projectId?: string;
  onRestore?: (taskId: string) => void;
}) {
  const [tasks, setTasks] = useState<ArchivedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = projectId
      ? `/api/tasks/archived?projectId=${projectId}`
      : "/api/tasks/archived";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setTasks(data.tasks))
      .finally(() => setLoading(false));
  }, [projectId]);

  const restore = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}/archive`, { method: "DELETE" });
    onRestore?.(id);
  };

  if (loading) {
    return (
      <div className="py-8 text-center font-mono text-xs text-white/20">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white">완료 아카이브</h4>
          <p className="mt-0.5 font-mono text-[10px] text-white/30">
            아카이브된 작업 {tasks.length}건
          </p>
        </div>
      </div>

      {tasks.length === 0 && (
        <div className="py-10 text-center font-mono text-xs text-white/20">
          아카이브된 작업이 없습니다
        </div>
      )}

      <div className="space-y-1.5">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 opacity-70 transition-all hover:opacity-100"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-white/70 line-through">
                {t.title}
              </div>
              <div className="mt-0.5 flex items-center gap-2 font-mono text-[9px] text-white/30">
                <span>{t.project.name}</span>
                <span>{STATUS_LABEL[t.status]}</span>
                {t.archivedAt && (
                  <span>
                    아카이브: {new Date(t.archivedAt).toLocaleDateString("ko-KR")}
                  </span>
                )}
              </div>
            </div>

            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
              style={{ background: colorForId(t.assignee.id) }}
            >
              {initials(t.assignee)}
            </div>

            <button
              onClick={() => restore(t.id)}
              className="shrink-0 cursor-pointer rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] font-bold text-white/40 transition-all hover:bg-white/10 hover:text-white"
            >
              복원
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
