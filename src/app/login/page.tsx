import { prisma } from "@/lib/prisma";
import { LoginForm } from "@/components/auth/LoginForm";
import { Icon } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const loginImage = await prisma.loginPageImage.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="light-ui flex min-h-screen w-full bg-white">
      {/* 좌측 — 로그인 폼 */}
      <div className="flex min-h-screen w-full flex-col px-8 py-10 sm:px-12 lg:w-1/2 lg:px-20 xl:px-28">
        <div className="flex flex-1 items-center">
          <LoginForm />
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
        {loginImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={loginImage.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
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
          </>
        )}
      </div>
    </main>
  );
}
