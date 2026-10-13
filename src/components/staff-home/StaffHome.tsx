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
  return (
    <AppShell
      currentUser={currentUser}
      main={
        <div className="flex min-h-full flex-col gap-5 sm:h-full">
          <WorksSplitView works={initialWorks} currentUser={currentUser} />
        </div>
      }
    />
  );
}
