export type Status = 'todo' | 'in_progress' | 'done' | 'archived';

export type Assignee = 'Orazio' | 'Jarvis' | 'Unassigned';

export type AutomationState =
  | 'not_started'
  | 'spawning'
  | 'running'
  | 'blocked'
  | 'done'
  | 'error';

export type TaskAutomation = {
  enabled: boolean;
  state: AutomationState;
  childSessionKey?: string;
  runId?: string;
  startedAt?: string;
  finishedAt?: string;
  lastCheckedAt?: string;
  error?: string;
};

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  assignee: Assignee;
  order: number; // smaller = higher in column
  createdAt: string;
  updatedAt: string;
  automation?: TaskAutomation;
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
  | 'agent.loop.started'
  | 'agent.loop.progress'
  | 'agent.loop.finished'
  | 'agent.loop.blocked'
  | 'agent.loop.error'
  | 'system.heartbeat';

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  message: string;
  createdAt: string;
  source?: 'user' | 'jarvis';
}

export const STATUSES: Array<{ key: Status; label: string }> = [
  { key: 'todo', label: 'Todo' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
  { key: 'archived', label: 'Archived' },
];
