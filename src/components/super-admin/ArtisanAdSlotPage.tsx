"use client";

import { useEffect, useMemo, useState } from "react";

import type { ArtisanWorkItem } from "../artisan/types";

export function ArtisanAdSlotPage({ showToast }: { showToast: (message: string) => void }) {
  const [works, setWorks] = useState<ArtisanWorkItem[] | null>(null);
  const [adQuery, setAdQuery] = useState("");
  const [adSaving, setAdSaving] = useState(false);

  const load = () => {
    fetch("/api/artisan-works")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setWorks(Array.isArray(data?.works) ? data.works : []));
  };

  useEffect(load, []);

  const currentAd = useMemo(() => (works ?? []).find((w) => w.isAd) ?? null, [works]);

  const adResults = useMemo(() => {
    const q = adQuery.trim();
    if (!q || !works) return [];
    return works.filter((w) => !w.isAd && (w.title.includes(q) || w.category.includes(q))).slice(0, 8);
  }, [works, adQuery]);

  const setAsAd = async (work: ArtisanWorkItem) => {
    setAdSaving(true);
    const res = await fetch(`/api/artisan-works/${work.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAd: true }),
    });
    setAdSaving(false);
    if (res.ok) {
      setAdQuery("");
      load();
      showToast(`'${work.title}'이(가) 광고 자리에 노출됩니다.`);
    }
  };

  const clearAd = async () => {
    if (!currentAd) return;
    setAdSaving(true);
    const res = await fetch(`/api/artisan-works/${currentAd.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAd: false }),
    });
    setAdSaving(false);
    if (res.ok) {
      load();
      showToast("광고 자리를 비웠습니다.");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="mb-1 text-[22px] font-bold text-slate-800">광고 배너</div>
        <div className="text-xs text-slate-500">
          아티즌 홈 &apos;실시간 ONE-PICK&apos; 섹션의 히어로 광고 자리에 노출할 게시물을 지정합니다. 한 번에 하나만 노출돼요.
        </div>
      </div>

      <section className="admin-sec-card p-6">
        {currentAd ? (
          <div className="flex items-center gap-3 rounded-xl border border-brand-light/40 bg-brand-light/8 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentAd.imageUrl} alt={currentAd.title} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] text-slate-400">{currentAd.category}</div>
              <div className="truncate text-sm font-semibold text-slate-700">{currentAd.title}</div>
            </div>
            <button onClick={clearAd} disabled={adSaving} className="admin-btn-ghost shrink-0 disabled:opacity-50">
              해제
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
            지정된 광고 게시물이 없어요.
          </div>
        )}

        <div className="mt-4">
          <input
            value={adQuery}
            onChange={(e) => setAdQuery(e.target.value)}
            className="admin-input"
            placeholder="제목이나 카테고리로 게시물 검색..."
          />
          {adQuery.trim() && (
            <div className="mt-2 space-y-1.5">
              {adResults.length === 0 && (
                <div className="py-3 text-center text-xs text-slate-400">일치하는 게시물이 없어요.</div>
              )}
              {adResults.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setAsAd(w)}
                  disabled={adSaving}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-2.5 text-left transition-colors hover:border-brand-light disabled:opacity-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={w.imageUrl} alt={w.title} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] text-slate-400">{w.category}</div>
                    <div className="truncate text-sm text-slate-700">{w.title}</div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-brand">선택</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
