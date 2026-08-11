"use client";

import { useEffect, useState } from "react";

import { Modal } from "./Modal";
import type { AdminProjectItem, CompanyItem, StaffOption } from "./types";

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
  const [companyId, setCompanyId] = useState(project.company?.id ?? "");
  const [pmId, setPmId] = useState(project.pm?.id ?? "");
  const [startDate, setStartDate] = useState(toDateInput(project.startDate));
  const [endDate, setEndDate] = useState(toDateInput(project.endDate));
  const [phasesText, setPhasesText] = useState("");
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
          setPhasesText((data.project.phases as string[]).join("\n"));
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
    const phases = phasesText
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    if (!name.trim() || phases.length === 0) {
      setError("프로젝트명과 최소 1개 이상의 단계가 필요합니다.");
      return;
    }

    setSubmitting(true);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        companyId: companyId || null,
        pmId: pmId || null,
        startDate: startDate || null,
        endDate: endDate || null,
        phases,
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
      title="프로젝트 수정"
      subtitle="프로젝트 정보를 수정합니다."
      onClose={onClose}
    >
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
            프로젝트명
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="admin-input"
          />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
              고객사
            </span>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="admin-input cursor-pointer"
            >
              <option value="" className="bg-[#0c0e12]">
                선택 안 함
              </option>
              {companies.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0c0e12]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
              담당 PM
            </span>
            <select
              value={pmId}
              onChange={(e) => setPmId(e.target.value)}
              className="admin-input cursor-pointer"
            >
              <option value="" className="bg-[#0c0e12]">
                선택 안 함
              </option>
              {staff.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0c0e12]">
                  {s.name ?? s.email}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
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
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
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
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
            단계 (줄바꿈으로 구분)
          </span>
          <textarea
            value={phasesText}
            onChange={(e) => setPhasesText(e.target.value)}
            disabled={loading}
            className="admin-input min-h-[100px] resize-none leading-relaxed disabled:opacity-40"
            placeholder={loading ? "불러오는 중..." : undefined}
          />
          <span className="text-[10px] text-white/30">
            현재 진행 단계보다 줄어들면 마지막 단계로 자동 조정됩니다.
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
            함께하는 스탭 (담당 PM 외 추가 배정)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {staff.length === 0 && (
              <span className="text-[11px] text-white/30">
                배정 가능한 스탭이 없습니다.
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
                      ? "border-brand-light bg-brand-light text-slate-900"
                      : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                  }`}
                >
                  {s.name ?? s.email}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="mt-1.5 flex justify-end gap-2 border-t border-white/8 pt-4">
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
