import { NextResponse } from "next/server";

import { requireStaff } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaff();
  const { id: projectId } = await params;
  const { name, url, size, mimeType } = await request.json();

  if (!name || !url) {
    return NextResponse.json(
      { error: "name과 url은 필수입니다." },
      { status: 400 }
    );
  }

  const file = await prisma.projectFile.create({
    data: {
      projectId,
      name,
      url,
      size: typeof size === "number" ? size : 0,
      mimeType: mimeType ?? null,
      uploaderId: user.id,
    },
    include: { uploader: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ file }, { status: 201 });
}
