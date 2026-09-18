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
      className="flex min-h-screen w-full items-stretch justify-center p-5"
      style={{
        background:
          "linear-gradient(135deg, #cfe6ff 0%, #dfe3ff 45%, #ecdcff 100%)",
      }}
    >
      <div className="flex w-full max-w-[1400px] gap-6 rounded-[28px] bg-white/40 p-5 shadow-xl shadow-indigo-900/5 backdrop-blur-sm">
        <AppSidebar currentUser={currentUser} />
        <main className="min-w-0 flex-1">{main}</main>
        <div className="w-[300px] shrink-0">{right}</div>
      </div>
    </div>
  );
}
