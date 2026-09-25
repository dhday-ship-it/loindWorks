"use client";

import { useEffect, useState } from "react";

import { ArtisanWorkModal } from "./ArtisanWorkModal";
import type { ArtisanWorkItem } from "./types";

type ArtisanCategory = { label: string; iconUrl: string | null };
type ArtisanContent = { id?: string; bannerUrl: string | null; categories: ArtisanCategory[] };

const fallback: ArtisanContent = {
  bannerUrl: null,
  categories: [
    { label: "커스텀작업 신청", iconUrl: null },
    { label: "디자인", iconUrl: null },
    { label: "영상", iconUrl: null },
    { label: "홈페이지,웹", iconUrl: null },
    { label: "굿즈,기념품 제작", iconUrl: null },
  ],
};

async function upload(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("scope", "artisan");
  const response = await fetch("/api/upload", { method: "POST", body: formData });
  if (!response.ok) throw new Error("이미지 업로드에 실패했습니다.");
  return (await response.json()).url as string;
}

export function ArtisanPage({ showToast }: { showToast: (message: string) => void }) {
  const [content, setContent] = useState<ArtisanContent>(fallback);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [works, setWorks] = useState<ArtisanWorkItem[]>([]);
  const [worksLoading, setWorksLoading] = useState(true);
  const [editingWork, setEditingWork] = useState<ArtisanWorkItem | "new" | null>(null);

  useEffect(() => {
    fetch("/api/admin/artisan")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.content) setContent(data.content);
      })
      .finally(() => setLoading(false));

    fetch("/api/admin/artisan-works")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.works) setWorks(data.works);
      })
      .finally(() => setWorksLoading(false));
  }, []);

  const updateCategory = (index: number, patch: Partial<ArtisanCategory>) => {
    setContent((current) => ({
      ...current,
      categories: current.categories.map((category, categoryIndex) =>
        categoryIndex === index ? { ...category, ...patch } : category,
      ),
    }));
  };

  const handleUpload = async (file: File, onUploaded: (url: string) => void) => {
    const url = await upload(file);
    onUploaded(url);
  };

  const save = async () => {
    setSaving(true);
    const response = await fetch("/api/admin/artisan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    setSaving(false);
    if (response.ok) {
      const data = await response.json();
      setContent(data.content);
      showToast("아티즌 콘텐츠가 저장되었습니다.");
    }
  };

  const sortedWorks = [...works].sort((a, b) => a.order - b.order);
  const nextWorkOrder = works.length === 0 ? 0 : Math.max(...works.map((w) => w.order)) + 1;

  if (loading) return <div className="py-20 text-center text-sm text-slate-400">불러오는 중...</div>;

  return <div>
    <div className="mb-6 flex items-start justify-between">
      <div><div className="mb-1 text-[22px] font-bold text-slate-800">아티즌</div><div className="text-xs text-slate-500">아티즌 홈의 배너, 서비스 카테고리, ONE-PICK 게시물을 관리합니다.</div></div>
      <button onClick={save} disabled={saving} className="admin-btn-primary">{saving ? "저장 중..." : "변경사항 저장"}</button>
    </div>
    <div className="space-y-5">
      <section className="admin-sec-card p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-bold text-slate-800">최상단 배너</h2><p className="mt-1 text-xs text-slate-400">히어로 영역 위쪽 배너 이미지입니다. (현재 사이트 화면에는 아직 노출 위치가 반영되지 않았습니다)</p></div><label className="admin-btn-ghost cursor-pointer">이미지 변경<input className="hidden" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleUpload(file, (url) => setContent((current) => ({ ...current, bannerUrl: url }))); }} /></label></div><div className="flex h-56 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-[#d9d9d9]">{content.bannerUrl ? <img src={content.bannerUrl} alt="최상단 배너" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-500">등록된 배너가 없습니다.</span>}</div><button className="mt-3 text-xs text-slate-400 underline" onClick={() => setContent((current) => ({ ...current, bannerUrl: null }))}>배너 삭제</button></section>
  <section className="admin-sec-card p-6"><div className="mb-4"><h2 className="text-base font-bold text-slate-800">서비스 카테고리</h2><p className="mt-1 text-xs text-slate-400">홈 화면의 원형 아이콘 이미지와 문구를 변경합니다.</p></div><div className="space-y-3">{content.categories.map((category, index) => <div className="grid grid-cols-[64px_1fr_auto] items-center gap-4 rounded-xl border border-slate-100 p-3" key={index}><div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#d9d9d9] text-xs text-slate-500">{category.iconUrl ? <img src={category.iconUrl} alt="" className="h-full w-full object-cover" /> : index + 1}</div><label className="text-[11px] text-slate-400">카테고리명<input className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand" value={category.label} onChange={(event) => updateCategory(index, { label: event.target.value })} /></label><label className="admin-btn-ghost cursor-pointer">아이콘 변경<input className="hidden" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleUpload(file, (url) => updateCategory(index, { iconUrl: url })); }} /></label></div>)}</div></section>

      <section className="admin-sec-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">ONE-PICK 게시물</h2>
            <p className="mt-1 text-xs text-slate-400">
              &apos;실시간 ONE-PICK&apos; 섹션에 노출되는 작업 게시물입니다. 하나를 &apos;광고 영역에 노출&apos;로 지정하면 그리드의 광고 자리에 표시됩니다.
            </p>
          </div>
          <button onClick={() => setEditingWork("new")} className="admin-btn-primary">+ 게시물 추가</button>
        </div>
        {worksLoading && <div className="py-6 text-center text-sm text-slate-400">불러오는 중...</div>}
        {!worksLoading && sortedWorks.length === 0 && (
          <div className="py-6 text-center text-sm text-slate-400">등록된 게시물이 없습니다.</div>
        )}
        {!worksLoading && sortedWorks.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {sortedWorks.map((w) => (
              <button
                key={w.id}
                onClick={() => setEditingWork(w)}
                className="overflow-hidden rounded-xl border border-slate-100 text-left"
              >
                <img src={w.imageUrl} alt={w.title} className="h-32 w-full object-cover" />
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] text-slate-400">{w.category}</span>
                    {w.isAd && <span className="admin-badge admin-b-done shrink-0">광고 중</span>}
                  </div>
                  <div className="mt-1 truncate text-sm font-medium text-slate-700">{w.title}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>

    {editingWork && (
      <ArtisanWorkModal
        work={editingWork === "new" ? null : editingWork}
        nextOrder={nextWorkOrder}
        onClose={() => setEditingWork(null)}
        onSaved={(saved) => {
          setWorks((prev) => {
            const exists = prev.some((w) => w.id === saved.id);
            const next = exists ? prev.map((w) => (w.id === saved.id ? saved : w)) : [...prev, saved];
            return saved.isAd ? next.map((w) => (w.id === saved.id ? w : { ...w, isAd: false })) : next;
          });
          setEditingWork(null);
          showToast(editingWork === "new" ? "게시물이 추가되었습니다." : "게시물이 수정되었습니다.");
        }}
        onDeleted={(id) => {
          setWorks((prev) => prev.filter((w) => w.id !== id));
          setEditingWork(null);
          showToast("게시물이 삭제되었습니다.");
        }}
      />
    )}
  </div>;
}
