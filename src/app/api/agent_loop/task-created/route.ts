import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertWebhookSecret, startAutomationForTask } from '@/lib/agentLoop';

const Schema = z.object({ taskId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    assertWebhookSecret(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await startAutomationForTask(parsed.data.taskId);
  return NextResponse.json({ ok: true, result });
}
