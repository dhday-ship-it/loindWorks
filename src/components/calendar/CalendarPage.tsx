"use client";

import type { Role } from "@/generated/prisma/enums";
import type { CalendarEventItem } from "@/types/shared";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarPanelLight } from "./CalendarPanelLight";
import { FullCalendarView } from "./FullCalendarView";

export function CalendarPage({
  currentUser,
  initialEvents,
}: {
  currentUser: { id: string; name: string | null; email: string; role: Role };
  initialEvents: CalendarEventItem[];
}) {
  return (
    <AppShell
      currentUser={currentUser}
      main={<FullCalendarView initialEvents={initialEvents} />}
      right={<CalendarPanelLight initialEvents={initialEvents} />}
    />
  );
}
