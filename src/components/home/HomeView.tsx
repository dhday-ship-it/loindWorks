"use client";

import type { Role } from "@/generated/prisma/enums";
import { AppShell } from "@/components/layout/AppShell";

export function HomeView({
  currentUser,
}: {
  currentUser: { id: string; name: string | null; email: string; role: Role };
}) {
  return (
    <AppShell
      currentUser={currentUser}
      main={
        <div className="flex flex-col gap-5">
          <header className="pb-2 pt-4 sm:pt-8">
            <h1 className="text-[32px] font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-[44px]">
              Creating Joy for God and People
            </h1>
            <p className="mt-5 text-sm font-bold text-brand">LOIND Corporation</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-slate-500 [word-break:keep-all]">
              LOIND는 하나님과 사람에게 기쁨이 되는 브랜드와 서비스를 만듭니다.
            </p>
          </header>
        </div>
      }
    />
  );
}
