"use client";

import { useEffect, useRef, useState } from "react";

interface LoginImageItem {
  id: string;
  imageUrl: string;
}

export function LoginImagePage({
  showToast,
}: {
  showToast: (msg: string) => void;
}) {
  const [image, setImage] = useState<LoginImageItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/login-image")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setLoading(false);
        if (data) setImage(data.image);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("scope", "banner");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      setUploading(false);
      showToast("이미지 업로드에 실패했습니다.");
      return;
    }
    const data = await res.json();

    setSaving(true);
    const putRes = await fetch("/api/admin/login-image", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: data.url }),
    });
    setUploading(false);
    setSaving(false);
    if (putRes.ok) {
      const { image: saved } = await putRes.json();
      setImage(saved);
      showToast("로그인 화면 이미지가 변경되었습니다.");
    } else {
      showToast("저장에 실패했습니다.");
    }
  };

  const reset = async () => {
    if (!window.confirm("기본 디자인으로 되돌릴까요?")) return;
    setSaving(true);
    const res = await fetch("/api/admin/login-image", { method: "DELETE" });
    setSaving(false);
    if (res.ok) {
      setImage(null);
      showToast("기본 디자인으로 되돌렸습니다.");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="mb-1 text-[22px] font-bold text-slate-800">로그인 화면</div>
        <div className="text-xs text-slate-500">
          로그인 페이지 우측에 노출되는 이미지를 관리합니다. 설정하지 않으면 기본 디자인이 표시됩니다.
        </div>
      </div>

      <div className="admin-sec-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[13px] font-bold text-slate-800">우측 이미지</div>
          <span className="font-mono text-[10px] text-slate-400">
            권장 사이즈 1200 × 1500px (세로형, 4:5 비율) · 최대 25MB
          </span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-slate-400">불러오는 중...</div>
        ) : (
          <div className="flex gap-5">
            <div className="flex h-[300px] w-[240px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image.imageUrl} alt="로그인 화면 이미지" className="h-full w-full object-cover" />
              ) : (
                <span className="px-4 text-center text-xs text-slate-300">
                  설정된 이미지가 없습니다.
                  <br />
                  기본 디자인이 노출됩니다.
                </span>
              )}
            </div>

            <div className="flex flex-col justify-center gap-2.5">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file);
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || saving}
                className="admin-btn-primary w-fit disabled:opacity-50"
              >
                {uploading ? "업로드 중..." : saving ? "저장 중..." : image ? "이미지 변경" : "이미지 업로드"}
              </button>
              {image && (
                <button
                  onClick={reset}
                  disabled={uploading || saving}
                  className="admin-btn-ghost w-fit disabled:opacity-50"
                >
                  기본 디자인으로 되돌리기
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
