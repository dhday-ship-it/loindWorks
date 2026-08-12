import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const user = await requireStaff();
  const { commentId } = await params;
  const { body } = await request.json();

  if (!body || typeof body !== "string") {
    return NextResponse.json({ error: "내용은 필수입니다." }, { status: 400 });
  }

  // Verify the user is the author
  const existing = await prisma.taskComment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
  }

  if (existing.authorId !== user.id) {
    return NextResponse.json({ error: "본인의 댓글만 수정할 수 있습니다." }, { status: 403 });
  }

  const updated = await prisma.taskComment.update({
    where: { id: commentId },
    data: { body },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ comment: updated });
}
