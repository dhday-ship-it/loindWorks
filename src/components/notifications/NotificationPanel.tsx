"use client";

import Link from "next/link";

import type { NotificationItem } from "@/components/staff-home/types";

const TYPE_ICON: Record<string, string> = {
  TASK_ASSIGNED: "📋",
  TASK_STATUS: "🔄",
  TASK_DUE: "⏰",
  TASK_OVERDUE: "🚨",
  TASK_COMMENT: "💬",
  TASK_MENTION: "@",
  PROJECT_UPDATE: "📁",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export function NotificationPanel({
  notifications,
  onNotificationsChange,
  onClose,
}: {
  notifications: NotificationItem[];
  onNotificationsChange: (next: NotificationItem[]) => void;
  onClose: () => void;
}) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    onNotificationsChange(notifications.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  };

  const markRead = async (id: string) => {
    onNotificationsChange(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-end bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-card animate-slide-down mt-14 mr-4 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl shadow-2xl md:mr-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white">알림</h4>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#c9595a]/20 px-2 py-0.5 font-mono text-[9px] font-bold text-[#c9595a]">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="cursor-pointer font-mono text-[10px] font-bold text-brand-light hover:text-white"
              >
                전체 읽음
              </button>
            )}
            <button onClick={onClose} className="cursor-pointer text-white/30 hover:text-white">✕</button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-[70vh] overflow-y-auto">
          {notifications.length === 0 && (
            <div className="py-12 text-center font-mono text-xs text-white/20">
              알림이 없습니다
            </div>
          )}
          {notifications.map((n) => {
            const icon = TYPE_ICON[n.type] ?? "🔔";
            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`flex cursor-pointer items-start gap-3 border-b border-white/5 px-5 py-3 transition-all hover:bg-white/5 ${
                  n.read ? "opacity-50" : ""
                }`}
              >
                {!n.read && (
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-light" />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{icon}</span>
                    <span className="flex-1 truncate text-xs font-medium text-white/85">
                      {n.title}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] text-white/25">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="truncate text-[11px] text-white/45">{n.body}</p>
                  )}
                  {n.link && (
                    <Link
                      href={n.link}
                      className="mt-1 self-start font-mono text-[10px] font-bold text-brand-light hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      바로가기 →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
