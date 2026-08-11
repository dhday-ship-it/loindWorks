"use client";

import { useState } from "react";
import Link from "next/link";
import { Bebas_Neue, DM_Sans } from "next/font/google";

import { ParticleBackground } from "@/components/ParticleBackground";
import { UserMenu } from "@/components/nav/UserMenu";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export function AccountSettings({
  currentUser,
}: {
  currentUser: { name: string | null; email: string };
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const displayName = currentUser.name ?? currentUser.email;

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
    <div
      className={`${dmSans.className} relative flex min-h-screen flex-col text-white`}
    >
      <ParticleBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <nav className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-white/10 bg-black/30 px-6 backdrop-blur-2xl md:px-10">
          <div className="flex items-center gap-5">
            <Link
              href="/dashboard"
              className={`${bebasNeue.className} cursor-pointer border-r border-white/10 pr-5 text-xl tracking-widest text-white transition-all hover:opacity-60`}
            >
              LOIND
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              계정 설정
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="cursor-pointer rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white"
            >
              ← 돌아가기
            </Link>
            <UserMenu name={displayName} roleLabel={currentUser.email} />
          </div>
        </nav>

        <main className="mx-auto w-full max-w-md flex-1 px-6 py-14">
          <h1
            className={`${bebasNeue.className} mb-1 text-4xl tracking-widest text-white/90`}
          >
            ACCOUNT SETTINGS
          </h1>
          <p className="mb-8 text-xs text-white/40">
            {displayName} ({currentUser.email})
          </p>

          <div className="glass-panel flex flex-col gap-4 rounded-2xl p-7 shadow-2xl">
            <h2 className="text-sm font-bold text-white">비밀번호 변경</h2>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                현재 비밀번호
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="glass-input rounded-lg border border-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                placeholder="현재 비밀번호"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                새 비밀번호
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="glass-input rounded-lg border border-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                placeholder="8자 이상"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input rounded-lg border border-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                placeholder="다시 입력"
              />
            </div>

            {message && (
              <div
                className={`rounded-lg border px-3 py-2 text-xs ${
                  message.ok
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500/25 bg-red-500/10 text-red-300"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              onClick={submit}
              disabled={
                saving ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              className="mt-1 cursor-pointer rounded-lg bg-white py-2.5 text-sm font-bold text-slate-900 transition-all hover:bg-white/90 disabled:opacity-40"
            >
              변경하기
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
