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
  const { status, assignedStaffId, draftFileUrl, finalFileUrl } = await request.json();

  const validStatus =
    typeof status === "string" && (Object.values(ArtisanOrderStatus) as string[]).includes(status)
      ? (status as ArtisanOrderStatus)
      : undefined;

  const order = await prisma.artisanOrder.update({
    where: { id },
    data: {
      status: validStatus,
      assignedStaffId: assignedStaffId === null ? null : typeof assignedStaffId === "string" ? assignedStaffId : undefined,
      draftFileUrl: draftFileUrl === null ? null : typeof draftFileUrl === "string" ? draftFileUrl : undefined,
      finalFileUrl: finalFileUrl === null ? null : typeof finalFileUrl === "string" ? finalFileUrl : undefined,
    },
    include: {
      work: { select: { id: true, title: true, category: true, imageUrl: true } },
      assignedStaff: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ order });
}
