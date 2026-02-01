'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import type { Task } from '@/lib/types';

export function TaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  return (
    <button
      ref={setNodeRef}
      style={style}
      onClick={() => onClick(task)}
      className={`group w-full rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-sm hover:border-zinc-300 hover:bg-zinc-50 active:cursor-grabbing ${
        isDragging ? 'opacity-60' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-900">{task.title}</div>
          {task.description ? (
            <div className="mt-1 max-h-9 overflow-hidden text-xs text-zinc-600">{task.description}</div>
          ) : null}
        </div>
        <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-700">
          {task.assignee}
        </span>
      </div>
      <div className="mt-2 text-[11px] text-zinc-400">Updated {new Date(task.updatedAt).toLocaleString()}</div>
    </button>
  );
}
