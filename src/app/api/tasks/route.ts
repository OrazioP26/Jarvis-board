import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { nowISO, updateData } from '@/lib/db';
import type { Status, Task } from '@/lib/types';

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).default('todo'),
  assignee: z.enum(['Orazio', 'Jarvis', 'Unassigned']).default('Unassigned'),
});

export async function GET() {
  const tasks = await updateData((data) => {
    return (data.tasks ?? []).slice().sort((a, b) => {
      if (a.status !== b.status) return a.status.localeCompare(b.status);
      return a.order - b.order;
    });
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

  const { title, description, status, assignee } = parsed.data;
  const now = nowISO();

  const task = await updateData((data) => {
    const maxOrder = Math.max(
      -1,
      ...(data.tasks
        .filter((t) => t.status === status)
        .map((t) => t.order))
    );

    const newTask: Task = {
      id: nanoid(),
      title,
      description: description || undefined,
      status: status as Status,
      assignee,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    data.tasks.push(newTask);
    return newTask;
  });

  return NextResponse.json({ task }, { status: 201 });
}
