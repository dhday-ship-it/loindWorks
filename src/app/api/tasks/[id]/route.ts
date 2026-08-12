import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@/generated/prisma/enums";

const VALID_STATUSES: TaskStatus[] = ["WAIT", "IN_PROGRESS", "REVIEW", "FEEDBACK", "DONE"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaff();
  const { id } = await params;
  const { status, priority, order, title, description, dueDate, assigneeId } =
    await request.json();

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "잘못된 상태값입니다." }, { status: 400 });
  }

  // 상태 변경 히스토리 기록
  if (status !== undefined) {
    const existing = await prisma.task.findUnique({
      where: { id },
      select: { status: true },
    });
    if (existing && existing.status !== status) {
      await prisma.taskHistory.create({
        data: {
          taskId: id,
          fromStatus: existing.status,
          toStatus: status,
          actorId: user.id,
        },
      });
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(order !== undefined && { order }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(assigneeId !== undefined && { assigneeId }),
    },
    select: {
      id: true,
      status: true,
      priority: true,
      order: true,
      title: true,
      description: true,
      dueDate: true,
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ task });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
