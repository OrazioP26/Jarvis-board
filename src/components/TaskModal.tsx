'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Assignee, Status, Task } from '@/lib/types';
import { STATUSES } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

export function TaskModal({
  open,
  onClose,
  initial,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Task | null;
  onSaved: (task: Task) => void;
  onDeleted?: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>('todo');
  const [assignee, setAssignee] = useState<Assignee>('Unassigned');
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const isEdit = !!initial?.id;

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setStatus(initial?.status ?? 'todo');
    setAssignee(initial?.assignee ?? 'Unassigned');
  }, [open, initial]);

  const canSave = useMemo(() => title.trim().length > 0 && !saving, [title, saving]);

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      if (isEdit) {
        const res = await fetch(`/api/tasks/${initial!.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title, description, status, assignee }),
        });
        if (!res.ok) throw new Error('Failed to update');
        const json = await res.json();
        onSaved(json.task);
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title, description, status, assignee }),
        });
        if (!res.ok) throw new Error('Failed to create');
        const json = await res.json();
        onSaved(json.task);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function retryAutomation() {
    if (!isEdit) return;
    setRetrying(true);
    try {
      // This triggers the server-side agent loop because tasks assigned to Jarvis
      // will auto-start automation when eligible.
      const res = await fetch(`/api/tasks/${initial!.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'todo', assignee: 'Jarvis' }),
      });
      if (!res.ok) throw new Error('Failed to retry');
      const json = await res.json();
      onSaved(json.task);
      onClose();
    } finally {
      setRetrying(false);
    }
  }

  async function del() {
    if (!isEdit) return;
    const ok = confirm('Delete this task?');
    if (!ok) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${initial!.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      onDeleted?.(initial!.id);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onMouseDown={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">{isEdit ? 'Edit task' : 'New task'}</h2>
            <p className="mt-1 text-sm text-zinc-500">Orazio + Jarvis kanban</p>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            Close
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-zinc-700">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-zinc-700">Status</label>
              <select
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
              >
                {STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Assignee</label>
              <select
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value as Assignee)}
              >
                {(['Unassigned', 'Orazio', 'Jarvis'] as Assignee[]).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isEdit && initial?.automation?.enabled ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
              <div className="font-medium">Automation</div>
              <div className="mt-1 text-xs text-zinc-600">
                State: <span className="font-semibold">{initial.automation.state}</span>
                {initial.automation.error ? ` · ${initial.automation.error}` : ''}
              </div>
              <div className="mt-2">
                <Button
                  variant="secondary"
                  onClick={retryAutomation}
                  disabled={saving || retrying}
                >
                  {retrying ? 'Retrying…' : 'Retry automation'}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div>
              {isEdit ? (
                <Button variant="danger" onClick={del} disabled={saving}>
                  Delete
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={save} disabled={!canSave}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
