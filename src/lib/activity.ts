import { nanoid } from 'nanoid';
import { nowISO, type DBData } from '@/lib/db';
import type { ActivityEvent, ActivityKind } from '@/lib/types';

export function recordActivity(data: DBData, kind: ActivityKind, message: string): ActivityEvent {
  const evt: ActivityEvent = {
    id: nanoid(),
    kind,
    message,
    createdAt: nowISO(),
  };

  data.activity.unshift(evt);
  // Keep log bounded.
  if (data.activity.length > 200) data.activity.length = 200;
  data.lastActivityAt = evt.createdAt;
  return evt;
}
