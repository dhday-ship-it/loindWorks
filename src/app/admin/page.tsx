import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { SuperAdminDashboard } from "@/components/super-admin/SuperAdminDashboard";
import type { AdminProjectItem, UnhandledRequestItem } from "@/components/super-admin/types";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export default async function AdminPage() {
  const admin = await requireSuperAdmin();

  const [
    activeProjectCount,
    totalProjectCount,
    staffCount,
    pmCount,
    companyCount,
    inProgressRaw,
    openRequests,
  ] = await Promise.all([
    prisma.project.count({ where: { status: "IN_PROGRESS" } }),
    prisma.project.count(),
    prisma.user.count({ where: { role: "STAFF" } }),
    prisma.user.count({ where: { role: "PM" } }),
    prisma.company.count(),
    prisma.project.findMany({
      where: { status: "IN_PROGRESS" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { id: true, name: true } },
        pm: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    }),
    prisma.projectRequest.findMany({
      include: {
        author: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        assignees: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const inProgressProjects: AdminProjectItem[] = inProgressRaw.map((p) => {
    const phases = p.phases as string[];
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      currentPhase: p.currentPhase,
      phaseCount: phases.length,
      startDate: p.startDate ? p.startDate.toISOString() : null,
      endDate: p.endDate ? p.endDate.toISOString() : null,
      company: p.company,
      pm: p.pm,
      memberNames: p.members.map((m) => m.user.name ?? "이름 없음"),
    };
  });

  const unhandled = openRequests.filter(
    (r) => r.assignees.length === 0 || r.assignees.some((a) => a.status === "WAIT")
  );
  const weekAgo = daysAgo(7);

  const unhandledRequests: UnhandledRequestItem[] = unhandled.slice(0, 8).map((r) => ({
    id: r.id,
    projectId: r.project.id,
    projectName: r.project.name,
    authorName: r.author.name ?? r.author.email,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <SuperAdminDashboard
      currentUserName={admin.name ?? admin.email ?? "관리자"}
      stats={{
        activeProjects: activeProjectCount,
        totalProjects: totalProjectCount,
        staffCount,
        pmCount,
        companyCount,
        unhandledCount: unhandled.length,
        newRequestsThisWeek: unhandled.filter((r) => r.createdAt >= weekAgo).length,
      }}
      inProgressProjects={inProgressProjects}
      unhandledRequests={unhandledRequests}
    />
  );
}
