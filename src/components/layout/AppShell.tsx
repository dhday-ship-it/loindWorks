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
          "linear-gradient(135deg, #cfe6ff 0%, #dfe3ff 45%, #ecdcff 100%)",
      }}
    >
      <div className="flex w-full max-w-[1400px] items-stretch gap-5">
        <aside className="w-[190px] shrink-0 rounded-3xl bg-white p-4 shadow-sm shadow-indigo-900/5">
          <AppSidebar currentUser={currentUser} />
        </aside>
        <main className="min-w-0 flex-1 rounded-3xl bg-white p-7 shadow-sm shadow-indigo-900/5">
          {main}
        </main>
        <div className="w-[300px] shrink-0 rounded-3xl bg-white p-5 shadow-sm shadow-indigo-900/5">
          {right}
        </div>
      </div>
    </div>
  );
}
