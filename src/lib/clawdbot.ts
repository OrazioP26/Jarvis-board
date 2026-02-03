export type SpawnSessionResponse = {
  childSessionKey: string;
  runId?: string;
};

export type SessionStatus =
  | { state: 'running'; detail?: string }
  | { state: 'done'; detail?: string }
  | { state: 'blocked'; detail?: string }
  | { state: 'error'; detail?: string };

function getConfig(): { url: string; token?: string } | null {
  const url = process.env.CLAWDBOT_API_URL;
  if (!url) return null;
  const token = process.env.CLAWDBOT_API_TOKEN;
  return { url, token };
}

async function clawdbotFetch(path: string, init: RequestInit) {
  const cfg = getConfig();
  if (!cfg) throw new Error('Missing CLAWDBOT_API_URL');

  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (cfg.token) headers.set('authorization', `Bearer ${cfg.token}`);

  const res = await fetch(new URL(path, cfg.url).toString(), {
    ...init,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Clawdbot API error ${res.status}: ${text}`);
  }
  return res;
}

/**
 * Minimal contract (expected by this app):
 * POST /v1/sessions/spawn -> { childSessionKey, runId? }
 * GET  /v1/sessions/status?childSessionKey=...&runId=... -> { state, detail? }
 *
 * If your gateway uses different paths, set:
 *  - CLAWDBOT_SESSIONS_SPAWN_PATH
 *  - CLAWDBOT_SESSIONS_STATUS_PATH
 */
export async function spawnSession(opts: {
  label: string;
  prompt: string;
  metadata?: Record<string, unknown>;
}): Promise<SpawnSessionResponse> {
  const spawnPath = process.env.CLAWDBOT_SESSIONS_SPAWN_PATH || '/v1/sessions/spawn';
  const res = await clawdbotFetch(spawnPath, {
    method: 'POST',
    body: JSON.stringify({
      label: opts.label,
      prompt: opts.prompt,
      metadata: opts.metadata ?? {},
    }),
  });
  return (await res.json()) as SpawnSessionResponse;
}

export async function getSessionStatus(opts: {
  childSessionKey: string;
  runId?: string;
}): Promise<SessionStatus> {
  const statusPath = process.env.CLAWDBOT_SESSIONS_STATUS_PATH || '/v1/sessions/status';
  const url = new URL(statusPath, process.env.CLAWDBOT_API_URL!);
  url.searchParams.set('childSessionKey', opts.childSessionKey);
  if (opts.runId) url.searchParams.set('runId', opts.runId);

  const res = await clawdbotFetch(url.pathname + url.search, { method: 'GET' });
  return (await res.json()) as SessionStatus;
}
