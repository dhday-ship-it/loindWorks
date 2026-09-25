import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireSuperAdmin();
  const works = await prisma.artisanWork.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ works });
}

export async function POST(request: Request) {
  await requireSuperAdmin();
  const { category, title, text, imageUrl, color, isAd, order } = await request.json();

  if (!category || !title || !text || !imageUrl) {
    return NextResponse.json({ error: "카테고리, 제목, 설명, 이미지는 필수입니다." }, { status: 400 });
  }

  const work = await prisma.$transaction(async (tx) => {
    if (isAd === true) {
      await tx.artisanWork.updateMany({ where: { isAd: true }, data: { isAd: false } });
    }
    return tx.artisanWork.create({
      data: {
        category,
        title,
        text,
        imageUrl,
        color: typeof color === "string" && color ? color : "lavender",
        isAd: isAd === true,
        order: typeof order === "number" ? order : 0,
      },
    });
  });

  return NextResponse.json({ work }, { status: 201 });
}
