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

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      summary: true,
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
