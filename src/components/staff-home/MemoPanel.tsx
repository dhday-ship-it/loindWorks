"use client";

import { useState } from "react";

import type { MemoFolderItem, MemoItem } from "./types";

export function MemoPanel({
  initialMemos,
  initialFolders,
}: {
  initialMemos: MemoItem[];
  initialFolders: MemoFolderItem[];
}) {
  const [memos, setMemos] = useState(initialMemos);
  const [folders, setFolders] = useState(initialFolders);
  const [currentFolder, setCurrentFolder] = useState("전체");

  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [folderId, setFolderId] = useState("");
  const [pinned, setPinned] = useState(false);

  const [openMemo, setOpenMemo] = useState<MemoItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const createFolder = async () => {
    const name = window.prompt("새로 추가할 메모 폴더명을 입력하세요:");
    if (!name || !name.trim()) return;
    const clean = name.trim();

    if (folders.some((f) => f.name === clean)) {
      window.alert("이미 존재하는 폴더명입니다.");
      return;
    }

    const res = await fetch("/api/memo-folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: clean }),
    });
    if (res.ok) {
      const { folder } = await res.json();
      setFolders((prev) => [...prev, folder]);
    }
  };

  const filtered = (
    currentFolder === "전체"
      ? memos
      : memos.filter((m) => m.folder?.name === currentFolder)
  ).sort((a, b) => Number(b.pinned) - Number(a.pinned));

  const addMemo = async () => {
    if (!title.trim() && !body.trim()) return;

    const res = await fetch("/api/memos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "제목 없음",
        body,
        folderId: folderId || undefined,
        pinned,
      }),
    });

    if (res.ok) {
      const { memo } = await res.json();
      setMemos((prev) => [memo, ...prev]);
      setTitle("");
      setBody("");
      setPinned(false);
      setShowCompose(false);
    }
  };

  const toggleStar = async (memo: MemoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPinned = !memo.pinned;
    setMemos((prev) =>
      prev.map((m) => (m.id === memo.id ? { ...m, pinned: nextPinned } : m))
    );
    await fetch(`/api/memos/${memo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: nextPinned }),
    });
  };

  const removeMemo = async (id: string) => {
    setMemos((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/memos/${id}`, { method: "DELETE" });
  };

  const openDetail = (memo: MemoItem) => {
    setOpenMemo(memo);
    setEditTitle(memo.title);
    setEditBody(memo.body ?? "");
  };

  const saveDetail = async () => {
    if (!openMemo) return;
    const nextTitle = editTitle.trim() || "제목 없음";
    setMemos((prev) =>
      prev.map((m) =>
        m.id === openMemo.id ? { ...m, title: nextTitle, body: editBody } : m
      )
    );
    await fetch(`/api/memos/${openMemo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: nextTitle, body: editBody }),
    });
    setOpenMemo(null);
  };

  return (
    <div className="flex flex-col pt-5 md:pl-6 md:pt-0">
      <div className="mb-3 flex items-center justify-between pb-2.5">
        <div>
          <h4 className="text-sm font-bold text-white">개인 메모</h4>
          <span className="text-[10px] tracking-wider text-white/30">
            CUSTOM FOLDER LOG
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={createFolder}
            className="cursor-pointer rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60 transition-all hover:bg-white/10 hover:text-white"
          >
            + 폴더
          </button>
          <button
            onClick={() => setShowCompose((v) => !v)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white transition-all hover:bg-white/10"
          >
            +
          </button>
        </div>
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {["전체", ...folders.map((f) => f.name)].map((f) => (
          <button
            key={f}
            onClick={() => setCurrentFolder(f)}
            className={`shrink-0 cursor-pointer px-1 py-0.5 text-[10px] font-medium transition-all ${
              currentFolder === f
                ? "border-b-2 border-white font-bold text-white"
                : "text-white/40 hover:text-white"
            }`}
          >
            {f === "전체" ? f : `📁 ${f}`}
          </button>
        ))}
      </div>

      {showCompose && (
        <div className="glass-input animate-fade-up mb-3 rounded-xl p-3.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-2 w-full border-b border-white/5 bg-transparent pb-1 text-xs font-bold text-white outline-none placeholder:text-white/20"
            placeholder="제목을 입력하세요."
          />
          <div className="mb-2 flex items-center justify-between">
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="rounded border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] text-white/70 outline-none"
            >
              <option value="">폴더 없음</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
            <label className="flex cursor-pointer select-none items-center gap-1 text-[10px] text-white/50">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              ⭐ 중요 고정
            </label>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[50px] w-full resize-none border-none bg-transparent text-xs leading-relaxed text-white outline-none placeholder:text-white/20"
            placeholder="내용을 기록하세요..."
          />
          <div className="mt-2 flex justify-end gap-1.5 text-xs font-bold">
            <button
              onClick={() => setShowCompose(false)}
              className="cursor-pointer rounded border border-white/10 px-2.5 py-0.5 text-white/50"
            >
              취소
            </button>
            <button
              onClick={addMemo}
              className="cursor-pointer rounded bg-white px-2.5 py-0.5 text-slate-900"
            >
              저장
            </button>
          </div>
        </div>
      )}

      <div className="max-h-[300px] flex-1 space-y-2.5 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <div className="py-5 text-center text-xs text-white/20">
            선택한 폴더에 메모가 없습니다.
          </div>
        )}
        {filtered.map((m) => (
          <div
            key={m.id}
            onClick={() => openDetail(m)}
            className="glass-input group cursor-pointer rounded-xl p-3 transition-all hover:border-white/20"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-xs font-bold text-white/90">
                {m.title}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={(e) => toggleStar(m, e)}
                  className={`cursor-pointer text-xs ${m.pinned ? "text-amber-400" : "text-white/20 hover:text-white/50"}`}
                >
                  ★
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMemo(m.id);
                  }}
                  className="cursor-pointer text-[10px] text-white/20 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            </div>
            {m.body && (
              <p className="line-clamp-2 whitespace-pre-line text-[11px] leading-relaxed text-white/50">
                {m.body}
              </p>
            )}
          </div>
        ))}
      </div>

      {openMemo && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenMemo(null);
          }}
        >
          <div className="glass-card animate-fade-up flex w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 border-none bg-transparent text-sm font-bold text-white outline-none"
                placeholder="제목"
              />
              <button
                onClick={() => setOpenMemo(null)}
                className="cursor-pointer p-1 text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-6">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="min-h-[240px] w-full resize-none border-none bg-transparent text-sm leading-relaxed text-white/90 outline-none"
                placeholder="내용을 입력하세요..."
              />
            </div>
            <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-6 py-3.5">
              <span className="font-mono text-xs text-white/30">
                {new Date(openMemo.createdAt).toLocaleDateString("ko-KR")}
              </span>
              <div className="flex gap-2 text-xs font-semibold">
                <button
                  onClick={() => setOpenMemo(null)}
                  className="cursor-pointer rounded border border-white/10 px-3.5 py-1 text-white/60 hover:bg-white/5"
                >
                  닫기
                </button>
                <button
                  onClick={saveDetail}
                  className="cursor-pointer rounded bg-white px-3.5 py-1 text-slate-900 hover:opacity-90"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
