import { NextResponse } from "next/server";

// loind-web(로인드 홈페이지)의 스토리 중 "Artisan" 카테고리로 올라온 글을 읽어와
// 아티즌 홈 포트폴리오 섹션에 노출한다. loind-web은 이 프로젝트와 완전히 별개의
// Supabase 프로젝트를 쓰므로, 그쪽이 이미 공개(anon) 키로 브라우저에서 직접 읽는
// stories 테이블을 여기서도 같은 방식(REST, 읽기 전용)으로 조회한다.
const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

export async function GET() {
  const supabaseUrl = process.env.LOIND_WEB_SUPABASE_URL;
  const anonKey = process.env.LOIND_WEB_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ stories: [] }, { headers: CORS_HEADERS });
  }

  const query = new URLSearchParams({
    category: "eq.Artisan",
    order: "created_at.desc",
    select: "id,title,text,summary,img,images,link,created_at",
  });

  const res = await fetch(`${supabaseUrl}/rest/v1/stories?${query}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ stories: [] }, { headers: CORS_HEADERS });
  }

  const stories = await res.json();
  return NextResponse.json({ stories }, { headers: CORS_HEADERS });
}
