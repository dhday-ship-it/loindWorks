"use client";

import { useState } from "react";

import { CreateProjectModal } from "./CreateProjectModal";
import { EditProjectModal } from "./EditProjectModal";
import type { AdminProjectItem, CompanyItem, StaffOption } from "./types";

const STATUS_LABEL: Record<AdminProjectItem["status"], string> = {
  PENDING: "대기",
  IN_PROGRESS: "진행중",
  DONE: "완료",
};
const STATUS_CLASS: Record<AdminProjectItem["status"], string> = {
  PENDING: "admin-badge admin-b-pending",
  IN_PROGRESS: "admin-badge admin-b-wip",
  DONE: "admin-badge admin-b-done",
};
const STATUS_ORDER: AdminProjectItem["status"][] = ["PENDING", "IN_PROGRESS", "DONE"];

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
  const [editing, setEditing] = useState<AdminProjectItem | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const deleteProject = async (id: string, name: string) => {
    if (!window.confirm(`${name} Works를 삭제할까요? 되돌릴 수 없습니다.`))
      return;
    onProjectsChange(projects.filter((p) => p.id !== id));
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) showToast(`${name} Works가 삭제되었습니다.`);
  };

  const setStatus = async (p: AdminProjectItem, status: AdminProjectItem["status"]) => {
    if (status === p.status) return;
    setSavingId(p.id);
    const res = await fetch(`/api/projects/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSavingId(null);
    if (res.ok) {
      onProjectsChange(
        projects.map((item) => (item.id === p.id ? { ...item, status } : item))
      );
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[22px] font-bold text-slate-800">
            Works 관리
          </div>
          <div className="text-xs text-slate-500">
            Works를 생성하고 담당자 및 고객사를 배정합니다.
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="admin-btn-primary"
        >
          + Works 생성
        </button>
      </div>

      <div className="admin-sec-card p-6">
        <div className="overflow-x-auto">
          <table className="admin-tbl w-full border-collapse">
            <thead>
              <tr>
                <th>Works 이름</th>
                <th>고객사</th>
                <th>담당 PM</th>
                <th>기간</th>
                <th>팀원</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    생성된 Works가 없습니다.
                  </td>
                </tr>
              )}
              {projects.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold text-slate-800">{p.name}</td>
                  <td>{p.company?.name ?? "-"}</td>
                  <td>{p.pm?.name ?? p.pm?.email ?? "-"}</td>
                  <td className="font-mono text-[11px] text-slate-600">
                    {fmtPeriod(p)}
                  </td>
                  <td className="text-[11px] text-slate-600">
                    {p.memberNames.length ? p.memberNames.join(", ") : "-"}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      {STATUS_ORDER.map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(p, s)}
                          disabled={savingId === p.id}
                          className={`cursor-pointer transition-all disabled:cursor-default disabled:opacity-50 ${
                            p.status === s
                              ? STATUS_CLASS[s]
                              : "admin-badge border border-slate-100 bg-transparent text-slate-300 hover:text-slate-500"
                          }`}
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setEditing(p)}
                        className="admin-btn-ghost"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => deleteProject(p.id, p.name)}
                        className="admin-btn-danger"
                      >
                        삭제
                      </button>
                    </div>
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
            showToast(`${project.name} Works가 생성되었습니다.`);
          }}
        />
      )}

      {editing && (
        <EditProjectModal
          project={editing}
          companies={companies}
          staff={staff}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            onProjectsChange(
              projects.map((p) => (p.id === updated.id ? updated : p))
            );
            setEditing(null);
            showToast(`${updated.name} Works가 수정되었습니다.`);
          }}
        />
      )}
    </div>
  );
}
