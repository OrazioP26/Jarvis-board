'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { Status, Task } from '@/lib/types';
import { STATUSES } from '@/lib/types';
import { TaskCard } from '@/components/TaskCard';
import { TaskModal } from '@/components/TaskModal';
import { AgentStatus } from '@/components/AgentStatus';
import { Button } from '@/components/ui/Button';

function groupByStatus(tasks: Task[]) {
  const by: Record<Status, Task[]> = {
    todo: [],
    in_progress: [],
    done: [],
    archived: [],
  };
  for (const t of tasks) by[t.status].push(t);
  for (const s of Object.keys(by) as Status[]) by[s].sort((a, b) => a.order - b.order);
  return by;
}

function ColumnDropZone({ id, children }: { id: Status; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[120px] flex-col gap-2 rounded-lg ${isOver ? 'ring-2 ring-zinc-400' : ''}`}
    >
      {children}
    </div>
  );
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byStatus = useMemo(() => groupByStatus(tasks), [tasks]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', { cache: 'no-store' });
      const json = await res.json();
      setTasks(json.tasks);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(t: Task) {
    setEditing(t);
    setModalOpen(true);
  }

  function upsertLocal(t: Task) {
    setTasks((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      if (idx === -1) return [...prev, t];
      const copy = prev.slice();
      copy[idx] = t;
      return copy;
    });
  }

  async function persistColumn(status: Status, nextTasks: Task[]) {
    const col = nextTasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order);
    // ensure sequential
    const patches = col.map((t, i) => ({ ...t, order: i }));
    setTasks(patchesForAll(nextTasks, patches));

    // Best-effort persist; small N.
    await Promise.all(
      patches.map((t) =>
        fetch(`/api/tasks/${t.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status: t.status, order: t.order }),
        })
      )
    );
  }

  function patchesForAll(all: Task[], patches: Task[]) {
    const map = new Map(patches.map((p) => [p.id, p] as const));
    return all.map((t) => map.get(t.id) ?? t);
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveTask(null);
    if (!over) return;

    const activeId = String(active.id);
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Determine destination status + index
    const overId = String(over.id);
    const overTask = tasks.find((t) => t.id === overId) ?? null;
    const destStatus: Status = overTask
      ? overTask.status
      : (STATUSES.map((s) => s.key) as Status[]).includes(overId as Status)
        ? (overId as Status)
        : activeTask.status;

    const sourceStatus = activeTask.status;

    const sourceList = byStatus[sourceStatus];
    const destList = byStatus[destStatus];

    const sourceIndex = sourceList.findIndex((t) => t.id === activeId);
    const destIndex = overTask
      ? destList.findIndex((t) => t.id === overTask.id)
      : destList.length;

    let next = tasks.slice();

    if (sourceStatus === destStatus) {
      const ids = sourceList.map((t) => t.id);
      const newIds = arrayMove(ids, sourceIndex, destIndex);
      next = next.map((t) => (t.status !== sourceStatus ? t : { ...t, order: newIds.indexOf(t.id) }));
      setTasks(next);
      await persistColumn(sourceStatus, next);
      return;
    }

    // Moving across columns
    // Remove from source ordering
    const newSourceIds = sourceList.filter((t) => t.id !== activeId).map((t) => t.id);

    // Insert into dest ordering
    const destIds = destList.map((t) => t.id);
    const insertAt = Math.max(0, destIndex);
    const newDestIds = destIds.slice();
    newDestIds.splice(insertAt, 0, activeId);

    next = next.map((t) => {
      if (t.id === activeId) return { ...t, status: destStatus, order: insertAt };
      if (t.status === sourceStatus) return { ...t, order: newSourceIds.indexOf(t.id) };
      if (t.status === destStatus) {
        const idx = newDestIds.indexOf(t.id);
        if (idx === -1) return t;
        return { ...t, order: idx };
      }
      return t;
    });

    setTasks(next);

    // Persist moved task (status change), then normalize both columns
    await fetch(`/api/tasks/${activeId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: destStatus, order: insertAt }),
    });

    await Promise.all([persistColumn(sourceStatus, next), persistColumn(destStatus, next)]);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="text-sm text-zinc-600">Loading tasks…</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-zinc-900">Jarvis-board</h1>
          <div className="flex items-center gap-3">
            <p className="text-sm text-zinc-500">Tasks for Orazio + Jarvis</p>
            <span className="text-zinc-300">•</span>
            <AgentStatus />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={refresh}>
            Refresh
          </Button>
          <Button onClick={openNew}>New task</Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => {
          const t = tasks.find((x) => x.id === String(e.active.id));
          if (t) setActiveTask(t);
        }}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {STATUSES.map((s) => {
            const col = byStatus[s.key];
            return (
              <div key={s.key} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-zinc-800">{s.label}</div>
                  <div className="text-xs font-medium text-zinc-500">{col.length}</div>
                </div>
                <SortableContext items={col.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <ColumnDropZone id={s.key}>
                    {col.map((t) => (
                      <TaskCard key={t.id} task={t} onClick={openEdit} />
                    ))}
                    {col.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-zinc-200 bg-white p-3 text-xs text-zinc-500">
                        Drop here
                      </div>
                    ) : null}
                  </ColumnDropZone>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-72 opacity-90">
              <TaskCard task={activeTask} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSaved={(t) => {
          upsertLocal(t);
          refresh();
        }}
        onDeleted={(id) => {
          setTasks((prev) => prev.filter((t) => t.id !== id));
          refresh();
        }}
      />
    </div>
  );
}
