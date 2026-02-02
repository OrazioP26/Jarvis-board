import path from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { createClient } from '@vercel/kv';
import type { ActivityEvent, Deliverable, Task } from './types';

export type DBData = {
  tasks: Task[];
  deliverables: Deliverable[];
  activity: ActivityEvent[];
  lastActivityAt: string | null;
  lastActivityNote: string | null;
};

const defaultData: DBData = {
  tasks: [],
  deliverables: [],
  activity: [],
  lastActivityAt: null,
  lastActivityNote: null,
};

const KV_KEY = 'jarvis_board:v1';

function getKvConfig(): { url: string; token: string } | null {
  // Newer Vercel integrations often expose Upstash env vars instead of KV_*.
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.UPSTASH_REDIS_REST_URL?.toString();

  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.toString();

  if (!url || !token) return null;
  return { url, token };
}

let kvClient: ReturnType<typeof createClient> | null = null;
function getKV(): ReturnType<typeof createClient> {
  if (kvClient) return kvClient;

  const cfg = getKvConfig();
  if (!cfg) {
    throw new Error(
      'No KV/Upstash Redis env vars configured. Add an Upstash Redis integration in Vercel (or set KV_REST_API_URL + KV_REST_API_TOKEN).'
    );
  }

  kvClient = createClient({ url: cfg.url, token: cfg.token });
  return kvClient;
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

function normalizeData(data: DBData | null | undefined): DBData {
  const d = (data ?? {}) as Partial<DBData>;
  return {
    tasks: Array.isArray(d.tasks) ? d.tasks : [],
    deliverables: Array.isArray(d.deliverables) ? d.deliverables : [],
    activity: Array.isArray(d.activity) ? d.activity : [],
    lastActivityAt: typeof d.lastActivityAt === 'string' ? d.lastActivityAt : null,
    lastActivityNote: typeof d.lastActivityNote === 'string' ? d.lastActivityNote : null,
  };
}

export async function readData(): Promise<DBData> {
  // Prefer KV in prod; lowdb is only for local dev.
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const client = getKV();
    const data = await client.get<DBData>(KV_KEY);
    return normalizeData(data);
  }

  const cfg = getKvConfig();
  if (cfg) {
    const client = getKV();
    const data = await client.get<DBData>(KV_KEY);
    return normalizeData(data);
  }

  const db = await getLowDB();
  return normalizeData(db.data ?? null);
}

export async function writeData(data: DBData): Promise<void> {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const client = getKV();
    await client.set(KV_KEY, data);
    return;
  }

  const cfg = getKvConfig();
  if (cfg) {
    const client = getKV();
    await client.set(KV_KEY, data);
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
