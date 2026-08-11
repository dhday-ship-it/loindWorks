"use client";

import { useMemo, useState } from "react";

import type { Role, RequestStatus } from "@/generated/prisma/enums";
import {
  colorForId,
  initials,
  type ActivityLogItem,
  type Person,
  type ProjectFileItem,
  type ProjectMemberItem,
  type ProjectRequestItem,
} from "./types";
import { HistoryModal } from "./HistoryModal";
import { fmtFileSize, uploadFile } from "@/lib/file-format";

function AttachmentList({ files }: { files: ProjectFileItem[] }) {
  if (files.length === 0) return null;
  return (
    <div className="mt-0.5 flex flex-wrap gap-1.5">
      {files.map((f) => (
        <a
          key={f.id}
          href={f.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-white/55 transition-all hover:bg-white/10 hover:text-white"
        >
          📎 {f.name}
          <span className="text-white/25">{fmtFileSize(f.size)}</span>
        </a>
      ))}
    </div>
  );
}

// ─── 통합 유형 정의 ──────────────────────────────────────────────
const KIND_META = {
  REQUEST: { icon: "📨", label: "요청", kind: "request" as const, cls: "border-brand-light/30 text-brand-light bg-brand-light/5" },
  TASK: { icon: "📋", label: "작업", kind: "request" as const, cls: "border-white/20 text-white/60 bg-white/5" },
  CALL: { icon: "📞", label: "통화", kind: "log" as const, cls: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" },
  MEET: { icon: "👥", label: "미팅", kind: "log" as const, cls: "border-blue-500/30 text-blue-400 bg-blue-500/5" },
  MSG: { icon: "💬", label: "문자", kind: "log" as const, cls: "border-amber-500/30 text-amber-400 bg-amber-500/5" },
  EMAIL: { icon: "✉️", label: "이메일", kind: "log" as const, cls: "border-red-500/30 text-red-400 bg-red-500/5" },
  NOTE: { icon: "📝", label: "메모", kind: "log" as const, cls: "border-white/20 text-white/60 bg-white/5" },
} as const;
type ComposeKind = keyof typeof KIND_META;
const KIND_ORDER: ComposeKind[] = ["REQUEST", "TASK", "CALL", "MEET", "MSG", "EMAIL", "NOTE"];

const STATUS_LABEL: Record<RequestStatus, string> = {
  WAIT: "대기",
  CHECK: "확인",
  WIP: "작업 중",
  REVIEW: "검토",
  DONE: "완료",
};
const STATUS_ORDER: RequestStatus[] = ["WAIT", "CHECK", "WIP", "REVIEW", "DONE"];
const STATUS_STYLE: Record<RequestStatus, string> = {
  WAIT: "border-white/15 bg-white/5 text-white/50",
  CHECK: "border-blue-400/35 bg-blue-400/10 text-blue-300",
  WIP: "border-amber-400/35 bg-amber-400/10 text-amber-300",
  REVIEW: "border-violet-400/35 bg-violet-400/10 text-violet-300",
  DONE: "border-emerald-400/35 bg-emerald-400/10 text-emerald-300",
};
const STATUS_DOT: Record<RequestStatus, string> = {
  WAIT: "bg-white/30",
  CHECK: "bg-blue-400",
  WIP: "bg-amber-400 animate-pulse",
  REVIEW: "bg-violet-400",
  DONE: "bg-emerald-400",
};

function timeAgo(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function overallStatus(item: ProjectRequestItem): RequestStatus {
  if (item.assignees.length === 0) return "WAIT";
  let max = 0;
  for (const a of item.assignees) {
    const idx = STATUS_ORDER.indexOf(a.status);
    if (idx > max) max = idx;
  }
  return STATUS_ORDER[max];
}

type StreamEntry =
  | { kind: "request"; id: string; createdAt: string; data: ProjectRequestItem }
  | { kind: "log"; id: string; createdAt: string; data: ActivityLogItem };

export function ProjectStreamTab({
  projectId,
  requests,
  logs,
  members,
  currentUser,
  currentUserRole,
  onRequestsChange,
  onLogsChange,
}: {
  projectId: string;
  requests: ProjectRequestItem[];
  logs: ActivityLogItem[];
  members: ProjectMemberItem[];
  currentUser: Person;
  currentUserRole: Role;
  onRequestsChange: (next: ProjectRequestItem[]) => void;
  onLogsChange: (next: ActivityLogItem[]) => void;
}) {
  const [filterKind, setFilterKind] = useState<ComposeKind | "ALL">("ALL");
  const [onlyMine, setOnlyMine] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  const [composeKind, setComposeKind] = useState<ComposeKind>("REQUEST");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [withPerson, setWithPerson] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [pendingFiles, setPendingFiles] = useState<
    { name: string; url: string; size: number; mimeType: string | null }[]
  >([]);
  const [uploading, setUploading] = useState(false);

  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTags, setEditTags] = useState<Set<string>>(new Set());
  const [historyLog, setHistoryLog] = useState<ActivityLogItem | null>(null);

  const memberOf = useMemo(() => {
    const map = new Map<string, Person>();
    for (const m of members) map.set(m.user.id, m.user);
    return map;
  }, [members]);

  const entries: StreamEntry[] = useMemo(() => {
    const a: StreamEntry[] = requests.map((r) => ({
      kind: "request",
      id: r.id,
      createdAt: r.createdAt,
      data: r,
    }));
    const b: StreamEntry[] = logs.map((l) => ({
      kind: "log",
      id: l.id,
      createdAt: l.createdAt,
      data: l,
    }));
    return [...a, ...b].sort(
      (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
    );
  }, [requests, logs]);

  const filtered = entries.filter((e) => {
    if (filterKind !== "ALL") {
      const value = e.kind === "request" ? e.data.itemType : e.data.type;
      if (value !== filterKind) return false;
    }
    if (onlyMine) {
      if (e.kind === "request") {
        if (!e.data.assignees.some((a) => a.user.id === currentUser.id)) return false;
      } else {
        if (!e.data.taggedUserIds.includes(currentUser.id)) return false;
      }
    }
    return true;
  });

  const toggleTag = (id: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEditTag = (id: string) => {
    setEditTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openForm = () => {
    setTitle("");
    setBody("");
    setWithPerson("");
    setLogDate(new Date().toISOString().slice(0, 10));
    setSelectedTags(new Set());
    setPendingFiles([]);
    setShowCompose(true);
  };

  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const uploaded = await uploadFile(file, projectId);
        setPendingFiles((prev) => [...prev, uploaded]);
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const removePendingFile = (url: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.url !== url));
  };

  const submitItem = async () => {
    const meta = KIND_META[composeKind];
    if (meta.kind === "request") {
      if (!body.trim()) return;
      const res = await fetch(`/api/projects/${projectId}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          itemType: composeKind,
          assigneeUserIds: [...selectedTags],
          attachments: pendingFiles,
        }),
      });
      if (res.ok) {
        const { request } = await res.json();
        onRequestsChange([request, ...requests]);
        setShowCompose(false);
      }
    } else {
      if (!title.trim()) {
        window.alert("제목을 입력해주세요.");
        return;
      }
      const res = await fetch(`/api/projects/${projectId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachments: pendingFiles,
          type: composeKind,
          title,
          body,
          withPerson,
          logDate,
          taggedUserIds: [...selectedTags],
        }),
      });
      if (res.ok) {
        const { log } = await res.json();
        onLogsChange([log, ...logs]);
        setShowCompose(false);
      }
    }
  };

  const deleteRequest = async (id: string) => {
    onRequestsChange(requests.filter((r) => r.id !== id));
    await fetch(`/api/projects/${projectId}/requests/${id}`, { method: "DELETE" });
  };

  const deleteLog = async (id: string) => {
    onLogsChange(logs.filter((l) => l.id !== id));
    await fetch(`/api/projects/${projectId}/logs/${id}`, { method: "DELETE" });
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

  const startEditLog = (log: ActivityLogItem) => {
    setEditingLogId(log.id);
    setEditTitle(log.title);
    setEditBody(log.body ?? "");
    setEditTags(new Set(log.taggedUserIds));
  };

  const saveEditLog = async (id: string) => {
    const res = await fetch(`/api/projects/${projectId}/logs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        body: editBody,
        taggedUserIds: [...editTags],
      }),
    });
    if (res.ok) {
      const { log } = await res.json();
      onLogsChange(logs.map((l) => (l.id === id ? log : l)));
    }
    setEditingLogId(null);
  };

  return (
    <div className="flex h-full flex-col">
      {/* ── 헤더 & 필터 ── */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1 font-mono text-[10px]">
          <button
            onClick={() => setFilterKind("ALL")}
            className={`cursor-pointer rounded-full border px-2.5 py-0.5 font-bold transition-all ${
              filterKind === "ALL"
                ? "border-white/20 bg-white text-slate-900"
                : "border-white/5 bg-white/5 text-white/35 hover:text-white"
            }`}
          >
            전체 {entries.length}
          </button>
          {KIND_ORDER.map((k) => {
            const count = entries.filter((e) =>
              e.kind === "request" ? e.data.itemType === k : e.data.type === k
            ).length;
            if (count === 0) return null;
            return (
              <button
                key={k}
                onClick={() => setFilterKind(k)}
                className={`cursor-pointer rounded-full border px-2.5 py-0.5 font-bold transition-all ${
                  filterKind === k
                    ? "border-white/20 bg-white text-slate-900"
                    : "border-white/5 bg-white/5 text-white/35 hover:text-white"
                }`}
              >
                {KIND_META[k].icon} {KIND_META[k].label} {count}
              </button>
            );
          })}
          <button
            onClick={() => setOnlyMine((v) => !v)}
            className={`cursor-pointer rounded-full border px-2.5 py-0.5 font-bold transition-all ${
              onlyMine
                ? "border-brand-light/40 bg-brand-light/15 text-brand-light"
                : "border-white/5 bg-white/5 text-white/35 hover:text-white"
            }`}
          >
            🏷️ 내 태그만
          </button>
        </div>
        <button
          onClick={openForm}
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white transition-all hover:bg-white/12"
        >
          +
        </button>
      </div>

      {/* ── 작성 폼 ── */}
      {showCompose && (
        <div className="glass-input animate-fade-up mb-4 rounded-xl border border-white/10 p-3.5">
          <div className="mb-3 flex flex-wrap gap-1">
            {KIND_ORDER.map((k) => (
              <button
                key={k}
                onClick={() => setComposeKind(k)}
                className={`cursor-pointer rounded px-2.5 py-0.5 font-mono text-[10px] font-bold transition-all ${
                  composeKind === k
                    ? "bg-white text-slate-900"
                    : "border border-white/5 bg-white/5 font-medium text-white/40 hover:text-white"
                }`}
              >
                {KIND_META[k].icon} {KIND_META[k].label}
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white outline-none placeholder:text-white/20"
            placeholder="제목"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mb-3 min-h-[64px] w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-relaxed text-white outline-none placeholder:text-white/20"
            placeholder="내용을 입력하세요..."
          />

          {KIND_META[composeKind].kind === "log" && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                value={withPerson}
                onChange={(e) => setWithPerson(e.target.value)}
                style={{ width: 130 }}
                className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs text-white outline-none placeholder:text-white/20"
                placeholder="대화 상대"
              />
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                style={{ width: 125 }}
                className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs text-white/60 outline-none"
              />
            </div>
          )}

          <div className="border-t border-white/5 pt-2.5">
            <div className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
              누가 해줬으면 하는지 태그
            </div>
            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => {
                const isSel = selectedTags.has(m.user.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleTag(m.user.id)}
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

          <div className="mt-3 border-t border-white/5 pt-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                첨부파일
              </span>
              <label className="cursor-pointer rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-medium text-white/50 transition-all hover:text-white">
                {uploading ? "업로드 중..." : "+ 파일 선택"}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    handleFileSelect(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {pendingFiles.map((f) => (
                  <span
                    key={f.url}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-white/55"
                  >
                    📎 {f.name}
                    <button
                      onClick={() => removePendingFile(f.url)}
                      className="cursor-pointer text-white/30 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
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

      {/* ── 통합 스트림 ── */}
      <div className="flex-1 space-y-2.5 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="py-10 text-center font-mono text-xs text-white/20">
            표시할 항목이 없습니다.
          </div>
        )}

        {filtered.map((e) => {
          if (e.kind === "request") {
            const r = e.data;
            const meta = KIND_META[r.itemType === "TASK" ? "TASK" : "REQUEST"];
            const overall = overallStatus(r);
            return (
              <div
                key={`req-${r.id}`}
                className="group relative flex flex-col gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-white/10 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[overall]}`} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-white/40">
                        <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${meta.cls}`}>
                          {meta.icon} {meta.label}
                        </span>
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
                    <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold ${STATUS_STYLE[overall]}`}>
                      {STATUS_LABEL[overall]}
                    </span>
                    <button
                      onClick={() => deleteRequest(r.id)}
                      className="cursor-pointer text-xs text-white/20 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="whitespace-pre-wrap text-xs font-medium leading-relaxed text-white/75">
                  {r.body}
                </div>

                <AttachmentList files={r.files} />

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
                            <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-medium text-white/70">
                              <div
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                                style={{ background: colorForId(a.user.id) }}
                              >
                                {initials(a.user)}
                              </div>
                              <span className="truncate">{a.user.name ?? a.user.email}</span>
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-1">
                              {a.user.id === currentUser.id ||
                              currentUserRole === "SUPER_ADMIN" ? (
                                STATUS_ORDER.map((s) => (
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
                                ))
                              ) : (
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${STATUS_STYLE[a.status]}`}
                                >
                                  {STATUS_LABEL[a.status]}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => toggleComments(key)}
                              className="flex shrink-0 cursor-pointer items-center gap-1 font-mono text-[10px] font-bold text-white/35 transition-all hover:text-white"
                            >
                              💬
                              {a.comments.length > 0 && (
                                <span className="rounded border border-brand-light/20 bg-brand-light/10 px-1 text-[8px] text-brand-light">
                                  {a.comments.length}
                                </span>
                              )}
                            </button>
                          </div>

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
                                  onChange={(ev) =>
                                    setCommentDraft((prev) => ({ ...prev, [key]: ev.target.value }))
                                  }
                                  onKeyDown={(ev) => {
                                    if (ev.key === "Enter") sendComment(r.id, a.id);
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
          }

          const log = e.data;
          const meta = KIND_META[log.type as ComposeKind] ?? KIND_META.NOTE;
          const editCount = log.edits.length - 1;
          const tagged = log.taggedUserIds
            .map((id) => memberOf.get(id))
            .filter((p): p is Person => Boolean(p));

          if (editingLogId === log.id) {
            return (
              <div
                key={`log-${log.id}`}
                className="glass-card rounded-xl border border-white/5 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${meta.cls}`}>
                    {meta.icon} {meta.label}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-white/40">
                    인라인 수정 모드
                  </span>
                </div>
                <input
                  value={editTitle}
                  onChange={(ev) => setEditTitle(ev.target.value)}
                  className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-white outline-none"
                />
                <textarea
                  value={editBody}
                  onChange={(ev) => setEditBody(ev.target.value)}
                  className="min-h-[72px] w-full resize-none rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs leading-relaxed text-white outline-none"
                />
                <div className="mt-2.5 border-t border-white/5 pt-2.5">
                  <div className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                    태그
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {members.map((m) => {
                      const isSel = editTags.has(m.user.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => toggleEditTag(m.user.id)}
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
                <div className="mt-2 flex justify-end gap-1.5 text-xs font-bold">
                  <button
                    onClick={() => setEditingLogId(null)}
                    className="cursor-pointer rounded bg-white/5 px-2.5 py-0.5 text-white/40"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => saveEditLog(log.id)}
                    className="cursor-pointer rounded bg-white px-2.5 py-0.5 text-slate-900"
                  >
                    저장
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={`log-${log.id}`}
              className="glass-card group relative flex flex-col gap-2.5 rounded-xl border border-white/5 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs ${meta.cls}`}
                  >
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="break-all text-xs font-bold leading-snug text-white/95">
                      {log.title}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-white/40">
                      <span className="font-bold text-white/60">
                        {log.author.name ?? log.author.email}
                      </span>
                      {log.withPerson && <span>↔ {log.withPerson}</span>}
                      {log.logDate && (
                        <span>{new Date(log.logDate).toLocaleDateString("ko-KR")}</span>
                      )}
                      {editCount > 0 && (
                        <button
                          onClick={() => setHistoryLog(log)}
                          className="cursor-pointer font-bold text-brand-light hover:underline"
                        >
                          🕓 {editCount}회 수정
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-all group-hover:opacity-100">
                  <button
                    onClick={() => startEditLog(log)}
                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-[10px] text-white/30 hover:bg-white/10 hover:text-white"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteLog(log.id)}
                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-[10px] text-white/30 hover:bg-white/10 hover:text-red-400"
                  >
                    🗑
                  </button>
                </div>
              </div>
              {log.body && (
                <div className="mt-1 whitespace-pre-wrap rounded-xl border border-white/5 bg-black/10 p-3 text-xs leading-relaxed text-white/70">
                  {log.body}
                </div>
              )}
              <AttachmentList files={log.files} />
              {tagged.length > 0 && (
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[9px] text-white/25">🏷️</span>
                  {tagged.map((p) => (
                    <span
                      key={p.id}
                      className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-white/50"
                    >
                      <div
                        className="flex h-3 w-3 items-center justify-center rounded-full text-[6px] font-bold text-white"
                        style={{ background: colorForId(p.id) }}
                      >
                        {initials(p)}
                      </div>
                      {p.name ?? p.email}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {historyLog && (
        <HistoryModal log={historyLog} onClose={() => setHistoryLog(null)} />
      )}
    </div>
  );
}
