"use client";

import { useState } from "react";

import type { TaskPriority } from "@/generated/prisma/enums";
import { colorForId, initials, type ProjectMemberItem } from "./types";

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "HIGH", label: "🔴 긴급" },
  { value: "NORMAL", label: "🔵 보통" },
  { value: "LOW", label: "⚪ 낮음" },
];

export function NewTaskModal({
  projectId,
  members,
  defaultAssigneeId,
  onClose,
  onCreated,
}: {
  projectId: string;
  members: ProjectMemberItem[];
  defaultAssigneeId: string;
  onClose: () => void;
  onCreated: (task: unknown) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId);
  const [priority, setPriority] = useState<TaskPriority>("NORMAL");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined,
        assigneeId: assigneeId || undefined,
        projectId,
        priority,
        dueDate: dueDate || undefined,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "작업 생성에 실패했습니다.");
      return;
    }

    const { task } = await res.json();
    onCreated(task);
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-card animate-fade-up flex w-full max-w-md flex-col overflow-hidden rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-3.5">
          <strong className="font-mono text-xs text-white">새 작업 추가</strong>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 text-sm text-white/40 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto p-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none placeholder:text-white/20 focus:border-brand-light/40"
            placeholder="작업 제목"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-relaxed text-white outline-none placeholder:text-white/20 focus:border-brand-light/40"
            placeholder="세부 내용 (선택)"
          />

          <div>
            <div className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
              담당자
            </div>
            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => {
                const isSel = assigneeId === m.user.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setAssigneeId(m.user.id)}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium transition-all ${
                      isSel
                        ? "border-white bg-white text-slate-900"
                        : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                    }`}
                  >
                    <div
                      className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-bold text-white"
                      style={{ background: colorForId(m.user.id) }}
                    >
                      {initials(m.user)}
                    </div>
                    <span>{m.user.name ?? m.user.email}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                우선순위
              </div>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full cursor-pointer rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value} className="bg-[#0c0e12]">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                마감일 (선택)
              </div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="mt-1 flex justify-end gap-2 border-t border-white/8 pt-3">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] text-white/45 transition-all hover:text-white"
            >
              취소
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="cursor-pointer rounded-lg border border-brand-light/35 bg-brand-light/15 px-4 py-1.5 text-[11px] font-bold text-brand-light transition-all hover:bg-brand-light/25 disabled:opacity-50"
            >
              {submitting ? "생성 중..." : "생성"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
