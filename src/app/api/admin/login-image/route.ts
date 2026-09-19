import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireSuperAdmin();
  const image = await prisma.loginPageImage.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ image });
}

export async function PUT(request: Request) {
  await requireSuperAdmin();
  const { imageUrl } = await request.json();

  if (!imageUrl || typeof imageUrl !== "string") {
    return NextResponse.json({ error: "이미지는 필수입니다." }, { status: 400 });
  }

  const existing = await prisma.loginPageImage.findFirst();
  const image = existing
    ? await prisma.loginPageImage.update({
        where: { id: existing.id },
        data: { imageUrl },
      })
    : await prisma.loginPageImage.create({ data: { imageUrl } });

  return NextResponse.json({ image });
}

export async function DELETE() {
  await requireSuperAdmin();
  await prisma.loginPageImage.deleteMany({});
  return NextResponse.json({ ok: true });
}
