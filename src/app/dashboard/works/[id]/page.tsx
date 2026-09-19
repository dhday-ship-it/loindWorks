import { notFound } from "next/navigation";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { WorksDetail } from "@/components/works/WorksDetail";

export default async function WorksDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;

  const isManager = user.role === "SUPER_ADMIN" || user.role === "PM";
  if (!isManager) {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: user.id } },
    });
    if (!membership) notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      summary: true,
      calendarEvents: {
        orderBy: { startAt: "asc" },
        include: { owner: { select: { id: true, name: true, email: true } } },
      },
      logs: {
        orderBy: { logDate: "desc" },
        select: {
          id: true,
          title: true,
          body: true,
          logDate: true,
          createdAt: true,
          author: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!project) notFound();

  return (
    <WorksDetail
      currentUser={{
        id: user.id,
        name: user.name ?? null,
        email: user.email ?? "",
        role: user.role,
      }}
      work={{
        id: project.id,
        name: project.name,
        summary: project.summary,
      }}
      initialEvents={project.calendarEvents.map((e) => ({
        ...e,
        startAt: e.startAt.toISOString(),
        endAt: e.endAt ? e.endAt.toISOString() : null,
      }))}
      initialEntries={project.logs.map((l) => ({
        id: l.id,
        title: l.title,
        body: l.body,
        logDate: l.logDate ? l.logDate.toISOString() : l.createdAt.toISOString(),
        author: l.author,
        projectId: project.id,
      }))}
    />
  );
}
