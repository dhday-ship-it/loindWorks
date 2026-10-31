// loind.com 스토리 — loind.com(LOIND-WEB) Supabase 프로젝트의 `stories` 테이블과
// `story-images` 스토리지 버킷을 서버에서 대신 읽고 쓴다. (WORKS 자체 DB와는 다른 프로젝트)
// 쓰기에는 RLS 를 통과하는 서버 전용 키(LOIND_WEB_SUPABASE_SERVICE_ROLE_KEY)가 필요하다.

export interface StoryRecord {
  id: string;
  category: string;
  title: string;
  img: string;
  images: string[];
  text: string;
  summary: string | null;
  detail: string;
  link: string | null;
  is_recommended: boolean;
  is_home_featured: boolean;
  home_order: number;
  created_at: string;
}

export type StoryPayload = Omit<StoryRecord, "id" | "created_at">;

const BUCKET = "story-images";

function config() {
  const url = process.env.LOIND_WEB_SUPABASE_URL;
  const key = process.env.LOIND_WEB_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

export function storiesConfigured() {
  return config() !== null;
}

function headers(key: string, extra?: Record<string, string>) {
  // 새 형식 비밀 키(sb_secret_…)는 apikey 헤더만, 예전 service_role JWT 는 Authorization 도 함께
  const h: Record<string, string> = { apikey: key, ...extra };
  if (key.startsWith("eyJ")) h.Authorization = `Bearer ${key}`;
  return h;
}

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const c = config();
  if (!c) throw new Error("LOIND_WEB_SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다.");
  const res = await fetch(`${c.url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: headers(c.key, {
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers as Record<string, string> | undefined),
    }),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export function listStories() {
  return rest<StoryRecord[]>("stories?select=*&order=created_at.desc");
}

export async function createStory(payload: StoryPayload) {
  const rows = await rest<StoryRecord[]>("stories", { method: "POST", body: JSON.stringify(payload) });
  return rows[0];
}

export async function updateStory(id: string, patch: Partial<StoryPayload>) {
  const rows = await rest<StoryRecord[]>(`stories?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return rows[0];
}

export async function deleteStory(id: string) {
  await rest(`stories?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** 이미지를 story-images 버킷에 올리고 공개 URL 을 돌려준다. */
export async function uploadStoryImage(file: File) {
  const c = config();
  if (!c) throw new Error("LOIND_WEB_SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다.");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const res = await fetch(`${c.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: headers(c.key, { "Content-Type": file.type || "application/octet-stream", "x-upsert": "false" }),
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!res.ok) throw new Error(`이미지 업로드 실패 (${res.status}): ${await res.text()}`);
  return `${c.url}/storage/v1/object/public/${BUCKET}/${path}`;
}
