"use client";

import { useState } from "react";
import type { Role } from "@/generated/prisma/enums";
import type { RequestEntryItem } from "./types";

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function EntryEditForm({
  entry,
  onCancel,
  onSaved,
}: {
  entry: RequestEntryItem;
  onCancel: () => void;
  onSaved: (next: RequestEntryItem) => void;
}) {
  const [title, setTitle] = useState(entry.title);
  const [body, setBody] = useState(entry.body ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/projects/${entry.projectId}/logs/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    setSaving(false);
    if (res.ok) {
      onSaved({ ...entry, title, body: body || null });
    }
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3.5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none placeholder:text-slate-300"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="내용"
        rows={3}
        className="mb-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-300"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold text-slate-400"
        >
          취소
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="cursor-pointer rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

export function RequestFeed({
  workId,
  entries,
  onEntriesChange,
  currentUser,
}: {
  workId: string;
  entries: RequestEntryItem[];
  onEntriesChange: (next: RequestEntryItem[]) => void;
  currentUser: { id: string; role: Role };
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [editingId, setEditingId] = useState<string | null>(null);

  const canModify = (entry: RequestEntryItem) =>
    entry.author.id === currentUser.id || currentUser.role === "SUPER_ADMIN";

  const submit = async () => {
    if (!title.trim()) return;
    const res = await fetch(`/api/projects/${workId}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "NOTE", title, body, logDate }),
    });
    if (res.ok) {
      const { log } = await res.json();
      onEntriesChange([
        {
          id: log.id,
          title: log.title,
          body: log.body,
          logDate: log.logDate ?? log.createdAt,
          author: log.author,
          projectId: workId,
        },
        ...entries,
      ]);
      setTitle("");
      setBody("");
      setShowForm(false);
    }
  };

  const remove = async (id: string) => {
    onEntriesChange(entries.filter((e) => e.id !== id));
    await fetch(`/api/projects/${workId}/logs/${id}`, { method: "DELETE" });
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-t border-slate-100 pt-6">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <div className="text-sm font-bold text-slate-700">요청사항내용</div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="cursor-pointer rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition-all hover:bg-brand-light/12 hover:text-brand"
        >
          + 추가
        </button>
      </div>

      {showForm && (
        <div className="mb-4 shrink-0 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
          <div className="mb-2 flex gap-2">
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 outline-none"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none placeholder:text-slate-300"
            />
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="내용"
            rows={3}
            className="mb-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-300"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold text-slate-400"
            >
              취소
            </button>
            <button
              onClick={submit}
              className="cursor-pointer rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white"
            >
              등록
            </button>
          </div>
        </div>
      )}

      <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-3">
        {entries.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-300">
            등록된 요청사항이 없습니다.
          </div>
        )}
        {entries.map((e) =>
          editingId === e.id ? (
            <EntryEditForm
              key={e.id}
              entry={e}
              onCancel={() => setEditingId(null)}
              onSaved={(next) => {
                onEntriesChange(entries.map((it) => (it.id === next.id ? next : it)));
                setEditingId(null);
              }}
            />
          ) : (
            <div
              key={e.id}
              className="group rounded-xl bg-slate-50 p-3.5 transition-all hover:bg-slate-100/70"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400">
                      {fmtDateTime(e.logDate)}
                    </span>
                    <span className="text-[10px] text-slate-300">
                      {e.author.name ?? e.author.email}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-700">
                    {e.title}
                  </div>
                  {e.body && (
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-500">
                      {e.body}
                    </p>
                  )}
                </div>
                {canModify(e) && (
                  <div className="flex shrink-0 items-center gap-2 opacity-0 transition-all group-hover:opacity-100">
                    <button
                      onClick={() => setEditingId(e.id)}
                      className="cursor-pointer text-[11px] font-semibold text-slate-400 hover:text-brand"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => remove(e.id)}
                      className="cursor-pointer text-slate-300 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
