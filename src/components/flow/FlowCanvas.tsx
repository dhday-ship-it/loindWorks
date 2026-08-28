"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { ParticleBackground } from "@/components/ParticleBackground";
import type { FlowNodeItem } from "./types";

const COLOR_PALETTE = [
  "#f472b6",
  "#fb923c",
  "#a78bfa",
  "#60a5fa",
  "#4ade80",
  "#f87171",
  "#22d3ee",
  "#facc15",
];

const NODE_WIDTH = 190;
const ROW_HEIGHT = 40;
const ROW_GAP = 10;
const COLUMN_GAP = 90;
const INDENT = 22;
const CATEGORY_Y = 170;
const HUB_Y = 30;
const HUB_WIDTH = 160;

interface LaidOutNode extends FlowNodeItem {
  x: number;
  y: number;
  depth: number;
  effectiveColor: string;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

function nextColor(usedCount: number) {
  return COLOR_PALETTE[usedCount % COLOR_PALETTE.length];
}

function layout(nodes: FlowNodeItem[]) {
  const byParent = new Map<string | null, FlowNodeItem[]>();
  for (const n of nodes) {
    const key = n.parentId;
    const list = byParent.get(key) ?? [];
    list.push(n);
    byParent.set(key, list);
  }
  for (const list of byParent.values()) list.sort((a, b) => a.order - b.order);

  const categories = byParent.get(null) ?? [];
  const laidOut: LaidOutNode[] = [];
  const lines: Line[] = [];

  let columnX = 0;
  const categoryPositions: { x: number; color: string }[] = [];

  categories.forEach((cat, i) => {
    const catColor = cat.color || nextColor(i);
    const colStartX = columnX;
    let cursorY = CATEGORY_Y;
    let maxDepthX = colStartX;

    const visit = (
      node: FlowNodeItem,
      depth: number,
      parentPos: { x: number; y: number } | null
    ) => {
      const x = colStartX + depth * INDENT;
      const y = cursorY;
      maxDepthX = Math.max(maxDepthX, x);
      laidOut.push({ ...node, x, y, depth, effectiveColor: catColor });
      if (parentPos) {
        lines.push({
          x1: parentPos.x + 14,
          y1: parentPos.y + ROW_HEIGHT,
          x2: x + 14,
          y2: y,
          color: catColor,
        });
      }
      cursorY += ROW_HEIGHT + ROW_GAP;
      const children = byParent.get(node.id) ?? [];
      for (const child of children) visit(child, depth + 1, { x, y });
    };

    visit(cat, 0, null);
    categoryPositions.push({ x: colStartX + NODE_WIDTH / 2, color: catColor });
    columnX = maxDepthX + NODE_WIDTH + COLUMN_GAP;
  });

  const totalWidth = Math.max(columnX - COLUMN_GAP, HUB_WIDTH);
  const hubX = totalWidth / 2 - HUB_WIDTH / 2;
  const hubLines: Line[] = categoryPositions.map((c) => ({
    x1: hubX + HUB_WIDTH / 2,
    y1: HUB_Y + ROW_HEIGHT,
    x2: c.x + 14,
    y2: CATEGORY_Y,
    color: c.color,
  }));

  const maxY = laidOut.reduce((m, n) => Math.max(m, n.y), CATEGORY_Y) + ROW_HEIGHT + 80;

  return { laidOut, lines: [...hubLines, ...lines], totalWidth, maxY, hubX };
}

export function FlowCanvas({ initialNodes }: { initialNodes: FlowNodeItem[] }) {
  const [nodes, setNodes] = useState(initialNodes);
  const [scale, setScale] = useState(0.85);
  const [pan, setPan] = useState({ x: 60, y: 40 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(scale);
  const panRef = useRef(pan);
  useEffect(() => {
    scaleRef.current = scale;
    panRef.current = pan;
  }, [scale, pan]);

  const [selected, setSelected] = useState<FlowNodeItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetail, setEditDetail] = useState("");
  const [editColor, setEditColor] = useState(COLOR_PALETTE[0]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(COLOR_PALETTE[0]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildTitle, setNewChildTitle] = useState("");

  const { laidOut, lines, totalWidth, maxY, hubX } = useMemo(
    () => layout(nodes),
    [nodes]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const currentScale = scaleRef.current;
      const currentPan = panRef.current;
      const contentX = (mouseX - currentPan.x) / currentScale;
      const contentY = (mouseY - currentPan.y) / currentScale;
      const delta = -e.deltaY * 0.0012;
      const newScale = Math.min(2, Math.max(0.25, currentScale + delta));
      setPan({
        x: mouseX - contentX * newScale,
        y: mouseY - contentY * newScale,
      });
      setScale(newScale);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onBackgroundMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    dragging.current = true;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const stopDragging = () => {
    dragging.current = false;
  };

  const openDetail = (node: FlowNodeItem) => {
    setSelected(node);
    setEditTitle(node.title);
    setEditDetail(node.detail ?? "");
    setEditColor(node.color || COLOR_PALETTE[0]);
    setShowAddChild(false);
    setNewChildTitle("");
  };

  const saveDetail = async () => {
    if (!selected || !editTitle.trim()) return;
    const patch = {
      title: editTitle.trim(),
      detail: editDetail || null,
      ...(selected.parentId === null ? { color: editColor } : {}),
    };
    const res = await fetch(`/api/flow-nodes/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const { node } = await res.json();
      setNodes((prev) => prev.map((n) => (n.id === node.id ? node : n)));
      setSelected(node);
    }
  };

  const deleteNode = async () => {
    if (!selected) return;
    if (!window.confirm("이 항목과 하위 항목을 모두 삭제할까요?")) return;
    await fetch(`/api/flow-nodes/${selected.id}`, { method: "DELETE" });
    const removeSubtree = (id: string, list: FlowNodeItem[]): FlowNodeItem[] => {
      const childIds = list.filter((n) => n.parentId === id).map((n) => n.id);
      let next = list.filter((n) => n.id !== id);
      for (const childId of childIds) next = removeSubtree(childId, next);
      return next;
    };
    setNodes((prev) => removeSubtree(selected.id, prev));
    setSelected(null);
  };

  const addCategory = async () => {
    if (!newCategoryTitle.trim()) return;
    const res = await fetch("/api/flow-nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newCategoryTitle.trim(), color: newCategoryColor }),
    });
    if (res.ok) {
      const { node } = await res.json();
      setNodes((prev) => [...prev, node]);
      setShowAddCategory(false);
      setNewCategoryTitle("");
    }
  };

  const addChild = async () => {
    if (!selected || !newChildTitle.trim()) return;
    const res = await fetch("/api/flow-nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newChildTitle.trim(), parentId: selected.id }),
    });
    if (res.ok) {
      const { node } = await res.json();
      setNodes((prev) => [...prev, node]);
      setNewChildTitle("");
      setShowAddChild(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#0a0c10] text-white">
      <ParticleBackground />

      <div className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-black/30 px-6 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="cursor-pointer text-xs font-semibold text-white/50 transition-all hover:text-white"
          >
            ← 홈으로
          </Link>
          <span className="h-4 w-px bg-white/10" />
          <h1 className="text-sm font-bold tracking-wide text-white/90">🗺️ 회사 흐름도</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-white/25">
            휠: 확대/축소 · 드래그: 이동 · 클릭: 상세
          </span>
          <button
            onClick={() => {
              const topLevelCount = nodes.filter((n) => n.parentId === null).length;
              setNewCategoryColor(nextColor(topLevelCount));
              setShowAddCategory(true);
            }}
            className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/70 transition-all hover:bg-white/10 hover:text-white"
          >
            + 카테고리 추가
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        onMouseDown={onBackgroundMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        className="relative z-10 flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            width: totalWidth,
            height: maxY,
            position: "relative",
          }}
        >
          <svg
            className="pointer-events-none absolute left-0 top-0 overflow-visible"
            width={totalWidth}
            height={maxY}
          >
            {lines.map((l, i) => (
              <path
                key={i}
                d={`M ${l.x1} ${l.y1} C ${l.x1} ${(l.y1 + l.y2) / 2}, ${l.x2} ${(l.y1 + l.y2) / 2}, ${l.x2} ${l.y2}`}
                fill="none"
                stroke={l.color}
                strokeOpacity={0.4}
                strokeWidth={1.5}
              />
            ))}
          </svg>

          {/* 허브 노드 */}
          <div
            style={{ left: hubX, top: HUB_Y, width: HUB_WIDTH, position: "absolute" }}
            className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-center font-mono text-xs font-bold tracking-widest text-white/90 shadow-lg backdrop-blur-sm"
          >
            LOIND
          </div>

          {laidOut.map((node) => (
            <button
              key={node.id}
              onClick={(e) => {
                e.stopPropagation();
                openDetail(node);
              }}
              style={{
                left: node.x,
                top: node.y,
                width: NODE_WIDTH - node.depth * INDENT,
                position: "absolute",
                borderColor: `${node.effectiveColor}55`,
                background: node.depth === 0 ? `${node.effectiveColor}22` : "rgba(255,255,255,0.04)",
              }}
              className="cursor-pointer truncate rounded-lg border px-3 py-2 text-left text-[11px] font-semibold text-white/90 shadow-md transition-all hover:brightness-125"
              title={node.title}
            >
              {node.depth === 0 && <span className="mr-1">●</span>}
              {node.title}
            </button>
          ))}
        </div>
      </div>

      {/* 카테고리 추가 모달 */}
      {showAddCategory && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddCategory(false); }}
        >
          <div className="glass-card w-full max-w-sm rounded-2xl p-5 shadow-2xl">
            <h3 className="mb-3 text-sm font-bold text-white">새 카테고리</h3>
            <input
              value={newCategoryTitle}
              onChange={(e) => setNewCategoryTitle(e.target.value)}
              autoFocus
              className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none placeholder:text-white/20"
              placeholder="카테고리 이름 (예: SNS)"
            />
            <div className="mb-4 flex flex-wrap gap-1.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewCategoryColor(c)}
                  style={{ background: c }}
                  className={`h-6 w-6 cursor-pointer rounded-full transition-all ${
                    newCategoryColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#0e1116]" : ""
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setShowAddCategory(false)}
                className="cursor-pointer rounded-lg bg-white/5 px-3 py-1.5 text-white/40"
              >
                취소
              </button>
              <button
                onClick={addCategory}
                className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-slate-900"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 패널 */}
      {selected && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-end bg-black/40 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="glass-card animate-slide-down flex h-full max-h-[calc(100vh-2rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/30">
                노드 상세
              </span>
              <button
                onClick={() => setSelected(null)}
                className="cursor-pointer text-white/30 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div>
                <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                  제목
                </label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white outline-none"
                />
              </div>

              {selected.parentId === null && (
                <div>
                  <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                    색상
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        style={{ background: c }}
                        className={`h-6 w-6 cursor-pointer rounded-full transition-all ${
                          editColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#0e1116]" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                  설명
                </label>
                <textarea
                  value={editDetail}
                  onChange={(e) => setEditDetail(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-relaxed text-white outline-none placeholder:text-white/20"
                  placeholder="세부 내용 (선택)"
                />
              </div>

              <div className="border-t border-white/5 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                    하위 항목
                  </span>
                  <button
                    onClick={() => setShowAddChild((v) => !v)}
                    className="cursor-pointer text-[10px] font-bold text-brand-light hover:text-white"
                  >
                    + 추가
                  </button>
                </div>
                {showAddChild && (
                  <div className="mb-2 flex gap-1.5">
                    <input
                      value={newChildTitle}
                      onChange={(e) => setNewChildTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addChild(); }}
                      autoFocus
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-white/20"
                      placeholder="하위 항목 이름"
                    />
                    <button
                      onClick={addChild}
                      className="cursor-pointer rounded-lg bg-white px-2.5 text-xs font-bold text-slate-900"
                    >
                      추가
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {nodes
                    .filter((n) => n.parentId === selected.id)
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => openDetail(c)}
                        className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/60 hover:text-white"
                      >
                        {c.title}
                      </button>
                    ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between gap-2 border-t border-white/10 px-5 py-3 text-xs font-bold">
              <button
                onClick={deleteNode}
                className="cursor-pointer rounded-lg bg-red-500/10 px-3 py-1.5 text-red-400 hover:bg-red-500/20"
              >
                삭제
              </button>
              <button
                onClick={saveDetail}
                className="cursor-pointer rounded-lg bg-white px-4 py-1.5 text-slate-900"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
