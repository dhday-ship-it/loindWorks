"use client";

import { useState } from "react";

import { Modal } from "./Modal";
import type { AdminProjectItem, CompanyItem, StaffOption } from "./types";

export function CreateProjectModal({
  companies,
  staff,
  onClose,
  onCreated,
}: {
  companies: CompanyItem[];
  staff: StaffOption[];
  onClose: () => void;
  onCreated: (project: AdminProjectItem) => void;
}) {
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [pmId, setPmId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [phasesText, setPhasesText] = useState(
    "기획 확정\n디자인 시안 검토\n개발 착수\nQA · 테스트\n최종 런칭"
  );
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

    if (!name.trim() || !companyId || !pmId || phases.length === 0) {
      setError("프로젝트명, 고객사, 담당 PM은 필수입니다.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phases,
        companyId,
        pmId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        memberUserIds: [...new Set([pmId, ...selectedStaff])],
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "프로젝트 생성에 실패했습니다.");
      return;
    }

    const { project } = await res.json();
    const company = companies.find((c) => c.id === companyId) ?? null;
    const pm = staff.find((s) => s.id === pmId) ?? null;

    onCreated({
      id: project.id,
      name,
      status: "PENDING",
      currentPhase: 0,
      phaseCount: phases.length,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      company: company ? { id: company.id, name: company.name } : null,
      pm,
      memberNames: [],
    });
  };

  return (
    <Modal
      title="프로젝트 생성"
      subtitle="새 프로젝트를 생성하고 담당자와 고객사를 배정합니다."
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
            placeholder="웹사이트 리뉴얼"
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
                선택...
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
                선택...
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
            className="admin-input min-h-[100px] resize-none leading-relaxed"
          />
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
                  className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
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
            disabled={submitting}
            className="admin-btn-primary disabled:opacity-50"
          >
            {submitting ? "생성 중..." : "생성"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
