import type { Role } from "@/generated/prisma/enums";
import { AppSidebar } from "./AppSidebar";

export function AppShell({
  currentUser,
  main,
}: {
  currentUser: { name: string | null; email: string; role: Role };
  main: React.ReactNode;
}) {
  return (
    <div className="light-ui flex h-screen w-full overflow-hidden bg-white">
      <div className="flex h-full w-full overflow-hidden">
        <aside className="scroll-thin h-full w-[64px] shrink-0 overflow-y-auto border-r border-slate-100 p-2.5 sm:w-[190px] sm:p-4">
          <AppSidebar currentUser={currentUser} />
        </aside>
        <main className="scroll-thin h-full min-w-0 flex-1 overflow-y-auto p-4 sm:p-7">
          {main}
        </main>
      </div>
    </div>
  );
}
