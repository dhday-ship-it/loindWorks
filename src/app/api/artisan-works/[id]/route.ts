import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

// GET is public and read-only — the LOIND-아티즌 detail page (/work/:id) fetches a
// single type/work this way, cross-origin. PATCH/DELETE are super-admin only.
const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const work = await prisma.artisanWork.findUnique({ where: { id } });
  if (!work) {
    return NextResponse.json({ error: "존재하지 않는 게시물입니다." }, { status: 404, headers: CORS_HEADERS });
  }
  return NextResponse.json({ work }, { headers: CORS_HEADERS });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;
  const { category, title, text, description, imageUrl, galleryImages, color, isAd, order, tags, price, supportsPrint } =
    await request.json();

  const work = await prisma.$transaction(async (tx) => {
    if (isAd === true) {
      await tx.artisanWork.updateMany({ where: { isAd: true, id: { not: id } }, data: { isAd: false } });
    }
    return tx.artisanWork.update({
      where: { id },
      data: {
        category: typeof category === "string" ? category : undefined,
        title: typeof title === "string" ? title : undefined,
        text: typeof text === "string" ? text : undefined,
        description: description === null ? null : typeof description === "string" ? description : undefined,
        imageUrl: typeof imageUrl === "string" ? imageUrl : undefined,
        galleryImages: Array.isArray(galleryImages)
          ? galleryImages.filter((g) => typeof g === "string" && g)
          : undefined,
        color: typeof color === "string" ? color : undefined,
        isAd: typeof isAd === "boolean" ? isAd : undefined,
        order: typeof order === "number" ? order : undefined,
        tags: Array.isArray(tags) ? tags.filter((t) => typeof t === "string" && t) : undefined,
        price: price === null ? null : typeof price === "number" ? price : undefined,
        supportsPrint: typeof supportsPrint === "boolean" ? supportsPrint : undefined,
      },
    });
  });

  return NextResponse.json({ work });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;

  await prisma.artisanWork.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
