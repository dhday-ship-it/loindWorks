import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;
  const { handled } = await request.json();

  if (typeof handled !== "boolean") {
    return NextResponse.json(
      { error: "handled 값이 필요합니다." },
      { status: 400 }
    );
  }

  const contact = await prisma.contactRequest.update({
    where: { id },
    data: { handled },
  });

  return NextResponse.json({
    contact: { ...contact, createdAt: contact.createdAt.toISOString() },
  });
}
