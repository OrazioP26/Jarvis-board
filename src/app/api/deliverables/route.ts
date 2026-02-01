import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { getDB, nowISO } from '@/lib/db';
import type { Deliverable } from '@/lib/types';

const CreateDeliverableSchema = z.object({
  name: z.string().min(1),
  link: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export async function GET() {
  const db = await getDB();
  const deliverables = (db.data?.deliverables ?? [])
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ deliverables });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateDeliverableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const db = await getDB();
  const now = nowISO();

  const deliverable: Deliverable = {
    id: nanoid(),
    name: parsed.data.name,
    link: parsed.data.link || undefined,
    notes: parsed.data.notes || undefined,
    createdAt: now,
    updatedAt: now,
  };

  db.data!.deliverables.push(deliverable);
  await db.write();

  return NextResponse.json({ deliverable }, { status: 201 });
}
