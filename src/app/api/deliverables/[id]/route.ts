import { NextResponse } from 'next/server';
import { z } from 'zod';
import { nowISO, updateData } from '@/lib/db';

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

  const deliverable = await updateData((data) => {
    const item = data.deliverables.find((d) => d.id === id);
    if (!item) return null;

    if (parsed.data.name !== undefined) item.name = parsed.data.name;
    if (parsed.data.link !== undefined) item.link = parsed.data.link || undefined;
    if (parsed.data.notes !== undefined) item.notes = parsed.data.notes || undefined;
    item.updatedAt = nowISO();

    return item;
  });

  if (!deliverable) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ deliverable });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ok = await updateData((data) => {
    const idx = data.deliverables.findIndex((d) => d.id === id);
    if (idx === -1) return false;

    data.deliverables.splice(idx, 1);
    return true;
  });

  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
