"use client";

import { useEffect, useState } from "react";

import { BannerModal } from "./BannerModal";
import type { BannerItem } from "./types";

export function BannersPage({
  showToast,
}: {
  showToast: (msg: string) => void;
}) {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BannerItem | "new" | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/banners")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setLoading(false);
        if (data) setBanners(data.banners);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleActive = async (b: BannerItem) => {
    const res = await fetch(`/api/admin/banners/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !b.active }),
    });
    if (res.ok) {
      const { banner } = await res.json();
      setBanners((prev) => prev.map((x) => (x.id === banner.id ? banner : x)));
    }
  };

  const move = async (b: BannerItem, dir: -1 | 1) => {
    const sorted = [...banners].sort((a, c) => a.order - c.order);
    const idx = sorted.findIndex((x) => x.id === b.id);
    const swapWith = sorted[idx + dir];
    if (!swapWith) return;

    const [resA, resB] = await Promise.all([
      fetch(`/api/admin/banners/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: swapWith.order }),
      }),
      fetch(`/api/admin/banners/${swapWith.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: b.order }),
      }),
    ]);
    if (resA.ok && resB.ok) {
      const { banner: updatedA } = await resA.json();
      const { banner: updatedB } = await resB.json();
      setBanners((prev) =>
        prev.map((x) => (x.id === updatedA.id ? updatedA : x.id === updatedB.id ? updatedB : x))
      );
    }
  };

  const sorted = [...banners].sort((a, b) => a.order - b.order);
  const nextOrder = banners.length === 0 ? 0 : Math.max(...banners.map((b) => b.order)) + 1;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[22px] font-bold text-slate-800">배너 관리</div>
          <div className="text-xs text-slate-500">
            홈 화면 상단에 노출되는 광고 배너를 관리합니다. 여러 개 등록 시 순서대로 순환 노출됩니다.
          </div>
        </div>
        <button onClick={() => setEditing("new")} className="admin-btn-primary">
          + 배너 추가
        </button>
      </div>

      <div className="admin-sec-card p-6">
        {loading && <div className="py-6 text-center text-sm text-slate-400">불러오는 중...</div>}
        {!loading && sorted.length === 0 && (
          <div className="py-6 text-center text-sm text-slate-400">등록된 배너가 없습니다.</div>
        )}
        {!loading && sorted.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {sorted.map((b, i) => (
              <div key={b.id} className="overflow-hidden rounded-xl border border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.imageUrl} alt="배너" className="h-32 w-full object-cover" />
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <span className={`admin-badge ${b.active ? "admin-b-done" : "admin-b-pending"}`}>
                      {b.active ? "노출 중" : "비활성"}
                    </span>
                    {b.linkUrl && (
                      <div className="mt-1 truncate text-[11px] text-slate-400">{b.linkUrl}</div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => move(b, -1)}
                      disabled={i === 0}
                      className="admin-btn-ghost px-2 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(b, 1)}
                      disabled={i === sorted.length - 1}
                      className="admin-btn-ghost px-2 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button onClick={() => toggleActive(b)} className="admin-btn-ghost">
                      {b.active ? "숨기기" : "노출"}
                    </button>
                    <button onClick={() => setEditing(b)} className="admin-btn-ghost">
                      수정
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <BannerModal
          banner={editing === "new" ? null : editing}
          nextOrder={nextOrder}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setBanners((prev) => {
              const exists = prev.some((b) => b.id === saved.id);
              return exists ? prev.map((b) => (b.id === saved.id ? saved : b)) : [...prev, saved];
            });
            setEditing(null);
            showToast(editing === "new" ? "배너가 추가되었습니다." : "배너가 수정되었습니다.");
          }}
          onDeleted={(id) => {
            setBanners((prev) => prev.filter((b) => b.id !== id));
            setEditing(null);
            showToast("배너가 삭제되었습니다.");
          }}
        />
      )}
    </div>
  );
}
