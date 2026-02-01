import path from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { kv } from '@vercel/kv';
import type { Deliverable, Task } from './types';

export type DBData = {
  tasks: Task[];
  deliverables: Deliverable[];
};

const defaultData: DBData = {
  tasks: [],
  deliverables: [],
};

const KV_KEY = 'jarvis_board:v1';

function hasKV() {
  // Vercel/Upstash expose these env vars. If they aren't present, fall back to local lowdb.
  return Boolean(
    process.env.KV_REST_API_URL &&
      process.env.KV_REST_API_TOKEN &&
      process.env.KV_REST_API_READ_ONLY_TOKEN
  );
}

let lowDbPromise: Promise<Low<DBData>> | null = null;
async function getLowDB() {
  if (!lowDbPromise) {
    const file = path.join(process.cwd(), 'data', 'db.json');
    const adapter = new JSONFile<DBData>(file);
    const db = new Low<DBData>(adapter, defaultData);
    lowDbPromise = (async () => {
      await db.read();
      db.data ||= defaultData;
      await db.write();
      return db;
    })();
  }
  return lowDbPromise;
}

export async function readData(): Promise<DBData> {
  if (hasKV()) {
    const data = await kv.get<DBData>(KV_KEY);
    return data ?? defaultData;
  }

  const db = await getLowDB();
  return db.data ?? defaultData;
}

export async function writeData(data: DBData): Promise<void> {
  if (hasKV()) {
    await kv.set(KV_KEY, data);
    return;
  }

  const db = await getLowDB();
  db.data = data;
  await db.write();
}

export async function updateData<T>(fn: (data: DBData) => T | Promise<T>): Promise<T> {
  // MVP: read-modify-write. Good enough for single-user usage.
  const data = await readData();
  const result = await fn(data);
  await writeData(data);
  return result;
}

export function nowISO() {
  return new Date().toISOString();
}
