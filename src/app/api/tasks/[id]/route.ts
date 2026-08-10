import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@/generated/prisma/enums";

const VALID_STATUSES: TaskStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;
  const { status } = await request.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "잘못된 상태값입니다." }, { status: 400 });
  }

  const task = await prisma.task.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
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
