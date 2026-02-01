export type Status = 'todo' | 'in_progress' | 'done' | 'archived';

export type Assignee = 'Orazio' | 'Jarvis' | 'Unassigned';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  assignee: Assignee;
  order: number; // smaller = higher in column
  createdAt: string;
  updatedAt: string;
}

export interface Deliverable {
  id: string;
  name: string;
  link?: string; // file path or URL
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityKind =
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'deliverable.created'
  | 'deliverable.updated'
  | 'deliverable.deleted'
  | 'system.heartbeat';

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  message: string;
  createdAt: string;
}

export const STATUSES: Array<{ key: Status; label: string }> = [
  { key: 'todo', label: 'Todo' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
  { key: 'archived', label: 'Archived' },
];
