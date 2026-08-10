import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { SuperAdminDashboard } from "@/components/super-admin/SuperAdminDashboard";
import type {
  AdminProjectItem,
  ContactRequestItem,
  UnhandledRequestItem,
} from "@/components/super-admin/types";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export default async function AdminPage() {
  const admin = await requireSuperAdmin();

  const [
    activeProjectCount,
    totalProjectCount,
    staffCount,
    clientCount,
    companyCount,
    users,
    companies,
    allProjects,
    staff,
    openRequests,
    contactRequests,
  ] = await Promise.all([
    prisma.project.count({ where: { status: "IN_PROGRESS" } }),
    prisma.project.count(),
    prisma.user.count({ where: { role: "STAFF" } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.company.count(),
    prisma.user.findMany({
      where: { role: { in: ["STAFF", "CLIENT"] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        company: { select: { id: true, name: true } },
        projectMemberships: {
          select: { project: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.company.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { users: true, projects: true } } },
    }),
    prisma.project.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        company: { select: { id: true, name: true } },
        pm: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["STAFF", "SUPER_ADMIN"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.projectRequest.findMany({
      include: {
        author: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        assignees: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contactRequest.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const contacts: ContactRequestItem[] = contactRequests.map((c) => ({
    ...c,
    projects: c.projects as unknown as ContactRequestItem["projects"],
    createdAt: c.createdAt.toISOString(),
  }));

  const projects: AdminProjectItem[] = allProjects.map((p) => {
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
      clientNames: p.members
        .filter((m) => m.user.role === "CLIENT")
        .map((m) => m.user.name ?? "이름 없음"),
    };
  });

  const inProgressProjects = projects
    .filter((p) => p.status === "IN_PROGRESS")
    .slice(0, 5);

  const unhandled = openRequests.filter(
    (r) =>
      r.assignees.length === 0 ||
      r.assignees.some((a) => a.status === "WAIT")
  );
  const weekAgo = daysAgo(7);

  const unhandledRequests: UnhandledRequestItem[] = unhandled
    .slice(0, 8)
    .map((r) => ({
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
        clientCount,
        companyCount,
        unhandledCount: unhandled.length,
        newRequestsThisWeek: unhandled.filter((r) => r.createdAt >= weekAgo)
          .length,
      }}
      inProgressProjects={inProgressProjects}
      unhandledRequests={unhandledRequests}
      initialUsers={users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      }))}
      initialCompanies={companies}
      initialProjects={projects}
      initialContacts={contacts}
      staff={staff}
    />
  );
}
