"use client";

import { useRef, useState } from "react";

import { Modal } from "../super-admin/Modal";
import type { ArtisanWorkItem } from "./types";

const COLORS = [
  { value: "lavender", label: "라벤더" },
  { value: "blue", label: "블루" },
  { value: "peach", label: "피치" },
  { value: "mint", label: "민트" },
  { value: "yellow", label: "옐로우" },
  { value: "lilac", label: "라일락" },
];

// 아티즌 홈 상단 카테고리와 동일해야 카테고리 페이지 필터가 맞물린다.
const CATEGORY_OPTIONS: { value: string; tags: string[] }[] = [
  { value: "커스텀작업 신청", tags: [] },
  {
    value: "디자인",
    tags: [
      "주보", "헌금봉투", "현수막(강단/외벽)", "배너·X배너·롤업배너", "수련회/행사 포스터",
      "초청장", "로고 디자인", "명함", "교회 소식지·뉴스레터", "말씀카드", "SNS카드뉴스", "각종 썸네일",
    ],
  },
  {
    value: "영상",
    tags: ["인터뷰 영상", "다큐멘터리", "뮤직비디오", "설교 요약 릴스/쇼츠", "행사 홍보 영상", "강의영상제작", "유튜브 인트로/아웃트로"],
  },
  { value: "홈페이지,웹", tags: ["반응형 공식 웹사이트", "랜딩페이지", "쇼핑몰", "관리자 페이지"] },
  { value: "굿즈,기념품 제작", tags: ["수련회 단체 티셔츠", "성경책 커버", "창립기념/세례·성찬 기념품", "커스텀 굿즈"] },
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
  const [category, setCategory] = useState(work?.category ?? CATEGORY_OPTIONS[1].value);
  const [title, setTitle] = useState(work?.title ?? "");
  const [text, setText] = useState(work?.text ?? "");
  const [imageUrl, setImageUrl] = useState(work?.imageUrl ?? "");
  const [color, setColor] = useState(work?.color ?? "lavender");
  const [tags, setTags] = useState<string[]>(work?.tags ?? []);
  const [price, setPrice] = useState(work?.price != null ? String(work.price) : "");
  const [noPrice, setNoPrice] = useState(work ? work.price == null : false);
  const availableTags = CATEGORY_OPTIONS.find((c) => c.value === category)?.tags ?? [];
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

    const payload = {
      category,
      title,
      text,
      imageUrl,
      color,
      order: work?.order ?? nextOrder,
      tags,
      price: noPrice || !price ? null : Number(price),
    };

    const res = work
      ? await fetch(`/api/artisan-works/${work.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/artisan-works", {
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
    const res = await fetch(`/api/artisan-works/${work.id}`, { method: "DELETE" });
    setSaving(false);
    if (res.ok) onDeleted(work.id);
    else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "삭제에 실패했습니다.");
    }
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
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setTags([]); }}
            className="admin-input"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.value}</option>
            ))}
          </select>
        </div>

        {availableTags.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
              세부 분류 (카테고리 페이지 필터에 노출됩니다)
            </span>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const checked = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setTags((prev) => (checked ? prev.filter((t) => t !== tag) : [...prev, tag]))
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      checked ? "border-brand bg-brand-light/12 text-brand" : "border-slate-200 text-slate-500"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">가격</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={price}
              disabled={noPrice}
              onChange={(e) => setPrice(e.target.value)}
              className="admin-input disabled:opacity-40"
              placeholder="예: 150000"
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={noPrice}
                onChange={(e) => setNoPrice(e.target.checked)}
              />
              가격 문의
            </label>
          </div>
        </div>

        {work?.isAd && (
          <p className="rounded-xl bg-brand-light/12 p-3 text-xs font-medium text-brand">
            이 게시물은 현재 광고 자리에 노출 중이에요. 해제하려면 목록 상단의 &apos;광고 자리&apos;에서 변경하세요.
          </p>
        )}

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
