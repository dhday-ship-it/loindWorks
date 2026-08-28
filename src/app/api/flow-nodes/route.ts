import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireStaff();

  const nodes = await prisma.flowNode.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      detail: true,
      color: true,
      order: true,
      parentId: true,
    },
  });

  return NextResponse.json({ nodes });
}

export async function POST(request: Request) {
  const user = await requireStaff();
  const { title, detail, color, parentId } = await request.json();

  if (!title || !String(title).trim()) {
    return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 });
  }

  const siblingCount = await prisma.flowNode.count({
    where: { parentId: parentId || null },
  });

  const node = await prisma.flowNode.create({
    data: {
      title: String(title).trim(),
      detail: detail || undefined,
      color: color || undefined,
      parentId: parentId || undefined,
      order: siblingCount,
      createdById: user.id,
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

  return NextResponse.json({ node }, { status: 201 });
}
