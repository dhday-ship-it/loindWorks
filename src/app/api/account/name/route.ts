import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const user = await requireUser();
  const { name } = await request.json();

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "이름은 필수입니다." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: name.trim() },
  });

  return NextResponse.json({ success: true, name: name.trim() });
}
