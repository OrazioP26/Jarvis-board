import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createDocument, listDocuments } from '@/lib/documents';

const CreateDocSchema = z.object({
  title: z.string().min(1),
  content: z.string().default(''),
  ext: z.enum(['md', 'txt']).optional(),
});

export async function GET() {
  const documents = await listDocuments();
  return NextResponse.json({ documents });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateDocSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const doc = await createDocument({
    title: parsed.data.title,
    content: parsed.data.content,
    ext: parsed.data.ext,
  });

  return NextResponse.json({ document: doc }, { status: 201 });
}
