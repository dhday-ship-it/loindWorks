"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bebas_Neue, DM_Sans } from "next/font/google";

import { ParticleBackground } from "@/components/ParticleBackground";
import { colorForId } from "@/components/staff-projects/types";
import { progressPercent } from "@/lib/project-progress";
import type { ClientProjectCard } from "./types";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400" });

const STATUS_LABEL: Record<ClientProjectCard["status"], string> = {
  PENDING: "예정",
  IN_PROGRESS: "진행 중",
  DONE: "완료",
};

const STATUS_BADGE_CLASS: Record<ClientProjectCard["status"], string> = {
  PENDING:
    "border border-amber-400/25 bg-amber-400/10 text-amber-300",
  IN_PROGRESS:
    "border border-blue-400/25 bg-blue-400/10 text-blue-300",
  DONE: "border border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
};

function fmtDate(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function ClientHome({
  currentUser,
  companyName,
  projects,
}: {
  currentUser: { id: string; name: string | null; email: string };
  companyName: string | null;
  projects: ClientProjectCard[];
}) {
  const displayName = currentUser.name ?? currentUser.email;
  const initial = displayName.charAt(0).toUpperCase();

  const inProgress = projects.filter((p) => p.status === "IN_PROGRESS");
  const done = projects.filter((p) => p.status === "DONE");
  const avgProgress =
    projects.length === 0
      ? 0
      : Math.round(
          projects.reduce(
            (sum, p) =>
              sum + progressPercent(p.status, p.currentPhase, p.phases.length),
            0
          ) / projects.length
        );

  return (
    <div
      className={`${dmSans.className} relative flex min-h-screen flex-col text-white`}
    >
      <ParticleBackground />
      <nav className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-white/10 bg-black/30 px-6 backdrop-blur-2xl md:px-10">
        <div className="flex items-center gap-5">
          <span
            className={`${bebasNeue.className} text-xl tracking-widest text-white/90`}
          >
            LOIND
          </span>
          <div className="h-4.5 w-px bg-white/10" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/35">
            Client Portal
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-l border-white/10 pl-5">
            <div className="text-right leading-tight">
              <div className="text-xs font-semibold text-white/90">
                {displayName}
              </div>
              <div className="font-mono text-[10px] text-white/40">
                {companyName ?? "소속 없음"}
              </div>
            </div>
            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/15">
              <span className="text-[11px] font-bold text-emerald-400">
                {initial}
              </span>
            </div>
            <Link
              href="/dashboard/settings"
              className="cursor-pointer rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white"
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20 pt-10 md:px-10">
        <div className="animate-fade-up mb-8">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
            Client Portal · My Projects
          </div>
          <h1
            className={`${bebasNeue.className} text-5xl leading-none tracking-widest text-white/90 md:text-6xl`}
          >
            MY WORKSPACE
          </h1>
          <p className="mt-2 font-mono text-xs text-white/35">
            배정된 프로젝트를 선택하여 진행 상황을 확인하세요.
          </p>
        </div>

        <div className="animate-fade-up mb-9 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/30">
              전체 프로젝트
            </div>
            <div
              className={`${bebasNeue.className} mt-1 text-3xl tracking-wide text-white/90`}
            >
              {projects.length}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/30">
              진행 중
            </div>
            <div
              className={`${bebasNeue.className} mt-1 text-3xl tracking-wide text-blue-300`}
            >
              {inProgress.length}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/30">
              완료
            </div>
            <div
              className={`${bebasNeue.className} mt-1 text-3xl tracking-wide text-emerald-300`}
            >
              {done.length}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4.5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/30">
              평균 진행률
            </div>
            <div
              className={`${bebasNeue.className} mt-1 text-3xl tracking-wide text-white/85`}
            >
              {avgProgress}%
            </div>
            <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300"
                style={{ width: `${avgProgress}%` }}
              />
            </div>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="glass-panel flex min-h-[300px] items-center justify-center rounded-2xl text-sm text-white/30">
            배정된 프로젝트가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4.5 md:grid-cols-2">
            {projects.map((p) => {
              const total = p.phases.length;
              const pct = progressPercent(p.status, p.currentPhase, total);
              const isDone = p.status === "DONE";
              return (
                <Link
                  key={p.id}
                  href={`/dashboard/client/${p.id}`}
                  className={`group animate-fade-up flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.055] p-7 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 ${
                    isDone ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-bold text-white"
                        style={{ background: colorForId(p.id) }}
                      >
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-base font-semibold text-white/95">
                          {p.name}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${STATUS_BADGE_CLASS[p.status]}`}
                    >
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>

                  {p.summary && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-white/45">
                      {p.summary}
                    </p>
                  )}

                  {total > 0 && (
                    <div>
                      <div className="mb-1.5 flex items-baseline justify-between font-mono text-[10px]">
                        <span className="font-sans font-semibold text-white/70">
                          {String(p.currentPhase + 1).padStart(2, "0")}.{" "}
                          {p.phases[p.currentPhase]}
                        </span>
                        <span className="font-bold text-white/40">
                          {p.currentPhase + 1} / {total}
                        </span>
                      </div>
                      <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${isDone ? "bg-emerald-400/45" : "bg-gradient-to-r from-blue-400 to-blue-200"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[11px]">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-mono text-[9px] uppercase text-white/25">
                          담당 PM
                        </div>
                        <div className="mt-0.5 text-white/65">
                          {p.pm?.name ?? p.pm?.email ?? "-"}
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[9px] uppercase text-white/25">
                          마감일
                        </div>
                        <div className="mt-0.5 text-white/65">
                          {fmtDate(p.endDate)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 opacity-0 transition-all group-hover:opacity-100">
                      <span className="font-bold">입장하기</span>
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
