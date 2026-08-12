"use client";

import { useState } from "react";

import { fmtFileSize, uploadFile } from "@/lib/file-format";
import type { ProjectDetail } from "./types";

export function ProjectInfoPanel({
  project,
  onUpdate,
}: {
  project: ProjectDetail;
  onUpdate: (patch: Partial<ProjectDetail>) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const uploaded = await uploadFile(file, project.id);
        const res = await fetch(`/api/projects/${project.id}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(uploaded),
        });
        if (res.ok) {
          const { file: created } = await res.json();
          onUpdate({ files: [created, ...project.files] });
        }
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    onUpdate({ files: project.files.filter((f) => f.id !== fileId) });
    await fetch(`/api/projects/${project.id}/files/${fileId}`, { method: "DELETE" });
  };

  return (
    <div className="glass-panel flex flex-col gap-4 rounded-2xl border border-white/10 p-6 shadow-2xl">
      <div className="border-b border-white/10 pb-2">
        <span className="block font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
          Project Info
        </span>
        <h4 className="text-sm font-bold text-white">
          {project.company?.name ?? "클라이언트 미지정"}
        </h4>
      </div>
      <div className="flex flex-col gap-3.5 text-xs">
        <div>
          <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/40">
            담당 PM
          </span>
          <div className="font-medium text-white/80">
            {project.pm?.name ?? project.pm?.email ?? "-"}
          </div>
        </div>
        <div>
          <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/40">
            고객사 담당자
          </span>
          <div className="font-medium text-white/80">
            {project.company?.contactName ?? "-"}
          </div>
        </div>
        <div>
          <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/40">
            이메일
          </span>
          <div className="truncate rounded-lg border border-white/5 bg-black/30 px-3 py-1.5 select-all font-mono text-white/50">
            {project.company?.contactEmail ?? "-"}
          </div>
        </div>
        <div>
          <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wider text-white/40">
            연락처
          </span>
          <div className="truncate rounded-lg border border-white/5 bg-black/30 px-3 py-1.5 select-all font-mono text-white/50">
            {project.company?.contactPhone ?? "-"}
          </div>
        </div>
        {project.brandColors.length > 0 && (
          <div>
            <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-white/40">
              브랜드 컬러
            </span>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {project.brandColors.map((c) => (
                  <div
                    key={c}
                    className="h-5 w-5 cursor-pointer rounded border border-white/10 shadow"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="font-mono text-[9px] text-white/30">
                {project.brandColors.join(" · ")}
              </div>
            </div>
          </div>
        )}
        {project.keywords.length > 0 && (
          <div>
            <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-white/40">
              키워드
            </span>
            <div className="flex flex-wrap gap-1">
              {project.keywords.map((k) => (
                <span
                  key={k}
                  className="rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/50"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="border-t border-white/5 pt-3">
          <span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-wider text-brand-light">
            특이사항
          </span>
          <p className="text-[11px] leading-relaxed text-white/40">
            {project.notes ??
              "아직 확정된 내용이 없습니다. 클라이언트 브랜드 가이드라인, 금기어, 레퍼런스 등이 추가될 예정입니다."}
          </p>
        </div>
        <div className="border-t border-white/5 pt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">
              결과물 · 파일 (클라이언트 공개)
            </span>
            <label className="cursor-pointer rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] font-medium text-white/45 transition-all hover:text-white">
              {uploading ? "업로드 중..." : "+ 업로드"}
              <input
                type="file"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  handleFileSelect(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {project.files.length === 0 ? (
            <p className="font-mono text-[10px] text-white/25">등록된 파일이 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {project.files.map((f) => (
                <div
                  key={f.id}
                  className="group flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-2.5 py-1.5"
                >
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-[11px] text-white/65 hover:text-white"
                  >
                    📎 {f.name}
                  </a>
                  <span className="shrink-0 font-mono text-[9px] text-white/25">
                    {fmtFileSize(f.size)}
                  </span>
                  <button
                    onClick={() => deleteFile(f.id)}
                    className="shrink-0 cursor-pointer text-[10px] text-white/20 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
