'use client';

import { useEffect, useState } from 'react';
import type { Deliverable } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

export function DeliverablesPanel() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/deliverables', { cache: 'no-store' });
      const json = await res.json();
      setDeliverables(json.deliverables);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function add() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/deliverables', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, link, notes }),
      });
      if (!res.ok) throw new Error('Failed');
      setName('');
      setLink('');
      setNotes('');
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    const ok = confirm('Delete this deliverable?');
    if (!ok) return;
    await fetch(`/api/deliverables/${id}`, { method: 'DELETE' });
    await refresh();
  }

  return (
    <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Scheduled Deliverables</h2>
          <p className="text-sm text-zinc-500">
            Recurring reports/newsletters/check-ins (daily/weekly) that keep Jarvis memory + operations organized
          </p>
        </div>
        <Button variant="secondary" onClick={refresh}>
          Refresh
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-zinc-700">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning Brief (daily)" />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700">Link / Path</label>
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Source URL, cron/job id, or ./relative/path" />
        </div>
        <div className="md:col-span-3">
          <label className="text-sm font-medium text-zinc-700">Notes</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional" />
        </div>
        <div className="md:col-span-3 flex justify-end">
          <Button onClick={add} disabled={saving || !name.trim()}>
            {saving ? 'Adding…' : 'Add scheduled deliverable'}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-zinc-600">Loading scheduled deliverables…</div>
        ) : deliverables.length === 0 ? (
          <div className="text-sm text-zinc-500">No scheduled deliverables yet.</div>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
            {deliverables.map((d) => (
              <li key={d.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-900">{d.name}</div>
                  {d.link ? (
                    <div className="truncate text-sm text-zinc-600">
                      <a className="underline" href={d.link} target="_blank" rel="noreferrer">
                        {d.link}
                      </a>
                    </div>
                  ) : null}
                  {d.notes ? <div className="text-sm text-zinc-600">{d.notes}</div> : null}
                  <div className="text-xs text-zinc-400">Created {new Date(d.createdAt).toLocaleString()}</div>
                </div>
                <div className="mt-2 flex shrink-0 justify-end sm:mt-0">
                  <Button variant="ghost" onClick={() => del(d.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
