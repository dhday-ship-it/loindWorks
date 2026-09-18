import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

export async function getHomeData(userId: string, role: Role) {
  const isManager = role === "SUPER_ADMIN" || role === "PM";

  const works = await prisma.project.findMany({
    where: isManager ? undefined : { members: { some: { userId } } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  const accessibleProjectIds = works.map((w) => w.id);

  const events = await prisma.calendarEvent.findMany({
    where: {
      OR: [{ ownerId: userId }, { projectId: { in: accessibleProjectIds } }],
    },
    orderBy: { startAt: "asc" },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return {
    works: works.map((w) => ({
      ...w,
      startDate: w.startDate ? w.startDate.toISOString() : null,
      endDate: w.endDate ? w.endDate.toISOString() : null,
    })),
    events: events.map((e) => ({
      ...e,
      startAt: e.startAt.toISOString(),
      endAt: e.endAt ? e.endAt.toISOString() : null,
    })),
  };
}
