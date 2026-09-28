"use client";

import type { Role } from "@/generated/prisma/enums";
import type { CalendarEventItem } from "@/types/shared";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarPanelLight } from "@/components/calendar/CalendarPanelLight";
import { ArtisanOrderBoard } from "./ArtisanOrderBoard";

export function ArtisanOrdersWorkstationPage({
  currentUser,
  initialEvents,
}: {
  currentUser: { id: string; name: string | null; email: string; role: Role };
  initialEvents: CalendarEventItem[];
}) {
  return (
    <AppShell
      currentUser={currentUser}
      main={<ArtisanOrderBoard />}
      right={<CalendarPanelLight initialEvents={initialEvents} />}
    />
  );
}
