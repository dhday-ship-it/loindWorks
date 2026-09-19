"use client";

import { useRef, useState } from "react";

import { Modal } from "./Modal";
import type { BannerItem } from "./types";

export function BannerModal({
  banner,
  nextOrder,
  onClose,
  onSaved,
  onDeleted,
}: {
  banner: BannerItem | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: (banner: BannerItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl ?? "");
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("scope", "banner");
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
    if (!imageUrl) {
      setError("배너 이미지를 업로드해주세요.");
      return;
    }
    setError(null);
    setSaving(true);

    const payload = { imageUrl, linkUrl: linkUrl || null, order: banner?.order ?? nextOrder };

    const res = banner
      ? await fetch(`/api/admin/banners/${banner.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/banners", {
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

    const { banner: saved } = await res.json();
    onSaved(saved);
  };

  const remove = async () => {
    if (!banner) return;
    if (!window.confirm("이 배너를 삭제할까요?")) return;
    setSaving(true);
    const res = await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" });
    setSaving(false);
    if (res.ok) onDeleted(banner.id);
  };

  return (
    <Modal
      title={banner ? "배너 수정" : "새 배너 추가"}
      subtitle="홈 화면 상단에 노출되는 배너 이미지를 관리합니다."
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              배너 이미지
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              권장 사이즈 1600 × 300px (가로형)
            </span>
          </div>
          {imageUrl && (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="배너 미리보기" className="max-h-40 w-full object-cover" />
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
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            연결 링크 (선택)
          </span>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="admin-input"
            placeholder="https://..."
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          {banner ? (
            <button
              onClick={remove}
              disabled={saving}
              className="admin-btn-danger disabled:opacity-50"
            >
              삭제
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="admin-btn-ghost">
              취소
            </button>
            <button
              onClick={save}
              disabled={saving || uploading}
              className="admin-btn-primary disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
