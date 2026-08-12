"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bebas_Neue, DM_Sans } from "next/font/google";

import type { Role } from "@/generated/prisma/enums";
import { ParticleBackground } from "@/components/ParticleBackground";
import { UserMenu } from "@/components/nav/UserMenu";
import { CalendarPanel } from "@/components/calendar/CalendarPanel";
import { WorkStationPanel } from "./WorkStationPanel";
import { MemoPanel } from "./MemoPanel";
import { MusicWidget } from "./MusicWidget";
import type {
  CalendarEventItem,
  MemoFolderItem,
  MemoItem,
  NotificationItem,
  ProjectSummary,
  TaggedItem,
  TaskItem,
} from "./types";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";

const TAGGED_KIND_META: Record<TaggedItem["kind"], { icon: string; label: string }> = {
  request: { icon: "📨", label: "요청/작업" },
  log: { icon: "🗂️", label: "기록" },
};

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

function nowMs() {
  return Date.now();
}

export function StaffHome({
  currentUser,
  initialTasks,
  initialEvents,
  initialMemos,
  initialFolders,
  myProjects,
  taggedItems: initialTaggedItems,
  initialNotifications = [],
}: {
  currentUser: { id: string; name: string | null; email: string; role: Role };
  initialTasks: TaskItem[];
  initialEvents: CalendarEventItem[];
  initialMemos: MemoItem[];
  initialFolders: MemoFolderItem[];
  myProjects: ProjectSummary[];
  taggedItems: TaggedItem[];
  initialNotifications?: NotificationItem[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [events, setEvents] = useState(initialEvents);
  const [taggedItems, setTaggedItems] = useState(initialTaggedItems);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeView, setActiveView] = useState<"home" | string>("home"); // "home" or projectId
  const displayName = currentUser.name ?? currentUser.email;
  const initial = displayName.charAt(0).toUpperCase();
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/dashboard/home");
      if (!res.ok) return;
      const data = await res.json();
      setTasks(data.tasks);
      setEvents(data.events);
      setTaggedItems(data.taggedItems);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const myTasks = tasks.filter((t) => t.assignee.id === currentUser.id);
  const doneCount = myTasks.filter((t) => t.status === "DONE").length;
  const openCount = myTasks.length - doneCount;
  const upcomingEvents = events.filter(
    (e) => new Date(e.startAt).getTime() >= nowMs()
  ).length;

  const activeProjects = myProjects.filter((p) => p.status !== "DONE");
  const doneProjects = myProjects.filter((p) => p.status === "DONE");

  return (
    <div
      className={`${dmSans.className} relative flex min-h-screen flex-col text-white`}
    >
      <ParticleBackground />
      <div className="relative z-10 flex min-h-screen flex-col justify-between">
        <nav className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-white/10 bg-black/30 px-4 backdrop-blur-2xl md:px-10">
          <div className="flex min-w-0 shrink-0 items-center gap-3 md:gap-6">
            <div
              className={`${bebasNeue.className} shrink-0 cursor-pointer border-r border-white/10 pr-3 text-xl tracking-widest text-white transition-all hover:opacity-60 md:pr-5`}
            >
              LOIND
            </div>
            <div className="flex shrink-0 gap-1 md:gap-2">
              <button className="cursor-pointer whitespace-nowrap rounded-sm bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 md:px-4">
                홈
              </button>
              <Link
                href="/dashboard/projects"
                className="cursor-pointer whitespace-nowrap rounded-sm px-2.5 py-1.5 text-xs font-semibold text-white/60 transition-all hover:bg-white/5 hover:text-white md:px-4"
              >
                프로젝트
              </Link>
              {currentUser.role === "SUPER_ADMIN" && (
                <Link
                  href="/admin"
                  className="cursor-pointer whitespace-nowrap rounded-sm px-2.5 py-1.5 text-xs font-semibold text-white/60 transition-all hover:bg-white/5 hover:text-white md:px-4"
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
            {/* 알림 벨 */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative cursor-pointer rounded-lg border border-white/10 bg-white/5 p-1.5 text-sm transition-all hover:bg-white/10"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#c9595a] text-[8px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <UserMenu name={displayName} roleLabel={ROLE_LABEL[currentUser.role]} />
          </div>
        </nav>

        <div className="w-full px-6 pb-3 pt-10 md:px-10">
          <h2
            className={`${bebasNeue.className} text-4xl font-light leading-none tracking-widest text-white/90 md:text-5xl`}
          >
            LOIND CORPORATION
          </h2>
          <div className="glass-panel mt-5 flex max-w-lg items-center gap-3 rounded-xl p-2.5">
            <span className="border-r border-white/10 px-3 font-mono text-xs font-bold uppercase tracking-wider text-white/40">
              Quick Links
            </span>
            <div className="flex items-center gap-2 pl-1">
              {["🌐", "🖥️", "📄", "📷"].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-white transition-all hover:bg-white/15"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-stretch">
          <div className="glass-panel flex flex-1 overflow-hidden rounded-2xl shadow-2xl lg:col-span-8">
            {/* 왼쪽 프로젝트 사이드바 */}
            <aside className="hidden w-48 shrink-0 flex-col overflow-y-auto border-r border-white/10 p-4 md:flex">
            <button
              onClick={() => setActiveView("home")}
              className={`mb-4 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold transition-all ${
                activeView === "home" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span>🏠</span>
              <span>홈</span>
            </button>
            <div className="mb-3 font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
              프로젝트
            </div>
            {activeProjects.length === 0 && (
              <div className="py-3 text-[11px] text-white/20">프로젝트 없음</div>
            )}
            <div className="flex flex-col gap-1">
              {activeProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveView(p.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-all ${
                    activeView === p.id
                      ? "bg-white/10 text-white"
                      : "text-white/55 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${activeView === p.id ? "bg-brand-light" : "bg-white/25"}`} />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
            {doneProjects.length > 0 && (
              <div className="mt-3 text-[10px] text-white/20">
                완료 {doneProjects.length}개
              </div>
            )}
            <div className="mt-auto pt-4">
              <Link
                href="/dashboard/projects"
                className="flex items-center gap-2 rounded-lg border border-dashed border-white/10 px-3 py-2 text-[11px] text-white/30 transition-all hover:border-white/20 hover:text-white/60"
              >
                📁 프로젝트 관리
              </Link>
            </div>
          </aside>

            {/* 메인 콘텐츠 */}
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-7">
              {activeView === "home" ? (
                <>
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 font-mono">
              <div className="flex items-center gap-2.5 text-xs font-bold tracking-widest text-brand-light">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand-light shadow-[0_0_8px_rgba(143,168,196,0.6)]" />
                LOIND FLOW STATION
              </div>
              <div
                className="text-xs tracking-widest text-white/40"
                suppressHydrationWarning
              >
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })}
              </div>
            </div>

            <div className="grid min-h-[460px] grid-cols-1 gap-y-8 divide-y divide-white/10 md:grid-cols-[1fr_2fr] md:gap-y-0 md:divide-x md:divide-y-0">
              <CalendarPanel initialEvents={events} tasks={tasks} myProjects={myProjects} />
              <WorkStationPanel
                tasks={tasks}
                onTasksChange={setTasks}
                currentUserId={currentUser.id}
                myProjects={myProjects}
              />
            </div>
                </>
              ) : (
                <div className="flex h-full flex-col">
                  <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4 font-mono">
                    <div className="flex items-center gap-2.5 text-xs font-bold tracking-widest text-brand-light">
                      <span className="h-2 w-2 rounded-full bg-brand-light" />
                      {myProjects.find((p) => p.id === activeView)?.name ?? "프로젝트"}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto text-center text-sm text-white/30">
                    <p className="py-12">프로젝트 칸반 보드 (구현 예정)</p>
                  </div>
                </div>
              )}
          </div>
          </div>{/* 합쳐진 카드 닫기 */}

          <div className="glass-panel flex h-full flex-col gap-6 rounded-2xl p-7 shadow-2xl lg:col-span-4">
            <div className="flex items-center gap-4">
              <div className="group relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-light to-brand opacity-50 blur-md transition-all duration-500 group-hover:opacity-80" />
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/20 bg-black/40 shadow-inner">
                  <span className={`${bebasNeue.className} text-2xl text-white/80`}>
                    {initial}
                  </span>
                </div>
                <span className="absolute bottom-0.5 right-0.5 z-20 h-3 w-3 animate-pulse rounded-full border-2 border-slate-900 bg-brand-light" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-bold tracking-tight text-white/95">
                  {displayName}
                </h3>
                <div
                  className={`${bebasNeue.className} text-xs tracking-widest text-brand-light`}
                >
                  {ROLE_LABEL[currentUser.role].toUpperCase()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 border-y border-white/10 py-4">
              <div className="text-center">
                <div className={`${bebasNeue.className} text-2xl text-white/90`}>
                  {openCount}
                </div>
                <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-white/35">
                  진행 업무
                </div>
              </div>
              <div className="text-center">
                <div className={`${bebasNeue.className} text-2xl text-brand-light`}>
                  {doneCount}
                </div>
                <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-white/35">
                  완료
                </div>
              </div>
              <div className="text-center">
                <div className={`${bebasNeue.className} text-2xl text-white/90`}>
                  {upcomingEvents}
                </div>
                <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-white/35">
                  예정 일정
                </div>
              </div>
            </div>

            {taggedItems.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-white/30">
                  🏷️ 내게 배정된 항목
                  <span className="rounded-full border border-brand-light/30 bg-brand-light/10 px-1.5 py-0.5 text-[9px] font-bold text-brand-light">
                    {taggedItems.length}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {taggedItems.slice(0, 4).map((item) => (
                    <Link
                      key={`${item.kind}-${item.id}`}
                      href={`/dashboard/projects?project=${item.projectId}`}
                      className="flex items-center gap-2 rounded-lg border border-brand-light/10 bg-brand-light/5 px-3 py-2 text-xs font-medium text-white/70 transition-all hover:bg-brand-light/10 hover:text-white"
                    >
                      <span className="shrink-0">{TAGGED_KIND_META[item.kind].icon}</span>
                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
                      <span className="shrink-0 font-mono text-[9px] text-white/30">
                        {item.projectName}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 개인 메모 */}
            <div className="flex-1 overflow-hidden border-t border-white/10 pt-4">
              <MemoPanel
                initialMemos={initialMemos}
                initialFolders={initialFolders}
              />
            </div>

            <div className="mt-auto flex flex-col gap-2.5">
              <Link
                href="/dashboard/projects"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/70 transition-all hover:bg-white/10 hover:text-white"
              >
                <span>📁</span> 프로젝트 워크스테이션
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/70 transition-all hover:bg-white/10 hover:text-white"
              >
                <span>⚙️</span> 계정 설정
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}
