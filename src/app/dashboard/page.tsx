import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { getStaffHomeData } from "@/lib/staff-home-data";
import { StaffHome } from "@/components/staff-home/StaffHome";

export default async function DashboardPage() {
  const user = await requireUser();

  // SUPER_ADMIN, PM, STAFF 모두 StaffHome으로
  const [{ tasks, events, taggedItems }, memos, folders, myProjects, notifications] =
    await Promise.all([
      getStaffHomeData(user.id),
      prisma.memo.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
        include: { folder: { select: { id: true, name: true } } },
      }),
      prisma.memoFolder.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "asc" },
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { pmId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
        select: { id: true, name: true, status: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.notification.findMany({
        where: { userId: user.id, read: false },
        orderBy: { createdAt: "desc" },
        take: 20,
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
      initialTasks={tasks}
      initialEvents={events}
      initialMemos={memos.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      }))}
      initialFolders={folders}
      myProjects={myProjects}
      taggedItems={taggedItems}
      initialNotifications={notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      }))}
    />
  );
}
