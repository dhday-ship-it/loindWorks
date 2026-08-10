"use client";

import { useState } from "react";

export function MusicWidget() {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(70);

  const setFromClientX = (clientX: number, track: HTMLDivElement) => {
    const rect = track.getBoundingClientRect();
    const v = Math.round(
      Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 100
    );
    setVolume(v);
  };

  return (
    <div
      className="group relative flex cursor-pointer items-center gap-2.5 px-4"
      onClick={() => setPlaying((v) => !v)}
    >
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
        <div
          className={`h-2 w-2 rounded-full bg-slate-900 ${playing ? "animate-[spin_4s_linear_infinite]" : ""}`}
        />
      </div>
      <span className="w-8 select-none text-xs font-medium text-white/70">
        {playing ? "정지" : "재생"}
      </span>

      <div
        className="glass-blur-heavy absolute top-[calc(100%+10px)] right-0 flex items-center gap-3 rounded-xl p-3.5 opacity-0 shadow-2xl transition-all duration-200 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm text-white/60">
          {volume === 0 ? "🔇" : volume < 40 ? "🔉" : "🔊"}
        </span>
        <div
          className="relative flex h-4 w-28 cursor-pointer items-center"
          onMouseDown={(e) => setFromClientX(e.clientX, e.currentTarget)}
        >
          <div className="absolute left-0 right-0 h-1 rounded-full bg-white/20" />
          <div
            className="absolute left-0 h-1 rounded-full bg-white"
            style={{ width: `${volume}%` }}
          />
          <div
            className="absolute h-3.5 w-3.5 -translate-x-1/2 rounded-full border border-slate-900 bg-white shadow-md"
            style={{ left: `${volume}%` }}
          />
        </div>
        <span className="w-5 text-right font-mono text-xs font-bold text-white/70">
          {volume}
        </span>
      </div>
    </div>
  );
}
