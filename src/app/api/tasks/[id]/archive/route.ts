import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

// 작업 아카이브 (DONE 상태 → archivedAt 설정)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;

  const task = await prisma.task.update({
    where: { id },
    data: { archivedAt: new Date() },
    select: { id: true, archivedAt: true },
  });

  return NextResponse.json({ task });
}

// 아카이브 해제
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;

  const task = await prisma.task.update({
    where: { id },
    data: { archivedAt: null },
    select: { id: true, archivedAt: true },
  });

  return NextResponse.json({ task });
}
