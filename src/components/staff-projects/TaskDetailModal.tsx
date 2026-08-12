"use client";

import { useState, useRef } from "react";

import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import { colorForId, initials, type Person } from "./types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TaskComment {
  id: string;
  body: string;
  mentions: string[];
  createdAt: string;
  author: Person;
}

export interface TaskHistoryEntry {
  id: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  note: string | null;
  createdAt: string;
  actorId: string;
}

export interface TaskDetailData {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: string;
  assignee: Person;
  createdBy: Person;
  createdAt: string;
  comments: TaskComment[];
  history: TaskHistoryEntry[];
}

export interface TaskEditPatch {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string;
}

interface Props {
  task: TaskDetailData;
  members: { id: string; user: Person }[];
  onClose: () => void;
  onUpdate: (task: Partial<TaskDetailData>) => void;
  onArchive?: () => void;
  onStatusChange?: (status: TaskStatus) => void;
  onEdit?: (patch: TaskEditPatch) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<TaskStatus, string> = {
  WAIT: "대기",
  IN_PROGRESS: "진행 중",
  REVIEW: "검토",
  FEEDBACK: "피드백",
  DONE: "완료",
};

const STATUS_STYLE: Record<TaskStatus, string> = {
  WAIT: "badge-wait",
  IN_PROGRESS: "badge-progress",
  REVIEW: "badge-review",
  FEEDBACK: "badge-feedback",
  DONE: "badge-done",
};

const STATUS_ORDER: TaskStatus[] = ["WAIT", "IN_PROGRESS", "REVIEW", "FEEDBACK", "DONE"];

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  HIGH: "🔴 긴급",
  NORMAL: "🔵 보통",
  LOW: "⚪ 낮음",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function TaskDetailModal({ task, members, onClose, onUpdate, onArchive, onStatusChange, onEdit }: Props) {
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description ?? "");
  const [editAssigneeId, setEditAssigneeId] = useState(task.assignee.id);
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority);
  const [editDueDate, setEditDueDate] = useState(
    task.dueDate ? task.dueDate.slice(0, 10) : ""
  );

  const startEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditAssigneeId(task.assignee.id);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!editTitle.trim()) return;
    const assignee = members.find((m) => m.user.id === editAssigneeId)?.user;
    onEdit?.({
      title: editTitle.trim(),
      description: editDescription || null,
      priority: editPriority,
      dueDate: editDueDate || null,
      assigneeId: editAssigneeId,
    });
    onUpdate({
      title: editTitle.trim(),
      description: editDescription || null,
      priority: editPriority,
      dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
      ...(assignee ? { assignee } : {}),
    });
    setIsEditing(false);
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);

    // @멘션 파싱
    const mentionRegex = /@(\S+)/g;
    const mentionNames = [...commentText.matchAll(mentionRegex)].map((m) => m[1]);
    const mentionIds = members
      .filter((m) => mentionNames.some((n) =>
        (m.user.name ?? m.user.email).toLowerCase().includes(n.toLowerCase())
      ))
      .map((m) => m.user.id);

    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentText, mentions: mentionIds }),
    });

    setSubmitting(false);
    if (res.ok) {
      const { comment } = await res.json();
      onUpdate({ comments: [...task.comments, comment] });
      setCommentText("");
    }
  };

  const insertMention = (user: Person) => {
    const name = user.name ?? user.email.split("@")[0];
    setCommentText((prev) => prev + `@${name} `);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-card animate-fade-up flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/8 px-6 py-4">
          {isEditing ? (
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm font-bold text-white outline-none focus:border-brand-light/40"
                placeholder="작업 제목"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="resize-none rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs leading-relaxed text-white outline-none focus:border-brand-light/40"
                placeholder="세부 내용 (선택)"
              />
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-white">{task.title}</h3>
              {task.description && (
                <p className="mt-1 text-xs leading-relaxed text-white/50">{task.description}</p>
              )}
            </div>
          )}
          <div className="ml-4 flex shrink-0 items-center gap-1">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/50 hover:text-white"
                >
                  취소
                </button>
                <button
                  onClick={saveEdit}
                  className="cursor-pointer rounded-lg border border-brand-light/35 bg-brand-light/15 px-2.5 py-1 text-[10px] font-bold text-brand-light hover:bg-brand-light/25"
                >
                  저장
                </button>
              </>
            ) : (
              <button
                onClick={startEdit}
                className="cursor-pointer p-1 text-white/30 hover:text-white"
                title="수정"
              >
                ✎
              </button>
            )}
            <button
              onClick={onClose}
              className="cursor-pointer p-1 text-white/30 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-6 py-3">
          <div className="flex shrink-0 flex-wrap gap-1">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange?.(s)}
                disabled={!onStatusChange}
                className={`cursor-pointer rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all disabled:cursor-default ${
                  task.status === s
                    ? STATUS_STYLE[s] + " scale-105 shadow-sm"
                    : "border-white/10 bg-transparent text-white/30 hover:text-white"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          {isEditing ? (
            <>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white outline-none"
              >
                {(["HIGH", "NORMAL", "LOW"] as TaskPriority[]).map((p) => (
                  <option key={p} value={p} className="bg-[#0c0e12]">
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1">
                {members.map((m) => {
                  const isSel = editAssigneeId === m.user.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setEditAssigneeId(m.user.id)}
                      className={`flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all ${
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
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white outline-none"
              />
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold text-white/50">
                {PRIORITY_LABEL[task.priority]}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                <div
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold text-white"
                  style={{ background: colorForId(task.assignee.id) }}
                >
                  {initials(task.assignee)}
                </div>
                <span>{task.assignee.name ?? task.assignee.email}</span>
              </div>
              {task.dueDate && (
                <span className="font-mono text-[10px] text-white/35">
                  마감: {new Date(task.dueDate).toLocaleDateString("ko-KR")}
                </span>
              )}
            </>
          )}
          {task.status === "DONE" && onArchive && (
            <button
              onClick={onArchive}
              className="ml-auto cursor-pointer rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] font-bold text-white/40 transition-all hover:bg-white/10 hover:text-white"
            >
              📦 아카이브
            </button>
          )}
        </div>

        {/* Content area — tabs */}
        <div className="flex max-h-[60vh] flex-1 flex-col overflow-y-auto">
          {/* History */}
          {task.history.length > 0 && (
            <div className="border-b border-white/5 px-6 py-3">
              <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                상태 변경 히스토리
              </div>
              <div className="space-y-1.5">
                {task.history.slice(0, 10).map((h) => (
                  <div key={h.id} className="flex items-center gap-2 text-[10px] text-white/40">
                    <span className="font-mono">{new Date(h.createdAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    {h.fromStatus && (
                      <span className={`rounded border px-1.5 py-0.5 font-bold ${STATUS_STYLE[h.fromStatus]}`}>
                        {STATUS_LABEL[h.fromStatus]}
                      </span>
                    )}
                    <span className="text-white/20">→</span>
                    {h.toStatus && (
                      <span className={`rounded border px-1.5 py-0.5 font-bold ${STATUS_STYLE[h.toStatus]}`}>
                        {STATUS_LABEL[h.toStatus]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="flex-1 px-6 py-3">
            <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
              댓글 ({task.comments.length})
            </div>
            <div className="space-y-3">
              {task.comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <div
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                    style={{ background: colorForId(c.author.id) }}
                  >
                    {initials(c.author)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white/85">
                        {c.author.name ?? c.author.email}
                      </span>
                      <span className="font-mono text-[9px] text-white/25">
                        {new Date(c.createdAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/65">
                      {c.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comment input + file upload */}
        <div className="border-t border-white/8 px-6 py-3">
          <div className="relative flex items-center gap-2">
            {/* @ 멘션 팝업 */}
            {showMentions && (
              <div className="glass-card animate-slide-down absolute bottom-full left-0 z-10 mb-1 max-h-40 w-64 overflow-y-auto rounded-xl p-2 shadow-xl">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => insertMention(m.user)}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                      style={{ background: colorForId(m.user.id) }}
                    >
                      {initials(m.user)}
                    </div>
                    <span>{m.user.name ?? m.user.email}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowMentions((v) => !v)}
              className="shrink-0 cursor-pointer rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-bold text-white/40 hover:text-white"
            >
              @
            </button>

            <input
              ref={inputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
              className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none placeholder:text-white/20"
              placeholder="댓글 입력... (@로 멘션)"
            />

            <button
              onClick={submitComment}
              disabled={submitting || !commentText.trim()}
              className="shrink-0 cursor-pointer rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
            >
              전송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
