import { NextResponse } from 'next/server';
import { z } from 'zod';
import { nowISO, updateData } from '@/lib/db';
import { recordActivity } from '@/lib/activity';
import { startAutomationForTask } from '@/lib/agentLoop';
import type { Task } from '@/lib/types';

const UpdateTaskSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
    assignee: z.enum(['Orazio', 'Jarvis', 'Unassigned']).optional(),
    order: z.number().int().min(0).optional(),
  })
  .strict();

function reorderWithinStatus(tasks: Task[], status: Task['status']) {
  const inCol = tasks
    .filter((t) => t.status === status)
    .sort((a, b) => a.order - b.order);
  inCol.forEach((t, idx) => (t.order = idx));
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = UpdateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const task = await updateData((data) => {
    const task = data.tasks.find((t) => t.id === id);
    if (!task) return null;

    const beforeStatus = task.status;

    if (parsed.data.title !== undefined) task.title = parsed.data.title;
    if (parsed.data.description !== undefined)
      task.description = parsed.data.description || undefined;
    if (parsed.data.assignee !== undefined) task.assignee = parsed.data.assignee;
    if (parsed.data.status !== undefined) task.status = parsed.data.status;

    // If order explicitly provided, set it and later normalize.
    if (parsed.data.order !== undefined) task.order = parsed.data.order;

    task.updatedAt = nowISO();

    // Normalize orders in affected columns
    reorderWithinStatus(data.tasks, beforeStatus);
    reorderWithinStatus(data.tasks, task.status);

    recordActivity(data, 'task.updated', `Updated task: ${task.title}`);

    return task;
  });

  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fire-and-forget: if the task is assigned to Jarvis, let the agent loop pick it up.
  if (task.automation?.enabled) {
    void startAutomationForTask(task.id);
  }

  return NextResponse.json({ task });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ok = await updateData((data) => {
    const idx = data.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return false;

    const [removed] = data.tasks.splice(idx, 1);
    // Normalize column ordering after delete
    const status = removed.status;
    data.tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order)
      .forEach((t, i) => (t.order = i));

    recordActivity(data, 'task.deleted', `Deleted task: ${removed.title}`);

    return true;
  });

  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
