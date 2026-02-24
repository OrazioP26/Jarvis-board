import { NextResponse } from 'next/server';
import { assertWebhookSecret, pollAutomationOnce } from '@/lib/agentLoop';

// GET is exposed so that uptime monitors and Vercel's own health-check GETs
// receive a 200 instead of generating noisy 405s in the runtime logs.
export function GET() {
  return NextResponse.json({ ok: true, note: 'use POST' });
}

export async function POST(req: Request) {
  try {
    assertWebhookSecret(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await pollAutomationOnce();
  return NextResponse.json({ ok: true, result });
}
