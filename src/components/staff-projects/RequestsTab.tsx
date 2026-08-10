"use client";

import { useState } from "react";

import type { RequestStatus } from "@/generated/prisma/enums";
import {
  colorForId,
  initials,
  type Person,
  type ProjectMemberItem,
  type ProjectRequestItem,
} from "./types";

const STATUS_LABEL: Record<RequestStatus, string> = {
  WAIT: "대기",
  CHECK: "확인",
  WIP: "작업 중",
  DONE: "완료",
};
const STATUS_ORDER: RequestStatus[] = ["WAIT", "CHECK", "WIP", "DONE"];

function timeAgo(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RequestsTab({
  projectId,
  requests,
  members,
  currentUser,
  onRequestsChange,
}: {
  projectId: string;
  requests: ProjectRequestItem[];
  members: ProjectMemberItem[];
  currentUser: Person;
  onRequestsChange: (next: ProjectRequestItem[]) => void;
}) {
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submitRequest = async () => {
    if (!body.trim()) return;

    const res = await fetch(`/api/projects/${projectId}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        assigneeUserIds: [...selected],
      }),
    });

    if (res.ok) {
      const { request } = await res.json();
      onRequestsChange([request, ...requests]);
      setTitle("");
      setBody("");
      setSelected(new Set());
      setShowCompose(false);
    }
  };

  const deleteRequest = async (id: string) => {
    onRequestsChange(requests.filter((r) => r.id !== id));
    await fetch(`/api/projects/${projectId}/requests/${id}`, {
      method: "DELETE",
    });
  };

  const setStatus = async (
    requestId: string,
    assigneeId: string,
    status: RequestStatus
  ) => {
    const request = requests.find((r) => r.id === requestId);
    const assignee = request?.assignees.find((a) => a.id === assigneeId);
    const nextStatus = assignee?.status === status ? "WAIT" : status;

    onRequestsChange(
      requests.map((r) =>
        r.id !== requestId
          ? r
          : {
              ...r,
              assignees: r.assignees.map((a) =>
                a.id === assigneeId ? { ...a, status: nextStatus } : a
              ),
            }
      )
    );

    await fetch(
      `/api/projects/${projectId}/requests/${requestId}/assignees/${assigneeId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      }
    );
  };

  const toggleComments = (key: string) => {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sendComment = async (requestId: string, assigneeId: string) => {
    const key = `${requestId}-${assigneeId}`;
    const text = (commentDraft[key] ?? "").trim();
    if (!text) return;

    const optimistic = {
      authorId: currentUser.id,
      authorName: currentUser.name ?? currentUser.email,
      text,
      createdAt: new Date().toISOString(),
    };

    onRequestsChange(
      requests.map((r) =>
        r.id !== requestId
          ? r
          : {
              ...r,
              assignees: r.assignees.map((a) =>
                a.id === assigneeId
                  ? { ...a, comments: [...a.comments, optimistic] }
                  : a
              ),
            }
      )
    );
    setCommentDraft((prev) => ({ ...prev, [key]: "" }));

    await fetch(
      `/api/projects/${projectId}/requests/${requestId}/assignees/${assigneeId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: text }),
      }
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold tracking-wide text-white">
            요청사항
          </h4>
          <span className="font-mono text-[10px] text-white/30">
            요청사항 · 담당자 지정 · 진행 상태
          </span>
        </div>
        <button
          onClick={() => setShowCompose((v) => !v)}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white transition-all hover:bg-white/12"
        >
          +
        </button>
      </div>

      {showCompose && (
        <div className="glass-input animate-fade-up mb-4 rounded-xl border border-white/10 p-3.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-2 w-full rounded-lg border-none bg-transparent text-xs font-bold text-white outline-none placeholder:text-white/20"
            placeholder="제목 (선택)"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mb-3 min-h-[64px] w-full resize-none border-none bg-transparent text-xs leading-relaxed text-white outline-none placeholder:text-white/20"
            placeholder="요청 사항 필드 가이드라인을 작성하세요..."
          />
          <div className="border-t border-white/5 pt-2.5">
            <div className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
              담당자 지정
            </div>
            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => {
                const isSel = selected.has(m.user.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleSelected(m.user.id)}
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
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2 text-xs font-bold">
            <button
              onClick={() => setShowCompose(false)}
              className="cursor-pointer rounded bg-white/5 px-3 py-1 text-white/40 transition-all hover:text-white"
            >
              취소
            </button>
            <button
              onClick={submitRequest}
              className="cursor-pointer rounded bg-white px-3 py-1 text-slate-900 transition-all"
            >
              등록
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {requests.length === 0 && (
          <div className="py-8 text-center font-mono text-xs text-white/20">
            요청사항이 없습니다.
          </div>
        )}
        {requests.map((r) => (
          <div
            key={r.id}
            className="glass-card group relative flex flex-col gap-2.5 rounded-xl border border-white/5 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 font-mono text-[11px] text-white/40">
                <div
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold text-white"
                  style={{ background: colorForId(r.author.id) }}
                >
                  {initials(r.author)}
                </div>
                <span className="font-bold text-white/70">
                  {r.author.name ?? r.author.email}
                </span>
                <span>{timeAgo(r.createdAt)}</span>
              </div>
              <button
                onClick={() => deleteRequest(r.id)}
                className="cursor-pointer text-xs text-white/20 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>

            {r.title && (
              <div className="text-xs font-bold text-white">{r.title}</div>
            )}
            <div className="whitespace-pre-wrap text-xs font-medium leading-relaxed text-white/90">
              {r.body}
            </div>

            {r.assignees.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5">
                {r.assignees.map((a) => {
                  const key = `${r.id}-${a.id}`;
                  const isOpen = openComments.has(key);
                  return (
                    <div
                      key={a.id}
                      className="flex flex-col gap-2.5 rounded-xl border border-white/5 bg-black/30 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-white/80">
                          <div
                            className="flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold text-white"
                            style={{ background: colorForId(a.user.id) }}
                          >
                            {initials(a.user)}
                          </div>
                          <span>{a.user.name ?? a.user.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {STATUS_ORDER.map((s) => (
                            <button
                              key={s}
                              onClick={() => setStatus(r.id, a.id, s)}
                              className={`cursor-pointer rounded border px-2 py-0.5 text-[9px] font-bold transition-all ${
                                a.status === s
                                  ? "border-white bg-white text-slate-900"
                                  : "border-white/5 bg-transparent text-white/40 hover:text-white"
                              }`}
                            >
                              {STATUS_LABEL[s]}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => toggleComments(key)}
                          className="flex cursor-pointer items-center gap-1 font-mono text-[10px] font-bold text-white/40 transition-all hover:text-white"
                        >
                          💬
                          {a.comments.length > 0 && (
                            <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1 text-[8px] text-emerald-400">
                              {a.comments.length}
                            </span>
                          )}
                        </button>
                      </div>

                      {isOpen && (
                        <div className="flex flex-col gap-2 border-t border-white/5 pt-2.5">
                          <div className="space-y-2">
                            {a.comments.map((c, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <div
                                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] font-bold text-white"
                                  style={{ background: colorForId(c.authorId) }}
                                >
                                  {c.authorName.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1 rounded-xl border border-white/5 bg-white/5 px-2.5 py-1">
                                  <div className="mb-0.5 text-[10px] font-bold text-white/90">
                                    {c.authorName}
                                    <span className="ml-1 font-mono text-[8px] font-normal text-white/20">
                                      {timeAgo(c.createdAt)}
                                    </span>
                                  </div>
                                  <div className="break-all leading-relaxed text-white/70">
                                    {c.text}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <input
                              value={commentDraft[key] ?? ""}
                              onChange={(e) =>
                                setCommentDraft((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") sendComment(r.id, a.id);
                              }}
                              className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none placeholder:text-white/20"
                              placeholder="코멘트 달기..."
                            />
                            <button
                              onClick={() => sendComment(r.id, a.id)}
                              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white text-xs text-slate-900"
                            >
                              ➤
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
