"use client";

export function Toast({ message }: { message: string | null }) {
  return (
    <div
      className={`fixed bottom-7 left-1/2 z-[999] flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-xl border border-white/12 bg-[rgba(10,13,16,0.92)] px-5 py-3 text-xs text-white backdrop-blur-xl transition-all duration-300 ${
        message
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-5 opacity-0"
      }`}
    >
      <span className="text-emerald-400">✓</span>
      <span>{message}</span>
    </div>
  );
}
