import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { ProjectsWorkstation } from "@/components/staff-projects/ProjectsWorkstation";
import type { ProjectDetail } from "@/components/staff-projects/types";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const user = await requireStaff();
  const { project: requestedProjectId } = await searchParams;

  const [projects, staff] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        status: true,
        summary: true,
        statusNote: true,
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["STAFF", "SUPER_ADMIN"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const initialProject =
    (requestedProjectId && projects.find((p) => p.id === requestedProjectId)) ||
    projects[0];

  let initialDetail: ProjectDetail | null = null;

  if (initialProject) {
    const detail = await prisma.project.findUnique({
      where: { id: initialProject.id },
      include: {
        company: true,
        pm: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        requests: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, name: true, email: true } },
            assignees: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
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
          include: {
            owner: { select: { id: true, name: true, email: true } },
          },
        },
        files: {
          where: { requestId: null, logId: null },
          orderBy: { createdAt: "desc" },
          include: { uploader: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (detail) {
      initialDetail = {
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
    }
  }

  return (
    <ProjectsWorkstation
      currentUser={{
        id: user.id,
        name: user.name ?? null,
        email: user.email ?? "",
        role: user.role,
      }}
      projectList={projects}
      initialDetail={initialDetail}
      staff={staff}
    />
  );
}
