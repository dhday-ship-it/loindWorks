import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireSuperAdmin();
  const banners = await prisma.banner.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ banners });
}

export async function POST(request: Request) {
  await requireSuperAdmin();
  const { imageUrl, linkUrl, order } = await request.json();

  if (!imageUrl || typeof imageUrl !== "string") {
    return NextResponse.json({ error: "이미지는 필수입니다." }, { status: 400 });
  }

  const banner = await prisma.banner.create({
    data: {
      imageUrl,
      linkUrl: linkUrl || null,
      order: typeof order === "number" ? order : 0,
    },
  });

  return NextResponse.json({ banner }, { status: 201 });
}
