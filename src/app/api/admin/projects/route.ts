import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireSuperAdmin();

  const [allProjects, staff] = await Promise.all([
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
      where: { role: { in: ["STAFF", "PM", "SUPER_ADMIN"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const projects = allProjects.map((p) => {
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

  return NextResponse.json({ projects, staff });
}
