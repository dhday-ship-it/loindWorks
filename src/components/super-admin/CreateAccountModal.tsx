"use client";

import { useState } from "react";

import { Modal } from "./Modal";
import type { AdminUserItem, CompanyItem } from "./types";

export function CreateAccountModal({
  companies,
  projects,
  onClose,
  onCreated,
}: {
  companies: CompanyItem[];
  projects: { id: string; name: string }[];
  onClose: () => void;
  onCreated: (user: AdminUserItem) => void;
}) {
  const [role, setRole] = useState<"" | "STAFF" | "CLIENT">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleProject = (id: string) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    setError(null);
    if (!role || !name.trim() || !email.trim() || !password) {
      setError("모든 필드를 입력해주세요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        companyId: role === "CLIENT" ? companyId || undefined : undefined,
        projectIds: role === "CLIENT" ? [...selectedProjects] : undefined,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "계정 생성에 실패했습니다.");
      return;
    }

    const { user } = await res.json();
    onCreated(user);
  };

  return (
    <Modal
      title="새 계정 생성"
      subtitle="생성된 계정은 바로 로그인에 사용할 수 있습니다."
      onClose={onClose}
    >
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
            역할 (Role)
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "STAFF" | "CLIENT")}
            className="admin-input cursor-pointer"
          >
            <option value="" className="bg-[#0c0e12]">
              선택...
            </option>
            <option value="STAFF" className="bg-[#0c0e12]">
              Staff (내부 직원)
            </option>
            <option value="CLIENT" className="bg-[#0c0e12]">
              Client (고객사 담당자)
            </option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
              이름
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="admin-input"
              placeholder="홍길동"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
              이메일
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-input"
              placeholder="you@loind.com"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
            임시 비밀번호
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="admin-input"
            placeholder="8자 이상"
          />
        </div>

        {role === "CLIENT" && (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
                소속 고객사
              </span>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="admin-input cursor-pointer"
              >
                <option value="" className="bg-[#0c0e12]">
                  고객사 선택...
                </option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0c0e12]">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/38">
                프로젝트 배정
              </span>
              <div className="flex min-h-[38px] flex-wrap gap-1.5 rounded-[10px] border border-white/10 bg-black/30 p-2">
                {projects.length === 0 && (
                  <span className="px-1 py-1 text-[11px] text-white/20">
                    생성된 프로젝트가 없습니다.
                  </span>
                )}
                {projects.map((p) => {
                  const isSel = selectedProjects.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProject(p.id)}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-[3px] font-mono text-[10px] ${
                        isSel
                          ? "border-blue-400/40 bg-blue-400/15 text-blue-300"
                          : "border-white/10 bg-white/5 text-white/40 hover:text-white"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="mt-1.5 flex justify-end gap-2 border-t border-white/8 pt-4">
          <button onClick={onClose} className="admin-btn-ghost">
            취소
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="admin-btn-primary disabled:opacity-50"
          >
            {submitting ? "생성 중..." : "계정 생성"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
