"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Icon } from "@/components/ui/Icon";

export function LoginForm() {
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
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-slate-900">
        Welcome back!
      </h1>
      <p className="mt-3.5 text-sm leading-relaxed text-slate-400">
        워크스페이스에 오신 것을 환영합니다.
        <br />
        계정 정보를 입력해 로그인해주세요.
      </p>

      <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-3.5">
        <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50/80 px-5 py-3.5 transition-all focus-within:border-slate-900 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(15,23,42,0.05)]">
          <Icon name="mail" className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            autoComplete="email"
            className="w-full border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50/80 px-5 py-3.5 transition-all focus-within:border-slate-900 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(15,23,42,0.05)]">
          <Icon name="lock" className="h-4 w-4 shrink-0 text-slate-400" />
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
            className="shrink-0 cursor-pointer text-slate-300 transition-colors hover:text-slate-600"
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
          className="mt-3 w-full cursor-pointer rounded-full bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.99] disabled:opacity-50 disabled:shadow-none"
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
  );
}
