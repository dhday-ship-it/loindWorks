"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@/generated/prisma/enums";

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "최고관리자",
  PM: "PM",
  STAFF: "Creator",
};

export function AppSidebar({
  currentUser,
}: {
  currentUser: { name: string | null; email: string; role: Role };
}) {
  const pathname = usePathname();
  const displayName = currentUser.name ?? currentUser.email;
  const initial = displayName.charAt(0).toUpperCase();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const navItems = [{ href: "/dashboard", label: "Overview" }];

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="px-3 pb-8 pt-2 text-sm font-bold tracking-wide text-slate-700">
          LOGO
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active =
              pathname === "/dashboard" || pathname?.startsWith("/dashboard/works");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-indigo-50 text-indigo-500"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="relative px-1 pb-2" ref={ref}>
        {open && (
          <div className="absolute bottom-full left-0 mb-2 w-44 overflow-hidden rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl shadow-slate-300/40">
            <div className="border-b border-slate-50 px-3 py-2">
              <div className="truncate text-xs font-semibold text-slate-700">
                {displayName}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                {ROLE_LABEL[currentUser.role]}
              </div>
            </div>
            {currentUser.role === "SUPER_ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                관리자
              </Link>
            )}
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
            >
              계정 설정
            </Link>
            <button
              onClick={() => signOut({ redirectTo: "/login" })}
              className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-medium text-red-400 hover:bg-red-50"
            >
              로그아웃
            </button>
          </div>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-all hover:bg-slate-50"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-500">
            {initial}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600">
            {displayName}
          </span>
        </button>
        <div className="px-3 pt-4 text-[10px] font-semibold leading-tight tracking-wide text-slate-300">
          LOIND CREATOR
          <br />
          GROUND
        </div>
      </div>
    </div>
  );
}
