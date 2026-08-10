import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const user = await requireUser();
  const { currentPassword, newPassword } = await request.json();

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return NextResponse.json(
      { error: "현재 비밀번호와 새 비밀번호를 모두 입력해주세요." },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "새 비밀번호는 8자 이상이어야 합니다." },
      { status: 400 }
    );
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.passwordHash) {
    return NextResponse.json(
      { error: "계정을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "현재 비밀번호가 일치하지 않습니다." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
