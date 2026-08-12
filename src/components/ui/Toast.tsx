"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ─── Types ───────────────────────────────────────────────────── */

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

/* ─── Constants ───────────────────────────────────────────────── */

const ICON: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

const COLOR: Record<ToastType, string> = {
  success: "#5ba08a",
  error: "#c9595a",
  info: "#8fa8c4",
};

const AUTO_DISMISS_MS = 3000;

/* ─── useToast Hook ───────────────────────────────────────────── */

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = crypto.randomUUID();
      const item: ToastItem = { id, message, type };
      setToasts((prev) => [...prev, item]);

      const timer = setTimeout(() => {
        dismiss(id);
      }, AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  // Cleanup all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return { toasts, show, dismiss };
}

/* ─── ToastContainer Component ────────────────────────────────── */

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="glass-card animate-slide-down flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-lg"
        >
          {/* Icon */}
          <span
            className="text-sm font-bold"
            style={{ color: COLOR[toast.type] }}
          >
            {ICON[toast.type]}
          </span>

          {/* Message */}
          <span className="text-xs text-white/90">{toast.message}</span>

          {/* Close button */}
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="ml-2 text-white/40 transition-colors hover:text-white/80"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
