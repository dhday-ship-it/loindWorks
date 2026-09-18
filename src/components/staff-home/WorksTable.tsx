"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProjectStatus } from "@/generated/prisma/enums";
import type { WorkSummary } from "@/types/shared";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  PENDING: "대기",
  IN_PROGRESS: "진행중",
  DONE: "완료",
};

const STATUS_STYLE: Record<ProjectStatus, string> = {
  PENDING: "bg-slate-100 text-slate-500",
  IN_PROGRESS: "bg-indigo-50 text-indigo-500",
  DONE: "bg-emerald-50 text-emerald-500",
};

function fmtDate(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function WorksRow({ w }: { w: WorkSummary }) {
  return (
    <Link
      href={`/dashboard/works/${w.id}`}
      className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-slate-50 py-3 text-sm transition-all last:border-b-0 hover:bg-slate-50/70"
    >
      <span className="truncate font-medium text-slate-700">{w.name}</span>
      <span className="w-[170px] text-right font-mono text-[11px] text-slate-400">
        {fmtDate(w.startDate)} ~ {fmtDate(w.endDate)}
      </span>
      <span className="w-[70px] text-right">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[w.status]}`}
        >
          {STATUS_LABEL[w.status]}
        </span>
      </span>
    </Link>
  );
}

export function WorksTable({ works }: { works: WorkSummary[] }) {
  const [showDone, setShowDone] = useState(false);
  const active = works.filter((w) => w.status !== "DONE");
  const done = works.filter((w) => w.status === "DONE");

  return (
    <div>
      <div className="mb-3 text-sm font-bold text-slate-700">Overview</div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-slate-100 pb-2 text-[11px] font-semibold text-slate-400">
        <span>항목</span>
        <span className="w-[170px] text-right">기간</span>
        <span className="w-[70px] text-right">상태</span>
      </div>

      <div className="flex flex-col">
        {active.length === 0 && done.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-300">
            아직 등록된 Works가 없습니다.
          </div>
        )}
        {active.map((w) => (
          <WorksRow key={w.id} w={w} />
        ))}
      </div>

      {done.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowDone((v) => !v)}
            className="flex cursor-pointer items-center gap-1 py-2 text-[11px] font-semibold text-slate-400 transition-all hover:text-slate-600"
          >
            <span>{showDone ? "▾" : "▸"}</span> 완료 {done.length}개
          </button>
          {showDone && (
            <div className="flex flex-col">
              {done.map((w) => (
                <WorksRow key={w.id} w={w} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
