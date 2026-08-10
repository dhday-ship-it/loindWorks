import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function POST(request: Request) {
  const body = await request.json();
  const { companyName, contactName, phone, email, projects, privacyAgreed } =
    body;

  if (!companyName || !contactName || !phone || !email) {
    return NextResponse.json(
      { error: "기업명, 담당자, 연락처, 이메일은 필수입니다." },
      { status: 400 }
    );
  }

  if (!privacyAgreed) {
    return NextResponse.json(
      { error: "개인정보 수집 및 이용에 동의해주세요." },
      { status: 400 }
    );
  }

  if (!Array.isArray(projects) || projects.length === 0) {
    return NextResponse.json(
      { error: "최소 1개 이상의 프로젝트 정보가 필요합니다." },
      { status: 400 }
    );
  }

  const contactRequest = await prisma.contactRequest.create({
    data: {
      companyName,
      contactName,
      phone,
      email,
      privacyAgreed: true,
      projects: projects as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  return NextResponse.json({ contactRequest }, { status: 201 });
}
