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
      className="light-ui flex min-h-screen w-full justify-center p-6"
      style={{
        background:
          "linear-gradient(135deg, #f6f8fa 0%, #ebeff4 50%, #ccd2e1 100%)",
      }}
    >
      <div className="flex w-full max-w-[1680px] overflow-hidden rounded-3xl bg-white shadow-sm shadow-brand/5">
        <aside className="w-[190px] shrink-0 border-r border-slate-100 p-4">
          <AppSidebar currentUser={currentUser} />
        </aside>
        <main className="min-w-0 flex-1 p-7">{main}</main>
        <div className="w-[300px] shrink-0 border-l border-slate-100 p-5">
          {right}
        </div>
      </div>
    </div>
  );
}
