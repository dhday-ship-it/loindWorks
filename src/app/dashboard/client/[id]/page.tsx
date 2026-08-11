import { notFound } from "next/navigation";

import { requireClient } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { ClientProjectDetail } from "@/components/client-project/ClientProjectDetail";
import type { ProjectDetail } from "@/components/staff-projects/types";

export default async function ClientProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireClient();
  const { id } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: user.id } },
  });
  if (!membership) {
    notFound();
  }

  const detail = await prisma.project.findUnique({
    where: { id },
    include: {
      company: true,
      pm: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      requests: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
          assignees: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          files: {
            include: { uploader: { select: { id: true, name: true, email: true } } },
          },
        },
      },
      logs: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
          files: {
            include: { uploader: { select: { id: true, name: true, email: true } } },
          },
        },
      },
      calendarEvents: {
        orderBy: { startAt: "asc" },
        include: { owner: { select: { id: true, name: true, email: true } } },
      },
      files: {
        where: { requestId: null, logId: null },
        orderBy: { createdAt: "desc" },
        include: { uploader: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!detail) {
    notFound();
  }

  const project: ProjectDetail = {
    ...detail,
    phases: detail.phases as string[],
    startDate: detail.startDate ? detail.startDate.toISOString() : null,
    endDate: detail.endDate ? detail.endDate.toISOString() : null,
    requests: detail.requests.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      assignees: r.assignees.map((a) => ({
        ...a,
        comments:
          a.comments as unknown as ProjectDetail["requests"][number]["assignees"][number]["comments"],
      })),
      files: r.files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
    })),
    logs: detail.logs.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
      logDate: l.logDate ? l.logDate.toISOString() : null,
      edits: l.edits as unknown as ProjectDetail["logs"][number]["edits"],
      files: l.files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
    })),
    calendarEvents: detail.calendarEvents.map((e) => ({
      ...e,
      startAt: e.startAt.toISOString(),
    })),
    files: detail.files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
  };

  return (
    <ClientProjectDetail
      project={project}
      currentUser={{
        id: user.id,
        name: user.name ?? null,
        email: user.email ?? "",
      }}
    />
  );
}
