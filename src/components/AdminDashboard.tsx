import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, LogIn, Mail, RefreshCw, ShieldCheck, X,
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { isLocalAdminBypass, isSupabaseConfigured, supabase } from '@/lib/supabase';
import CrmWorkspace from './crm/CrmWorkspace';
import { demoDashboardData } from './crm/demoData';
import type { ContactDetail, CrmIdentity, CrmRecord, CrmView, DashboardData } from './crm/model';

const isTemporaryPasswordAuth = import.meta.env.VITE_TEMP_ADMIN_AUTH_ENABLED === 'true';

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}
function authHeaders(session: Session | null, json = false) {
  return { ...(json ? { 'content-type': 'application/json' } : {}), ...(session ? { authorization: `Bearer ${session.access_token}` } : {}) };
}
async function responseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error || fallback;
}

export default function AdminDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [identity, setIdentity] = useState<CrmIdentity | null>(null);
  const [authLoading, setAuthLoading] = useState(!isLocalAdminBypass);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [previewData, setPreviewData] = useState<DashboardData>(demoDashboardData);
  const [activeView, setActiveView] = useState<CrmView>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ search: '', journey: 'all', stage: 'all', assignedTo: 'all', page: 1 });
  const [selected, setSelected] = useState<CrmRecord | null>(null);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [editingAction, setEditingAction] = useState({ nextAction: '', nextActionAt: '' });
  const dashboardRequestRef = useRef<AbortController | null>(null);
  const detailCloseRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isLocalAdminBypass) return;
    if (isTemporaryPasswordAuth) {
      void fetch('/api/auth/me', { credentials: 'include' })
        .then(async (response) => response.ok ? (await response.json()) as { user: CrmIdentity } : null)
        .then((body) => setIdentity(body?.user || null)).catch(() => setIdentity(null)).finally(() => setAuthLoading(false));
      return;
    }
    if (!supabase) { setAuthLoading(false); return; }
    void supabase.auth.getSession().then(({ data: authData }) => { setSession(authData.session); setAuthLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setAuthLoading(false); });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLocalAdminBypass || isTemporaryPasswordAuth || !session) return;
    setAuthLoading(true);
    void fetch('/api/auth/me', { headers: authHeaders(session) })
      .then(async (response) => { if (!response.ok) throw new Error(await responseError(response, 'Account is not authorized.')); return (await response.json()) as { user: CrmIdentity }; })
      .then((body) => { setIdentity(body.user); setAuthMessage(null); })
      .catch((cause: unknown) => { setIdentity(null); setAuthMessage(cause instanceof Error ? cause.message : 'Account is not authorized.'); })
      .finally(() => setAuthLoading(false));
  }, [session]);

  const loadDashboard = useCallback(async () => {
    if (!isLocalAdminBypass && identity?.role !== 'admin') return;
    dashboardRequestRef.current?.abort();
    const controller = new AbortController();
    dashboardRequestRef.current = controller;
    setLoading(true); setError(null);
    const query = new URLSearchParams({ search: filters.search, journey: filters.journey, stage: filters.stage, assignedTo: filters.assignedTo, page: String(filters.page), pageSize: '20' });
    try {
      const response = await fetch(`/api/admin/dashboard?${query}`, { credentials: 'include', headers: { accept: 'application/json', ...authHeaders(session) }, signal: controller.signal });
      if (!response.ok) throw new Error(await responseError(response, 'Dashboard could not be loaded.'));
      setData((await response.json()) as DashboardData);
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
        setError(cause instanceof Error ? cause.message : 'Dashboard could not be loaded.');
      }
    }
    finally {
      if (dashboardRequestRef.current === controller) {
        dashboardRequestRef.current = null;
        setLoading(false);
      }
    }
  }, [filters, identity?.role, session]);

  useEffect(() => { if (isLocalAdminBypass || identity?.role === 'admin') void loadDashboard(); }, [identity?.role, loadDashboard]);

  const updateOpportunity = async (record: CrmRecord, changes: Record<string, unknown>) => {
    setUpdatingId(record.id); setError(null);
    if (isLocalAdminBypass && !data) {
      setPreviewData((current) => {
        const stage = typeof changes.stageId === 'string' ? current.stages.find((item) => item.id === changes.stageId) : undefined;
        const profile = typeof changes.assignedTo === 'string' ? current.profiles.find((item) => item.id === changes.assignedTo) : undefined;
        const updateRecord = (item: CrmRecord) => item.id !== record.id ? item : {
          ...item,
          ...(stage ? { stage } : {}),
          ...(changes.assignedTo === null || typeof changes.assignedTo === 'string' ? { assignedTo: changes.assignedTo as string | null, ownerName: profile?.fullName || null } : {}),
          ...(typeof changes.priority === 'string' ? { priority: changes.priority as CrmRecord['priority'] } : {}),
          ...(changes.nextAction === null || typeof changes.nextAction === 'string' ? { nextAction: changes.nextAction as string | null } : {}),
          ...(changes.nextActionAt === null || typeof changes.nextActionAt === 'string' ? { nextActionAt: changes.nextActionAt as string | null } : {}),
        };
        return { ...current, records: current.records.map(updateRecord), attention: current.attention.map(updateRecord) };
      });
      setSelected((current) => current?.id === record.id ? { ...current, ...(typeof changes.nextAction === 'string' ? { nextAction: changes.nextAction } : {}), ...(typeof changes.nextActionAt === 'string' ? { nextActionAt: changes.nextActionAt } : {}) } : current);
      setUpdatingId(null);
      return;
    }
    try {
      const response = await fetch(`/api/admin/opportunities/${encodeURIComponent(record.id)}`, { method: 'PATCH', credentials: 'include', headers: authHeaders(session, true), body: JSON.stringify(changes) });
      if (!response.ok) throw new Error(await responseError(response, 'Record update failed.'));
      setSelected((current) => {
        if (!current || current.id !== record.id) return current;
        const next = { ...current };
        if (typeof changes.stageId === 'string') {
          const stage = data?.stages.find((item) => item.id === changes.stageId);
          if (stage) next.stage = stage;
        }
        if (changes.assignedTo === null || typeof changes.assignedTo === 'string') {
          next.assignedTo = changes.assignedTo as string | null;
          next.ownerName = data?.profiles.find((profile) => profile.id === changes.assignedTo)?.fullName || null;
        }
        if (typeof changes.priority === 'string') next.priority = changes.priority as CrmRecord['priority'];
        if (changes.nextAction === null || typeof changes.nextAction === 'string') next.nextAction = changes.nextAction as string | null;
        if (changes.nextActionAt === null || typeof changes.nextActionAt === 'string') next.nextActionAt = changes.nextActionAt as string | null;
        return next;
      });
      await loadDashboard();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Record update failed.'); }
    finally { setUpdatingId(null); }
  };

  const openDetail = async (record: CrmRecord) => {
    setSelected(record); setDetail(null); setEditingAction({ nextAction: record.nextAction || '', nextActionAt: record.nextActionAt?.slice(0, 16) || '' }); setDetailLoading(true);
    if (isLocalAdminBypass && !data) {
      setDetail({
        contact: record.contact,
        activities: [
          { id: 'preview-activity-1', event_type: 'lead.created', summary: `Lead captured from ${record.contact.leadSource}.`, created_at: record.createdAt },
          { id: 'preview-activity-2', event_type: 'workflow.queued', summary: 'Instant response workflow queued.', created_at: record.updatedAt },
        ],
        tasks: [],
      });
      setDetailLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/admin/contacts/${encodeURIComponent(record.contact.id)}`, { credentials: 'include', headers: authHeaders(session) });
      if (!response.ok) throw new Error(await responseError(response, 'Contact details could not be loaded.'));
      setDetail((await response.json()) as ContactDetail);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Contact details could not be loaded.'); }
    finally { setDetailLoading(false); }
  };

  const addNote = async () => {
    if (!selected || !note.trim() || noteLoading) return;
    setNoteLoading(true);
    setError(null);
    if (isLocalAdminBypass && !data) {
      setDetail((current) => current ? { ...current, activities: [{ id: `preview-note-${Date.now()}`, event_type: 'note.added', summary: note.trim(), created_at: new Date().toISOString() }, ...current.activities] } : current);
      setNote('');
      setNoteLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/admin/contacts/${encodeURIComponent(selected.contact.id)}/notes`, { method: 'POST', credentials: 'include', headers: authHeaders(session, true), body: JSON.stringify({ note: note.trim() }) });
      if (!response.ok) throw new Error(await responseError(response, 'Note could not be added.'));
      setNote('');
      await openDetail(selected);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Note could not be added.');
    } finally {
      setNoteLoading(false);
    }
  };

  useEffect(() => {
    if (!selected) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => detailCloseRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      previousFocusRef.current?.focus();
    };
  }, [selected]);

  const sendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault(); setAuthMessage(null);
    if (!supabase) return setAuthMessage('Email authentication is not configured.');
    const { error: signInError } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/#admin`, shouldCreateUser: false } });
    setAuthMessage(signInError ? signInError.message : 'Secure sign-in link sent. Check the approved work email inbox.');
  };

  const signInWithTemporaryPassword = async (event: React.FormEvent) => {
    event.preventDefault(); setAuthMessage(null); setAuthLoading(true);
    try {
      const response = await fetch('/api/auth/temporary-login', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
      const body = (await response.json().catch(() => null)) as { user?: CrmIdentity; error?: string } | null;
      if (!response.ok || !body?.user) throw new Error(body?.error || 'Login failed.');
      setIdentity(body.user); setPassword('');
    } catch (cause) { setAuthMessage(cause instanceof Error ? cause.message : 'Login failed.'); }
    finally { setAuthLoading(false); }
  };

  const signOut = async () => {
    setIdentity(null); setData(null);
    if (isTemporaryPasswordAuth) await fetch('/api/auth/temporary-logout', { method: 'POST', credentials: 'include' });
    else if (supabase) await supabase.auth.signOut();
  };

  const workspaceData = data || (isLocalAdminBypass ? previewData : null);
  const visibleWorkspaceData = useMemo(() => {
    if (!workspaceData || data || !filters.search.trim()) return workspaceData;
    const query = filters.search.toLowerCase();
    const records = workspaceData.records.filter((record) => [record.contact.firstName, record.contact.lastName, record.contact.email, record.contact.phone].filter(Boolean).join(' ').toLowerCase().includes(query));
    return { ...workspaceData, records, pagination: { ...workspaceData.pagination, total: records.length } };
  }, [data, filters.search, workspaceData]);
  const stagesFor = useCallback((record: CrmRecord) => (workspaceData?.stages || []).filter((stage) => stage.pipeline?.id === record.pipeline.id), [workspaceData?.stages]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-dominus-black" role="status" aria-label="Loading secure CRM access"><RefreshCw className="h-8 w-8 animate-spin text-dominus-gold" aria-hidden="true" /></div>;

  if (!isLocalAdminBypass && !identity && (isTemporaryPasswordAuth || !session)) {
    return <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-dominus-black px-5 text-dominus-text-primary"><div className="absolute inset-0 gold-radial opacity-60" /><div className="relative w-full max-w-md rounded-3xl border border-dominus-gold/25 bg-dominus-charcoal p-8 shadow-card sm:p-10"><button type="button" onClick={() => { window.location.hash = '#home'; }} className="mb-8 flex items-center gap-2 text-sm text-dominus-gold/75"><ArrowLeft className="h-4 w-4" /> Return to website</button><div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-dominus-gold/30 bg-dominus-gold/10"><LogIn className="h-6 w-6 text-dominus-gold" /></div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-dominus-gold/70">Secure CRM Access</p><h1 className="mt-2 font-serif text-4xl font-semibold">Dominus 360 CRM</h1><p className="mt-3 text-sm leading-relaxed text-white/50">{isTemporaryPasswordAuth ? 'Enter the temporary administrator password. The secure session expires after eight hours.' : 'Enter an approved team email to receive a secure sign-in link.'}</p><form onSubmit={isTemporaryPasswordAuth ? signInWithTemporaryPassword : sendMagicLink} className="mt-8 space-y-4"><label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/55">{isTemporaryPasswordAuth ? 'Temporary password' : 'Work email'}</span><span className="flex items-center gap-3 rounded-xl border border-dominus-gold/20 bg-dominus-black px-4 focus-within:border-dominus-gold/60"><Mail className="h-4 w-4 text-dominus-gold/60" /><input type={isTemporaryPasswordAuth ? 'password' : 'email'} required minLength={isTemporaryPasswordAuth ? 12 : undefined} autoComplete={isTemporaryPasswordAuth ? 'current-password' : 'email'} value={isTemporaryPasswordAuth ? password : email} onChange={(event) => isTemporaryPasswordAuth ? setPassword(event.target.value) : setEmail(event.target.value)} className="w-full bg-transparent py-3.5 text-sm outline-none" /></span></label><button disabled={authLoading} className="btn-gold w-full rounded-xl px-5 py-3.5 disabled:cursor-not-allowed disabled:opacity-60">{authLoading ? 'Checking access…' : isTemporaryPasswordAuth ? 'Unlock CRM Dashboard' : 'Email Secure Sign-In Link'}</button></form>{!isTemporaryPasswordAuth && !isSupabaseConfigured && <p className="mt-4 text-xs text-amber-200">Email authentication configuration is incomplete.</p>}{authMessage && <p className="mt-4 text-center text-sm text-dominus-gold-light" role="alert" aria-live="polite">{authMessage}</p>}</div></div>;
  }

  if (!isTemporaryPasswordAuth && !isLocalAdminBypass && session && !identity) return <div className="flex min-h-screen items-center justify-center bg-dominus-black px-5 text-white"><div className="max-w-lg text-center"><AlertTriangle className="mx-auto h-10 w-10 text-red-300" /><h1 className="mt-5 font-serif text-3xl">Access not provisioned</h1><p className="mt-3 text-white/55">{authMessage}</p><button onClick={() => void signOut()} className="btn-gold mt-7 px-6 py-3">Sign out</button></div></div>;
  if (!isLocalAdminBypass && identity?.role === 'consultant') return <div className="flex min-h-screen items-center justify-center bg-dominus-black px-5 text-white"><div className="max-w-xl rounded-3xl border border-dominus-gold/20 bg-dominus-charcoal p-10"><ShieldCheck className="h-10 w-10 text-dominus-gold" /><h1 className="mt-5 font-serif text-4xl">Welcome, {identity.fullName}</h1><p className="mt-4 text-white/55">Your account is restricted to assigned work. The consultant workspace is outside this basic dashboard release.</p><button onClick={() => void signOut()} className="btn-gold-outline mt-8 px-5 py-3">Sign out</button></div></div>;

  return <>
    <CrmWorkspace
      data={visibleWorkspaceData}
      isPreview={isLocalAdminBypass && !data}
      loading={loading}
      error={error}
      identityName={identity?.fullName || 'Amanda'}
      activeView={activeView}
      searchInput={searchInput}
      updatingId={updatingId}
      onViewChange={setActiveView}
      onSearchInput={setSearchInput}
      onSearch={() => setFilters((current) => ({ ...current, search: searchInput, page: 1 }))}
      onRefresh={() => void loadDashboard()}
      onSignOut={!isLocalAdminBypass ? () => void signOut() : undefined}
      onDismissError={() => setError(null)}
      onOpenRecord={(record) => void openDetail(record)}
      onUpdateRecord={(record, changes) => void updateOpportunity(record, changes)}
    />
    {selected && <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}><aside role="dialog" aria-modal="true" aria-labelledby="contact-record-title" className="h-full w-full max-w-xl overflow-y-auto border-l border-dominus-gold/20 bg-dominus-charcoal p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-wider text-dominus-gold/70">Contact record</p><h2 id="contact-record-title" className="mt-2 font-serif text-3xl">{selected.contact.firstName} {selected.contact.lastName}</h2><p className="mt-1 text-sm text-white/45">{[selected.contact.email, selected.contact.phone].filter(Boolean).join(' · ') || 'No contact details provided'}</p></div><button ref={detailCloseRef} aria-label="Close contact record" onClick={() => setSelected(null)} className="rounded-full border border-white/10 p-2"><X className="h-5 w-5" /></button></div><div className="mt-8 grid gap-4 sm:grid-cols-2"><label className="text-xs text-white/45">Stage<select value={selected.stage.id} onChange={(event) => void updateOpportunity(selected, { stageId: event.target.value })} className="mt-2 w-full rounded-lg border border-white/10 bg-dominus-black px-3 py-2.5 text-sm text-white">{stagesFor(selected).map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label><label className="text-xs text-white/45">Owner<select value={selected.assignedTo || ''} onChange={(event) => void updateOpportunity(selected, { assignedTo: event.target.value || null })} className="mt-2 w-full rounded-lg border border-white/10 bg-dominus-black px-3 py-2.5 text-sm text-white"><option value="">Unassigned</option>{workspaceData?.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.fullName}</option>)}</select></label></div><div className="mt-6 rounded-xl border border-white/10 bg-dominus-black/40 p-4"><h3 className="font-semibold">Next action</h3><label className="mt-3 block text-xs text-white/45">Action<textarea value={editingAction.nextAction} onChange={(event) => setEditingAction((current) => ({ ...current, nextAction: event.target.value }))} rows={3} maxLength={500} className="mt-2 w-full rounded-lg border border-white/10 bg-dominus-black px-3 py-2 text-sm text-white outline-none" placeholder="What should happen next?" /></label><label className="mt-3 block text-xs text-white/45">Due date and time<input type="datetime-local" value={editingAction.nextActionAt} onChange={(event) => setEditingAction((current) => ({ ...current, nextActionAt: event.target.value }))} className="mt-2 w-full rounded-lg border border-white/10 bg-dominus-black px-3 py-2 text-sm text-white" /></label><button disabled={updatingId === selected.id} onClick={() => void updateOpportunity(selected, { nextAction: editingAction.nextAction || null, nextActionAt: editingAction.nextActionAt ? new Date(editingAction.nextActionAt).toISOString() : null })} className="btn-gold mt-3 rounded-lg px-4 py-2 text-xs disabled:opacity-50">Save next action</button></div><div className="mt-6"><h3 className="font-semibold">Internal note</h3><div className="mt-3 flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Internal note</span><input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Add a note…" className="w-full rounded-lg border border-white/10 bg-dominus-black px-3 py-2.5 text-sm outline-none" /></label><button disabled={noteLoading || !note.trim()} onClick={() => void addNote()} className="btn-gold rounded-lg px-4 text-xs disabled:cursor-not-allowed disabled:opacity-50">{noteLoading ? 'Adding…' : 'Add'}</button></div></div><div className="mt-8"><h3 className="font-semibold">Activity history</h3>{detailLoading ? <RefreshCw className="mt-5 h-5 w-5 animate-spin text-dominus-gold" /> : detail?.activities.length ? <div className="mt-4 space-y-3">{detail.activities.map((activity) => <div key={activity.id} className="border-l border-dominus-gold/30 pl-4"><p className="text-sm text-white/75">{activity.summary}</p><p className="mt-1 text-[11px] text-white/35">{formatDate(activity.created_at)} · {activity.event_type}</p></div>)}</div> : <p className="mt-3 text-sm text-white/35">No activity recorded yet.</p>}</div></aside></div>}
  </>;
}
