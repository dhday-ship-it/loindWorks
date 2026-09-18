"use client";

import { useState } from "react";

import { Modal } from "./Modal";
import type { AdminUserItem } from "./types";

export function CreateAccountModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (user: AdminUserItem) => void;
}) {
  const [role, setRole] = useState<"" | "PM" | "STAFF">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      body: JSON.stringify({ name, email, password, role }),
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
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            역할 (Role)
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "PM" | "STAFF")}
            className="admin-input cursor-pointer"
          >
            <option value="">선택...</option>
            <option value="PM">PM (Works 생성·관리)</option>
            <option value="STAFF">Creator (배정된 Works만 접근)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
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
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
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
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            임시 비밀번호
          </span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="admin-input"
            placeholder="8자 이상"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="mt-1.5 flex justify-end gap-2 border-t border-slate-100 pt-4">
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
