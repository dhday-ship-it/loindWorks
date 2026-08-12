"use client";

import type { Role } from "@/generated/prisma/enums";

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "최고관리자",
  PM: "프로젝트 매니저",
  STAFF: "직원",
};

interface ProfileCardProps {
  currentUser: { name: string | null; email: string; role: Role };
  openCount: number;
  doneCount: number;
  upcomingEvents: number;
}

export function ProfileCard({
  currentUser,
  openCount,
  doneCount,
  upcomingEvents,
}: ProfileCardProps) {
  const displayName = currentUser.name ?? currentUser.email;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="group relative shrink-0">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-light to-brand opacity-50 blur-md transition-all duration-500 group-hover:opacity-80" />
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/20 bg-black/40 shadow-inner">
            <span className="font-[family-name:var(--font-bebas)] text-2xl text-white/80">
              {initial}
            </span>
          </div>
          <span className="absolute bottom-0.5 right-0.5 z-20 h-3 w-3 animate-pulse rounded-full border-2 border-slate-900 bg-brand-light" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold tracking-tight text-white/95">
            {displayName}
          </h3>
          <div className="font-[family-name:var(--font-bebas)] text-xs tracking-widest text-brand-light">
            {ROLE_LABEL[currentUser.role].toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 border-y border-white/10 py-4">
        <div className="text-center">
          <div className="font-[family-name:var(--font-bebas)] text-2xl text-white/90">
            {openCount}
          </div>
          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-white/35">
            진행 업무
          </div>
        </div>
        <div className="text-center">
          <div className="font-[family-name:var(--font-bebas)] text-2xl text-brand-light">
            {doneCount}
          </div>
          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-white/35">
            완료
          </div>
        </div>
        <div className="text-center">
          <div className="font-[family-name:var(--font-bebas)] text-2xl text-white/90">
            {upcomingEvents}
          </div>
          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-white/35">
            예정 일정
          </div>
        </div>
      </div>
    </>
  );
}
