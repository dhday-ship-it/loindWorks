"use client";

import Link from "next/link";
import type { TaggedItem } from "./types";

const TAGGED_KIND_META: Record<TaggedItem["kind"], { icon: string; label: string }> = {
  request: { icon: "📨", label: "요청/작업" },
  log: { icon: "🗂️", label: "기록" },
};

interface TaggedItemsListProps {
  items: TaggedItem[];
}

export function TaggedItemsList({ items }: TaggedItemsListProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-white/30">
        🏷️ 내게 배정된 항목
        <span className="rounded-full border border-brand-light/30 bg-brand-light/10 px-1.5 py-0.5 text-[9px] font-bold text-brand-light">
          {items.length}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {items.slice(0, 4).map((item) => (
          <Link
            key={`${item.kind}-${item.id}`}
            href={`/dashboard?project=${item.projectId}`}
            className="flex items-center gap-2 rounded-lg border border-brand-light/10 bg-brand-light/5 px-3 py-2 text-xs font-medium text-white/70 transition-all hover:bg-brand-light/10 hover:text-white"
          >
            <span className="shrink-0">{TAGGED_KIND_META[item.kind].icon}</span>
            <span className="min-w-0 flex-1 truncate">{item.title}</span>
            <span className="shrink-0 font-mono text-[9px] text-white/30">
              {item.projectName}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
