import path from 'path';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';

export type StoredDocument = {
  id: string;
  title: string;
  filename: string;
  relativePath: string; // relative to process.cwd()
  absolutePath: string;
  createdAt: string;
  updatedAt: string;
  bytes: number;
};

export function getDocumentsDirAbs() {
  const configured = process.env.JARVIS_BOARD_DOCS_DIR;
  // Default: local filesystem folder inside the repo.
  const dir = configured?.trim()
    ? configured.trim()
    : path.join(process.cwd(), 'data', 'documents');

  // If user passed a relative path, resolve from cwd.
  return path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
}

export async function ensureDocumentsDir() {
  const dir = getDocumentsDirAbs();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function safeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
}

export async function createDocument(params: {
  title: string;
  content: string;
  ext?: 'md' | 'txt';
}): Promise<StoredDocument> {
  const dir = await ensureDocumentsDir();
  const now = new Date().toISOString();
  const id = nanoid();

  const ext = params.ext ?? 'md';
  const slug = safeSlug(params.title) || 'doc';
  const filename = `${now.slice(0, 10)}_${slug}_${id}.${ext}`;

  const absolutePath = path.join(dir, filename);
  await fs.writeFile(absolutePath, params.content, 'utf8');
  const st = await fs.stat(absolutePath);

  const relativePath = path.relative(process.cwd(), absolutePath);

  return {
    id,
    title: params.title,
    filename,
    relativePath,
    absolutePath,
    createdAt: now,
    updatedAt: now,
    bytes: st.size,
  };
}

export async function listDocuments(): Promise<StoredDocument[]> {
  const dir = await ensureDocumentsDir();
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const docs: StoredDocument[] = [];
  for (const ent of entries) {
    if (!ent.isFile()) continue;
    const filename = ent.name;
    if (!filename.endsWith('.md') && !filename.endsWith('.txt')) continue;

    const absolutePath = path.join(dir, filename);
    const st = await fs.stat(absolutePath);
    const relativePath = path.relative(process.cwd(), absolutePath);

    docs.push({
      id: filename, // stable enough for MVP (filename is unique)
      title: filename,
      filename,
      relativePath,
      absolutePath,
      createdAt: st.birthtime.toISOString(),
      updatedAt: st.mtime.toISOString(),
      bytes: st.size,
    });
  }

  // Most recent first
  docs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return docs;
}

export async function readDocument(relativePath: string) {
  // Only allow reading within the documents dir.
  const dir = await ensureDocumentsDir();
  const abs = path.resolve(process.cwd(), relativePath);
  const realDir = await fs.realpath(dir);
  const realAbs = await fs.realpath(abs);
  if (!realAbs.startsWith(realDir + path.sep)) {
    throw new Error('Path outside documents dir');
  }
  return fs.readFile(realAbs, 'utf8');
}
