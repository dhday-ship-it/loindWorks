"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bebas_Neue, DM_Sans } from "next/font/google";

import type { Role } from "@/generated/prisma/enums";
import { ParticleBackground } from "@/components/ParticleBackground";
import { MusicWidget } from "@/components/staff-home/MusicWidget";
import { CalendarPanel } from "@/components/calendar/CalendarPanel";
import { ProjectSummaryCard } from "./ProjectSummaryCard";
import { RequestsTab } from "./RequestsTab";
import { LogsTab } from "./LogsTab";
import { ProjectInfoPanel } from "./ProjectInfoPanel";
import { NewProjectModal } from "./NewProjectModal";
import type { Person, ProjectDetail, ProjectSummary } from "./types";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400" });

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "최고관리자",
  BRAND_ADMIN: "브랜드 관리자",
  STAFF: "직원",
  CLIENT: "클라이언트",
};

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
  const [tab, setTab] = useState<"req" | "log">("req");
  const [showNewProject, setShowNewProject] = useState(false);

  const project = detailCache[currentId] ?? null;
  const person: Person = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
  };

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
      className={`${dmSans.className} relative flex min-h-screen flex-col justify-between text-white`}
    >
      <ParticleBackground />
      <nav className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-white/10 bg-black/20 px-4 backdrop-blur-xl md:px-10">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-6">
          <Link
            href="/dashboard"
            className={`${bebasNeue.className} shrink-0 cursor-pointer border-r border-white/10 pr-3 text-xl tracking-widest text-white transition-all hover:opacity-60 md:pr-5`}
          >
            LOIND
          </Link>

          <div className="flex shrink-0 gap-1 border-r border-white/10 pr-3 md:gap-1.5 md:pr-4">
            <Link
              href="/dashboard"
              className="cursor-pointer rounded-sm px-2.5 py-1.5 text-xs font-semibold text-white/60 transition-all hover:bg-white/5 hover:text-white md:px-3"
            >
              홈
            </Link>
            <button className="cursor-pointer rounded-sm bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 transition-all md:px-3">
              프로젝트
            </button>
            {currentUser.role === "SUPER_ADMIN" && (
              <Link
                href="/admin"
                className="cursor-pointer rounded-sm px-2.5 py-1.5 text-xs font-semibold text-white/60 transition-all hover:bg-white/5 hover:text-white md:px-3"
              >
                관리자
              </Link>
            )}
          </div>

          <div className="hidden items-center gap-2 overflow-x-auto pl-2 md:flex">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => selectProject(p.id)}
                className={`flex shrink-0 cursor-pointer items-center gap-2 rounded px-3 py-1 text-[11px] transition-all ${
                  p.id === currentId
                    ? "bg-white font-bold text-slate-900 shadow-sm"
                    : "border border-white/10 bg-white/5 font-medium text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${p.id === currentId ? "bg-emerald-500" : "bg-white/30"}`}
                />
                <span className="whitespace-nowrap">{p.name}</span>
                <span
                  className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold ${
                    p.id === currentId
                      ? "bg-black/10 text-slate-700"
                      : "border border-white/5 bg-white/5 text-white/40"
                  }`}
                >
                  {p.status === "PENDING"
                    ? "Pending"
                    : p.status === "IN_PROGRESS"
                      ? "In Progress"
                      : "Done"}
                </span>
              </button>
            ))}
            <button
              onClick={() => setShowNewProject(true)}
              className="ml-1 flex shrink-0 cursor-pointer items-center gap-1.5 rounded border border-dashed border-white/10 px-3 py-1 text-[11px] font-medium text-white/30 transition-all hover:border-white/30 hover:text-white/60"
            >
              + 새 프로젝트
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-5">
          <div className="hidden items-center gap-2 border-r border-white/10 pr-5 text-xs lg:flex">
            <span className="text-sm">☀️</span>
            <span className="font-bold text-white/90">Seoul</span>
            <span className="text-white/60">16° / 23°</span>
          </div>

          <div className="hidden md:block">
            <MusicWidget />
          </div>

          <div className="flex items-center gap-2 border-l border-white/10 pl-3 md:gap-3 md:pl-5">
            <div className="hidden flex-col text-right leading-tight sm:flex">
              <span className="text-xs font-bold text-white">
                {currentUser.name ?? currentUser.email}
              </span>
              <span className="font-mono text-[10px] text-white/50">
                {ROLE_LABEL[currentUser.role]}
              </span>
            </div>
            <Link
              href="/dashboard/settings"
              className="hidden cursor-pointer rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white sm:block"
            >
              설정
            </Link>
            <button
              onClick={() => signOut({ redirectTo: "/login" })}
              className="cursor-pointer rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white"
            >
              로그아웃
            </button>
          </div>
        </div>
      </nav>

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

              <div className="glass-panel flex min-h-[540px] flex-col rounded-2xl shadow-2xl lg:col-span-7">
                <div className="flex gap-2 border-b border-white/10 bg-black/20 px-6">
                  <button
                    onClick={() => setTab("req")}
                    className={`cursor-pointer border-b-2 px-2 py-3.5 font-mono text-xs transition-all ${
                      tab === "req"
                        ? "border-white font-bold text-white"
                        : "border-transparent font-medium text-white/40 hover:text-white"
                    }`}
                  >
                    WORK STATION
                  </button>
                  <button
                    onClick={() => setTab("log")}
                    className={`cursor-pointer border-b-2 px-2 py-3.5 font-mono text-xs transition-all ${
                      tab === "log"
                        ? "border-white font-bold text-white"
                        : "border-transparent font-medium text-white/40 hover:text-white"
                    }`}
                  >
                    히스토리 로그
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {tab === "req" ? (
                    <RequestsTab
                      projectId={project.id}
                      requests={project.requests}
                      members={project.members}
                      currentUser={person}
                      onRequestsChange={(requests) =>
                        updateProject({ requests })
                      }
                    />
                  ) : (
                    <LogsTab
                      projectId={project.id}
                      logs={project.logs}
                      onLogsChange={(logs) => updateProject({ logs })}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-6 xl:col-span-4">
              <div className="glass-panel flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 shadow-md">
                <div className="flex items-center gap-3 truncate">
                  <span className="text-xs text-emerald-400">📣</span>
                  <span className="truncate text-xs font-medium text-white/80">
                    서버 점검 및 서비스 일시 중단 안내 (04/15)
                  </span>
                </div>
              </div>

              <div className="glass-panel rounded-2xl border border-white/10 p-5 shadow-2xl">
                <CalendarPanel
                  initialEvents={project.calendarEvents}
                  projectId={project.id}
                />
              </div>
              <ProjectInfoPanel project={project} />
            </div>
          </>
        )}
      </main>

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
