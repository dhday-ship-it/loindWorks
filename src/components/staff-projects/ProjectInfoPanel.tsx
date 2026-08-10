import type { ProjectDetail } from "./types";

export function ProjectInfoPanel({ project }: { project: ProjectDetail }) {
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
          <span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
            특이사항
          </span>
          <p className="text-[11px] leading-relaxed text-white/40">
            {project.notes ??
              "아직 확정된 내용이 없습니다. 클라이언트 브랜드 가이드라인, 금기어, 레퍼런스 등이 추가될 예정입니다."}
          </p>
        </div>
      </div>
    </div>
  );
}
