import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id: projectId } = await params;

  const { title, body, assigneeUserIds } = await request.json();

  if (!body || typeof body !== "string") {
    return NextResponse.json({ error: "내용은 필수입니다." }, { status: 400 });
  }

  let assignees: string[];
  if (user.role === "CLIENT") {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { pmId: true, members: { where: { userId: user.id } } },
    });
    if (!project || project.members.length === 0) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    assignees = project.pmId ? [project.pmId] : [];
  } else if (user.role === "STAFF" || user.role === "SUPER_ADMIN") {
    assignees = Array.isArray(assigneeUserIds) ? assigneeUserIds : [];
  } else {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const projectRequest = await prisma.projectRequest.create({
    data: {
      projectId,
      authorId: user.id,
      title: typeof title === "string" && title.trim() ? title.trim() : null,
      body,
      assignees: {
        create: assignees.map((userId: string) => ({ userId })),
      },
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      assignees: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return NextResponse.json({ request: projectRequest }, { status: 201 });
}
