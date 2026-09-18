"use client";

import type { Role } from "@/generated/prisma/enums";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarPanelLight } from "@/components/calendar/CalendarPanelLight";
import { WorksTable } from "./WorksTable";
import type { CalendarEventItem, WorkSummary } from "./types";

export function StaffHome({
  currentUser,
  initialWorks,
  initialEvents,
}: {
  currentUser: { id: string; name: string | null; email: string; role: Role };
  initialWorks: WorkSummary[];
  initialEvents: CalendarEventItem[];
}) {
  const displayName = currentUser.name ?? currentUser.email;

  return (
    <AppShell
      currentUser={currentUser}
      main={
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Hey there, {displayName}!
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              오늘도 좋은 하루 되세요.
            </p>
          </div>
          <WorksTable works={initialWorks} />
        </div>
      }
      right={<CalendarPanelLight initialEvents={initialEvents} />}
    />
  );
}
