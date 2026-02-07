import { NextResponse } from 'next/server';
import { assertWebhookSecret, pollAutomationOnce } from '@/lib/agentLoop';

export async function POST(req: Request) {
  try {
    assertWebhookSecret(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await pollAutomationOnce();
  return NextResponse.json({ ok: true, result });
}
