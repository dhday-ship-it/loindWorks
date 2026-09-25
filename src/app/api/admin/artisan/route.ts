import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const defaultCategories = [
  { label: "커스텀작업 신청", iconUrl: null },
  { label: "디자인", iconUrl: null },
  { label: "영상", iconUrl: null },
  { label: "홈페이지,웹", iconUrl: null },
  { label: "굿즈,기념품 제작", iconUrl: null },
];

async function getOrCreateContent() {
  const existing = await prisma.artisanContent.findFirst();
  if (existing) return existing;
  return prisma.artisanContent.create({ data: { categories: defaultCategories } });
}

export async function GET() {
  await requireSuperAdmin();
  const content = await getOrCreateContent();
  return NextResponse.json({ content });
}

export async function PUT(request: Request) {
  await requireSuperAdmin();
  const body = await request.json();
  const bannerUrl = body.bannerUrl === null || typeof body.bannerUrl === "string" ? body.bannerUrl : undefined;
  const rawCategories: unknown[] = Array.isArray(body.categories) ? body.categories : [];
  const categories = rawCategories
    .map((value: unknown) => {
      const category = value as { label?: unknown; iconUrl?: unknown };
      return {
        label: typeof category.label === "string" ? category.label.trim() : "",
        iconUrl: typeof category.iconUrl === "string" ? category.iconUrl : null,
      };
    })
    .filter((category: { label: string }) => category.label);

  const current = await getOrCreateContent();
  const content = await prisma.artisanContent.update({
    where: { id: current.id },
    data: {
      ...(bannerUrl !== undefined ? { bannerUrl } : {}),
      ...(categories ? { categories } : {}),
    },
  });
  return NextResponse.json({ content });
}
