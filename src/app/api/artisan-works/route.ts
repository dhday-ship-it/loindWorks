import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

// GET is public and read-only — consumed cross-origin by the LOIND-아티즌 marketing
// site. POST is super-admin only — Artisans 제작은 로인드 내부 작업팀이 처리하므로
// 외부 크리에이터 계정 개념은 없다.
const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

export async function GET() {
  const works = await prisma.artisanWork.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ works }, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  await requireSuperAdmin();
  const { category, title, text, imageUrl, color, isAd, order, tags, price } = await request.json();

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
        tags: Array.isArray(tags) ? tags.filter((t) => typeof t === "string" && t) : [],
        price: typeof price === "number" ? price : null,
      },
    });
  });

  return NextResponse.json({ work }, { status: 201 });
}
