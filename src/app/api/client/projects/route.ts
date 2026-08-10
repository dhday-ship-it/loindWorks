import { NextResponse } from "next/server";

import { requireClient } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireClient();

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: user.id } } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      status: true,
      summary: true,
      phases: true,
      currentPhase: true,
      startDate: true,
      endDate: true,
      company: { select: { id: true, name: true } },
      pm: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    projects: projects.map((p) => ({
      ...p,
      phases: p.phases as string[],
      startDate: p.startDate ? p.startDate.toISOString() : null,
      endDate: p.endDate ? p.endDate.toISOString() : null,
    })),
  });
}
