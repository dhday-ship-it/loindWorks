"use client";

import { useEffect, useState } from "react";

import { Modal } from "./Modal";
import type { ProjectStatus } from "@/generated/prisma/enums";
import type { AdminProjectItem, CompanyItem, StaffOption } from "./types";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  PENDING: "대기",
  IN_PROGRESS: "진행중",
  DONE: "완료",
};

function toDateInput(iso: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

export function EditProjectModal({
  project,
  companies,
  staff,
  onClose,
  onSaved,
}: {
  project: AdminProjectItem;
  companies: CompanyItem[];
  staff: StaffOption[];
  onClose: () => void;
  onSaved: (project: AdminProjectItem) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [companyId, setCompanyId] = useState(project.company?.id ?? "");
  const [pmId, setPmId] = useState(project.pm?.id ?? "");
  const [startDate, setStartDate] = useState(toDateInput(project.startDate));
  const [endDate, setEndDate] = useState(toDateInput(project.endDate));
  const [summary, setSummary] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${project.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setLoading(false);
        if (data?.project) {
          setSummary(data.project.summary ?? "");
          const members = data.project.members as {
            userId: string;
            roleLabel: string;
          }[];
          setSelectedStaff(
            new Set(
              members
                .filter((m) => m.roleLabel === "팀원")
                .map((m) => m.userId)
            )
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  const toggleStaff = (id: string) => {
    setSelectedStaff((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Works 이름을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        status,
        summary: summary || null,
        companyId: companyId || null,
        pmId: pmId || null,
        startDate: startDate || null,
        endDate: endDate || null,
        memberUserIds: [...selectedStaff],
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "수정에 실패했습니다.");
      return;
    }

    const { project: updated } = await res.json();
    onSaved({
      ...project,
      name: updated.name,
      status: updated.status,
      currentPhase: updated.currentPhase,
      phaseCount: updated.phaseCount,
      startDate: updated.startDate,
      endDate: updated.endDate,
      company: updated.company,
      pm: updated.pm,
    });
  };

  return (
    <Modal
      title="Works 수정"
      subtitle="Works 정보를 수정합니다."
      onClose={onClose}
    >
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            Works 이름
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="admin-input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            상태
          </span>
          <div className="flex gap-1.5">
            {(["PENDING", "IN_PROGRESS", "DONE"] as ProjectStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                  status === s
                    ? "border-indigo-400 bg-indigo-50 text-indigo-500"
                    : "border-slate-100 bg-slate-50 text-slate-400 hover:text-slate-800"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              고객사
            </span>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="admin-input cursor-pointer"
            >
              <option value="">선택 안 함</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              담당 PM
            </span>
            <select
              value={pmId}
              onChange={(e) => setPmId(e.target.value)}
              className="admin-input cursor-pointer"
            >
              <option value="">선택 안 함</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name ?? s.email}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              시작일
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="admin-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              마감일
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="admin-input"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            의뢰서내용
          </span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={loading}
            className="admin-input min-h-[90px] resize-none leading-relaxed disabled:opacity-40"
            placeholder={loading ? "불러오는 중..." : "Works 상세 페이지에 표시될 의뢰 내용 (선택)"}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            함께하는 팀원 (담당 PM 외 추가 배정)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {staff.length === 0 && (
              <span className="text-[11px] text-slate-400">
                배정 가능한 팀원이 없습니다.
              </span>
            )}
            {staff.map((s) => {
              const isSel = selectedStaff.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleStaff(s.id)}
                  disabled={loading}
                  className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all disabled:opacity-40 ${
                    isSel
                      ? "border-indigo-400 bg-indigo-500 text-white"
                      : "border-slate-100 bg-slate-50 text-slate-600 hover:text-slate-800"
                  }`}
                >
                  {s.name ?? s.email}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="mt-1.5 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button onClick={onClose} className="admin-btn-ghost">
            취소
          </button>
          <button
            onClick={submit}
            disabled={submitting || loading}
            className="admin-btn-primary disabled:opacity-50"
          >
            {submitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
