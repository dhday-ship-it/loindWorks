import { prisma } from "@/lib/prisma";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const loginImage = await prisma.loginPageImage.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="light-ui flex min-h-screen w-full bg-white">
      {/* 좌측 — 이미지 (화면 꽉 채움) */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={loginImage ? loginImage.imageUrl : "/login-hero.png"}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* 좌상단 로고 */}
        <div className="absolute left-10 top-9 z-10">
          <p className="text-sm font-extrabold tracking-tight text-white drop-shadow">
            LOIND WORKS
          </p>
        </div>
      </div>

      {/* 우측 — 로그인 패널 */}
      <div
        className="relative flex min-h-screen w-full flex-col lg:w-1/2"
        style={{
          background:
            "radial-gradient(900px 500px at 70% 20%, #eef5ff 0%, #ffffff 55%)",
        }}
      >
        {/* 가운데 폼 */}
        <div className="flex flex-1 items-center px-8 sm:px-14 lg:px-20">
          <LoginForm />
        </div>

        {/* 하단 — 카피라이트 */}
        <div className="px-10 py-7 text-center text-[11px] text-slate-400">
          <span className="font-mono">
            © {new Date().getFullYear()} LOIND Corporation. All rights reserved.
          </span>
        </div>
      </div>
    </main>
  );
}
