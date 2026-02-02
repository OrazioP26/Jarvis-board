'use client';

import { useEffect, useState } from 'react';

type StatusResp = {
  state: 'working' | 'idle';
  now: string;
  lastActivityAt: string | null;
  lastActivityNote?: string | null;
};

export function AgentStatus() {
  const [status, setStatus] = useState<StatusResp | null>(null);

  async function refresh() {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      const json = (await res.json()) as StatusResp;
      setStatus(json);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    // Avoid calling setState synchronously inside the effect body.
    const t0 = setTimeout(() => {
      void refresh();
    }, 0);

    const t = setInterval(() => {
      void refresh();
    }, 15000);

    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, []);

  const state = status?.state ?? 'idle';

  return (
    <div className="flex items-center gap-2">
      <span
        className={
          state === 'working'
            ? 'relative flex h-2.5 w-2.5'
            : 'inline-block h-2.5 w-2.5 rounded-full bg-zinc-400'
        }
        aria-label={state}
        title={state}
      >
        {state === 'working' ? (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </>
        ) : null}
      </span>
      <div className="text-sm font-medium text-zinc-700">
        Jarvis
        <span className={state === 'working' ? 'text-emerald-600' : 'text-zinc-500'}>
          {' '}
          · {state === 'working' ? 'Working' : 'Idle'}
        </span>
      </div>
      {status?.lastActivityAt ? (
        <div className="hidden text-xs text-zinc-400 md:block">
          last: {new Date(status.lastActivityAt).toLocaleTimeString()}
          {status.lastActivityNote ? ` · ${status.lastActivityNote}` : ''}
        </div>
      ) : null}
    </div>
  );
}
