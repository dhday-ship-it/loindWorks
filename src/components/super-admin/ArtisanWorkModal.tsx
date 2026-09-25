"use client";

import { useRef, useState } from "react";

import { Modal } from "./Modal";
import type { ArtisanWorkItem } from "./types";

const COLORS = [
  { value: "lavender", label: "라벤더" },
  { value: "blue", label: "블루" },
  { value: "peach", label: "피치" },
  { value: "mint", label: "민트" },
  { value: "yellow", label: "옐로우" },
  { value: "lilac", label: "라일락" },
];

export function ArtisanWorkModal({
  work,
  nextOrder,
  onClose,
  onSaved,
  onDeleted,
}: {
  work: ArtisanWorkItem | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: (work: ArtisanWorkItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [category, setCategory] = useState(work?.category ?? "");
  const [title, setTitle] = useState(work?.title ?? "");
  const [text, setText] = useState(work?.text ?? "");
  const [imageUrl, setImageUrl] = useState(work?.imageUrl ?? "");
  const [color, setColor] = useState(work?.color ?? "lavender");
  const [isAd, setIsAd] = useState(work?.isAd ?? false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("scope", "artisan-work");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    setUploading(false);
    if (!res.ok) {
      setError("이미지 업로드에 실패했습니다.");
      return;
    }
    const data = await res.json();
    setImageUrl(data.url);
  };

  const save = async () => {
    if (!category || !title || !text || !imageUrl) {
      setError("카테고리, 제목, 설명, 이미지를 모두 입력해주세요.");
      return;
    }
    setError(null);
    setSaving(true);

    const payload = { category, title, text, imageUrl, color, isAd, order: work?.order ?? nextOrder };

    const res = work
      ? await fetch(`/api/admin/artisan-works/${work.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/artisan-works", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "저장에 실패했습니다.");
      return;
    }

    const { work: saved } = await res.json();
    onSaved(saved);
  };

  const remove = async () => {
    if (!work) return;
    if (!window.confirm("이 게시물을 삭제할까요?")) return;
    setSaving(true);
    const res = await fetch(`/api/admin/artisan-works/${work.id}`, { method: "DELETE" });
    setSaving(false);
    if (res.ok) onDeleted(work.id);
  };

  return (
    <Modal
      title={work ? "게시물 수정" : "새 게시물 추가"}
      subtitle="아티즌 홈 '실시간 ONE-PICK' 섹션에 노출되는 작업 게시물입니다."
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">이미지</span>
          {imageUrl && (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="게시물 미리보기" className="max-h-40 w-full object-cover" />
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="admin-btn-ghost w-fit disabled:opacity-50"
          >
            {uploading ? "업로드 중..." : imageUrl ? "이미지 변경" : "이미지 업로드"}
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">카테고리</span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="admin-input"
            placeholder="예: 브랜딩"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">제목</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="admin-input"
            placeholder="예: 브랜드의 시작을 함께 설계합니다"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">설명</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="admin-input min-h-20 resize-none"
            placeholder="예: 정체성을 발견하고 오래 남는 언어와 모습을 만듭니다."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">카드 배경색</span>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  color === c.value ? "border-brand bg-brand-light/12 text-brand" : "border-slate-200 text-slate-500"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-slate-100 p-3 text-sm text-slate-600">
          <input type="checkbox" checked={isAd} onChange={(e) => setIsAd(e.target.checked)} />
          이 게시물을 광고 영역에 노출 (한 번에 하나만 노출되며, 선택 시 기존 광고는 자동 해제됩니다)
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          {work ? (
            <button onClick={remove} disabled={saving} className="admin-btn-danger disabled:opacity-50">
              삭제
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="admin-btn-ghost">
              취소
            </button>
            <button onClick={save} disabled={saving || uploading} className="admin-btn-primary disabled:opacity-50">
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
