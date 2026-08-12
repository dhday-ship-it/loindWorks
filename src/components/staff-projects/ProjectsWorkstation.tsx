"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bebas_Neue, DM_Sans } from "next/font/google";

import type { Role } from "@/generated/prisma/enums";
import { ParticleBackground } from "@/components/ParticleBackground";
import { UserMenu } from "@/components/nav/UserMenu";
import { MusicWidget } from "@/components/staff-home/MusicWidget";
import { CalendarPanel } from "@/components/calendar/CalendarPanel";
import { ProjectSummaryCard } from "./ProjectSummaryCard";
import { ProjectStreamTab } from "./ProjectStreamTab";
import { ProjectInfoPanel } from "./ProjectInfoPanel";
import { NewProjectModal } from "./NewProjectModal";
import { KanbanBoard, type KanbanTask } from "./KanbanBoard";
import { TaskDetailModal, type TaskDetailData } from "./TaskDetailModal";
import { PMOverviewPanel } from "./PMOverviewPanel";
import { ArchivePanel } from "./ArchivePanel";
import type { Person, ProjectDetail, ProjectSummary } from "./types";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400" });

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "최고관리자",
  PM: "프로젝트 매니저",
  STAFF: "직원",
};

function ProjectRow({
  p,
  active,
  onClick,
}: {
  p: ProjectSummary;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] transition-all ${
        active
          ? "bg-white font-bold text-slate-900 shadow-sm"
          : "font-medium text-white/60 hover:bg-white/8 hover:text-white"
      }`}
    >
      <div
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          active ? "bg-brand" : p.status === "DONE" ? "bg-emerald-400" : "bg-white/30"
        }`}
      />
      <span className="min-w-0 flex-1 truncate">{p.name}</span>
    </button>
  );
}

export function ProjectsWorkstation({
  currentUser,
  projectList,
  initialDetail,
  staff,
}: {
  currentUser: { id: string; name: string | null; email: string; role: Role };
  projectList: ProjectSummary[];
  initialDetail: ProjectDetail | null;
  staff: Person[];
}) {
  const [projects, setProjects] = useState(projectList);
  const [detailCache, setDetailCache] = useState<Record<string, ProjectDetail>>(
    initialDetail ? { [initialDetail.id]: initialDetail } : {}
  );
  const [currentId, setCurrentId] = useState(initialDetail?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [mobileShowDone, setMobileShowDone] = useState(false);
  const [viewTab, setViewTab] = useState<"kanban" | "stream" | "overview" | "archive">("kanban");
  const [selectedTask, setSelectedTask] = useState<TaskDetailData | null>(null);

  const project = detailCache[currentId] ?? null;
  const person: Person = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
  };

  const activeProjects = projects.filter((p) => p.status !== "DONE");
  const doneProjects = projects.filter((p) => p.status === "DONE");

  useEffect(() => {
    if (!currentId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/projects/${currentId}`);
      if (res.ok) {
        const { project: detail } = await res.json();
        setDetailCache((prev) => ({ ...prev, [currentId]: detail }));
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [currentId]);

  const selectProject = async (id: string) => {
    setCurrentId(id);
    if (detailCache[id]) return;

    setLoading(true);
    const res = await fetch(`/api/projects/${id}`);
    setLoading(false);
    if (res.ok) {
      const { project: detail } = await res.json();
      setDetailCache((prev) => ({ ...prev, [id]: detail }));
    }
  };

  const updateProject = (patch: Partial<ProjectDetail>) => {
    if (!project) return;
    setDetailCache((prev) => ({
      ...prev,
      [project.id]: { ...prev[project.id], ...patch },
    }));
    if (patch.status) {
      const nextStatus = patch.status;
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: nextStatus } : p))
      );
    }
  };

  return (
    <div
      className={`${dmSans.className} relative flex min-h-screen flex-col text-white`}
    >
      <ParticleBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <nav className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between border-b border-white/10 bg-black/30 px-4 backdrop-blur-2xl md:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-6">
            <Link
              href="/dashboard"
              className={`${bebasNeue.className} shrink-0 cursor-pointer border-r border-white/10 pr-3 text-xl tracking-widest text-white transition-all hover:opacity-60 md:pr-5`}
            >
              LOIND
            </Link>

            <div className="flex shrink-0 gap-1 md:gap-1.5">
              <Link
                href="/dashboard"
                className="cursor-pointer whitespace-nowrap rounded-sm px-2.5 py-1.5 text-xs font-semibold text-white/60 transition-all hover:bg-white/5 hover:text-white md:px-3"
              >
                홈
              </Link>
              <button className="cursor-pointer whitespace-nowrap rounded-sm bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 transition-all md:px-3">
                프로젝트
              </button>
              {currentUser.role === "SUPER_ADMIN" && (
                <Link
                  href="/admin"
                  className="cursor-pointer whitespace-nowrap rounded-sm px-2.5 py-1.5 text-xs font-semibold text-white/60 transition-all hover:bg-white/5 hover:text-white md:px-3"
                >
                  관리자
                </Link>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 md:gap-4">
            <div className="hidden md:block">
              <MusicWidget />
            </div>
            <UserMenu
              name={currentUser.name ?? currentUser.email}
              roleLabel={ROLE_LABEL[currentUser.role]}
            />
          </div>
        </nav>

        {/* mobile-only project switcher */}
        <div className="flex flex-col gap-2 border-b border-white/10 bg-black/20 px-4 py-2 md:hidden">
          <div className="flex items-center gap-2 overflow-x-auto">
            {activeProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => selectProject(p.id)}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded px-2.5 py-1 text-[11px] transition-all ${
                  p.id === currentId
                    ? "bg-white font-bold text-slate-900"
                    : "border border-white/10 bg-white/5 font-medium text-white/60"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${p.id === currentId ? "bg-brand" : "bg-white/30"}`}
                />
                {p.name}
              </button>
            ))}
            <button
              onClick={() => setShowNewProject(true)}
              className="shrink-0 rounded border border-dashed border-white/10 px-2.5 py-1 text-[11px] font-medium text-white/30"
            >
              + 새 프로젝트
            </button>
          </div>
          {doneProjects.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setMobileShowDone((v) => !v)}
                className="shrink-0 whitespace-nowrap font-mono text-[10px] font-bold text-white/30"
              >
                {mobileShowDone ? "▾" : "▸"} 완료 {doneProjects.length}개
              </button>
              {mobileShowDone &&
                doneProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectProject(p.id)}
                    className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded px-2.5 py-1 text-[11px] transition-all ${
                      p.id === currentId
                        ? "bg-white font-bold text-slate-900"
                        : "border border-white/10 bg-white/5 font-medium text-white/45"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {p.name}
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="flex flex-1 items-stretch">
          {/* desktop sidebar: primary project switcher */}
          <aside className="sticky top-14 hidden h-[calc(100vh-56px)] w-64 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-black/20 p-4 md:flex">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/35">
                프로젝트
              </span>
              <button
                onClick={() => setShowNewProject(true)}
                className="cursor-pointer rounded border border-dashed border-white/15 px-2 py-0.5 text-[10px] font-medium text-white/40 transition-all hover:border-white/30 hover:text-white"
              >
                + 새 프로젝트
              </button>
            </div>

            <div className="mb-1 font-mono text-[9px] font-bold uppercase tracking-widest text-white/25">
              진행중 · {activeProjects.length}
            </div>
            <div className="mb-4 flex flex-col gap-0.5">
              {activeProjects.length === 0 && (
                <div className="px-3 py-2 font-mono text-[11px] text-white/25">
                  진행중인 프로젝트가 없습니다.
                </div>
              )}
              {activeProjects.map((p) => (
                <ProjectRow
                  key={p.id}
                  p={p}
                  active={p.id === currentId}
                  onClick={() => selectProject(p.id)}
                />
              ))}
            </div>

            {doneProjects.length > 0 && (
              <div>
                <button
                  onClick={() => setShowDone((v) => !v)}
                  className="mb-1 flex w-full cursor-pointer items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest text-white/25 hover:text-white/45"
                >
                  <span>{showDone ? "▾" : "▸"}</span> 완료 · {doneProjects.length}
                </button>
                {showDone && (
                  <div className="flex flex-col gap-0.5">
                    {doneProjects.map((p) => (
                      <ProjectRow
                        key={p.id}
                        p={p}
                        active={p.id === currentId}
                        onClick={() => selectProject(p.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>

          <main className="mb-16 grid w-full flex-1 grid-cols-1 items-start gap-6 px-6 py-6 md:mb-6 md:px-10 xl:grid-cols-12">
            {!project ? (
              <div className="glass-panel col-span-full flex min-h-[400px] items-center justify-center rounded-2xl text-white/40">
                {loading ? "불러오는 중..." : "프로젝트가 없습니다."}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 xl:col-span-8">
                  <div className="flex flex-col gap-4 lg:col-span-5">
                    <ProjectSummaryCard project={project} onUpdate={updateProject} />
                  </div>

                  <div className="glass-panel flex min-h-[540px] flex-col rounded-2xl p-6 shadow-2xl lg:col-span-7">
                    {/* 탭 전환 */}
                    <div className="mb-4 flex items-center justify-between border-b border-white/8 pb-3">
                      <div className="flex gap-1 font-mono text-[10px]">
                        {([
                          { id: "kanban", label: "칸반 보드" },
                          { id: "stream", label: "스트림" },
                          ...(currentUser.role === "PM" || currentUser.role === "SUPER_ADMIN"
                            ? [{ id: "overview", label: "전체 현황" }]
                            : []),
                          { id: "archive", label: "아카이브" },
                        ] as { id: typeof viewTab; label: string }[]).map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setViewTab(tab.id)}
                            className={`cursor-pointer rounded-lg px-3 py-1.5 font-bold transition-all ${
                              viewTab === tab.id
                                ? "bg-white text-slate-900"
                                : "text-white/40 hover:text-white"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                      <span className="hidden font-mono text-[10px] text-white/25 md:block">
                        WORK STATION
                      </span>
                    </div>

                    {/* 탭 콘텐츠 */}
                    <div className="flex-1 overflow-y-auto">
                      {viewTab === "kanban" && project.tasks && (
                        <KanbanBoard
                          tasks={project.tasks.map((t) => ({
                            ...t,
                            dueDate: t.dueDate ?? null,
                          })) as KanbanTask[]}
                          onStatusChange={async (taskId, newStatus) => {
                            const updated = project.tasks.map((t) =>
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
                            const updated = project.tasks.map((t) =>
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
                            // 태스크 상세 모달 열기
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
                      {viewTab === "overview" && (
                        <PMOverviewPanel
                          tasks={project.tasks.map((t) => ({
                            ...t,
                            projectId: project.id,
                            projectName: project.name,
                            dueDate: t.dueDate ?? null,
                          }))}
                          onTaskClick={(taskId) => {
                            const task = project.tasks.find((t) => t.id === taskId);
                            if (task) {
                              setSelectedTask({
                                ...task,
                                projectId: project.id,
                                createdAt: task.createdAt ?? "",
                                comments: [],
                                history: [],
                                files: [],
                              });
                            }
                          }}
                        />
                      )}
                      {viewTab === "archive" && (
                        <ArchivePanel
                          projectId={project.id}
                          onRestore={async () => {
                            const res = await fetch(`/api/projects/${project.id}`);
                            if (res.ok) {
                              const { project: detail } = await res.json();
                              setDetailCache((prev) => ({ ...prev, [project.id]: detail }));
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-6 xl:col-span-4">
                  <div className="glass-panel rounded-2xl border border-white/10 p-5 shadow-2xl">
                    <CalendarPanel
                      initialEvents={project.calendarEvents}
                      projectId={project.id}
                    />
                  </div>
                  <ProjectInfoPanel project={project} onUpdate={updateProject} />
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {selectedTask && project && (
        <TaskDetailModal
          task={selectedTask}
          members={project.members}
          currentUser={person}
          onClose={() => setSelectedTask(null)}
          onUpdate={(patch) => {
            setSelectedTask((prev) => prev ? { ...prev, ...patch } : null);
          }}
        />
      )}

      {showNewProject && (
        <NewProjectModal
          staff={staff}
          onClose={() => setShowNewProject(false)}
          onCreated={async (id) => {
            setShowNewProject(false);
            const res = await fetch("/api/projects");
            if (res.ok) {
              const { projects: list } = await res.json();
              setProjects(list);
            }
            await selectProject(id);
          }}
        />
      )}
    </div>
  );
}
