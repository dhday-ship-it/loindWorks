"use client";

import { useEffect, useState } from "react";

import type { Role } from "@/generated/prisma/enums";
import { CalendarPanel } from "@/components/calendar/CalendarPanel";
import { ProjectSummaryCard } from "./ProjectSummaryCard";
import { ProjectStreamTab } from "./ProjectStreamTab";
import { ProjectInfoPanel } from "./ProjectInfoPanel";
import { KanbanBoard, type KanbanTask } from "./KanbanBoard";
import { TaskDetailModal, type TaskDetailData } from "./TaskDetailModal";
import { ArchivePanel } from "./ArchivePanel";
import type { Person, ProjectDetail } from "./types";

export function ProjectContent({
  projectId,
  currentUser,
  staff,
}: {
  projectId: string;
  currentUser: { id: string; name: string | null; email: string; role: Role };
  staff: Person[];
}) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState<"kanban" | "stream" | "archive">("kanban");
  const [selectedTask, setSelectedTask] = useState<TaskDetailData | null>(null);

  const person: Person = { id: currentUser.id, name: currentUser.name, email: currentUser.email };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((d) => { setProject(d.project ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId]);

  // 8초 폴링
  useEffect(() => {
    if (!projectId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const { project: detail } = await res.json();
        setProject(detail);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [projectId]);

  const updateProject = (patch: Partial<ProjectDetail>) => {
    if (!project) return;
    setProject({ ...project, ...patch });
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-white/30">불러오는 중...</div>;
  }

  if (!project) {
    return <div className="flex h-full items-center justify-center text-sm text-white/30">프로젝트를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 상단: 프로젝트 요약 */}
      <div className="shrink-0">
        <ProjectSummaryCard project={project} onUpdate={updateProject} />
      </div>

      {/* 탭 전환 */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        {([
          { id: "kanban", label: "칸반 보드" },
          { id: "stream", label: "스트림" },
          { id: "archive", label: "아카이브" },
        ] as { id: typeof viewTab; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewTab(tab.id)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
              viewTab === tab.id
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {viewTab === "kanban" && project.tasks && (
          <KanbanBoard
            tasks={project.tasks as unknown as KanbanTask[]}
            onStatusChange={async (taskId, newStatus) => {
              const updated = (project.tasks ?? []).map((t) =>
                t.id === taskId ? { ...t, status: newStatus } : t
              );
              updateProject({ tasks: updated });
              await fetch(`/api/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
              });
            }}
            onReorder={async (taskId, newOrder, newStatus) => {
              const updated = (project.tasks ?? []).map((t) =>
                t.id === taskId ? { ...t, order: newOrder, status: newStatus } : t
              );
              updateProject({ tasks: updated });
              await fetch(`/api/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order: newOrder, status: newStatus }),
              });
            }}
            onTaskClick={async (task) => {
              const res = await fetch(`/api/tasks/${task.id}/comments`);
              const commentsData = res.ok ? await res.json() : { comments: [] };
              setSelectedTask({
                ...task,
                projectId: project.id,
                createdAt: "",
                comments: commentsData.comments ?? [],
                history: [],
                files: [],
              });
            }}
          />
        )}
        {viewTab === "stream" && (
          <ProjectStreamTab
            projectId={project.id}
            requests={project.requests}
            logs={project.logs}
            members={project.members}
            currentUser={person}
            currentUserRole={currentUser.role}
            onRequestsChange={(requests) => updateProject({ requests })}
            onLogsChange={(logs) => updateProject({ logs })}
          />
        )}
        {viewTab === "archive" && (
          <ArchivePanel
            projectId={project.id}
            onRestore={async () => {
              const res = await fetch(`/api/projects/${project.id}`);
              if (res.ok) {
                const { project: detail } = await res.json();
                setProject(detail);
              }
            }}
          />
        )}
      </div>

      {/* 작업 상세 모달 */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          members={project.members}
          currentUser={person}
          onClose={() => setSelectedTask(null)}
          onUpdate={(patch) => setSelectedTask((prev) => prev ? { ...prev, ...patch } : null)}
        />
      )}
    </div>
  );
}
