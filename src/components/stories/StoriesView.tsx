"use client";

import { useCallback, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { Role } from "@/generated/prisma/enums";
import { AppShell } from "@/components/layout/AppShell";
import type { StoryRecord } from "@/lib/loind-stories";

// 예전 loind.com/admin(스토리 어드민)을 그대로 옮긴 화면 — 데이터는 loind.com Supabase 의 stories
const CATEGORY_OPTIONS = ["Artisan", "LODN", "Rise"];
const CATEGORY_LABELS: Record<string, string> = {
  ALL: "전체",
  Artisan: "제작 스튜디오 : 아티즌",
  LODN: "브랜드 콘텐츠 : 로든",
  Rise: "크리스천 비즈니스 : 라이즈",
};
const displayCategory = (c: string) => CATEGORY_LABELS[c] ?? c;

const HOME_FEATURED_LIMIT = 3;
const PAGE_SIZE = 6;

type View = "list" | "new" | "order";
const VIEW_META: Record<View, { title: string; sub: string }> = {
  list: { title: "스토리 목록", sub: "등록된 스토리 관리" },
  new: { title: "새 스토리 작성", sub: "loind.com 스토리 페이지에 올라갈 글을 써요" },
  order: { title: "메인 노출 순서", sub: "loind.com 메인페이지 스토리 노출 순서" },
};

function storyImages(s: Pick<StoryRecord, "img" | "images">) {
  if (Array.isArray(s.images) && s.images.length > 0) return s.images;
  return s.img ? [s.img] : [];
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
  return data as T;
}

export function StoriesView({
  currentUser,
  configured,
  initialStories,
  initialError,
}: {
  currentUser: { id: string; name: string | null; email: string; role: Role };
  configured: boolean;
  initialStories: StoryRecord[];
  initialError: string;
}) {
  const [view, setView] = useState<View>("list");
  const [stories, setStories] = useState<StoryRecord[]>(initialStories);
  const [loadError, setLoadError] = useState(initialError);
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // 작성 폼
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [title, setTitle] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [imgUrl, setImgUrl] = useState("");
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [summary, setSummary] = useState("");
  const [detail, setDetail] = useState("");
  const [isRecommended, setIsRecommended] = useState(false);
  const [isHomeFeatured, setIsHomeFeatured] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const homeFeaturedCount = stories.filter((s) => s.is_home_featured).length;
  const featuredOrdered = stories
    .filter((s) => s.is_home_featured)
    .sort((a, b) => a.home_order - b.home_order || (a.created_at < b.created_at ? 1 : -1));
  const filtered = filter === "ALL" ? stories : stories.filter((s) => s.category === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const fetchStories = useCallback(async () => {
    try {
      const { stories } = await api<{ stories: StoryRecord[] }>("/api/stories");
      setStories(stories);
      setLoadError("");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const resetForm = () => {
    setCategory(CATEGORY_OPTIONS[0]);
    setTitle("");
    setImages([]);
    setPendingFiles([]);
    setImgUrl("");
    setText("");
    setLink("");
    setSummary("");
    setDetail("");
    setIsRecommended(false);
    setIsHomeFeatured(false);
    setEditId(null);
    setSubmitting(false);
  };

  const go = (v: View) => {
    if (v === "new") resetForm();
    setView(v);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length) setPendingFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };
  const addImageUrl = () => {
    const url = imgUrl.trim();
    if (!url) return;
    setImages((prev) => [...prev, url]);
    setImgUrl("");
  };
  const moveImage = (i: number, dir: -1 | 1) =>
    setImages((prev) => {
      const t = i + dir;
      if (t < 0 || t >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[t]] = [next[t], next[i]];
      return next;
    });

  const nextHomeOrder = () => stories.filter((s) => s.is_home_featured).reduce((m, s) => Math.max(m, s.home_order), 0) + 1;

  const handleSubmit = async () => {
    if (!title) return alert("제목을 입력하세요.");
    const existing = editId ? stories.find((s) => s.id === editId) : undefined;
    if (isHomeFeatured && !existing?.is_home_featured && homeFeaturedCount >= HOME_FEATURED_LIMIT) {
      return alert(`메인페이지 노출 스토리는 최대 ${HOME_FEATURED_LIMIT}개까지 선택할 수 있습니다. 다른 스토리를 먼저 해제하세요.`);
    }
    if (images.length === 0 && pendingFiles.length === 0) return alert("이미지를 한 장 이상 등록하세요.");
    setSubmitting(true);
    try {
      const uploaded: string[] = [];
      for (const f of pendingFiles) {
        const fd = new FormData();
        fd.append("file", f);
        const { url } = await api<{ url: string }>("/api/stories/upload", { method: "POST", body: fd });
        uploaded.push(url);
      }
      const finalImages = [...images, ...uploaded];
      let homeOrder = existing?.home_order ?? 0;
      if (isHomeFeatured && !existing?.is_home_featured) homeOrder = nextHomeOrder();
      const payload = {
        category, title, images: finalImages, text, summary, detail, link,
        is_recommended: isRecommended, is_home_featured: isHomeFeatured, home_order: homeOrder,
      };
      await api(editId ? `/api/stories/${editId}` : "/api/stories", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await fetchStories();
      resetForm();
      setView("list");
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  };

  const handleEdit = (s: StoryRecord) => {
    setCategory(s.category);
    setTitle(s.title);
    setImages(storyImages(s));
    setPendingFiles([]);
    setImgUrl("");
    setText(s.text);
    setLink(s.link || "");
    setSummary(s.summary || "");
    setDetail(s.detail);
    setIsRecommended(s.is_recommended);
    setIsHomeFeatured(s.is_home_featured);
    setEditId(s.id);
    setSubmitting(false);
    setView("new");
  };

  const toggleHomeFeatured = async (s: StoryRecord) => {
    const next = !s.is_home_featured;
    if (next && homeFeaturedCount >= HOME_FEATURED_LIMIT) {
      return alert(`메인페이지 노출 스토리는 최대 ${HOME_FEATURED_LIMIT}개까지 선택할 수 있습니다. 다른 스토리를 먼저 해제하세요.`);
    }
    try {
      await api(`/api/stories/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next ? { is_home_featured: true, home_order: nextHomeOrder() } : { is_home_featured: false }),
      });
      await fetchStories();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const moveFeatured = async (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= featuredOrdered.length) return;
    const reordered = [...featuredOrdered];
    [reordered[i], reordered[t]] = [reordered[t], reordered[i]];
    try {
      await api("/api/stories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map((s) => s.id) }),
      });
      await fetchStories();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 스토리를 삭제할까요? loind.com 에서도 사라져요.")) return;
    try {
      await api(`/api/stories/${id}`, { method: "DELETE" });
      await fetchStories();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const tabCls = (v: View) =>
    `rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
      view === v ? "bg-white text-brand-deep shadow-sm" : "text-slate-500 hover:text-slate-800"
    }`;
  const label = "font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400";

  return (
    <AppShell
      currentUser={currentUser}
      main={
        <div className="mx-auto flex max-w-[1080px] flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[22px] font-bold text-slate-800">
                {view === "new" && editId ? "스토리 수정" : VIEW_META[view].title}
              </h1>
              <p className="mt-1 text-sm text-slate-400">{VIEW_META[view].sub}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1">
                <button type="button" className={tabCls("list")} onClick={() => go("list")}>스토리 목록</button>
                <button type="button" className={tabCls("new")} onClick={() => go("new")}>새 스토리 작성</button>
                <button type="button" className={tabCls("order")} onClick={() => go("order")}>메인 노출 순서</button>
              </div>
              <a href="https://loind.com/story" target="_blank" rel="noopener noreferrer" className="admin-btn-ghost">
                사이트 스토리 보기 ↗
              </a>
            </div>
          </div>

          {!configured && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              loind.com Supabase 서버 키가 설정되지 않았어요. 환경변수 <code className="font-mono">LOIND_WEB_SUPABASE_SERVICE_ROLE_KEY</code> 를 넣어 주세요.
            </div>
          )}
          {configured && loadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">스토리를 불러오지 못했어요. {loadError}</div>
          )}

          {view === "list" && (
            <section className="admin-sec-card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {["ALL", ...CATEGORY_OPTIONS].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setFilter(c); setPage(1); }}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        filter === c ? "border-brand bg-brand text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {displayCategory(c)}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-400">총 {filtered.length}건 · 메인 노출 {homeFeaturedCount}/{HOME_FEATURED_LIMIT}</span>
              </div>
              {paged.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">해당 분류의 스토리가 없어요.</p>
              ) : (
                <ul>
                  {paged.map((s) => (
                    <li key={s.id} className="flex items-center gap-4 border-t border-slate-50 py-3 first:border-t-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.img} alt={s.title} className="h-16 w-24 shrink-0 rounded-lg bg-slate-100 object-cover" />
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-slate-800">
                          {s.is_recommended && <span title="추천 게시물" className="text-amber-400">★ </span>}
                          {s.is_home_featured && <span title="메인페이지 노출" className="mr-1 rounded bg-brand-light/15 px-1.5 py-0.5 text-[10px] font-bold text-brand">메인</span>}
                          {s.title}
                        </h4>
                        <p className="mt-0.5 text-xs text-slate-400">{displayCategory(s.category)} · {s.created_at.slice(0, 10).replace(/-/g, ".")}</p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button type="button" className="admin-btn-ghost" onClick={() => toggleHomeFeatured(s)}>
                          {s.is_home_featured ? "메인 해제" : "메인 노출"}
                        </button>
                        <button type="button" className="admin-btn-ghost" onClick={() => handleEdit(s)}>수정</button>
                        <button type="button" className="admin-btn-danger" onClick={() => handleDelete(s.id)}>삭제</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {totalPages > 1 && (
                <nav className="mt-4 flex justify-center gap-1">
                  <button type="button" className="admin-btn-ghost" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPage(i + 1)}
                      className={safePage === i + 1 ? "admin-btn-primary !px-3 !py-1" : "admin-btn-ghost"}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button type="button" className="admin-btn-ghost" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
                </nav>
              )}
            </section>
          )}

          {view === "new" && (
            <section className="admin-sec-card flex flex-col gap-4 p-6">
              <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
                <label className="flex flex-col gap-1.5">
                  <span className={label}>분류</span>
                  <select className="admin-input cursor-pointer" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{displayCategory(c)}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={label}>제목</span>
                  <input className="admin-input" type="text" placeholder="제목을 입력하세요" value={title} onChange={(e) => setTitle(e.target.value)} />
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <span className={label}>이미지 — 여러 장이면 상세 팝업에서 슬라이드로 보여요 (첫 번째가 대표 이미지)</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-sm font-medium text-slate-500 hover:border-brand-light hover:bg-slate-50"
                >
                  {pendingFiles.length > 0 ? `업로드 대기 ${pendingFiles.length}개 · 더 추가하려면 클릭` : "내 컴퓨터에서 이미지 선택 (여러 장 가능)"}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                <div className="flex gap-2">
                  <input
                    className="admin-input"
                    type="text"
                    placeholder="또는 이미지 URL 주소를 입력 후 추가"
                    value={imgUrl}
                    onChange={(e) => setImgUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl(); } }}
                  />
                  <button type="button" className="admin-btn-ghost !px-4" onClick={addImageUrl}>추가</button>
                </div>
                {(images.length > 0 || pendingFiles.length > 0) && (
                  <ul className="flex flex-col gap-1.5">
                    {images.map((src, i) => (
                      <li key={src + i} className="flex items-center gap-3 rounded-lg border border-slate-100 px-2 py-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-10 w-14 rounded object-cover" />
                        <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
                          {i === 0 && <strong className="mr-1.5 rounded bg-brand px-1.5 py-0.5 text-[10px] text-white">대표</strong>}
                          {src.split("/").pop()}
                        </span>
                        <button type="button" className="admin-btn-ghost" disabled={i === 0} onClick={() => moveImage(i, -1)}>↑</button>
                        <button type="button" className="admin-btn-ghost" disabled={i === images.length - 1} onClick={() => moveImage(i, 1)}>↓</button>
                        <button type="button" className="admin-btn-danger" onClick={() => setImages((p) => p.filter((_, j) => j !== i))}>삭제</button>
                      </li>
                    ))}
                    {pendingFiles.map((f, i) => (
                      <li key={f.name + i} className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 px-3 py-2">
                        <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
                          ⬆ {f.name} <em className="ml-1 not-italic text-amber-500">업로드 대기</em>
                        </span>
                        <button type="button" className="admin-btn-danger" onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}>삭제</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <label className="flex flex-col gap-1.5">
                <span className={label}>한 줄 요약 — 상단 피처드 소개글</span>
                <input className="admin-input" type="text" placeholder="한 줄 요약 문구" value={text} onChange={(e) => setText(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>연결 링크 (선택)</span>
                <input className="admin-input" type="text" placeholder="https://example.com" value={link} onChange={(e) => setLink(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>간략보기 내용 — 팝업</span>
                <textarea className="admin-input min-h-[110px] leading-relaxed" placeholder="스토리 팝업에 표시될 간략 내용" value={summary} onChange={(e) => setSummary(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>자세히보기 내용 — 상세 페이지</span>
                <textarea className="admin-input min-h-[200px] leading-relaxed" placeholder="자세히보기 상세 페이지에 표시될 내용" value={detail} onChange={(e) => setDetail(e.target.value)} />
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="accent-brand" checked={isRecommended} onChange={(e) => setIsRecommended(e.target.checked)} />
                스토리 페이지 추천 게시물로 노출
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="accent-brand" checked={isHomeFeatured} onChange={(e) => setIsHomeFeatured(e.target.checked)} />
                메인페이지 스토리로 노출 (최대 {HOME_FEATURED_LIMIT}개 · 현재 {homeFeaturedCount}/{HOME_FEATURED_LIMIT})
              </label>
              <div className="flex gap-2 border-t border-slate-100 pt-4">
                <button type="button" className="admin-btn-primary disabled:opacity-50" disabled={submitting || !configured} onClick={handleSubmit}>
                  {submitting ? "저장 중…" : editId ? "스토리 수정" : "스토리 게시"}
                </button>
                {editId && (
                  <button type="button" className="admin-btn-ghost !px-4" onClick={() => { resetForm(); setView("list"); }}>
                    수정 취소
                  </button>
                )}
              </div>
            </section>
          )}

          {view === "order" && (
            <section className="admin-sec-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">메인페이지 노출 순서</h2>
                <span className="text-xs text-slate-400">메인 노출 {homeFeaturedCount}/{HOME_FEATURED_LIMIT}</span>
              </div>
              {featuredOrdered.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">메인페이지 노출로 선택된 스토리가 없어요. 「스토리 목록」에서 「메인 노출」을 눌러 추가하세요.</p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {featuredOrdered.map((s, i) => (
                    <li key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.img} alt={s.title} className="h-12 w-16 rounded-lg object-cover" />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{s.title}</span>
                      <button type="button" className="admin-btn-ghost" disabled={i === 0} onClick={() => moveFeatured(i, -1)}>↑</button>
                      <button type="button" className="admin-btn-ghost" disabled={i === featuredOrdered.length - 1} onClick={() => moveFeatured(i, 1)}>↓</button>
                      <button type="button" className="admin-btn-danger" onClick={() => toggleHomeFeatured(s)}>해제</button>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
        </div>
      }
    />
  );
}
