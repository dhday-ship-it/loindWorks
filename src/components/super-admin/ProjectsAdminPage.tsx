"use client";

import { useState } from "react";

import { progressPercent } from "@/lib/project-progress";
import { CreateProjectModal } from "./CreateProjectModal";
import type { AdminProjectItem, CompanyItem, StaffOption } from "./types";

const STATUS_LABEL: Record<AdminProjectItem["status"], string> = {
  PENDING: "대기",
  IN_PROGRESS: "진행 중",
  DONE: "완료",
};
const STATUS_CLASS: Record<AdminProjectItem["status"], string> = {
  PENDING: "admin-badge admin-b-pending",
  IN_PROGRESS: "admin-badge admin-b-wip",
  DONE: "admin-badge admin-b-done",
};

function progressOf(p: AdminProjectItem) {
  return progressPercent(p.status, p.currentPhase, p.phaseCount);
}

function fmtPeriod(p: AdminProjectItem) {
  if (!p.startDate || !p.endDate) return "미정";
  const s = new Date(p.startDate);
  const e = new Date(p.endDate);
  const f = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  return `${f(s)}~${f(e)}`;
}

export function ProjectsAdminPage({
  projects,
  onProjectsChange,
  companies,
  staff,
  showToast,
}: {
  projects: AdminProjectItem[];
  onProjectsChange: (next: AdminProjectItem[]) => void;
  companies: CompanyItem[];
  staff: StaffOption[];
  showToast: (msg: string) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const deleteProject = async (id: string, name: string) => {
    if (!window.confirm(`${name} 프로젝트를 삭제할까요? 되돌릴 수 없습니다.`))
      return;
    onProjectsChange(projects.filter((p) => p.id !== id));
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) showToast(`${name} 프로젝트가 삭제되었습니다.`);
  };

  const patchProject = async (
    id: string,
    data: Partial<Pick<AdminProjectItem, "currentPhase" | "status">>
  ) => {
    setSavingId(id);
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSavingId(null);
    if (res.ok) {
      onProjectsChange(
        projects.map((p) => (p.id === id ? { ...p, ...data } : p))
      );
    }
  };

  const advancePhase = (p: AdminProjectItem) => {
    const next = p.currentPhase + 1;
    patchProject(
      p.id,
      p.status === "PENDING"
        ? { currentPhase: next, status: "IN_PROGRESS" }
        : { currentPhase: next }
    );
  };

  const revertPhase = (p: AdminProjectItem) => {
    if (p.currentPhase === 0) return;
    patchProject(p.id, { currentPhase: p.currentPhase - 1 });
  };

  const completeProject = (p: AdminProjectItem) =>
    patchProject(p.id, { status: "DONE" });

  const reopenProject = (p: AdminProjectItem) =>
    patchProject(p.id, {
      status: "IN_PROGRESS",
      currentPhase: Math.max(0, p.phaseCount - 1),
    });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[22px] font-bold text-white">
            프로젝트 관리
          </div>
          <div className="text-xs text-white/40">
            프로젝트를 생성하고 담당자 및 클라이언트를 배정합니다.
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="admin-btn-primary"
        >
          + 프로젝트 생성
        </button>
      </div>

      <div className="admin-sec-card p-6">
        <div className="overflow-x-auto">
          <table className="admin-tbl w-full border-collapse">
            <thead>
              <tr>
                <th>프로젝트명</th>
                <th>고객사</th>
                <th>담당 PM</th>
                <th>진행률</th>
                <th>기간</th>
                <th>배정 클라이언트</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-white/30">
                    생성된 프로젝트가 없습니다.
                  </td>
                </tr>
              )}
              {projects.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold text-white">{p.name}</td>
                  <td>{p.company?.name ?? "-"}</td>
                  <td>{p.pm?.name ?? p.pm?.email ?? "-"}</td>
                  <td>
                    <div className="flex min-w-[160px] flex-col gap-1.5 py-1">
                      <div className="flex items-center gap-1.5">
                        <div className="admin-prog-track flex-1">
                          <div
                            className="admin-prog-fill"
                            style={
                              p.status === "DONE"
                                ? {
                                    width: "100%",
                                    background:
                                      "linear-gradient(90deg,#34d399,#6ee7b7)",
                                  }
                                : { width: `${progressOf(p)}%` }
                            }
                          />
                        </div>
                        <span
                          className={`whitespace-nowrap font-mono text-[10px] font-bold ${p.status === "DONE" ? "text-emerald-300" : "text-white/60"}`}
                        >
                          {progressOf(p)}%
                        </span>
                      </div>
                      {p.phaseCount > 0 && (
                        <div className="flex items-center gap-1">
                          {p.status === "DONE" ? (
                            <button
                              onClick={() => reopenProject(p)}
                              disabled={savingId === p.id}
                              className="cursor-pointer whitespace-nowrap rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white/45 transition-all hover:text-white disabled:opacity-40"
                            >
                              재오픈
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => revertPhase(p)}
                                disabled={savingId === p.id || p.currentPhase === 0}
                                className="cursor-pointer rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white/45 transition-all hover:text-white disabled:opacity-25"
                              >
                                ◀
                              </button>
                              {p.currentPhase < p.phaseCount - 1 ? (
                                <button
                                  onClick={() => advancePhase(p)}
                                  disabled={savingId === p.id}
                                  className="cursor-pointer whitespace-nowrap rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white/45 transition-all hover:text-white disabled:opacity-40"
                                >
                                  다음 단계 ▶
                                </button>
                              ) : (
                                <button
                                  onClick={() => completeProject(p)}
                                  disabled={savingId === p.id}
                                  className="cursor-pointer whitespace-nowrap rounded border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-300 transition-all hover:bg-emerald-400/20 disabled:opacity-40"
                                >
                                  완료 처리 ✓
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="font-mono text-[11px] text-white/50">
                    {fmtPeriod(p)}
                  </td>
                  <td className="text-[11px] text-white/55">
                    {p.clientNames.length ? p.clientNames.join(", ") : "-"}
                  </td>
                  <td>
                    <span className={STATUS_CLASS[p.status]}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => deleteProject(p.id, p.name)}
                      className="admin-btn-danger"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateProjectModal
          companies={companies}
          staff={staff}
          onClose={() => setShowCreate(false)}
          onCreated={(project) => {
            onProjectsChange([...projects, project]);
            setShowCreate(false);
            showToast(`${project.name} 프로젝트가 생성되었습니다.`);
          }}
        />
      )}
    </div>
  );
}
