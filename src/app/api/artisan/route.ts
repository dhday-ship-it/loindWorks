import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Public read-only endpoint consumed cross-origin by the LOIND-아티즌 marketing site.
const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

export async function GET() {
  const content = await prisma.artisanContent.findFirst();
  return NextResponse.json(
    {
      content: content ?? {
        bannerUrl: null,
        categories: [
          { label: "커스텀작업 신청", iconUrl: null },
          { label: "디자인", iconUrl: null },
          { label: "영상", iconUrl: null },
          { label: "홈페이지,웹", iconUrl: null },
          { label: "굿즈,기념품 제작", iconUrl: null },
        ],
      },
    },
    { headers: CORS_HEADERS },
  );
}
