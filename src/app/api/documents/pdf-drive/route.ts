import path from 'path';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureDocumentsDir } from '@/lib/documents';
import { writeSimplePdf } from '@/lib/pdf';
import { gogDriveMkdir, gogDriveUpload } from '@/lib/gogDrive';

const Schema = z.object({
  title: z.string().min(1),
  content: z.string().default(''),
});

const DRIVE_ACCOUNT = 'orazio.p26@gmail.com';
const DEFAULT_FOLDER_NAME = 'Jarvis Documents';

async function ensureDriveFolderId() {
  const override = process.env.JARVIS_DRIVE_FOLDER_ID?.trim();
  if (override) return override;

  const created = await gogDriveMkdir({ name: DEFAULT_FOLDER_NAME, account: DRIVE_ACCOUNT });
  if (!created?.id) throw new Error('Failed to create/find Drive folder');
  return created.id as string;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const docsDir = await ensureDocumentsDir();
  const safeName = parsed.data.title
    .replace(/[^a-z0-9-_ ]/gi, '')
    .trim()
    .slice(0, 80);
  const filename = `${new Date().toISOString().slice(0, 10)}_${safeName || 'document'}.pdf`;
  const outPath = path.join(docsDir, filename);

  await writeSimplePdf({ outPath, title: parsed.data.title, content: parsed.data.content });

  const folderId = await ensureDriveFolderId();
  const uploaded = await gogDriveUpload({
    localPath: outPath,
    account: DRIVE_ACCOUNT,
    parent: folderId,
    name: filename,
  });

  const driveFileId = uploaded?.id || uploaded?.fileId;
  const driveUrl = uploaded?.webViewLink || uploaded?.webContentLink || uploaded?.url;

  return NextResponse.json({
    localPath: path.relative(process.cwd(), outPath),
    driveFileId,
    driveUrl,
    folderId,
  });
}
