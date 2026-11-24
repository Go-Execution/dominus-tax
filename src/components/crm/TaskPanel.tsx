import { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import type { ContactDetail, CrmProfile } from './model';

export interface NewTask {
  title: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dueAt: string | null;
  assignedTo: string | null;
}

interface TaskPanelProps {
  tasks: ContactDetail['tasks'];
  loading: boolean;
  profiles: CrmProfile[];
  onAdd: (task: NewTask) => Promise<void>;
  onSetCompleted: (taskId: string, completed: boolean) => Promise<void>;
}

export default function TaskPanel({ tasks, loading, profiles, onAdd, onSetCompleted }: TaskPanelProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<NewTask['priority']>('normal');
  const [dueAt, setDueAt] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function addTask(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onAdd({
        title: title.trim(), priority,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        assignedTo: assignedTo || null,
      });
      setTitle(''); setPriority('normal'); setDueAt(''); setAssignedTo('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Task could not be created.');
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(taskId: string, completed: boolean) {
    setBusyId(taskId);
    setError(null);
    try {
      await onSetCompleted(taskId, completed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Task could not be updated.');
    } finally {
      setBusyId(null);
    }
  }

  return <section className="mt-8 border-t border-white/10 pt-6" aria-labelledby="crm-tasks-title">
    <div className="flex items-center justify-between"><h3 id="crm-tasks-title" className="font-semibold">Follow-up tasks</h3><span className="text-xs text-white/40">{tasks.length}</span></div>
    {loading ? <p className="mt-3 text-sm text-white/40">Loading tasks…</p> : tasks.length ? <ul className="mt-4 space-y-2">{tasks.map((task) => {
      const completed = task.status === 'completed';
      return <li key={task.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-dominus-black/40 p-3">
        <button type="button" disabled={busyId === task.id} onClick={() => void changeStatus(task.id, !completed)} aria-label={completed ? `Reopen ${task.title}` : `Complete ${task.title}`} className={`mt-0.5 rounded-lg border p-1.5 disabled:opacity-50 ${completed ? 'border-emerald-400/30 text-emerald-300' : 'border-white/15 text-white/50'}`}>{completed ? <RotateCcw className="h-4 w-4" /> : <Check className="h-4 w-4" />}</button>
        <div className="min-w-0"><p className={`text-sm ${completed ? 'text-white/45 line-through' : 'text-white/80'}`}>{task.title}</p><p className="mt-1 text-[11px] text-white/40">{task.priority} priority · {task.due_at ? new Date(task.due_at).toLocaleString() : 'No due date'} · {task.status}</p></div>
      </li>;
    })}</ul> : <p className="mt-3 text-sm text-white/40">No follow-up tasks yet.</p>}
    <form onSubmit={(event) => void addTask(event)} className="mt-5 space-y-3 rounded-xl border border-white/10 bg-dominus-black/40 p-4">
      <p className="text-xs font-semibold text-dominus-gold-light">Add a task</p>
      <label className="block text-xs text-white/50">Task title<input required maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Call this lead" className="mt-1.5 w-full rounded-lg border border-white/10 bg-dominus-black px-3 py-2.5 text-sm text-white" /></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs text-white/50">Due date<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-dominus-black px-3 py-2.5 text-sm text-white" /></label><label className="block text-xs text-white/50">Priority<select value={priority} onChange={(event) => setPriority(event.target.value as NewTask['priority'])} className="mt-1.5 w-full rounded-lg border border-white/10 bg-dominus-black px-3 py-2.5 text-sm text-white"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div>
      {profiles.length > 0 && <label className="block text-xs text-white/50">Assign to<select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-dominus-black px-3 py-2.5 text-sm text-white"><option value="">Unassigned</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.fullName}</option>)}</select></label>}
      {error && <p role="alert" className="text-xs text-red-200">{error}</p>}
      <button type="submit" disabled={busy || !title.trim()} className="btn-gold rounded-lg px-4 py-2.5 text-xs disabled:opacity-50">{busy ? 'Saving…' : 'Create task'}</button>
    </form>
  </section>;
}
