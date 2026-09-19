"use client";

import { useState } from "react";
import Link from "next/link";
import type { Role } from "@/generated/prisma/enums";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/ui/Icon";

export function AccountSettings({
  currentUser,
}: {
  currentUser: { id: string; name: string | null; email: string; role: Role };
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const displayName = currentUser.name ?? currentUser.email;
  const initial = displayName.charAt(0).toUpperCase();

  const submit = async () => {
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ text: "새 비밀번호가 서로 일치하지 않습니다.", ok: false });
      return;
    }

    setSaving(true);
    const res = await fetch("/api/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      setMessage({ text: "비밀번호가 변경되었습니다.", ok: true });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setMessage({ text: data.error ?? "변경에 실패했습니다.", ok: false });
    }
  };

  return (
    <AppShell
      currentUser={currentUser}
      main={
        <div className="flex h-full min-h-0 flex-col gap-5">
          <div className="shrink-0">
            <Link
              href="/dashboard"
              className="mb-2 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-slate-400 transition-all hover:text-slate-600"
            >
              ‹ Overview로
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">계정 설정</h1>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-100 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-light text-sm font-bold text-white">
              {initial}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-slate-800">
                {displayName}
              </div>
              <div className="truncate text-xs text-slate-400">
                {currentUser.email}
              </div>
            </div>
          </div>

          <div className="max-w-md shrink-0 rounded-2xl border border-slate-100 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-light/12 text-brand">
                <Icon name="lock" className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-sm font-bold text-slate-700">비밀번호 변경</h2>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-300 focus:border-brand-light"
                  placeholder="현재 비밀번호"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-300 focus:border-brand-light"
                  placeholder="8자 이상"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-300 focus:border-brand-light"
                  placeholder="다시 입력"
                />
              </div>

              {message && (
                <div
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${
                    message.ok
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-500"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                onClick={submit}
                disabled={
                  saving || !currentPassword || !newPassword || !confirmPassword
                }
                className="mt-1 cursor-pointer rounded-lg bg-brand py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-deep disabled:opacity-40"
              >
                {saving ? "변경 중..." : "변경하기"}
              </button>
            </div>
          </div>
        </div>
      }
    />
  );
}
