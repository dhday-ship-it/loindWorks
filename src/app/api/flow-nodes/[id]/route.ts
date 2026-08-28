import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;
  const { title, detail, color, order } = await request.json();

  if (title !== undefined && !String(title).trim()) {
    return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 });
  }

  const node = await prisma.flowNode.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: String(title).trim() }),
      ...(detail !== undefined && { detail: detail || null }),
      ...(color !== undefined && { color: color || null }),
      ...(order !== undefined && { order }),
    },
    select: {
      id: true,
      title: true,
      detail: true,
      color: true,
      order: true,
      parentId: true,
    },
  });

  return NextResponse.json({ node });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;

  await prisma.flowNode.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
