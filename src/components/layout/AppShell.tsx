import type { Role } from "@/generated/prisma/enums";
import { AppSidebar } from "./AppSidebar";
import { Icon, type IconName } from "@/components/ui/Icon";

const QUICK_LINKS: { label: string; href: string; icon: IconName }[] = [
  { label: "홈페이지", href: "https://loind.com/", icon: "globe" },
  { label: "인스타", href: "https://www.instagram.com/loind_official/", icon: "instagram" },
  { label: "유튜브", href: "https://www.youtube.com/@loind-youtube", icon: "youtube" },
  { label: "나스", href: "https://loind.tw2.quickconnect.to/", icon: "server" },
  { label: "블로그", href: "https://blog.naver.com/loind", icon: "rss" },
];

function QuickLinksRow() {
  return (
    <div className="flex items-stretch justify-between gap-1 border-t border-slate-100 px-2 py-3">
      {QUICK_LINKS.map((quickLink) => (
        <a
          key={quickLink.href}
          href={quickLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 flex-col items-center gap-1.5 rounded-xl py-1.5 text-slate-400 transition-all hover:bg-slate-50 hover:text-brand"
        >
          <Icon name={quickLink.icon} className="h-4.5 w-4.5 shrink-0" />
          <span className="text-[10px] font-medium leading-none whitespace-nowrap">{quickLink.label}</span>
        </a>
      ))}
    </div>
  );
}

export function AppShell({
  currentUser,
  main,
  right,
}: {
  currentUser: { name: string | null; email: string; role: Role };
  main: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="light-ui flex h-screen w-full justify-center overflow-hidden p-2 sm:p-4 lg:p-6"
      style={{
        background:
          "linear-gradient(135deg, #f6f8fa 0%, #ebeff4 50%, #ccd2e1 100%)",
      }}
    >
      <div className="flex h-full w-full max-w-[1680px] overflow-hidden rounded-2xl bg-white shadow-sm shadow-brand/5 sm:rounded-3xl">
        <aside className="scroll-thin h-full w-[64px] shrink-0 overflow-y-auto border-r border-slate-100 p-2.5 sm:w-[190px] sm:p-4">
          <AppSidebar currentUser={currentUser} />
        </aside>
        <main className="scroll-thin h-full min-w-0 flex-1 overflow-y-auto p-4 sm:p-7">
          {main}
        </main>
        <div className="hidden h-full w-[260px] shrink-0 flex-col border-l border-slate-100 xl:flex xl:w-[300px]">
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-5">{right}</div>
          <QuickLinksRow />
        </div>
      </div>
    </div>
  );
}
