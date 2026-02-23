import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readDocument } from '@/lib/documents';

// MVP: allow reading a stored doc by its relativePath.
const ReadSchema = z.object({
  path: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ReadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const content = await readDocument(parsed.data.path);
    return NextResponse.json({ content });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to read';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
