import { NextResponse } from 'next/server';
import { updateData } from '@/lib/db';
import { recordActivity } from '@/lib/activity';
import { z } from 'zod';

const PingSchema = z.object({
  state: z.enum(['working', 'idle']).default('working'),
  note: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = PingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { state, note } = parsed.data;

  await updateData((data) => {
    recordActivity(
      data,
      'system.heartbeat',
      `Jarvis ping: ${state}`,
      { source: 'jarvis', note: note ?? (state === 'working' ? 'Working' : 'Idle') }
    );
  });

  return NextResponse.json({ ok: true });
}
