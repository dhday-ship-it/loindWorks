"use client";

import { useState } from "react";

import type { Person } from "./types";

export function NewProjectModal({
  staff,
  onClose,
  onCreated,
}: {
  staff: Person[];
  onClose: () => void;
  onCreated: (projectId: string) => void;
}) {
  const [name, setName] = useState("");
  const [phasesText, setPhasesText] = useState(
    "기획 확정\n디자인 시안 검토\n개발 착수\nQA · 테스트\n최종 런칭"
  );
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) => {
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
      setError("프로젝트명과 최소 1개 단계가 필요합니다.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phases,
        memberUserIds: [...selectedMembers],
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "프로젝트 생성에 실패했습니다.");
      return;
    }

    const { project } = await res.json();
    onCreated(project.id);
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-blur-heavy animate-fade-up flex w-full max-w-md flex-col overflow-hidden rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-3.5">
          <strong className="font-mono text-xs text-white">
            새 프로젝트 생성
          </strong>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 text-sm text-white/40 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-white/40">
              프로젝트명
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none"
              placeholder="예: 브랜드 웹 리뉴얼"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-white/40">
              단계 (줄바꿈으로 구분)
            </label>
            <textarea
              value={phasesText}
              onChange={(e) => setPhasesText(e.target.value)}
              className="min-h-[110px] w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-relaxed text-white outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-white/40">
              팀원
            </label>
            <div className="flex flex-wrap gap-1.5">
              {staff.map((s) => {
                const isSel = selectedMembers.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleMember(s.id)}
                    className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                      isSel
                        ? "border-white bg-white text-slate-900"
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
        </div>
        <div className="flex justify-end gap-2 border-t border-white/10 bg-black/20 px-5 py-3 text-xs font-bold">
          <button
            onClick={onClose}
            className="cursor-pointer rounded border border-white/10 px-3.5 py-1 text-white/60 hover:bg-white/5"
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="cursor-pointer rounded bg-white px-3.5 py-1 text-slate-900 hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "생성 중..." : "생성"}
          </button>
        </div>
      </div>
    </div>
  );
}
