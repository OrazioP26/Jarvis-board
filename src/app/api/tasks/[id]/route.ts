import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDB, nowISO } from '@/lib/db';

const UpdateTaskSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
    assignee: z.enum(['Orazio', 'Jarvis', 'Unassigned']).optional(),
    order: z.number().int().min(0).optional(),
  })
  .strict();

function reorderWithinStatus(tasks: any[], status: string) {
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

  const db = await getDB();
  const task = db.data!.tasks.find((t) => t.id === id);
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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
  reorderWithinStatus(db.data!.tasks, beforeStatus);
  reorderWithinStatus(db.data!.tasks, task.status);

  await db.write();
  return NextResponse.json({ task });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDB();
  const idx = db.data!.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [removed] = db.data!.tasks.splice(idx, 1);
  // Normalize column ordering after delete
  const status = removed.status;
  db.data!.tasks
    .filter((t) => t.status === status)
    .sort((a, b) => a.order - b.order)
    .forEach((t, i) => (t.order = i));

  await db.write();
  return NextResponse.json({ ok: true });
}
