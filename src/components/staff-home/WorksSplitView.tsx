"use client";

import { useEffect, useState } from "react";
import type { ProjectStatus, Role } from "@/generated/prisma/enums";
import type { WorkSummary } from "@/types/shared";
import { Icon } from "@/components/ui/Icon";
import { RequestFeed } from "@/components/works/RequestFeed";
import type { RequestEntryItem } from "@/components/works/types";

const STATUS_STYLE: Record<ProjectStatus, string> = {
  PENDING: "bg-slate-300",
  IN_PROGRESS: "bg-brand",
  DONE: "bg-emerald-400",
};

interface WorkDetail {
  id: string;
  name: string;
  summary: string | null;
  logs: RequestEntryItem[];
}

interface ApiLog {
  id: string;
  title: string;
  body: string | null;
  logDate: string | null;
  createdAt: string;
  author: { id: string; name: string | null; email: string };
}

function WorkListRow({
  w,
  active,
  onClick,
}: {
  w: WorkSummary;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm transition-all ${
        active ? "bg-brand-light/12" : "hover:bg-slate-50"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          active ? "bg-brand text-white" : "bg-slate-100 text-slate-400"
        }`}
      >
        <Icon name="folder" className="h-3.5 w-3.5" />
      </span>
      <span className={`min-w-0 flex-1 truncate font-medium ${active ? "text-brand-deep" : "text-slate-700"}`}>
        {w.name}
      </span>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_STYLE[w.status]}`} />
    </button>
  );
}

export function WorksSplitView({
  works,
  currentUser,
}: {
  works: WorkSummary[];
  currentUser: { id: string; role: Role };
}) {
  const active = works.filter((w) => w.status !== "DONE");
  const done = works.filter((w) => w.status === "DONE");
  const [showDone, setShowDone] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    active[0]?.id ?? done[0]?.id ?? null
  );
  const [detail, setDetail] = useState<WorkDetail | null>(null);
  const loading = !!selectedId && detail?.id !== selectedId;

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    fetch(`/api/projects/${selectedId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const p = data.project;
        setDetail({
          id: p.id,
          name: p.name,
          summary: p.summary,
          logs: (p.logs as ApiLog[]).map((l) => ({
            id: l.id,
            title: l.title,
            body: l.body,
            logDate: l.logDate ?? l.createdAt,
            author: l.author,
            projectId: p.id,
          })),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  return (
    <div className="grid grid-cols-[240px_1fr] items-start gap-4">
      <div className="flex flex-col rounded-2xl border border-slate-100 p-3">
        <div className="mb-1 px-1.5 text-sm font-bold text-slate-700">Overview</div>
        <div className="mb-1 px-1.5 text-[11px] font-semibold text-slate-400">항목</div>
        <div className="flex flex-col gap-0.5">
          {active.length === 0 && done.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-300">
              등록된 Works가 없습니다.
            </div>
          )}
          {active.map((w) => (
            <WorkListRow
              key={w.id}
              w={w}
              active={w.id === selectedId}
              onClick={() => setSelectedId(w.id)}
            />
          ))}
        </div>
        {done.length > 0 && (
          <div className="mt-1">
            <button
              onClick={() => setShowDone((v) => !v)}
              className="flex cursor-pointer items-center gap-1 px-2.5 py-2 text-[11px] font-semibold text-slate-400 transition-all hover:text-slate-600"
            >
              <span>{showDone ? "▾" : "▸"}</span> 완료 {done.length}개
            </button>
            {showDone && (
              <div className="flex flex-col gap-0.5">
                {done.map((w) => (
                  <WorkListRow
                    key={w.id}
                    w={w}
                    active={w.id === selectedId}
                    onClick={() => setSelectedId(w.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="min-w-0 rounded-2xl border border-slate-100 p-5">
        {!selectedId && (
          <div className="py-16 text-center text-sm text-slate-300">
            왼쪽에서 Works를 선택하세요.
          </div>
        )}
        {loading && (
          <div className="py-16 text-center text-sm text-slate-300">불러오는 중...</div>
        )}
        {!loading && detail && (
          <div className="flex flex-col gap-5">
            <h3 className="text-lg font-bold text-slate-800">{detail.name}</h3>
            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">의뢰서내용</div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-500">
                {detail.summary || "등록된 내용이 없습니다."}
              </p>
            </div>
            <RequestFeed
              workId={detail.id}
              entries={detail.logs}
              onEntriesChange={(next) => setDetail((d) => (d ? { ...d, logs: next } : d))}
              currentUser={currentUser}
            />
          </div>
        )}
      </div>
    </div>
  );
}
