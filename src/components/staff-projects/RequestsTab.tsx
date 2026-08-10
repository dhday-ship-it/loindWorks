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

// ─── 5단계 상태 정의 ────────────────────────────────────────────
const STATUS_LABEL: Record<RequestStatus, string> = {
  WAIT: "대기",
  CHECK: "확인",
  WIP: "작업 중",
  REVIEW: "검토",
  DONE: "완료",
};

const STATUS_ORDER: RequestStatus[] = ["WAIT", "CHECK", "WIP", "REVIEW", "DONE"];

const STATUS_STYLE: Record<RequestStatus, string> = {
  WAIT:   "border-white/15 bg-white/5 text-white/50",
  CHECK:  "border-blue-400/35 bg-blue-400/10 text-blue-300",
  WIP:    "border-amber-400/35 bg-amber-400/10 text-amber-300",
  REVIEW: "border-violet-400/35 bg-violet-400/10 text-violet-300",
  DONE:   "border-emerald-400/35 bg-emerald-400/10 text-emerald-300",
};

const STATUS_DOT: Record<RequestStatus, string> = {
  WAIT:   "bg-white/30",
  CHECK:  "bg-blue-400",
  WIP:    "bg-amber-400 animate-pulse",
  REVIEW: "bg-violet-400",
  DONE:   "bg-emerald-400",
};

function timeAgo(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 요청 전체 대표 상태: 담당자 중 가장 진행된 상태 반환
function overallStatus(item: ProjectRequestItem): RequestStatus {
  if (item.assignees.length === 0) return "WAIT";
  const order = STATUS_ORDER;
  let max = 0;
  for (const a of item.assignees) {
    const idx = order.indexOf(a.status);
    if (idx > max) max = idx;
  }
  return order[max];
}

// ─── 컴포넌트 ────────────────────────────────────────────────────
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
  // 활성 섹션: "REQUEST" = 클라이언트 요청, "TASK" = 작업 목록
  const [section, setSection] = useState<"REQUEST" | "TASK">("REQUEST");
  const [showCompose, setShowCompose] = useState(false);

  // 작성 폼 state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 상태 필터
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "ALL">("ALL");

  // 댓글
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  // 섹션별 아이템
  const sectionItems = requests.filter((r) => r.itemType === section);
  const filtered =
    filterStatus === "ALL"
      ? sectionItems
      : sectionItems.filter((r) => overallStatus(r) === filterStatus);

  const clientRequests = requests.filter((r) => r.itemType === "REQUEST");
  const taskItems = requests.filter((r) => r.itemType === "TASK");

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openForm = () => {
    setTitle("");
    setBody("");
    setSelected(new Set());
    setShowCompose(true);
  };

  const submitItem = async () => {
    if (!body.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        itemType: section,
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

  const deleteItem = async (id: string) => {
    onRequestsChange(requests.filter((r) => r.id !== id));
    await fetch(`/api/projects/${projectId}/requests/${id}`, { method: "DELETE" });
  };

  const setStatus = async (
    requestId: string,
    assigneeId: string,
    status: RequestStatus
  ) => {
    const req = requests.find((r) => r.id === requestId);
    const a = req?.assignees.find((a) => a.id === assigneeId);
    const nextStatus = a?.status === status ? "WAIT" : status;

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
    <div className="flex h-full flex-col">
      {/* ── 섹션 탭 ── */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-xl border border-white/8 bg-black/20 p-1">
          <button
            onClick={() => { setSection("REQUEST"); setFilterStatus("ALL"); setShowCompose(false); }}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
              section === "REQUEST"
                ? "bg-white text-slate-900 shadow"
                : "text-white/45 hover:text-white"
            }`}
          >
            <span>📨</span>
            클라이언트 요청
            {clientRequests.length > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ${section === "REQUEST" ? "bg-slate-200 text-slate-700" : "bg-white/10 text-white/50"}`}>
                {clientRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setSection("TASK"); setFilterStatus("ALL"); setShowCompose(false); }}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
              section === "TASK"
                ? "bg-white text-slate-900 shadow"
                : "text-white/45 hover:text-white"
            }`}
          >
            <span>📋</span>
            작업 목록
            {taskItems.length > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ${section === "TASK" ? "bg-slate-200 text-slate-700" : "bg-white/10 text-white/50"}`}>
                {taskItems.length}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={openForm}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white transition-all hover:bg-white/12"
        >
          +
        </button>
      </div>

      {/* ── 상태 필터 ── */}
      <div className="mb-3 flex flex-wrap gap-1 font-mono text-[10px]">
        {(["ALL", ...STATUS_ORDER] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`cursor-pointer rounded-full border px-2.5 py-0.5 font-bold transition-all ${
              filterStatus === s
                ? "border-white/20 bg-white text-slate-900"
                : "border-white/5 bg-white/5 text-white/35 hover:text-white"
            }`}
          >
            {s === "ALL" ? "전체" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* ── 작성 폼 ── */}
      {showCompose && (
        <div className="glass-input animate-fade-up mb-4 rounded-xl border border-white/10 p-3.5">
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white/40">
            <span>{section === "REQUEST" ? "📨 클라이언트 요청 등록" : "📋 작업 항목 추가"}</span>
          </div>
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
            placeholder={section === "REQUEST" ? "클라이언트 요청 내용을 입력하세요..." : "작업 내용 및 요구사항을 입력하세요..."}
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
              onClick={submitItem}
              className="cursor-pointer rounded bg-white px-3 py-1 text-slate-900 transition-all"
            >
              등록
            </button>
          </div>
        </div>
      )}

      {/* ── 아이템 목록 ── */}
      <div className="flex-1 space-y-2.5 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="py-10 text-center font-mono text-xs text-white/20">
            {filterStatus === "ALL"
              ? section === "REQUEST"
                ? "클라이언트 요청이 없습니다."
                : "등록된 작업이 없습니다."
              : `'${STATUS_LABEL[filterStatus]}' 상태의 항목이 없습니다.`}
          </div>
        )}

        {filtered.map((r) => {
          const overall = overallStatus(r);
          return (
            <div
              key={r.id}
              className="group relative flex flex-col gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-white/10 hover:bg-white/[0.05]"
            >
              {/* 헤더 */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {/* 대표 상태 dot */}
                  <div className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[overall]}`} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2 font-mono text-[10px] text-white/40">
                      <div
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] font-bold text-white"
                        style={{ background: colorForId(r.author.id) }}
                      >
                        {initials(r.author)}
                      </div>
                      <span className="font-bold text-white/60">
                        {r.author.name ?? r.author.email}
                      </span>
                      <span>{timeAgo(r.createdAt)}</span>
                    </div>
                    {r.title && (
                      <div className="text-xs font-bold text-white">{r.title}</div>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {/* 대표 상태 뱃지 */}
                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold ${STATUS_STYLE[overall]}`}>
                    {STATUS_LABEL[overall]}
                  </span>
                  <button
                    onClick={() => deleteItem(r.id)}
                    className="cursor-pointer text-xs text-white/20 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="whitespace-pre-wrap text-xs font-medium leading-relaxed text-white/75">
                {r.body}
              </div>

              {/* 담당자별 상태 */}
              {r.assignees.length > 0 && (
                <div className="mt-1 flex flex-col gap-1.5 border-t border-white/5 pt-2.5">
                  {r.assignees.map((a) => {
                    const key = `${r.id}-${a.id}`;
                    const isOpen = openComments.has(key);
                    return (
                      <div
                        key={a.id}
                        className="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/25 p-2.5"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {/* 담당자 */}
                          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-medium text-white/70">
                            <div
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                              style={{ background: colorForId(a.user.id) }}
                            >
                              {initials(a.user)}
                            </div>
                            <span className="truncate">{a.user.name ?? a.user.email}</span>
                          </div>

                          {/* 5단계 상태 버튼 */}
                          <div className="flex shrink-0 flex-wrap gap-1">
                            {STATUS_ORDER.map((s) => (
                              <button
                                key={s}
                                onClick={() => setStatus(r.id, a.id, s)}
                                className={`cursor-pointer rounded-full border px-2 py-0.5 text-[9px] font-bold transition-all ${
                                  a.status === s
                                    ? STATUS_STYLE[s] + " scale-105 shadow-sm"
                                    : "border-white/5 bg-transparent text-white/30 hover:text-white"
                                }`}
                              >
                                {STATUS_LABEL[s]}
                              </button>
                            ))}
                          </div>

                          {/* 댓글 토글 */}
                          <button
                            onClick={() => toggleComments(key)}
                            className="flex shrink-0 cursor-pointer items-center gap-1 font-mono text-[10px] font-bold text-white/35 transition-all hover:text-white"
                          >
                            💬
                            {a.comments.length > 0 && (
                              <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1 text-[8px] text-emerald-400">
                                {a.comments.length}
                              </span>
                            )}
                          </button>
                        </div>

                        {/* 댓글 영역 */}
                        {isOpen && (
                          <div className="flex flex-col gap-2 border-t border-white/5 pt-2">
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
                            <div className="flex items-center gap-2">
                              <input
                                value={commentDraft[key] ?? ""}
                                onChange={(e) =>
                                  setCommentDraft((prev) => ({ ...prev, [key]: e.target.value }))
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
          );
        })}
      </div>
    </div>
  );
}
