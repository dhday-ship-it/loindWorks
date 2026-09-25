import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;
  const { category, title, text, imageUrl, color, isAd, order } = await request.json();

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
        imageUrl: typeof imageUrl === "string" ? imageUrl : undefined,
        color: typeof color === "string" ? color : undefined,
        isAd: typeof isAd === "boolean" ? isAd : undefined,
        order: typeof order === "number" ? order : undefined,
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
