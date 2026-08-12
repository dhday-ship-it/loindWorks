"use client";

import { useEffect, useRef, useState } from "react";

import type { Role } from "@/generated/prisma/enums";
import { usePolling } from "@/lib/hooks/usePolling";
import { CalendarPanel } from "@/components/calendar/CalendarPanel";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { ProjectSummaryCard } from "./ProjectSummaryCard";
import { ProjectStreamTab } from "./ProjectStreamTab";
import { ProjectInfoPanel } from "./ProjectInfoPanel";
import { KanbanBoard, type KanbanTask } from "./KanbanBoard";
import { TaskDetailModal, type TaskDetailData } from "./TaskDetailModal";
import { NewTaskModal } from "./NewTaskModal";
import type { Person, ProjectDetail } from "./types";

const ARCHIVE_URL = "https://loind.tw2.quickconnect.to/";

export function ProjectContent({
  projectId,
  currentUser,
  initialTaskId,
}: {
  projectId: string;
  currentUser: { id: string; name: string | null; email: string; role: Role };
  initialTaskId?: string | null;
}) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [viewTab, setViewTab] = useState<"kanban" | "stream">("kanban");
  const [selectedTask, setSelectedTask] = useState<TaskDetailData | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [openedInitialTask, setOpenedInitialTask] = useState(false);

  const { toasts, show: showToast, dismiss } = useToast();
  const inFlightRef = useRef<Set<string>>(new Set());

  const person: Person = { id: currentUser.id, name: currentUser.name, email: currentUser.email };

  const openTask = async (task: KanbanTask) => {
    const res = await fetch(`/api/tasks/${task.id}/comments`);
    const commentsData = res.ok ? await res.json() : { comments: [] };
    setSelectedTask({
      ...task,
      projectId,
      createdAt: "",
      comments: commentsData.comments ?? [],
      history: [],
    });
  };

  useEffect(() => {
    let cancelled = false;

    const attemptFetch = async (retriesLeft: number): Promise<void> => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) {
          if (res.status === 404) {
            if (!cancelled) {
              setProject(null);
              setLoading(false);
            }
            return;
          }
          throw new Error(`요청 실패 (${res.status})`);
        }
        const data = await res.json();
        if (!cancelled) {
          setProject(data.project ?? null);
          setLoading(false);
        }
      } catch {
        if (retriesLeft > 0) {
          await new Promise((r) => setTimeout(r, 800));
          if (!cancelled) await attemptFetch(retriesLeft - 1);
          return;
        }
        if (!cancelled) {
          setLoadError(true);
          setLoading(false);
        }
      }
    };

    attemptFetch(2);
    return () => {
      cancelled = true;
    };
  }, [projectId, retryTick]);

  // 8초 폴링 (usePolling 훅 사용)
  usePolling({
    url: `/api/projects/${projectId}`,
    interval: 8000,
    enabled: !loading && !loadError && !!project,
    onData: (data: { project: ProjectDetail }) => {
      setProject(data.project ?? null);
    },
  });

  useEffect(() => {
    if (!project || !initialTaskId || openedInitialTask) return;
    const task = project.tasks?.find((t) => t.id === initialTaskId);
    if (!task) {
      Promise.resolve().then(() => setOpenedInitialTask(true));
      return;
    }
    fetch(`/api/tasks/${task.id}/comments`)
      .then((res) => (res.ok ? res.json() : { comments: [] }))
      .then((commentsData) => {
        setOpenedInitialTask(true);
        setSelectedTask({
          ...task,
          projectId,
          createdAt: "",
          comments: commentsData.comments ?? [],
          history: [],
        });
      });
  }, [project, initialTaskId, openedInitialTask, projectId]);

  const updateProject = (patch: Partial<ProjectDetail>) => {
    if (!project) return;
    setProject({ ...project, ...patch });
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-white/30">불러오는 중...</div>;
  }

  if (loadError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-white/30">
        <span>불러오지 못했습니다. 네트워크 상태를 확인해주세요.</span>
        <button
          onClick={() => {
            setLoading(true);
            setLoadError(false);
            setRetryTick((t) => t + 1);
          }}
          className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition-all hover:bg-white/10 hover:text-white"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!project) {
    return <div className="flex h-full items-center justify-center text-sm text-white/30">프로젝트를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="grid h-full grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
      <div className="flex min-w-0 flex-col gap-4 overflow-y-auto">
        {/* 상단: 프로젝트 요약 */}
        <div className="shrink-0">
          <ProjectSummaryCard project={project} onUpdate={updateProject} />
        </div>

        {/* 탭 전환 */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            {([
              { id: "kanban", label: "작업 보드" },
              { id: "stream", label: "기록" },
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
            <a
              href={ARCHIVE_URL}
              target="_blank"
              rel="noreferrer"
              className="flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white/40 transition-all hover:bg-white/5 hover:text-white/70"
            >
              아카이브 ↗
            </a>
          </div>
          {viewTab === "kanban" && (
            <button
              onClick={() => setShowNewTask(true)}
              className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/60 transition-all hover:bg-white/10 hover:text-white"
            >
              + 새 작업
            </button>
          )}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="flex-1">
        {viewTab === "kanban" && project.tasks && (
          <KanbanBoard
            tasks={project.tasks as unknown as KanbanTask[]}
            onStatusChange={async (taskId, newStatus) => {
              if (inFlightRef.current.has(`status-${taskId}`)) return;
              inFlightRef.current.add(`status-${taskId}`);
              const previous = project.tasks ?? [];
              const updated = previous.map((t) =>
                t.id === taskId ? { ...t, status: newStatus } : t
              );
              updateProject({ tasks: updated });
              try {
                const res = await fetch(`/api/tasks/${taskId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: newStatus }),
                });
                if (!res.ok) throw new Error();
              } catch {
                updateProject({ tasks: previous });
                showToast("작업 상태 변경에 실패했습니다", "error");
              } finally {
                inFlightRef.current.delete(`status-${taskId}`);
              }
            }}
            onReorder={async (taskId, newOrder, newStatus) => {
              if (inFlightRef.current.has(`reorder-${taskId}`)) return;
              inFlightRef.current.add(`reorder-${taskId}`);
              const previous = project.tasks ?? [];
              const updated = previous.map((t) =>
                t.id === taskId ? { ...t, order: newOrder, status: newStatus } : t
              );
              updateProject({ tasks: updated });
              try {
                const res = await fetch(`/api/tasks/${taskId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ order: newOrder, status: newStatus }),
                });
                if (!res.ok) throw new Error();
              } catch {
                updateProject({ tasks: previous });
                showToast("작업 순서 변경에 실패했습니다", "error");
              } finally {
                inFlightRef.current.delete(`reorder-${taskId}`);
              }
            }}
            onTaskClick={openTask}
          />
        )}
        {viewTab === "stream" && (
          <ProjectStreamTab
            projectId={project.id}
            logs={project.logs}
            members={project.members}
            currentUser={person}
            onLogsChange={(logs) => updateProject({ logs })}
          />
        )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-5 overflow-y-auto">
        <div className="glass-panel rounded-2xl border border-white/10 p-5 shadow-2xl">
          <CalendarPanel initialEvents={project.calendarEvents} projectId={project.id} />
        </div>
        <ProjectInfoPanel project={project} onUpdate={updateProject} />
      </div>

      {/* 작업 상세 모달 */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          members={project.members}
          onClose={() => setSelectedTask(null)}
          onUpdate={(patch) => setSelectedTask((prev) => prev ? { ...prev, ...patch } : null)}
          onArchive={async () => {
            const previous = project.tasks ?? [];
            updateProject({
              tasks: previous.filter((t) => t.id !== selectedTask.id),
            });
            setSelectedTask(null);
            try {
              const res = await fetch(`/api/tasks/${selectedTask.id}/archive`, { method: "POST" });
              if (!res.ok) throw new Error();
            } catch {
              updateProject({ tasks: previous });
              showToast("작업 아카이브에 실패했습니다", "error");
            }
          }}
          onStatusChange={async (status) => {
            if (inFlightRef.current.has(`status-${selectedTask.id}`)) return;
            inFlightRef.current.add(`status-${selectedTask.id}`);
            const previous = project.tasks ?? [];
            const updated = previous.map((t) =>
              t.id === selectedTask.id ? { ...t, status } : t
            );
            updateProject({ tasks: updated });
            setSelectedTask((prev) => (prev ? { ...prev, status } : null));
            try {
              const res = await fetch(`/api/tasks/${selectedTask.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
              });
              if (!res.ok) throw new Error();
            } catch {
              updateProject({ tasks: previous });
              setSelectedTask((prev) => {
                const orig = previous.find((t) => t.id === selectedTask.id);
                return prev && orig ? { ...prev, status: orig.status } : prev;
              });
              showToast("작업 상태 변경에 실패했습니다", "error");
            } finally {
              inFlightRef.current.delete(`status-${selectedTask.id}`);
            }
          }}
          onEdit={async (patch) => {
            if (inFlightRef.current.has(`edit-${selectedTask.id}`)) return;
            inFlightRef.current.add(`edit-${selectedTask.id}`);
            const previous = project.tasks ?? [];
            const assignee = patch.assigneeId
              ? project.members.find((m) => m.user.id === patch.assigneeId)?.user
              : undefined;
            const updated = previous.map((t) =>
              t.id === selectedTask.id
                ? {
                    ...t,
                    ...(patch.title !== undefined && { title: patch.title }),
                    ...(patch.description !== undefined && { description: patch.description }),
                    ...(patch.priority !== undefined && { priority: patch.priority }),
                    ...(patch.dueDate !== undefined && { dueDate: patch.dueDate }),
                    ...(assignee ? { assignee } : {}),
                  }
                : t
            );
            updateProject({ tasks: updated });
            try {
              const res = await fetch(`/api/tasks/${selectedTask.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
              });
              if (!res.ok) throw new Error();
            } catch {
              updateProject({ tasks: previous });
              showToast("작업 수정에 실패했습니다", "error");
            } finally {
              inFlightRef.current.delete(`edit-${selectedTask.id}`);
            }
          }}
        />
      )}

      {showNewTask && (
        <NewTaskModal
          projectId={project.id}
          members={project.members}
          defaultAssigneeId={currentUser.id}
          onClose={() => setShowNewTask(false)}
          onCreated={(task) => {
            updateProject({
              tasks: [...(project.tasks ?? []), task as ProjectDetail["tasks"][number]],
            });
            setShowNewTask(false);
          }}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
