import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDB, nowISO } from '@/lib/db';

const UpdateDeliverableSchema = z
  .object({
    name: z.string().min(1).optional(),
    link: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .strict();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = UpdateDeliverableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const db = await getDB();
  const item = db.data!.deliverables.find((d) => d.id === id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (parsed.data.name !== undefined) item.name = parsed.data.name;
  if (parsed.data.link !== undefined) item.link = parsed.data.link || undefined;
  if (parsed.data.notes !== undefined) item.notes = parsed.data.notes || undefined;
  item.updatedAt = nowISO();

  await db.write();
  return NextResponse.json({ deliverable: item });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDB();
  const idx = db.data!.deliverables.findIndex((d) => d.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.data!.deliverables.splice(idx, 1);
  await db.write();
  return NextResponse.json({ ok: true });
}
