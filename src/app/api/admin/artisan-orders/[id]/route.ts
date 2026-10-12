import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { ArtisanOrderStatus } from "@/generated/prisma/enums";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;
  const { status } = await request.json();

  const validStatus =
    typeof status === "string" && (Object.values(ArtisanOrderStatus) as string[]).includes(status)
      ? (status as ArtisanOrderStatus)
      : undefined;

  const order = await prisma.artisanOrder.update({
    where: { id },
    data: {
      status: validStatus,
    },
    include: {
      work: { select: { id: true, title: true, category: true, imageUrl: true } },
    },
  });

  return NextResponse.json({ order });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;

  await prisma.artisanOrder.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
