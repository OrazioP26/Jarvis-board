import { KanbanBoard } from '@/components/KanbanBoard';
import { DeliverablesPanel } from '@/components/DeliverablesPanel';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <KanbanBoard />
        <DeliverablesPanel />
        <div className="mt-6 text-xs text-zinc-400">
          Local-only app. Data stored in <code className="rounded bg-white px-1 py-0.5">data/db.json</code>.
        </div>
      </div>
    </div>
  );
}
