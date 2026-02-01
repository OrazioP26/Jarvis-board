import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { getDB, nowISO } from '@/lib/db';
import type { Status, Task } from '@/lib/types';

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).default('todo'),
  assignee: z.enum(['Orazio', 'Jarvis', 'Unassigned']).default('Unassigned'),
});

export async function GET() {
  const db = await getDB();
  const tasks = (db.data?.tasks ?? []).slice().sort((a, b) => {
    if (a.status !== b.status) return a.status.localeCompare(b.status);
    return a.order - b.order;
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const db = await getDB();
  const { title, description, status, assignee } = parsed.data;
  const now = nowISO();

  const maxOrder = Math.max(
    -1,
    ...(db.data!.tasks
      .filter((t) => t.status === status)
      .map((t) => t.order))
  );

  const task: Task = {
    id: nanoid(),
    title,
    description: description || undefined,
    status: status as Status,
    assignee,
    order: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  };

  db.data!.tasks.push(task);
  await db.write();

  return NextResponse.json({ task }, { status: 201 });
}
