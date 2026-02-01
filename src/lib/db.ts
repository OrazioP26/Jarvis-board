import path from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import type { Deliverable, Task } from './types';

export type DBData = {
  tasks: Task[];
  deliverables: Deliverable[];
};

const defaultData: DBData = {
  tasks: [],
  deliverables: [],
};

let dbPromise: Promise<Low<DBData>> | null = null;

export async function getDB() {
  if (!dbPromise) {
    const file = path.join(process.cwd(), 'data', 'db.json');
    const adapter = new JSONFile<DBData>(file);
    const db = new Low<DBData>(adapter, defaultData);
    dbPromise = (async () => {
      await db.read();
      db.data ||= defaultData;
      await db.write();
      return db;
    })();
  }
  return dbPromise;
}

export function nowISO() {
  return new Date().toISOString();
}
