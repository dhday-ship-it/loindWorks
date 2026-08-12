"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import { colorForId, initials, type Person } from "./types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface KanbanTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;
  dueDate: string | null;
  assignee: Person;
  createdBy: Person;
}

interface Props {
  tasks: KanbanTask[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onReorder: (taskId: string, newOrder: number, newStatus: TaskStatus) => void;
  onTaskClick?: (task: KanbanTask) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "WAIT", label: "대기", color: "border-t-white/20" },
  { status: "IN_PROGRESS", label: "진행 중", color: "border-t-[#55689b]" },
  { status: "REVIEW", label: "검토", color: "border-t-[#8fa8c4]" },
  { status: "FEEDBACK", label: "피드백", color: "border-t-[#e8956d]" },
  { status: "DONE", label: "완료", color: "border-t-[#5ba08a]" },
];

const PRIORITY_DOT: Record<TaskPriority, string> = {
  HIGH: "bg-[#c9595a]",
  NORMAL: "bg-[#8fa8c4]",
  LOW: "bg-white/20",
};

function fmtDue(iso: string | null): { label: string; urgent: boolean } | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: "오버듀", urgent: true };
  if (diff === 0) return { label: "오늘", urgent: true };
  if (diff <= 3) return { label: `D-${diff}`, urgent: true };
  return { label: `D-${diff}`, urgent: false };
}

// ─── Sortable Card ───────────────────────────────────────────────────────────

function SortableCard({
  task,
  onClick,
}: {
  task: KanbanTask;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const due = fmtDue(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`kanban-card cursor-grab p-3 active:cursor-grabbing ${isDragging ? "dragging" : ""}`}
    >
      {/* Priority dot + title */}
      <div className="mb-2 flex items-start gap-2">
        <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} />
        <span className="flex-1 text-xs font-medium leading-snug text-white/90">
          {task.title}
        </span>
      </div>

      {/* Footer: assignee + due */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white"
            style={{ background: colorForId(task.assignee.id) }}
          >
            {initials(task.assignee)}
          </div>
          <span className="font-mono text-[10px] text-white/40">
            {task.assignee.name ?? task.assignee.email.split("@")[0]}
          </span>
        </div>
        {due && (
          <span
            className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold ${
              due.urgent
                ? "bg-[#c9595a]/15 text-[#c9595a]"
                : "bg-white/5 text-white/35"
            }`}
          >
            {due.label}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Card (for overlay) ──────────────────────────────────────────────────────

function CardOverlay({ task }: { task: KanbanTask }) {
  const due = fmtDue(task.dueDate);
  return (
    <div className="kanban-card w-64 p-3 shadow-2xl">
      <div className="mb-2 flex items-start gap-2">
        <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} />
        <span className="flex-1 text-xs font-medium leading-snug text-white/90">
          {task.title}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white"
            style={{ background: colorForId(task.assignee.id) }}
          >
            {initials(task.assignee)}
          </div>
        </div>
        {due && (
          <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold ${due.urgent ? "bg-[#c9595a]/15 text-[#c9595a]" : "bg-white/5 text-white/35"}`}>
            {due.label}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function KanbanBoard({ tasks, onStatusChange, onReorder, onTaskClick }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activeTask = tasks.find((t) => t.id === activeId);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // over.id가 컬럼 ID(status)인 경우
    const targetColumn = COLUMNS.find((c) => c.status === overId);
    if (targetColumn) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== targetColumn.status) {
        onStatusChange(taskId, targetColumn.status);
      }
      return;
    }

    // over.id가 다른 태스크인 경우
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== overTask.status) {
        onStatusChange(taskId, overTask.status);
      } else if (task) {
        onReorder(taskId, overTask.order, overTask.status);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((col) => {
          const columnTasks = tasks
            .filter((t) => t.status === col.status)
            .sort((a, b) => a.order - b.order);

          return (
            <div
              key={col.status}
              className={`kanban-col flex w-56 shrink-0 flex-col border-t-2 ${col.color} xl:w-auto xl:flex-1`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/50">
                    {col.label}
                  </span>
                  <span className="rounded-full bg-white/8 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white/35">
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <SortableContext
                items={columnTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
                id={col.status}
              >
                <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
                  {columnTasks.length === 0 && (
                    <div className="py-6 text-center font-mono text-[10px] text-white/15">
                      비어 있음
                    </div>
                  )}
                  {columnTasks.map((task) => (
                    <SortableCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick?.(task)}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? <CardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
