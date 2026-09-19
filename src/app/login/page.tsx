"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LoindLogoFull } from "@/components/layout/LoindLogoFull";
import { Icon } from "@/components/ui/Icon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="light-ui flex min-h-screen w-full bg-white">
      {/* 좌측 — 로그인 폼 */}
      <div className="flex w-full flex-col justify-between px-8 py-8 sm:px-12 lg:w-1/2 lg:px-20 xl:px-28">
        <LoindLogoFull className="h-auto w-44 sm:w-48" />

        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Welcome back!
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            LOIND Creator Ground 워크스페이스에 오신 것을
            <br />
            환영합니다. 계정 정보를 입력해주세요.
          </p>

          <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-5 py-3 transition-all focus-within:border-brand-light">
              <Icon name="mail" className="h-4 w-4 shrink-0 text-slate-300" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                autoComplete="email"
                className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
              />
            </div>

            <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-5 py-3 transition-all focus-within:border-brand-light">
              <Icon name="lock" className="h-4 w-4 shrink-0 text-slate-300" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                autoComplete="current-password"
                className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="shrink-0 cursor-pointer text-slate-300 hover:text-slate-500"
                tabIndex={-1}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-center text-xs font-medium text-red-500">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2.5 w-full cursor-pointer rounded-full bg-slate-900 py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  로그인 중...
                </span>
              ) : (
                "로그인"
              )}
            </button>
          </form>
        </div>

        <p className="text-center font-mono text-[10px] text-slate-300">
          LOIND Corporation · Internal Use Only
        </p>
      </div>

      {/* 우측 — 브랜드 패널 */}
      <div
        className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center"
        style={{
          background:
            "linear-gradient(135deg, #eef2f6 0%, #dbe3ee 45%, #b9c6dc 100%)",
        }}
      >
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-light/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />

        <div className="relative flex flex-col items-center gap-10 px-12">
          <div className="relative flex h-64 w-64 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-brand-light/30" />
            <div className="absolute inset-6 rounded-full border-[3px] border-brand/25" />
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-brand to-brand-light text-white shadow-xl shadow-brand/20">
              <Icon name="chart" className="h-10 w-10" />
            </div>

            <div className="absolute -bottom-6 -right-10 w-52 rounded-2xl bg-white p-4 shadow-xl shadow-slate-900/10">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light/15 text-brand">
                  <Icon name="folder" className="h-4 w-4" />
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand text-[10px] font-bold text-brand">
                  84%
                </span>
              </div>
              <div className="text-sm font-bold text-slate-800">웹 리뉴얼 프로젝트</div>
              <div className="mt-0.5 text-[11px] text-slate-400">4개 Works 진행중</div>
            </div>

            <div className="absolute -left-10 top-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-lg shadow-slate-900/10">
              <Icon name="trendUp" className="h-5 w-5 text-brand" />
            </div>
          </div>

          <div className="flex gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand/30" />
            <span className="h-1.5 w-1.5 rounded-full bg-brand/30" />
            <span className="h-1.5 w-5 rounded-full bg-brand" />
          </div>

          <div className="text-center">
            <p className="text-xl font-bold leading-snug text-slate-800">
              더 쉽고 체계적인 업무를 위해
              <br />
              <span className="text-brand">LOIND Creator Ground</span>와 함께
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
