import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

// 아카이브된 작업 목록
export async function GET(request: Request) {
  await requireStaff();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const tasks = await prisma.task.findMany({
    where: {
      archivedAt: { not: null },
      ...(projectId ? { projectId } : {}),
    },
    orderBy: { archivedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      archivedAt: true,
      createdAt: true,
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    tasks: tasks.map((t) => ({
      ...t,
      dueDate: t.dueDate?.toISOString() ?? null,
      archivedAt: t.archivedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
