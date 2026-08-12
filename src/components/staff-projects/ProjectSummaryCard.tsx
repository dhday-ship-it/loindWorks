import { useState } from "react";

import { progressPercent } from "@/lib/project-progress";
import { colorForId, initials, type ProjectDetail } from "./types";

const STATUS_LABEL: Record<ProjectDetail["status"], string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const STATUS_BADGE_CLASS: Record<ProjectDetail["status"], string> = {
  PENDING: "bg-white text-slate-900",
  IN_PROGRESS:
    "border border-brand-light/25 bg-brand-light/8 text-brand-light",
  DONE: "border border-white/20 bg-white/5 text-white/60",
};

export function ProjectSummaryCard({
  project,
  onUpdate,
}: {
  project: ProjectDetail;
  onUpdate: (patch: Partial<ProjectDetail>) => void;
}) {
  const total = project.phases.length;
  const current = project.currentPhase;
  const pct = progressPercent(project.status, current, total);
  const [saving, setSaving] = useState(false);

  const patchProject = async (
    data: Partial<Pick<ProjectDetail, "currentPhase" | "status">>
  ) => {
    setSaving(true);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (res.ok) {
      onUpdate(data);
    }
  };

  const advancePhase = () => {
    const next = current + 1;
    patchProject(
      project.status === "PENDING"
        ? { currentPhase: next, status: "IN_PROGRESS" }
        : { currentPhase: next }
    );
  };

  const revertPhase = () => {
    if (current === 0) return;
    patchProject({ currentPhase: current - 1 });
  };

  const completeProject = () => patchProject({ status: "DONE" });
  const reopenProject = () =>
    patchProject({ status: "IN_PROGRESS", currentPhase: total - 1 });

  return (
    <div className="glass-panel flex flex-col gap-4 rounded-2xl p-6 shadow-2xl">
      <div className="grid grid-cols-2 gap-3 border-b border-white/10 pb-4">
        <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/20 px-3.5 py-3">
          <span
            className={`w-fit rounded px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE_CLASS[project.status]}`}
          >
            {STATUS_LABEL[project.status]}
          </span>
          <span className="mt-2 font-mono text-[11px] font-bold text-white/40">
            진행률 {pct}%
          </span>
        </div>
        <div className="flex min-w-0 flex-col justify-between rounded-xl border border-white/10 bg-black/20 px-3.5 py-3">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
            고객사
          </span>
          <div className="mt-1.5 min-w-0">
            <div className="truncate text-[12px] font-semibold text-white/85">
              {project.company?.name ?? "고객사 미지정"}
            </div>
            {project.company?.contactName && (
              <div className="truncate font-mono text-[10px] text-white/40">
                담당자 {project.company.contactName}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold tracking-tight text-white/95">
          {project.name}
        </h3>
        {project.summary && (
          <p className="mt-0.5 text-xs text-white/50">{project.summary}</p>
        )}
      </div>

      {total > 0 && (
        <div className="rounded-xl border border-white/5 bg-black/20 p-3.5">
          <div className="mb-2 flex items-baseline justify-between font-mono text-xs">
            <span className="font-sans font-semibold text-white/70">
              {String(current + 1).padStart(2, "0")}. {project.phases[current]}
            </span>
            <span className="text-[10px] font-bold text-white/40">
              {current + 1} / {total}
            </span>
          </div>
          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`,
            }}
          >
            {project.phases.map((_, i) => (
              <div
                key={i}
                className={`h-1 overflow-hidden rounded-full ${
                  i < current || project.status === "DONE"
                    ? "bg-white"
                    : i === current
                      ? "relative bg-gradient-to-r from-brand-light to-brand"
                      : "bg-white/10"
                }`}
              >
                {i === current && project.status !== "DONE" && (
                  <div className="absolute inset-0 animate-pulse bg-white/30" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
            {project.status === "DONE" ? (
              <>
                <span className="font-mono text-[10px] text-white/40">
                  프로젝트가 완료 처리되었습니다.
                </span>
                <button
                  onClick={reopenProject}
                  disabled={saving}
                  className="cursor-pointer rounded border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] font-bold text-white/50 transition-all hover:text-white disabled:opacity-40"
                >
                  다시 진행 중으로
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={revertPhase}
                  disabled={saving || current === 0}
                  className="cursor-pointer rounded border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] font-bold text-white/50 transition-all hover:text-white disabled:opacity-30"
                >
                  ◀ 이전 단계
                </button>
                {current < total - 1 ? (
                  <button
                    onClick={advancePhase}
                    disabled={saving}
                    className="cursor-pointer rounded bg-white px-2.5 py-1 font-mono text-[10px] font-bold text-slate-900 transition-all hover:bg-white/90 disabled:opacity-40"
                  >
                    다음 단계로 ▶
                  </button>
                ) : (
                  <button
                    onClick={completeProject}
                    disabled={saving}
                    className="cursor-pointer rounded bg-emerald-400 px-2.5 py-1 font-mono text-[10px] font-bold text-slate-900 transition-all hover:bg-emerald-300 disabled:opacity-40"
                  >
                    프로젝트 완료 처리 ✓
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 rounded-xl border border-white/5 bg-black/40 p-3.5 font-mono text-xs">
        {project.phases.map((phase, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 ${
              i < current || project.status === "DONE"
                ? "text-white/40"
                : i === current
                  ? "font-semibold text-white"
                  : "text-white/20"
            }`}
          >
            <div
              className={`h-1.5 w-1.5 rounded-full ${
                i < current || project.status === "DONE"
                  ? "bg-white/30"
                  : i === current
                    ? "animate-pulse bg-brand-light shadow-[0_0_6px_rgba(143,168,196,0.5)]"
                    : "bg-white/10"
              }`}
            />
            {String(i + 1).padStart(2, "0")}. {phase}
          </div>
        ))}
      </div>

      {project.members.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
          {project.members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/70"
            >
              <div
                className="flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold text-white"
                style={{ background: colorForId(m.user.id) }}
              >
                {initials(m.user)}
              </div>
              {m.user.name ?? m.user.email}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
