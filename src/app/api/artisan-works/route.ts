import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Public read-only endpoint consumed cross-origin by the LOIND-아티즌 marketing site.
const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

export async function GET() {
  const works = await prisma.artisanWork.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ works }, { headers: CORS_HEADERS });
}
