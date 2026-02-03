import { nowISO, updateData } from '@/lib/db';
import { recordActivity } from '@/lib/activity';
import type { Task, TaskAutomation } from '@/lib/types';
import { getSessionStatus, spawnSession } from '@/lib/clawdbot';

function isEnabled() {
  return process.env.AGENT_LOOP_ENABLED === '1';
}

function webhookSecretOk(req: Request) {
  const required = process.env.JARVIS_BOARD_WEBHOOK_SECRET;
  if (!required) return true; // allow in dev

  const gotHeader = req.headers.get('x-jarvis-secret') || '';
  if (gotHeader === required) return true;

  // Allow Vercel Cron jobs (they send x-vercel-cron: 1)
  const isVercelCron =
    (process.env.VERCEL || process.env.NODE_ENV === 'production') &&
    req.headers.get('x-vercel-cron') === '1';
  if (isVercelCron) return true;

  // Also support query param (useful in non-Vercel schedulers): /api/.../poll?secret=...
  const url = new URL(req.url);
  const gotQuery = url.searchParams.get('secret') || '';
  return gotQuery === required;
}

export function assertWebhookSecret(req: Request) {
  if (!webhookSecretOk(req)) throw new Error('Unauthorized');
}

export function defaultAutomationForTask(task: Task): TaskAutomation | undefined {
  // Incremental default: only auto-run if explicitly assigned to Jarvis.
  if (task.assignee !== 'Jarvis') return undefined;
  return { enabled: true, state: 'not_started' };
}

export async function startAutomationForTask(taskId: string) {
  if (!isEnabled()) return { started: false, reason: 'disabled' } as const;

  const task = await updateData((data) => {
    const t = data.tasks.find((x) => x.id === taskId);
    if (!t) return null;

    t.automation = t.automation ?? { enabled: true, state: 'not_started' };
    if (!t.automation.enabled) return t;

    if (t.automation.state !== 'not_started' && t.automation.state !== 'error') return t;

    t.automation.state = 'spawning';
    t.automation.startedAt = nowISO();
    t.automation.error = undefined;

    // Move to in_progress as soon as we start automation.
    if (t.status === 'todo') t.status = 'in_progress';
    t.updatedAt = nowISO();

    recordActivity(data, 'agent.loop.started', `Agent loop started: ${t.title}`, {
      source: 'jarvis',
      note: `Started: ${t.title}`,
    });

    return t;
  });

  if (!task) return { started: false, reason: 'not_found' } as const;

  // Spawn outside the db transaction.
  try {
    const spawned = await spawnSession({
      label: `jarvis-board:${task.id}`,
      prompt: `You are Jarvis, executing a task from Jarvis-board.\n\nTASK TITLE: ${task.title}\nTASK DESCRIPTION: ${task.description ?? ''}\n\nRequirements: Keep the board updated. Ask the user for confirmation BEFORE taking any external action (sending messages, posting, purchases, irreversible changes).\n\nWhen you make progress, call back to the board using its API if available.`,
      metadata: { taskId: task.id },
    });

    await updateData((data) => {
      const t = data.tasks.find((x) => x.id === taskId);
      if (!t) return;
      t.automation = t.automation ?? { enabled: true, state: 'spawning' };
      t.automation.childSessionKey = spawned.childSessionKey;
      t.automation.runId = spawned.runId;
      t.automation.state = 'running';
      t.updatedAt = nowISO();
      recordActivity(data, 'agent.loop.progress', `Spawned sub-agent for: ${t.title}`, {
        source: 'jarvis',
        note: 'Sub-agent spawned',
      });
    });

    return { started: true, childSessionKey: spawned.childSessionKey, runId: spawned.runId } as const;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateData((data) => {
      const t = data.tasks.find((x) => x.id === taskId);
      if (!t) return;
      t.automation = t.automation ?? { enabled: true, state: 'error' };
      t.automation.state = 'error';
      t.automation.error = msg;
      t.updatedAt = nowISO();
      // fall back to todo
      if (t.status === 'in_progress') t.status = 'todo';
      recordActivity(data, 'agent.loop.error', `Agent loop error for: ${t.title} (${msg})`, {
        source: 'jarvis',
        note: 'Agent loop error',
      });
    });

    return { started: false, reason: 'spawn_failed', error: msg } as const;
  }
}

export async function pollAutomationOnce(limit = 10) {
  if (!isEnabled()) return { polled: 0 };

  const candidates = await updateData((data) => {
    const running = (data.tasks ?? []).filter(
      (t) => t.automation?.enabled && (t.automation.state === 'running' || t.automation.state === 'spawning')
    );
    return running.slice(0, limit).map((t) => ({
      id: t.id,
      title: t.title,
      childSessionKey: t.automation?.childSessionKey,
      runId: t.automation?.runId,
    }));
  });

  let polled = 0;
  for (const t of candidates) {
    if (!t.childSessionKey) continue;

    polled++;
    try {
      const status = await getSessionStatus({ childSessionKey: t.childSessionKey, runId: t.runId });
      await updateData((data) => {
        const task = data.tasks.find((x) => x.id === t.id);
        if (!task?.automation) return;

        task.automation.lastCheckedAt = nowISO();

        if (status.state === 'running') {
          task.automation.state = 'running';
          task.updatedAt = nowISO();
          return;
        }

        if (status.state === 'done') {
          task.automation.state = 'done';
          task.automation.finishedAt = nowISO();
          task.status = 'done';
          task.updatedAt = nowISO();
          recordActivity(data, 'agent.loop.finished', `Completed: ${task.title}`, {
            source: 'jarvis',
            note: 'Task completed',
          });
          return;
        }

        if (status.state === 'blocked') {
          task.automation.state = 'blocked';
          task.updatedAt = nowISO();
          recordActivity(data, 'agent.loop.blocked', `Blocked: ${task.title}${status.detail ? ` (${status.detail})` : ''}`, {
            source: 'jarvis',
            note: 'Blocked',
          });
          return;
        }

        if (status.state === 'error') {
          task.automation.state = 'error';
          task.automation.error = status.detail || 'Unknown error';
          task.status = 'todo';
          task.updatedAt = nowISO();
          recordActivity(data, 'agent.loop.error', `Error: ${task.title}${status.detail ? ` (${status.detail})` : ''}`, {
            source: 'jarvis',
            note: 'Agent error',
          });
        }
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await updateData((data) => {
        const task = data.tasks.find((x) => x.id === t.id);
        if (!task?.automation) return;
        task.automation.lastCheckedAt = nowISO();
        task.automation.state = 'error';
        task.automation.error = msg;
        task.status = 'todo';
        task.updatedAt = nowISO();
        recordActivity(data, 'agent.loop.error', `Poll error: ${task.title} (${msg})`, {
          source: 'jarvis',
          note: 'Poll error',
        });
      });
    }
  }

  return { polled };
}
