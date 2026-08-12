"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { DM_Sans } from "next/font/google";

import { ParticleBackground } from "@/components/ParticleBackground";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <main
      className={`${dmSans.className} relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0e1116]`}
    >
      <ParticleBackground />

      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-16 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-16 xl:px-24">
        {/* 좌측 브랜드 */}
        <div className="flex flex-col gap-6 lg:flex-1">
          <div className="animate-fade-up">
            <Image
              src="/brand/loind-logo.png"
              alt="LOIND"
              width={320}
              height={127}
              className="h-auto w-48 opacity-90 lg:w-64"
              priority
            />
          </div>
          <div className="animate-fade-up hidden flex-col gap-2 lg:flex">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/20">
              Internal Workspace
            </p>
            <p className="text-sm font-light leading-relaxed text-white/35">
              LOIND 내부 운영 시스템입니다.<br />
              인가된 계정으로만 접근 가능합니다.
            </p>
          </div>
        </div>

        {/* 우측 로그인 카드 */}
        <div className="animate-fade-up w-full max-w-sm lg:max-w-md">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
            {/* 헤더 */}
            <div className="mb-8">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8fa8c4]">
                Sign In
              </div>
              <h1 className="text-xl font-semibold text-white">
                워크스테이션 로그인
              </h1>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* 이메일 */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] font-semibold uppercase tracking-wider text-white/35">
                  Email
                </label>
                <div className="login-input-wrap">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@loind.com"
                    autoComplete="email"
                    className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* 비밀번호 */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] font-semibold uppercase tracking-wider text-white/35">
                  Password
                </label>
                <div className="login-input-wrap">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* 에러 */}
              {error && (
                <p className="rounded-lg border border-red-400/20 bg-red-400/8 px-3 py-2 text-center text-[11px] font-medium text-red-300">
                  {error}
                </p>
              )}

              {/* 버튼 */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full cursor-pointer rounded-xl bg-[#55689b] py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#6678aa] active:scale-[0.99] disabled:opacity-50"
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

            {/* 하단 */}
            <div className="mt-6 border-t border-white/5 pt-5">
              <p className="text-center font-mono text-[10px] text-white/20">
                LOIND Corporation · Internal Use Only
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
