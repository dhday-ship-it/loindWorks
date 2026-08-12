"use client";

import { useState } from "react";

import type { LogType } from "@/generated/prisma/enums";
import {
  colorForId,
  initials,
  type ActivityLogItem,
  type Person,
  type ProjectFileItem,
  type ProjectMemberItem,
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

const TYPE_META: Record<LogType, { icon: string; label: string; cls: string }> = {
  CALL: { icon: "📞", label: "통화", cls: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" },
  MEET: { icon: "👥", label: "미팅", cls: "border-blue-500/30 text-blue-400 bg-blue-500/5" },
  MSG: { icon: "💬", label: "문자", cls: "border-amber-500/30 text-amber-400 bg-amber-500/5" },
  EMAIL: { icon: "✉️", label: "이메일", cls: "border-red-500/30 text-red-400 bg-red-500/5" },
  NOTE: { icon: "📝", label: "메모", cls: "border-white/20 text-white/60 bg-white/5" },
};
const TYPE_ORDER: LogType[] = ["CALL", "MEET", "MSG", "EMAIL", "NOTE"];

export function ProjectStreamTab({
  projectId,
  logs,
  members,
  currentUser,
  onLogsChange,
}: {
  projectId: string;
  logs: ActivityLogItem[];
  members: ProjectMemberItem[];
  currentUser: Person;
  onLogsChange: (next: ActivityLogItem[]) => void;
}) {
  const [filterType, setFilterType] = useState<LogType | "ALL">("ALL");
  const [onlyMine, setOnlyMine] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  const [composeType, setComposeType] = useState<LogType>("CALL");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [withPerson, setWithPerson] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [pendingFiles, setPendingFiles] = useState<
    { name: string; url: string; size: number; mimeType: string | null }[]
  >([]);
  const [uploading, setUploading] = useState(false);

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTags, setEditTags] = useState<Set<string>>(new Set());
  const [historyLog, setHistoryLog] = useState<ActivityLogItem | null>(null);

  const memberOf = new Map<string, Person>();
  for (const m of members) memberOf.set(m.user.id, m.user);

  const filtered = logs.filter((l) => {
    if (filterType !== "ALL" && l.type !== filterType) return false;
    if (onlyMine && !l.taggedUserIds.includes(currentUser.id)) return false;
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

  const submitLog = async () => {
    if (!title.trim()) {
      window.alert("제목을 입력해주세요.");
      return;
    }
    const res = await fetch(`/api/projects/${projectId}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: pendingFiles,
        type: composeType,
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
  };

  const deleteLog = async (id: string) => {
    onLogsChange(logs.filter((l) => l.id !== id));
    await fetch(`/api/projects/${projectId}/logs/${id}`, { method: "DELETE" });
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
            onClick={() => setFilterType("ALL")}
            className={`cursor-pointer rounded-full border px-2.5 py-0.5 font-bold transition-all ${
              filterType === "ALL"
                ? "border-white/20 bg-white text-slate-900"
                : "border-white/5 bg-white/5 text-white/35 hover:text-white"
            }`}
          >
            전체 {logs.length}
          </button>
          {TYPE_ORDER.map((t) => {
            const count = logs.filter((l) => l.type === t).length;
            if (count === 0) return null;
            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`cursor-pointer rounded-full border px-2.5 py-0.5 font-bold transition-all ${
                  filterType === t
                    ? "border-white/20 bg-white text-slate-900"
                    : "border-white/5 bg-white/5 text-white/35 hover:text-white"
                }`}
              >
                {TYPE_META[t].icon} {TYPE_META[t].label} {count}
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
            {TYPE_ORDER.map((t) => (
              <button
                key={t}
                onClick={() => setComposeType(t)}
                className={`cursor-pointer rounded px-2.5 py-0.5 font-mono text-[10px] font-bold transition-all ${
                  composeType === t
                    ? "bg-white text-slate-900"
                    : "border border-white/5 bg-white/5 font-medium text-white/40 hover:text-white"
                }`}
              >
                {TYPE_META[t].icon} {TYPE_META[t].label}
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white outline-none placeholder:text-white/20"
            placeholder="제목 (예: 정대희 대표 통화 — UI 수정 방향 논의)"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mb-3 min-h-[64px] w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-relaxed text-white outline-none placeholder:text-white/20"
            placeholder="핵심 내용, 결정 사항, 다음 액션 등을 기록하세요..."
          />

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
              onClick={submitLog}
              className="cursor-pointer rounded bg-white px-3 py-1 text-slate-900 transition-all"
            >
              등록
            </button>
          </div>
        </div>
      )}

      {/* ── 기록 목록 ── */}
      <div className="flex-1 space-y-2.5 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="py-10 text-center font-mono text-xs text-white/20">
            표시할 항목이 없습니다.
          </div>
        )}

        {filtered.map((log) => {
          const meta = TYPE_META[log.type];
          const editCount = log.edits.length - 1;
          const tagged = log.taggedUserIds
            .map((id) => memberOf.get(id))
            .filter((p): p is Person => Boolean(p));

          if (editingLogId === log.id) {
            return (
              <div
                key={log.id}
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
              key={log.id}
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
