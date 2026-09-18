import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { SuperAdminDashboard } from "@/components/super-admin/SuperAdminDashboard";
import type { AdminProjectItem } from "@/components/super-admin/types";

export default async function AdminPage() {
  const admin = await requireSuperAdmin();

  const [
    activeProjectCount,
    totalProjectCount,
    staffCount,
    pmCount,
    companyCount,
    inProgressRaw,
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

  return (
    <SuperAdminDashboard
      currentUserName={admin.name ?? admin.email ?? "관리자"}
      stats={{
        activeProjects: activeProjectCount,
        totalProjects: totalProjectCount,
        staffCount,
        pmCount,
        companyCount,
      }}
      inProgressProjects={inProgressProjects}
    />
  );
}
