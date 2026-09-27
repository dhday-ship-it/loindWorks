import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

// Public — the LOIND-아티즌 order form uploads a reference/sketch file here before
// submitting the order itself. No login, so keep this narrowly scoped (size + type capped).
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MAX_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400, headers: CORS_HEADERS });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "파일은 15MB 이하만 업로드할 수 있습니다." }, { status: 400, headers: CORS_HEADERS });
  }
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "이미지(png/jpg/webp/gif) 또는 PDF 파일만 업로드할 수 있습니다." }, { status: 400, headers: CORS_HEADERS });
  }

  const blob = await put(`artisan-orders/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url }, { headers: CORS_HEADERS });
}
