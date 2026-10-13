"use client";

import type { Role } from "@/generated/prisma/enums";
import { AppShell } from "@/components/layout/AppShell";
import { WorksSplitView } from "./WorksSplitView";
import type { WorkSummary } from "./types";

export function StaffHome({
  currentUser,
  initialWorks,
}: {
  currentUser: { id: string; name: string | null; email: string; role: Role };
  initialWorks: WorkSummary[];
}) {
  const displayName = currentUser.name ?? currentUser.email;

  return (
    <AppShell
      currentUser={currentUser}
      main={
        <div className="flex min-h-full flex-col gap-5 sm:h-full">
          <div className="shrink-0">
            <div className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-light">
              LOIND Creator Ground
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Hey there, {displayName}!
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              오늘도 좋은 하루 되세요.
            </p>
          </div>
          <WorksSplitView works={initialWorks} currentUser={currentUser} />
        </div>
      }
    />
  );
}
