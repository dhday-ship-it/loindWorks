"use client";

import { useCallback, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { Role } from "@/generated/prisma/enums";
import { AppShell } from "@/components/layout/AppShell";
import type { StoryRecord } from "@/lib/loind-stories";
import styles from "./StoriesView.module.css";

// 예전 loind.com/admin(스토리 어드민)을 그대로 옮긴 화면 — 데이터는 loind.com Supabase 의 stories
const CATEGORY_OPTIONS = ["Artisan", "LODN", "Rise"];
const CATEGORY_LABELS: Record<string, string> = {
  Artisan: "제작 스튜디오 : 아티즌",
  LODN: "브랜드 콘텐츠 : 로든",
  Rise: "크리스천 비즈니스 : 라이즈",
};
const displayCategory = (c: string) => CATEGORY_LABELS[c] ?? c;

const HOME_FEATURED_LIMIT = 3;
const PAGE_SIZE = 6;

type View = "list" | "new" | "order";
const VIEW_META: Record<View, { title: string; sub: string }> = {
  list: { title: "Stories.", sub: "등록된 스토리 관리" },
  new: { title: "New Story.", sub: "새 스토리 작성" },
  order: { title: "Home Order.", sub: "메인페이지 노출 순서" },
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
    if (!confirm("Remove this story?")) return;
    try {
      await api(`/api/stories/${id}`, { method: "DELETE" });
      await fetchStories();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const navCls = (v: View) => (view === v ? styles.active : "");
  const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

  return (
    <AppShell
      currentUser={currentUser}
      main={
        <div className={styles.page}>
          <main className={styles.main}>
            {!configured && (
              <p className={styles.notice}>
                loind.com Supabase 서버 키가 설정되지 않았어요. 환경변수 LOIND_WEB_SUPABASE_SERVICE_ROLE_KEY 를 넣어 주세요.
              </p>
            )}
            {configured && loadError && <p className={cx(styles.notice, styles.error)}>스토리를 불러오지 못했어요. {loadError}</p>}

            <section className={styles.hero}>
              <h1>{view === "new" && editId ? "Edit Story." : VIEW_META[view].title}</h1>
              <p>{VIEW_META[view].sub}</p>
            </section>
            <nav className={styles.tabs}>
              <button type="button" className={navCls("list")} onClick={() => go("list")}>스토리 목록</button>
              <button type="button" className={navCls("new")} onClick={() => go("new")}>{editId ? "스토리 수정" : "새 스토리 작성"}</button>
              <button type="button" className={navCls("order")} onClick={() => go("order")}>메인 노출 순서</button>
              <span className={styles["tabs-spacer"]} />
              <a className={styles["site-link"]} href="https://loind.com/story" target="_blank" rel="noopener noreferrer">사이트 스토리 보기 ↗</a>
            </nav>

            {view === "new" && (
              <section className={cx(styles["editor-container"], styles["form-wrap"])}>
                <div className={styles["input-block"]}>
                  <label>Classification</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{displayCategory(opt)}</option>
                    ))}
                  </select>
                </div>
                <div className={styles["input-block"]}>
                  <label>Story Title</label>
                  <input type="text" placeholder="제목을 입력하세요" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className={styles["asset-group"]}>
                  <label className={styles["asset-label"]}>
                    VISUAL ASSET — 여러 장 등록 시 상세 팝업에서 슬라이드로 노출 됩니다 (첫 번째가 대표 이미지)
                  </label>
                  <div className={styles["asset-box"]} onClick={() => fileInputRef.current?.click()}>
                    <p>{pendingFiles.length > 0 ? `READY: ${pendingFiles.length}개 파일 업로드 대기` : "SELECT LOCAL IMAGE(S)"}</p>
                    <input type="file" accept="image/*" multiple className={styles["file-input"]} ref={fileInputRef} onChange={handleFileChange} />
                  </div>
                  <div className={styles["input-block"]}>
                    <div className={styles["image-url-row"]}>
                      <input
                        type="text"
                        placeholder="또는 이미지 URL 주소를 입력 후 추가"
                        value={imgUrl}
                        onChange={(e) => setImgUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl(); } }}
                      />
                      <button type="button" className={styles["image-add-btn"]} onClick={addImageUrl}>추가</button>
                    </div>
                  </div>
                  {(images.length > 0 || pendingFiles.length > 0) && (
                    <ul className={styles["image-list"]}>
                      {images.map((src, i) => (
                        <li key={src + i}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" />
                          <span className={styles["image-list-name"]}>
                            {i === 0 && <strong className={styles["image-cover-tag"]}>대표</strong>}
                            {src.split("/").pop()}
                          </span>
                          <div className={styles["image-list-actions"]}>
                            <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0}>↑</button>
                            <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1}>↓</button>
                            <button type="button" className={styles["del-btn"]} onClick={() => setImages((p) => p.filter((_, j) => j !== i))}>삭제</button>
                          </div>
                        </li>
                      ))}
                      {pendingFiles.map((f, i) => (
                        <li key={f.name + i}>
                          <span className={styles["image-list-name"]}>
                            ⬆ {f.name} <em className={styles["image-pending-tag"]}>업로드 대기</em>
                          </span>
                          <div className={styles["image-list-actions"]}>
                            <button type="button" className={styles["del-btn"]} onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}>삭제</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className={styles["input-block"]}>
                  <label>Short Summary</label>
                  <input type="text" placeholder="한 줄 요약 문구 (상단 피처드 소개글)" value={text} onChange={(e) => setText(e.target.value)} />
                </div>
                <div className={styles["input-block"]}>
                  <label>Link URL — 연결 링크 (선택)</label>
                  <input type="text" placeholder="https://example.com" value={link} onChange={(e) => setLink(e.target.value)} />
                </div>
                <div className={styles["input-block"]}>
                  <label>Brief View — 간략보기 내용 (팝업)</label>
                  <textarea placeholder="스토리 팝업에 표시될 간략 내용을 입력하세요..." value={summary} onChange={(e) => setSummary(e.target.value)} />
                </div>
                <div className={styles["input-block"]}>
                  <label>Detailed Narrative — 자세히보기 내용 (상세 페이지)</label>
                  <textarea placeholder="자세히보기 상세 페이지에 표시될 내용을 입력하세요..." value={detail} onChange={(e) => setDetail(e.target.value)} />
                </div>
                <label className={styles["recommend-toggle"]}>
                  <input type="checkbox" checked={isRecommended} onChange={(e) => setIsRecommended(e.target.checked)} />
                  스토리 페이지 추천 게시물로 노출
                </label>
                <label className={styles["recommend-toggle"]}>
                  <input type="checkbox" checked={isHomeFeatured} onChange={(e) => setIsHomeFeatured(e.target.checked)} />
                  메인페이지 스토리로 노출 (최대 {HOME_FEATURED_LIMIT}개 · 현재 {homeFeaturedCount}/{HOME_FEATURED_LIMIT})
                </label>
                <div>
                  <button className={styles["btn-primary"]} onClick={handleSubmit} disabled={submitting || !configured}>
                    {submitting ? "PUBLISHING..." : editId ? "UPDATE STORY" : "PUBLISH STORY"}
                  </button>
                  {editId && (
                    <button className={styles["cancel-edit"]} onClick={() => { resetForm(); setView("list"); }}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </section>
            )}

            {view === "order" && (
              <section>
                <div className={styles["archive-header"]}>
                  <span className={styles["archive-count"]}>메인페이지 노출 {homeFeaturedCount}/{HOME_FEATURED_LIMIT} · ↑↓로 순서를 바꿔요</span>
                </div>
                {featuredOrdered.length === 0 ? (
                  <p className={styles["loading-text"]}>메인페이지 노출로 선택된 스토리가 없습니다. &apos;스토리 목록&apos;에서 &apos;메인 노출&apos;을 눌러 추가하세요.</p>
                ) : (
                  <ol className={styles["home-order-list"]}>
                    {featuredOrdered.map((story, i) => (
                      <li key={story.id}>
                        <span className={styles["home-order-num"]}>{i + 1}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={story.img} alt={story.title} />
                        <span className={styles["home-order-title"]}>{story.title}</span>
                        <div className={styles["image-list-actions"]}>
                          <button type="button" onClick={() => moveFeatured(i, -1)} disabled={i === 0}>↑</button>
                          <button type="button" onClick={() => moveFeatured(i, 1)} disabled={i === featuredOrdered.length - 1}>↓</button>
                          <button type="button" className={styles["del-btn"]} onClick={() => toggleHomeFeatured(story)}>해제</button>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            )}

            {view === "list" && (
              <section>
                <div className={styles["archive-header"]}>
                <div className={styles["archive-filter"]}>
                  {["ALL", ...CATEGORY_OPTIONS].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={cx(styles["archive-filter-btn"], filter === cat && styles.active)}
                      onClick={() => { setFilter(cat); setPage(1); }}
                    >
                      {displayCategory(cat)}
                    </button>
                  ))}
                </div>
                <span className={styles["archive-count"]}>총 {filtered.length}건 · 메인 노출 {homeFeaturedCount}/{HOME_FEATURED_LIMIT}</span>
                </div>
                <div>
                  {paged.length === 0 ? (
                    <p className={styles["loading-text"]}>해당 분류의 스토리가 없습니다.</p>
                  ) : (
                    paged.map((story) => (
                      <div className={styles["archive-item"]} key={story.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={story.img} alt={story.title} />
                        <div className={styles["archive-item-info"]}>
                          <h4>
                            {story.is_recommended && <span title="추천 게시물">★ </span>}
                            {story.is_home_featured && <span title="메인페이지 노출">🏠 </span>}
                            {story.title}
                          </h4>
                          <p>{displayCategory(story.category)}</p>
                        </div>
                        <div className={styles["archive-actions"]}>
                          <button onClick={() => toggleHomeFeatured(story)}>{story.is_home_featured ? "메인 해제" : "메인 노출"}</button>
                          <button onClick={() => handleEdit(story)}>EDIT</button>
                          <button className={styles["del-btn"]} onClick={() => handleDelete(story.id)}>REMOVE</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {totalPages > 1 && (
                  <nav className={styles["archive-pagination"]}>
                    <button type="button" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button key={i} type="button" className={safePage === i + 1 ? styles.active : ""} onClick={() => setPage(i + 1)}>
                        {i + 1}
                      </button>
                    ))}
                    <button type="button" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
                  </nav>
                )}
              </section>
            )}
          </main>
        </div>
      }
    />
  );
}
