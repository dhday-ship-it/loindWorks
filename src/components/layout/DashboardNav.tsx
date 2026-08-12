"use client";

import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";
import { UserMenu } from "@/components/nav/UserMenu";
import { MusicWidget } from "@/components/staff-home/MusicWidget";

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "최고관리자",
  PM: "프로젝트 매니저",
  STAFF: "직원",
};

interface DashboardNavProps {
  currentUser: { name: string | null; email: string; role: Role };
  unreadCount: number;
  onNotificationsClick: () => void;
}

export function DashboardNav({
  currentUser,
  unreadCount,
  onNotificationsClick,
}: DashboardNavProps) {
  const displayName = currentUser.name ?? currentUser.email;

  return (
    <nav className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-white/10 bg-black/30 px-4 backdrop-blur-2xl md:px-10">
      <div className="flex min-w-0 shrink-0 items-center gap-3 md:gap-6">
        <div className="font-[family-name:var(--font-bebas)] shrink-0 cursor-pointer border-r border-white/10 pr-3 text-xl tracking-widest text-white transition-all hover:opacity-60 md:pr-5">
          LOIND
        </div>
        <div className="flex shrink-0 gap-1 md:gap-2">
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
          onClick={onNotificationsClick}
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
  );
}
