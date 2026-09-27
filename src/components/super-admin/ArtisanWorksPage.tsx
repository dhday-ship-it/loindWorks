"use client";

import { useEffect, useMemo, useState } from "react";

import { ArtisanWorkModal } from "../artisan/ArtisanWorkModal";
import type { ArtisanWorkItem } from "../artisan/types";

export function ArtisanWorksPage({ showToast }: { showToast: (message: string) => void }) {
  const [works, setWorks] = useState<ArtisanWorkItem[] | null>(null);
  const [editing, setEditing] = useState<ArtisanWorkItem | "new" | null>(null);
  const [reordering, setReordering] = useState(false);

  const load = () => {
    fetch("/api/artisan-works")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setWorks(Array.isArray(data?.works) ? data.works : []));
  };

  useEffect(load, []);

  const sorted = useMemo(() => [...(works ?? [])].sort((a, b) => a.order - b.order), [works]);
  const nextOrder = sorted.length === 0 ? 0 : Math.max(...sorted.map((w) => w.order)) + 1;

  const grouped = useMemo(() => {
    const map = new Map<string, ArtisanWorkItem[]>();
    for (const w of sorted) {
      const list = map.get(w.category) ?? [];
      list.push(w);
      map.set(w.category, list);
    }
    return Array.from(map.entries());
  }, [sorted]);

  const move = async (group: ArtisanWorkItem[], index: number, direction: -1 | 1) => {
    const target = group[index + direction];
    const current = group[index];
    if (!target || reordering) return;
    setReordering(true);
    try {
      await Promise.all([
        fetch(`/api/artisan-works/${current.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: target.order }),
        }),
        fetch(`/api/artisan-works/${target.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: current.order }),
        }),
      ]);
      load();
    } finally {
      setReordering(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[22px] font-bold text-slate-800">의뢰 타입 관리</div>
          <div className="text-xs text-slate-500">카테고리별 &apos;의뢰 타입 선택&apos;에 노출되는 항목을 추가·수정하고 순서를 조정합니다.</div>
        </div>
        <button onClick={() => setEditing("new")} className="admin-btn-primary">+ 게시물 추가</button>
      </div>

      <section className="admin-sec-card p-6">
        {works === null && <div className="py-6 text-center text-sm text-slate-400">불러오는 중...</div>}
        {works !== null && sorted.length === 0 && (
          <div className="py-6 text-center text-sm text-slate-400">등록된 게시물이 없습니다.</div>
        )}
        {works !== null && sorted.length > 0 && (
          <div className="space-y-6">
            {grouped.map(([category, group]) => (
              <div key={category}>
                <div className="mb-2 text-xs font-bold text-slate-500">{category}</div>
                <div className="space-y-1.5">
                  {group.map((w, i) => (
                    <div
                      key={w.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 transition-colors hover:border-brand-light"
                    >
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => move(group, i, -1)}
                          disabled={i === 0 || reordering}
                          className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                          aria-label="위로 이동"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => move(group, i, 1)}
                          disabled={i === group.length - 1 || reordering}
                          className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                          aria-label="아래로 이동"
                        >
                          ▼
                        </button>
                      </div>
                      <button onClick={() => setEditing(w)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={w.imageUrl} alt={w.title} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-slate-700">{w.title}</span>
                            {w.isAd && <span className="admin-badge admin-b-done shrink-0">광고 중</span>}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            <span>{w.price != null ? `${w.price.toLocaleString()}원` : "가격 문의"}</span>
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {editing && (
        <ArtisanWorkModal
          work={editing === "new" ? null : editing}
          nextOrder={nextOrder}
          onClose={() => setEditing(null)}
          onSaved={() => {
            load();
            setEditing(null);
            showToast(editing === "new" ? "게시물이 추가되었습니다." : "게시물이 수정되었습니다.");
          }}
          onDeleted={() => {
            load();
            setEditing(null);
            showToast("게시물이 삭제되었습니다.");
          }}
        />
      )}
    </div>
  );
}
