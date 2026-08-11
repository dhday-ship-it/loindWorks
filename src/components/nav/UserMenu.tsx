"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export function UserMenu({
  name,
  roleLabel,
}: {
  name: string;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = name.charAt(0).toUpperCase();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="사용자 메뉴"
        className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-2.5 transition-all hover:bg-white/10"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-light/30 bg-brand/20 text-[11px] font-bold text-brand-light">
          {initial}
        </span>
        <span className="hidden max-w-[110px] truncate text-xs font-semibold text-white sm:inline">
          {name}
        </span>
        <span className="hidden text-[10px] text-white/30 sm:inline">▾</span>
      </button>

      {open && (
        <div className="animate-fade-up absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-xl border border-white/10 bg-[rgba(10,12,16,0.97)] shadow-2xl backdrop-blur-2xl">
          <div className="border-b border-white/5 px-3.5 py-3">
            <div className="truncate text-xs font-semibold text-white">
              {name}
            </div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-white/35">
              {roleLabel}
            </div>
          </div>
          <div className="p-1.5">
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="block cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-white/70 transition-all hover:bg-white/5 hover:text-white"
            >
              계정 설정
            </Link>
            <button
              onClick={() => signOut({ redirectTo: "/login" })}
              className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs font-medium text-red-400/80 transition-all hover:bg-red-400/10 hover:text-red-300"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
