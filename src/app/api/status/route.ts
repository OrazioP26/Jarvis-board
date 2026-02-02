import { NextResponse } from 'next/server';
import { readData, nowISO } from '@/lib/db';

function minutesBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  return Math.abs(b - a) / 60000;
}

export async function GET() {
  const data = await readData();
  const now = nowISO();

  const last = data.lastActivityAt;
  const isWorking = last ? minutesBetween(last, now) <= 2 : false;

  return NextResponse.json({
    state: isWorking ? 'working' : 'idle',
    now,
    lastActivityAt: last,
    lastActivityNote: data.lastActivityNote ?? null,
    recent: (data.activity ?? []).slice(0, 5),
  });
}
