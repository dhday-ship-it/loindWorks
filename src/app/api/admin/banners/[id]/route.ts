import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;
  const { imageUrl, linkUrl, active, order } = await request.json();

  const banner = await prisma.banner.update({
    where: { id },
    data: {
      imageUrl: typeof imageUrl === "string" ? imageUrl : undefined,
      linkUrl: linkUrl !== undefined ? linkUrl || null : undefined,
      active: typeof active === "boolean" ? active : undefined,
      order: typeof order === "number" ? order : undefined,
    },
  });

  return NextResponse.json({ banner });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;

  await prisma.banner.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
