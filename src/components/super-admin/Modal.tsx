"use client";

import { useRef } from "react";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const mouseDownOnBackdrop = useRef(false);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        mouseDownOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && mouseDownOnBackdrop.current) {
          onClose();
        }
        mouseDownOnBackdrop.current = false;
      }}
    >
      <div className="animate-fade-up w-[520px] max-w-full max-h-[90vh] overflow-y-auto rounded-[20px] border border-white/12 bg-[rgba(12,15,18,0.95)] p-7 backdrop-blur-3xl">
        <div className="mb-1 text-base font-bold text-white">{title}</div>
        {subtitle && (
          <div className="mb-5 text-xs text-white/38">{subtitle}</div>
        )}
        {children}
      </div>
    </div>
  );
}
