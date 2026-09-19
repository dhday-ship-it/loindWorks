import type { Role } from "@/generated/prisma/enums";
import { AppSidebar } from "./AppSidebar";

export function AppShell({
  currentUser,
  main,
  right,
}: {
  currentUser: { name: string | null; email: string; role: Role };
  main: React.ReactNode;
  right: React.ReactNode;
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
        <div className="scroll-thin hidden h-full w-[260px] shrink-0 overflow-y-auto border-l border-slate-100 p-5 xl:block xl:w-[300px]">
          {right}
        </div>
      </div>
    </div>
  );
}
