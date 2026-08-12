import { prisma } from "@/lib/prisma";

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  projectId: true,
  order: true,
  startDate: true,
  dueDate: true,
  createdAt: true,
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

export async function getStaffHomeData(userId: string) {
  const [tasks, events, taggedAssignees, taggedLogs] = await Promise.all([
    prisma.task.findMany({
      where: {
        archivedAt: null,
        assigneeId: userId,
      },
      select: taskSelect,
      orderBy: { order: "asc" },
    }),
    prisma.calendarEvent.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { project: { members: { some: { userId } } } },
          { project: { pmId: userId } },
        ],
      },
      orderBy: { startAt: "asc" },
      include: { owner: { select: { id: true, name: true, email: true } } },
    }),
    prisma.requestAssignee.findMany({
      where: { userId, status: { not: "DONE" } },
      include: {
        request: {
          include: { project: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.activityLog.findMany({
      where: { taggedUserIds: { has: userId } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const taggedItems = [
    ...taggedAssignees.map((a) => ({
      id: a.request.id,
      kind: "request" as const,
      title: a.request.title ?? a.request.body.slice(0, 40),
      projectId: a.request.project.id,
      projectName: a.request.project.name,
      createdAt: a.request.createdAt.toISOString(),
    })),
    ...taggedLogs.map((l) => ({
      id: l.id,
      kind: "log" as const,
      title: l.title,
      projectId: l.project.id,
      projectName: l.project.name,
      createdAt: l.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    tasks: tasks.map((t) => ({
      ...t,
      startDate: t.startDate ? t.startDate.toISOString() : null,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
    })),
    events: events.map((e) => ({
      ...e,
      startAt: e.startAt.toISOString(),
    })),
    taggedItems,
  };
}
