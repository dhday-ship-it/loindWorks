"use client";

import {
  PROJECT_CATEGORIES,
  type ProjectInquiry,
} from "@/lib/contact-categories";

function formatCurrency(raw: string) {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? Number(digits).toLocaleString("ko-KR") : "";
}

export function ContactProjectBlock({
  index,
  project,
  onChange,
  onRemove,
}: {
  index: number;
  project: ProjectInquiry;
  onChange: (next: ProjectInquiry) => void;
  onRemove?: () => void;
}) {
  const update = (patch: Partial<ProjectInquiry>) =>
    onChange({ ...project, ...patch });

  return (
    <div
      className={`project-block flex flex-col gap-4 ${
        index > 0 ? "mt-4 border-t border-dashed border-white/10 pt-5" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
        <span>2. 프로젝트 정보 #{index + 1}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="cursor-pointer font-mono text-[10px] text-white/30 transition-all hover:text-red-400"
          >
            삭제 ✕
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="ml-1 text-[11px] font-medium text-white/50">
          2-1. 매칭 타겟 작업 분야를 선택해주세요
        </span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PROJECT_CATEGORIES.map((cat, i) => (
            <label key={cat.title} className={i === 6 ? "sm:col-span-2" : ""}>
              <input
                type="radio"
                name={`agency_${index}`}
                className="peer sr-only"
                checked={project.category === cat.title}
                onChange={() => update({ category: cat.title })}
              />
              <div className="flex cursor-pointer flex-col gap-1 rounded-xl border border-white/5 bg-black/30 p-3.5 transition-all hover:bg-white/5 peer-checked:border-emerald-400/60 peer-checked:bg-emerald-400/5">
                <div className="text-xs font-bold text-white/80">
                  {cat.title}
                </div>
                <div className="text-[10px] leading-normal text-white/30">
                  {cat.subtitle}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {project.category && (
        <div className="animate-fade-up flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="ml-1 text-[10px] tracking-widest text-white/40 font-mono uppercase">
              2-2. 프로젝트 목적
            </span>
            <div className="glass-input rounded-xl px-4 py-3">
              <textarea
                value={project.purpose}
                onChange={(e) => update({ purpose: e.target.value })}
                className="min-h-[56px] w-full resize-none border-none bg-transparent text-xs leading-relaxed text-white outline-none placeholder:text-white/15"
                placeholder="이번 프로젝트를 통해 달성하고자 하는 가장 핵심적인 목표는 무엇인가요?"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="ml-1 text-[10px] tracking-widest text-white/40 font-mono uppercase">
              2-3. 현재의 고민
            </span>
            <div className="glass-input rounded-xl px-4 py-3">
              <textarea
                value={project.painPoint}
                onChange={(e) => update({ painPoint: e.target.value })}
                className="min-h-[56px] w-full resize-none border-none bg-transparent text-xs leading-relaxed text-white outline-none placeholder:text-white/15"
                placeholder="현재 비즈니스나 브랜드가 직면한 가장 큰 문제점이나 아쉬운 부분은 무엇인가요?"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="ml-1 text-[10px] tracking-widest text-white/40 font-mono uppercase">
              2-4. 핵심 타겟 고객
            </span>
            <div className="glass-input rounded-xl px-4 py-3">
              <input
                type="text"
                value={project.targetAudience}
                onChange={(e) => update({ targetAudience: e.target.value })}
                className="w-full border-none bg-transparent text-xs text-white outline-none placeholder:text-white/15"
                placeholder="반응을 이끌어내고 싶은 주 타겟층 대상은 누구인가요?"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="ml-1 text-[10px] tracking-widest text-white/40 font-mono uppercase">
              2-5. 성공의 기준
            </span>
            <div className="glass-input rounded-xl px-4 py-3">
              <textarea
                value={project.successCriteria}
                onChange={(e) => update({ successCriteria: e.target.value })}
                className="min-h-[56px] w-full resize-none border-none bg-transparent text-xs leading-relaxed text-white outline-none placeholder:text-white/15"
                placeholder="이 프로젝트가 '성공했다'고 평가할 수 있는 구체적인 그림이나 기준이 있다면 무엇인가요?"
              />
            </div>
          </div>

          <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="ml-1 text-[10px] tracking-widest text-white/40 font-mono uppercase">
                2-6. 희망 런칭일
              </span>
              <div className="glass-input rounded-xl px-4 py-3">
                <input
                  type="date"
                  value={project.launchDate}
                  onChange={(e) => update({ launchDate: e.target.value })}
                  style={{ colorScheme: "dark" }}
                  className="w-full border-none bg-transparent text-xs text-white outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="ml-1 text-[10px] tracking-widest text-white/40 font-mono uppercase">
                예산 범위
              </span>
              <div className="glass-input flex items-center gap-1.5 rounded-xl px-4 py-3">
                <span className="select-none font-mono text-xs text-white/30">
                  ₩
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={project.budget}
                  onChange={(e) =>
                    update({ budget: formatCurrency(e.target.value) })
                  }
                  className="w-full border-none bg-transparent font-mono text-xs text-white outline-none placeholder:text-white/15"
                  placeholder="대략적인 예산 (숫자만 입력)"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
