"use client";

import { useState } from "react";

import type { LogType } from "@/generated/prisma/enums";
import type { ActivityLogItem } from "./types";
import { HistoryModal } from "./HistoryModal";

const TYPE_META: Record<LogType, { icon: string; label: string; cls: string }> = {
  CALL: { icon: "📞", label: "통화", cls: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" },
  MEET: { icon: "👥", label: "미팅", cls: "border-blue-500/30 text-blue-400 bg-blue-500/5" },
  MSG: { icon: "💬", label: "문자", cls: "border-amber-500/30 text-amber-400 bg-amber-500/5" },
  EMAIL: { icon: "✉️", label: "이메일", cls: "border-red-500/30 text-red-400 bg-red-500/5" },
  NOTE: { icon: "📝", label: "메모", cls: "border-white/20 text-white/60 bg-white/5" },
};
const TYPE_ORDER: LogType[] = ["CALL", "MEET", "MSG", "EMAIL", "NOTE"];

export function LogsTab({
  projectId,
  logs,
  onLogsChange,
}: {
  projectId: string;
  logs: ActivityLogItem[];
  onLogsChange: (next: ActivityLogItem[]) => void;
}) {
  const [showCompose, setShowCompose] = useState(false);
  const [type, setType] = useState<LogType>("CALL");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [withPerson, setWithPerson] = useState("");
  const [logDate, setLogDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [historyLog, setHistoryLog] = useState<ActivityLogItem | null>(null);

  const submitLog = async () => {
    if (!title.trim()) {
      window.alert("제목을 입력해주세요.");
      return;
    }

    const res = await fetch(`/api/projects/${projectId}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, body, withPerson, logDate }),
    });

    if (res.ok) {
      const { log } = await res.json();
      onLogsChange([log, ...logs]);
      setTitle("");
      setBody("");
      setWithPerson("");
      setShowCompose(false);
    }
  };

  const deleteLog = async (id: string) => {
    onLogsChange(logs.filter((l) => l.id !== id));
    await fetch(`/api/projects/${projectId}/logs/${id}`, { method: "DELETE" });
  };

  const startEdit = (log: ActivityLogItem) => {
    setEditingId(log.id);
    setEditTitle(log.title);
    setEditBody(log.body ?? "");
  };

  const saveEdit = async (id: string) => {
    const res = await fetch(`/api/projects/${projectId}/logs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, body: editBody }),
    });
    if (res.ok) {
      const { log } = await res.json();
      onLogsChange(logs.map((l) => (l.id === id ? log : l)));
    }
    setEditingId(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold tracking-wide text-white">
            히스토리 로그
          </h4>
          <span className="font-mono text-[10px] text-white/30">
            통화 · 미팅 · 문자 기록 보관소
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
        <div className="glass-input animate-fade-up mb-4 rounded-xl border border-white/10 p-4">
          <div className="mb-3 flex flex-wrap gap-1">
            {TYPE_ORDER.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`cursor-pointer rounded px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                  type === t
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
            className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white outline-none placeholder:text-white/20"
            placeholder="제목 (예: 정대희 대표 통화 — UI 수정 방향 논의)"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[72px] w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-relaxed text-white outline-none placeholder:text-white/20"
            placeholder="내용을 입력하세요. 핵심 내용, 결정 사항, 다음 액션 등을 기록하세요."
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
            <div className="flex items-center gap-2">
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
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowCompose(false)}
                className="cursor-pointer rounded bg-white/5 px-3 py-1 text-xs font-bold text-white/40 transition-all hover:text-white"
              >
                취소
              </button>
              <button
                onClick={submitLog}
                className="cursor-pointer rounded bg-white px-3 py-1 text-xs font-bold text-slate-900 transition-all"
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {logs.length === 0 && (
          <div className="py-8 text-center font-mono text-xs text-white/20">
            기록이 없습니다.
          </div>
        )}
        {logs.map((log) => {
          const tm = TYPE_META[log.type];
          const editCount = log.edits.length - 1;

          if (editingId === log.id) {
            return (
              <div
                key={log.id}
                className="glass-card rounded-xl border border-white/5 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded border text-[10px] ${tm.cls}`}
                  >
                    {tm.icon}
                  </div>
                  <span className="font-mono text-[11px] font-bold text-white/40">
                    {tm.label} 로그 인라인 수정 모드
                  </span>
                </div>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-white outline-none"
                />
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="min-h-[72px] w-full resize-none rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs leading-relaxed text-white outline-none"
                />
                <div className="mt-2 flex justify-end gap-1.5 text-xs font-bold">
                  <button
                    onClick={() => setEditingId(null)}
                    className="cursor-pointer rounded bg-white/5 px-2.5 py-0.5 text-white/40"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => saveEdit(log.id)}
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
                <div className="flex flex-1 min-w-0 items-start gap-3">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs ${tm.cls}`}
                  >
                    {tm.icon}
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
                        <span>
                          {new Date(log.logDate).toLocaleDateString("ko-KR")}
                        </span>
                      )}
                      {editCount > 0 && (
                        <button
                          onClick={() => setHistoryLog(log)}
                          className="cursor-pointer font-bold text-emerald-400 hover:underline"
                        >
                          🕓 {editCount}회 수정
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-all group-hover:opacity-100">
                  <button
                    onClick={() => startEdit(log)}
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
              <div className="mt-0.5 flex flex-wrap gap-1.5">
                <span className="rounded border border-white/5 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-white/40">
                  {tm.icon} {tm.label}
                </span>
                {log.withPerson && (
                  <span className="rounded border border-white/5 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-white/40">
                    {log.withPerson}
                  </span>
                )}
              </div>
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
