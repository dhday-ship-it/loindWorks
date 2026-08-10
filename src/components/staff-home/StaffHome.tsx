"use client";

import { useState } from "react";
import Link from "next/link";
import { Bebas_Neue, DM_Sans } from "next/font/google";

import { signOut } from "next-auth/react";
import type { Role } from "@/generated/prisma/enums";
import { ParticleBackground } from "@/components/ParticleBackground";
import { CalendarPanel } from "@/components/calendar/CalendarPanel";
import { WorkStationPanel } from "./WorkStationPanel";
import { MemoPanel } from "./MemoPanel";
import { MusicWidget } from "./MusicWidget";
import type {
  CalendarEventItem,
  MemoFolderItem,
  MemoItem,
  TaskItem,
} from "./types";

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

export function StaffHome({
  currentUser,
  initialTasks,
  initialEvents,
  initialMemos,
  initialFolders,
}: {
  currentUser: { id: string; name: string | null; email: string; role: Role };
  initialTasks: TaskItem[];
  initialEvents: CalendarEventItem[];
  initialMemos: MemoItem[];
  initialFolders: MemoFolderItem[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const displayName = currentUser.name ?? currentUser.email;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div
      className={`${dmSans.className} relative flex min-h-screen flex-col justify-between text-white`}
    >
      <ParticleBackground />
      <nav className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-white/10 bg-black/20 px-4 backdrop-blur-xl md:px-10">
        <div className="flex shrink-0 items-center gap-3 md:gap-6">
          <div
            className={`${bebasNeue.className} cursor-pointer border-r border-white/10 pr-3 text-xl tracking-widest text-white transition-all hover:opacity-60 md:pr-5`}
          >
            LOIND
          </div>
          <div className="flex gap-1 md:gap-2">
            <button className="cursor-pointer rounded-sm bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 md:px-4">
              홈
            </button>
            <Link
              href="/dashboard/projects"
              className="cursor-pointer rounded-sm px-2.5 py-1.5 text-xs font-semibold text-white/60 transition-all hover:bg-white/5 hover:text-white md:px-4"
            >
              프로젝트
            </Link>
            {currentUser.role === "SUPER_ADMIN" && (
              <Link
                href="/admin"
                className="cursor-pointer rounded-sm px-2.5 py-1.5 text-xs font-semibold text-white/60 transition-all hover:bg-white/5 hover:text-white md:px-4"
              >
                관리자
              </Link>
            )}
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
                {displayName}
              </span>
              <span className="font-mono text-[10px] text-white/50">
                {ROLE_LABEL[currentUser.role]}
              </span>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-medium text-white/80 xl:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              워크스테이션 가동 중
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

      <main className="mb-16 grid w-full flex-1 grid-cols-1 items-start gap-8 px-6 py-5 md:mb-6 md:px-10 lg:grid-cols-12">
        <div className="glass-panel flex flex-col gap-6 rounded-2xl p-7 shadow-2xl lg:col-span-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 font-mono">
            <div className="flex items-center gap-2.5 text-xs font-bold tracking-widest text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              LOIND FLOW STATION v2.5
            </div>
            <div className="text-xs tracking-widest text-white/40">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })}
            </div>
          </div>

          <div className="grid min-h-[460px] grid-cols-1 gap-y-8 divide-y divide-white/10 md:grid-cols-3 md:gap-y-0 md:divide-x md:divide-y-0">
            <CalendarPanel initialEvents={initialEvents} tasks={tasks} />
            <WorkStationPanel
              tasks={tasks}
              onTasksChange={setTasks}
              currentUserId={currentUser.id}
            />
            <MemoPanel
              initialMemos={initialMemos}
              initialFolders={initialFolders}
            />
          </div>
        </div>

        <div className="glass-panel flex h-full min-h-[536px] flex-col items-center justify-center rounded-2xl p-8 text-center shadow-2xl lg:col-span-4">
          <div className="flex w-full flex-col items-center gap-5">
            <div className="group relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400 to-blue-500 opacity-40 blur-md transition-all duration-500 group-hover:opacity-70" />
              <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full border-2 border-white/20 bg-black/40 shadow-inner">
                <span className={`${bebasNeue.className} text-5xl text-white/80`}>
                  {initial}
                </span>
              </div>
              <span className="absolute bottom-1 right-2 z-20 h-4 w-4 animate-pulse rounded-full border-2 border-slate-900 bg-emerald-400" />
            </div>

            <div className="mt-2 flex flex-col gap-1">
              <h3 className="text-2xl font-bold tracking-tight text-white/95">
                {displayName}
              </h3>
              <div
                className={`${bebasNeue.className} text-sm tracking-widest text-emerald-400`}
              >
                {ROLE_LABEL[currentUser.role].toUpperCase()}
              </div>
              <div className="mt-1 rounded-full border border-white/5 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/40">
                LOIND CORE TEAM
              </div>
            </div>

            <div className="my-2 w-full border-t border-white/10" />

            <div className="flex w-full flex-col gap-2.5">
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
              <button
                onClick={() => signOut({ redirectTo: "/login" })}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/8 px-4 py-2.5 text-xs font-semibold text-red-400/70 transition-all hover:bg-red-400/15 hover:text-red-300"
              >
                <span>→</span> 로그아웃
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
