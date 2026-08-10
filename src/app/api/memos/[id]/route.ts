import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaff();
  const { id } = await params;
  const { title, body, pinned, folderId } = await request.json();

  const memo = await prisma.memo.updateMany({
    where: { id, ownerId: user.id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(body !== undefined ? { body } : {}),
      ...(pinned !== undefined ? { pinned } : {}),
      ...(folderId !== undefined ? { folderId } : {}),
    },
  });

  if (memo.count === 0) {
    return NextResponse.json(
      { error: "메모를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const updated = await prisma.memo.findUnique({
    where: { id },
    include: { folder: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ memo: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaff();
  const { id } = await params;

  const result = await prisma.memo.deleteMany({
    where: { id, ownerId: user.id },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "메모를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
