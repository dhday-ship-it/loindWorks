import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id: projectId } = await params;

  const { title, body, assigneeUserIds, itemType, attachments } =
    await request.json();

  if (!body || typeof body !== "string") {
    return NextResponse.json({ error: "내용은 필수입니다." }, { status: 400 });
  }

  const files = Array.isArray(attachments)
    ? attachments
        .filter(
          (a): a is { name: string; url: string; size: number; mimeType?: string } =>
            a && typeof a.url === "string" && typeof a.name === "string"
        )
        .map((a) => ({
          name: a.name,
          url: a.url,
          size: typeof a.size === "number" ? a.size : 0,
          mimeType: a.mimeType ?? null,
          projectId,
          uploaderId: user.id,
        }))
    : [];

  let assignees: string[];
  if (user.role === "CLIENT") {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { pmId: true, members: true },
    });
    if (!project) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    const isMember = project.members.some((m) => m.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const staffMemberIds = new Set(
      project.members
        .filter((m) => m.roleLabel === "팀원")
        .map((m) => m.userId)
    );
    if (project.pmId) staffMemberIds.add(project.pmId);

    const requested = Array.isArray(assigneeUserIds)
      ? assigneeUserIds.filter(
          (id: unknown): id is string =>
            typeof id === "string" && staffMemberIds.has(id)
        )
      : [];

    assignees = requested.length > 0 ? requested : project.pmId ? [project.pmId] : [];
  } else if (user.role === "STAFF" || user.role === "SUPER_ADMIN") {
    assignees = Array.isArray(assigneeUserIds) ? assigneeUserIds : [];
  } else {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const resolvedType =
    typeof itemType === "string" && itemType === "TASK" ? "TASK" : "REQUEST";

  const projectRequest = await prisma.projectRequest.create({
    data: {
      projectId,
      authorId: user.id,
      title: typeof title === "string" && title.trim() ? title.trim() : null,
      body,
      itemType: resolvedType,
      assignees: {
        create: assignees.map((userId: string) => ({ userId })),
      },
      files: {
        create: files,
      },
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      assignees: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      files: {
        include: { uploader: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return NextResponse.json({ request: projectRequest }, { status: 201 });
}
