"use client";

import { useState } from "react";
import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";
import type { CalendarEventItem } from "@/types/shared";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarPanelLight } from "@/components/calendar/CalendarPanelLight";
import { RequestFeed } from "./RequestFeed";
import type { RequestEntryItem } from "./types";

export function WorksDetail({
  currentUser,
  work,
  initialEvents,
  initialEntries,
}: {
  currentUser: { id: string; name: string | null; email: string; role: Role };
  work: { id: string; name: string; summary: string | null };
  initialEvents: CalendarEventItem[];
  initialEntries: RequestEntryItem[];
}) {
  const [entries, setEntries] = useState(initialEntries);

  return (
    <AppShell
      currentUser={currentUser}
      main={
        <div className="flex flex-col gap-5">
          <div>
            <Link
              href="/dashboard"
              className="mb-2 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-slate-400 transition-all hover:text-slate-600"
            >
              ‹ 목록으로
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">{work.name}</h1>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="mb-2 text-sm font-bold text-slate-700">의뢰서내용</div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-500">
              {work.summary || "등록된 내용이 없습니다."}
            </p>
          </div>

          <RequestFeed workId={work.id} entries={entries} onEntriesChange={setEntries} />
        </div>
      }
      right={<CalendarPanelLight initialEvents={initialEvents} workId={work.id} />}
    />
  );
}
