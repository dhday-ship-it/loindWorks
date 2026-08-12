"use client";

import { useState } from "react";
import type { ProjectSummary } from "@/types/shared";

interface ProjectSidebarProps {
  projects: ProjectSummary[];
  activeView: string;
  onSelectView: (id: string) => void;
}

export function ProjectSidebar({
  projects,
  activeView,
  onSelectView,
}: ProjectSidebarProps) {
  const [showDone, setShowDone] = useState(false);

  const activeProjects = projects.filter((p) => p.status !== "DONE");
  const doneProjects = projects.filter((p) => p.status === "DONE");

  return (
    <aside className="hidden w-52 shrink-0 flex-col overflow-y-auto border-r border-white/10 p-4 md:flex">
      <button
        onClick={() => onSelectView("home")}
        className={`mb-4 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold transition-all ${
          activeView === "home"
            ? "bg-white/10 text-white"
            : "text-white/70 hover:bg-white/8 hover:text-white"
        }`}
      >
        <span>🏠</span>
        <span>홈</span>
      </button>

      <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-white/45">
        프로젝트
      </div>

      {activeProjects.length === 0 && (
        <div className="py-3 text-[11px] text-white/40">프로젝트 없음</div>
      )}

      <div className="flex flex-col gap-1">
        {activeProjects.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectView(p.id)}
            className={`flex w-full items-center gap-2 rounded-lg py-2.5 text-left text-[12px] font-medium transition-all ${
              activeView === p.id
                ? "border-l-[3px] border-brand-light bg-white/10 pl-2.5 pr-3 text-white"
                : "px-3 text-white/55 hover:bg-white/8 hover:text-white"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                activeView === p.id ? "bg-brand-light" : "bg-white/40"
              }`}
            />
            <span className="truncate">{p.name}</span>
          </button>
        ))}
      </div>

      {doneProjects.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowDone((v) => !v)}
            className="flex w-full cursor-pointer items-center gap-1 px-1 font-mono text-[10px] font-bold text-white/40 transition-all hover:text-white/65"
          >
            <span>{showDone ? "▾" : "▸"}</span> 완료 {doneProjects.length}개
          </button>
          {showDone && (
            <div className="mt-1 flex flex-col gap-1">
              {doneProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectView(p.id)}
                  className={`flex w-full items-center gap-2 rounded-lg py-2.5 text-left text-[12px] font-medium transition-all ${
                    activeView === p.id
                      ? "border-l-[3px] border-brand-light bg-white/10 pl-2.5 pr-3 text-white"
                      : "px-3 text-white/45 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      activeView === p.id
                        ? "bg-brand-light"
                        : "bg-emerald-400/50"
                    }`}
                  />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
