import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/auth";
import { StaffHome } from "@/components/staff-home/StaffHome";
import { ClientHome } from "@/components/client-home/ClientHome";

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  tag: true,
  startDate: true,
  dueDate: true,
  createdAt: true,
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "STAFF" || user.role === "SUPER_ADMIN") {
    const [tasks, events, memos, folders] = await Promise.all([
      prisma.task.findMany({
        select: taskSelect,
        orderBy: { createdAt: "desc" },
      }),
      prisma.calendarEvent.findMany({
        orderBy: { startAt: "asc" },
        include: { owner: { select: { id: true, name: true, email: true } } },
      }),
      prisma.memo.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
        include: { folder: { select: { id: true, name: true } } },
      }),
      prisma.memoFolder.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return (
      <StaffHome
        currentUser={{
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? "",
          role: user.role,
        }}
        initialTasks={tasks.map((t) => ({
          ...t,
          startDate: t.startDate ? t.startDate.toISOString() : null,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          createdAt: t.createdAt.toISOString(),
        }))}
        initialEvents={events.map((e) => ({
          ...e,
          startAt: e.startAt.toISOString(),
        }))}
        initialMemos={memos.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
        initialFolders={folders}
      />
    );
  }

  if (user.role === "CLIENT") {
    const [projects, me] = await Promise.all([
      prisma.project.findMany({
        where: { members: { some: { userId: user.id } } },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          status: true,
          summary: true,
          phases: true,
          currentPhase: true,
          startDate: true,
          endDate: true,
          company: { select: { id: true, name: true } },
          pm: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { company: { select: { name: true } } },
      }),
    ]);

    return (
      <ClientHome
        currentUser={{
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? "",
        }}
        companyName={me?.company?.name ?? null}
        projects={projects.map((p) => ({
          ...p,
          phases: p.phases as string[],
          startDate: p.startDate ? p.startDate.toISOString() : null,
          endDate: p.endDate ? p.endDate.toISOString() : null,
        }))}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold">대시보드</h1>
        <p className="text-gray-600">{user.name ?? user.email}님, 환영합니다.</p>
        <p className="text-sm text-gray-400">권한: {user.role}</p>

        <a
          href="/dashboard/settings"
          className="block w-full rounded-md border border-gray-300 py-2 text-sm font-medium"
        >
          계정 설정
        </a>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md border border-gray-300 py-2 text-sm font-medium"
          >
            로그아웃
          </button>
        </form>
      </div>
    </div>
  );
}
