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

const NODE_WIDTH = 220;
const ROW_HEIGHT = 46;
const ROW_GAP = 16;
const COLUMN_GAP = 110;
const INDENT = 32;
const CATEGORY_Y = 190;
const HUB_Y = 40;
const HUB_WIDTH = 170;
const GUIDE_OFFSET = 16;
const TRUNK_COLOR = "#8b93a1";

interface LaidOutNode extends FlowNodeItem {
  x: number;
  y: number;
  depth: number;
  effectiveColor: string;
}

interface Line {
  path: string;
  color: string;
}

function nextColor(usedCount: number) {
  return COLOR_PALETTE[usedCount % COLOR_PALETTE.length];
}

// 부모 아래로 자식들을 하나의 세로 스파인 + 개별 가로 가지로 연결 (겹침 없는 트리 커넥터)
function spineAndTicks(
  guideX: number,
  spineTopY: number,
  children: { x: number; y: number; color: string }[],
  lines: Line[],
  spineColor: string
) {
  if (children.length === 0) return;
  const lastCenterY = children[children.length - 1].y + ROW_HEIGHT / 2;
  lines.push({ path: `M ${guideX} ${spineTopY} V ${lastCenterY}`, color: spineColor });
  for (const child of children) {
    const cy = child.y + ROW_HEIGHT / 2;
    lines.push({ path: `M ${guideX} ${cy} H ${child.x}`, color: child.color });
  }
}

// 허브 → 카테고리들: 세로 줄기 하나 + 가로 레일 하나 + 카테고리별 세로 가지 (겹침 없는 부채꼴)
function fanOutHorizontal(
  trunkX: number,
  trunkTopY: number,
  railY: number,
  children: { x: number; y: number; color: string }[],
  lines: Line[],
  trunkColor: string
) {
  if (children.length === 0) return;
  lines.push({ path: `M ${trunkX} ${trunkTopY} V ${railY}`, color: trunkColor });
  const xs = [trunkX, ...children.map((c) => c.x)];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  if (minX !== maxX) {
    lines.push({ path: `M ${minX} ${railY} H ${maxX}`, color: trunkColor });
  }
  for (const child of children) {
    lines.push({ path: `M ${child.x} ${railY} V ${child.y}`, color: child.color });
  }
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
  const categoryPositions: { x: number; y: number; color: string }[] = [];

  categories.forEach((cat, i) => {
    const catColor = cat.color || nextColor(i);
    const colStartX = columnX;
    let cursorY = CATEGORY_Y;
    let maxDepthX = colStartX;

    const visit = (
      node: FlowNodeItem,
      depth: number,
      parentColor: string
    ): { x: number; y: number; effectiveColor: string } => {
      const x = colStartX + depth * INDENT;
      const y = cursorY;
      const effectiveColor = node.color || parentColor;
      maxDepthX = Math.max(maxDepthX, x);
      laidOut.push({ ...node, x, y, depth, effectiveColor });
      cursorY += ROW_HEIGHT + ROW_GAP;

      const children = byParent.get(node.id) ?? [];
      const childPositions = children.map((child) => ({
        ...visit(child, depth + 1, effectiveColor),
      }));
      spineAndTicks(
        x + GUIDE_OFFSET,
        y + ROW_HEIGHT,
        childPositions.map((c) => ({ x: c.x, y: c.y, color: c.effectiveColor })),
        lines,
        effectiveColor
      );

      return { x, y, effectiveColor };
    };

    const catPos = visit(cat, 0, catColor);
    categoryPositions.push({ x: catPos.x, y: catPos.y, color: catColor });
    columnX = maxDepthX + NODE_WIDTH + COLUMN_GAP;
  });

  const totalWidth = Math.max(columnX - COLUMN_GAP, HUB_WIDTH) + 40;
  const hubX = totalWidth / 2 - HUB_WIDTH / 2;
  const railY = HUB_Y + ROW_HEIGHT + (CATEGORY_Y - (HUB_Y + ROW_HEIGHT)) / 2;
  const hubLines: Line[] = [];
  fanOutHorizontal(
    hubX + HUB_WIDTH / 2,
    HUB_Y + ROW_HEIGHT,
    railY,
    categoryPositions.map((c) => ({ x: c.x + GUIDE_OFFSET, y: CATEGORY_Y, color: c.color })),
    hubLines,
    TRUNK_COLOR
  );

  const maxY = laidOut.reduce((m, n) => Math.max(m, n.y), CATEGORY_Y) + ROW_HEIGHT + 80;

  return { laidOut, lines: [...hubLines, ...lines], totalWidth, maxY, hubX };
}

export function FlowCanvas({ initialNodes }: { initialNodes: FlowNodeItem[] }) {
  const [nodes, setNodes] = useState(initialNodes);
  const [scale, setScale] = useState(0.9);
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
  const [editColor, setEditColor] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(COLOR_PALETTE[0]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildTitle, setNewChildTitle] = useState("");

  const { laidOut, lines, totalWidth, maxY, hubX } = useMemo(
    () => layout(nodes),
    [nodes]
  );

  const selectedLaidOut = selected ? laidOut.find((n) => n.id === selected.id) : undefined;

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
    setEditColor(node.color);
    setShowAddChild(false);
    setNewChildTitle("");
  };

  const saveDetail = async () => {
    if (!selected || !editTitle.trim()) return;
    const patch = {
      title: editTitle.trim(),
      detail: editDetail || null,
      color: selected.parentId === null ? (editColor || COLOR_PALETTE[0]) : editColor,
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
                d={l.path}
                fill="none"
                stroke={l.color}
                strokeOpacity={0.55}
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

          {laidOut.map((node) =>
            node.depth === 0 ? (
              <button
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  openDetail(node);
                }}
                style={{
                  left: node.x,
                  top: node.y,
                  width: NODE_WIDTH,
                  position: "absolute",
                  borderColor: `${node.effectiveColor}90`,
                  background: `${node.effectiveColor}22`,
                }}
                className="cursor-pointer truncate rounded-xl border-[1.5px] px-4 py-3 text-left text-[14px] font-bold text-white shadow-md transition-all hover:brightness-110"
                title={node.title}
              >
                <span
                  className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle"
                  style={{ background: node.effectiveColor }}
                />
                {node.title}
              </button>
            ) : (
              <button
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  openDetail(node);
                }}
                style={{
                  left: node.x,
                  top: node.y,
                  width: NODE_WIDTH,
                  position: "absolute",
                  borderLeftColor: node.effectiveColor,
                }}
                className="cursor-pointer truncate rounded-lg border border-l-[3px] border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-left text-[13px] font-medium text-white/85 shadow-sm transition-all hover:bg-white/[0.08] hover:text-white"
                title={node.title}
              >
                {node.title}
              </button>
            )
          )}
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

              <div>
                <label className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                  색상
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selected.parentId !== null && (
                    <button
                      onClick={() => setEditColor(null)}
                      style={{ background: selectedLaidOut?.effectiveColor }}
                      title="상위 카테고리 색상 자동 적용"
                      className={`relative h-6 w-6 cursor-pointer rounded-full border-2 border-dashed border-white/60 transition-all ${
                        editColor === null ? "ring-2 ring-white ring-offset-2 ring-offset-[#0e1116]" : ""
                      }`}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow">
                        A
                      </span>
                    </button>
                  )}
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
                {selected.parentId !== null && (
                  <p className="mt-1.5 font-mono text-[9px] text-white/25">
                    A = 상위 카테고리 색상을 자동으로 따라감
                  </p>
                )}
              </div>

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
