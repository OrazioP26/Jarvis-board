import { nanoid } from 'nanoid';
import { nowISO, type DBData } from '@/lib/db';
import type { ActivityEvent, ActivityKind } from '@/lib/types';

export function recordActivity(
  data: DBData,
  kind: ActivityKind,
  message: string,
  opts?: { source?: 'user' | 'jarvis'; note?: string }
): ActivityEvent {
  const evt: ActivityEvent = {
    id: nanoid(),
    kind,
    message,
    createdAt: nowISO(),
    source: opts?.source,
  };

  data.activity.unshift(evt);
  // Keep log bounded.
  if (data.activity.length > 200) data.activity.length = 200;
  data.lastActivityAt = evt.createdAt;
  if (opts?.note) data.lastActivityNote = opts.note;
  return evt;
}
