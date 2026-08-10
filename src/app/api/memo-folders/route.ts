import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireStaff();

  const folders = await prisma.memoFolder.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ folders });
}

export async function POST(request: Request) {
  const user = await requireStaff();
  const { name } = await request.json();

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "폴더명은 필수입니다." }, { status: 400 });
  }

  const existing = await prisma.memoFolder.findUnique({
    where: { ownerId_name: { ownerId: user.id, name } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "이미 존재하는 폴더명입니다." },
      { status: 409 }
    );
  }

  const folder = await prisma.memoFolder.create({
    data: { name, ownerId: user.id },
  });

  return NextResponse.json({ folder }, { status: 201 });
}
