import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  projectId: true,
  startDate: true,
  dueDate: true,
  order: true,
  createdAt: true,
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

export async function GET() {
  await requireStaff();

  const tasks = await prisma.task.findMany({
    where: { archivedAt: null },
    select: taskSelect,
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const user = await requireStaff();
  const { title, description, assigneeId, projectId, priority, startDate, dueDate } =
    await request.json();

  if (!title) {
    return NextResponse.json({ error: "제목은 필수입니다." }, { status: 400 });
  }
  if (!projectId) {
    return NextResponse.json({ error: "프로젝트는 필수입니다." }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description || undefined,
      priority: priority ?? "NORMAL",
      projectId,
      assigneeId: assigneeId || user.id,
      createdById: user.id,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    },
    select: taskSelect,
  });

  return NextResponse.json({ task }, { status: 201 });
}
