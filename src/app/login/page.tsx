"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { DM_Sans } from "next/font/google";

import { ParticleBackground } from "@/components/ParticleBackground";
import { ContactProjectBlock } from "@/components/ContactProjectBlock";
import {
  EMPTY_PROJECT,
  MAX_PROJECTS,
  type ProjectInquiry,
} from "@/lib/contact-categories";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

type View = "login" | "contact";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [projects, setProjects] = useState<ProjectInquiry[]>([
    { ...EMPTY_PROJECT },
  ]);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  const resetContactForm = () => {
    setCompanyName("");
    setContactName("");
    setPhone("");
    setContactEmail("");
    setPrivacyAgreed(false);
    setProjects([{ ...EMPTY_PROJECT }]);
    setContactError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoginLoading(false);

    if (result?.error) {
      setLoginError("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);

    if (!privacyAgreed) {
      setContactError("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }

    setContactSubmitting(true);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName,
        contactName,
        phone,
        email: contactEmail,
        privacyAgreed,
        projects,
      }),
    });

    setContactSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setContactError(data.error ?? "문의 접수에 실패했습니다.");
      return;
    }

    setContactSuccess(true);
    resetContactForm();
    setTimeout(() => {
      setContactSuccess(false);
      setView("login");
    }, 2000);
  };

  const updateProject = (index: number, next: ProjectInquiry) => {
    setProjects((prev) => prev.map((p, i) => (i === index ? next : p)));
  };

  const addProject = () => {
    if (projects.length >= MAX_PROJECTS) return;
    setProjects((prev) => [...prev, { ...EMPTY_PROJECT }]);
  };

  const removeProject = (index: number) => {
    setProjects((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <main
      className={`${dmSans.className} relative flex min-h-screen w-full flex-col overflow-hidden text-white lg:flex-row`}
    >
      <ParticleBackground />

      <div className="relative z-10 flex flex-1 flex-col justify-between p-8 md:p-16 lg:p-24 xl:p-28">
        <div />
        <div className="animate-fade-up my-auto py-12">
          <Image
            src="/brand/loind-logo.png"
            alt="LOIND Corporation"
            width={589}
            height={234}
            className="h-auto w-full max-w-md"
            priority
          />
        </div>
        <div className="animate-fade-up flex flex-col gap-1 font-mono text-[10px] uppercase tracking-widest text-white/20">
          <span>LOER agency</span>
          <span>LODEN creative tech studio</span>
        </div>
      </div>

      <div className="relative z-20 flex w-full flex-col justify-center p-6 sm:p-12 md:p-16 lg:w-[680px] xl:w-[760px]">
        <div className="glass-card mx-auto w-full max-w-2xl rounded-2xl border border-white/5 p-6 shadow-2xl sm:p-10">
          {view === "login" ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Login
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  LOIND Signal Hub 워크스테이션 방문을 환영합니다.
                </p>
              </div>

              <div className="my-3 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="ml-1 text-[10px] font-mono font-bold uppercase tracking-wider text-white/30">
                    Email
                  </span>
                  <div className="glass-input rounded-xl px-3.5 py-2.5">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="이메일을 입력하세요"
                      autoComplete="off"
                      className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="ml-1 text-[10px] font-mono font-bold uppercase tracking-wider text-white/30">
                    Password
                  </span>
                  <div className="glass-input rounded-xl px-3.5 py-2.5">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                    />
                  </div>
                </div>
              </div>

              {loginError && (
                <p className="text-center text-[11px] font-medium text-red-400/90">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full cursor-pointer rounded-xl bg-white py-3 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
              >
                {loginLoading ? "로그인 중..." : "로그인"}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 border-t border-white/5 pt-5 text-center">
                <span className="text-xs text-white/30">
                  신규 프로젝트 의뢰이신가요?
                </span>
                <button
                  type="button"
                  onClick={() => setView("contact")}
                  className="cursor-pointer text-xs font-bold text-emerald-400 underline underline-offset-4 transition-all hover:text-emerald-300"
                >
                  Contact →
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleContactSubmit}
              className="flex max-h-[80vh] flex-col gap-5 overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setView("login")}
                className="flex cursor-pointer items-center gap-1.5 self-start rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/40 transition-all hover:text-white"
              >
                ← 로그인으로 돌아가기
              </button>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Contact
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  세부 내용을 기록해 주시면{" "}
                  <span className="font-semibold text-emerald-400">
                    전문 담당자
                  </span>
                  가 검토 후 신속히 호출을 연결합니다.
                </p>
              </div>

              <div className="flex flex-col gap-5 text-sm">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-emerald-400">
                  1. 기업 및 클라이언트 정보
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <span className="ml-1 text-[10px] uppercase tracking-wider text-white/30 font-mono">
                      기업명
                    </span>
                    <div className="glass-input rounded-xl px-3 py-2">
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="예: LOIND Company"
                        className="w-full border-none bg-transparent text-xs text-white outline-none placeholder:text-white/15"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="ml-1 text-[10px] uppercase tracking-wider text-white/30 font-mono">
                      담당자 성함
                    </span>
                    <div className="glass-input rounded-xl px-3 py-2">
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="예: 홍길동 매니저"
                        className="w-full border-none bg-transparent text-xs text-white outline-none placeholder:text-white/15"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <span className="ml-1 text-[10px] uppercase tracking-wider text-white/30 font-mono">
                      연락처
                    </span>
                    <div className="glass-input rounded-xl px-3 py-2">
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        className="w-full border-none bg-transparent text-xs text-white outline-none placeholder:text-white/15"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="ml-1 text-[10px] uppercase tracking-wider text-white/30 font-mono">
                      이메일
                    </span>
                    <div className="glass-input rounded-xl px-3 py-2">
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="contact@loind.com"
                        className="w-full border-none bg-transparent text-xs text-white outline-none placeholder:text-white/15"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {projects.map((project, index) => (
                    <ContactProjectBlock
                      key={index}
                      index={index}
                      project={project}
                      onChange={(next) => updateProject(index, next)}
                      onRemove={
                        index > 0 ? () => removeProject(index) : undefined
                      }
                    />
                  ))}
                </div>

                {projects.length < MAX_PROJECTS && (
                  <button
                    type="button"
                    onClick={addProject}
                    className="w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 py-3.5 font-mono text-xs font-bold text-white/50 transition-all hover:bg-white/10 hover:text-white"
                  >
                    + 추가 프로젝트 의뢰 ({projects.length}/{MAX_PROJECTS})
                  </button>
                )}
              </div>

              <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-xl border border-white/5 bg-black/40 p-3.5 transition-all hover:border-white/10">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-emerald-500"
                />
                <div className="select-none text-[11px] leading-relaxed text-white/40">
                  수집된 개인정보는 프로젝트 문의 확인 및 맞춤형 파트너 배정
                  상담 목적으로만 사용되며, 보안 가이드라인에 따라 안전하게
                  소멸 관리됩니다.{" "}
                  <span className="text-white/60">
                    개인정보 수집 및 활용에 전적으로 동의합니다.
                  </span>
                </div>
              </label>

              {contactError && (
                <p className="text-center text-[11px] font-medium text-red-400/90">
                  {contactError}
                </p>
              )}
              {contactSuccess && (
                <p className="text-center text-[11px] font-medium text-emerald-400">
                  소중한 문의가 접수되었습니다. 담당자가 확인 후 신속하게
                  연락드리겠습니다.
                </p>
              )}

              <button
                type="submit"
                disabled={contactSubmitting}
                className="w-full cursor-pointer rounded-xl bg-emerald-500 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-950 shadow-lg transition-all hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50"
              >
                {contactSubmitting ? "접수 중..." : "프로젝트 의뢰 접수하기"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
