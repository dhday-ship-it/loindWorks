"use client";

import type { Role } from "@/generated/prisma/enums";
import { AppShell } from "@/components/layout/AppShell";
import { ArtisanOrderBoard } from "./ArtisanOrderBoard";

export function ArtisanOrdersWorkstationPage({
  currentUser,
}: {
  currentUser: { id: string; name: string | null; email: string; role: Role };
}) {
  return (
    <AppShell
      currentUser={currentUser}
      main={<ArtisanOrderBoard />}
    />
  );
}
