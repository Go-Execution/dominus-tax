import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, BriefcaseBusiness, CheckCircle2, ChevronLeft, ChevronRight,
  CircleAlert, ClipboardList, Filter, LogIn, LogOut, Mail, RefreshCw, Search,
  ShieldCheck, UserRoundCheck, Users, X,
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { isLocalAdminBypass, isSupabaseConfigured, supabase } from '@/lib/supabase';

const isTemporaryPasswordAuth = import.meta.env.VITE_TEMP_ADMIN_AUTH_ENABLED === 'true';

interface CrmIdentity { id: string; email?: string; fullName: string; role: 'admin' | 'consultant' }
interface CrmProfile { id: string; fullName: string; role: 'admin' | 'consultant' }
interface CrmStage {
  id: string; slug: string; name: string; position?: number; color?: string | null;
  requiresAttention?: boolean; isClosed?: boolean;
  pipeline?: { id: string; slug: string; name: string; journey: string };
}
interface CrmRecord {
  id: string; title: string; priority: 'low' | 'normal' | 'high' | 'urgent'; status: string;
  nextAction: string | null; nextActionAt: string | null; assignedTo: string | null;
  ownerName: string | null; createdAt: string; updatedAt: string;
  contact: { id: string; journey: 'tax-client' | 'consultant'; firstName: string; lastName: string; email: string | null; phone: string | null; leadSource: string; sourceSubmissionId: string | null };
  stage: CrmStage; pipeline: { id: string; slug: string; name: string };
}
interface DashboardData {
  generatedAt: string;
  metrics: { total: number; taxClients: number; consultants: number; needsAttention: number; unassigned: number; completed: number };
  attention: CrmRecord[]; records: CrmRecord[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  profiles: CrmProfile[]; stages: CrmStage[];
}
interface ContactDetail {
  contact: Record<string, unknown>;
  activities: Array<{ id: string; event_type: string; summary: string; created_at: string }>;
  tasks: Array<{ id: string; title: string; priority: string; status: string; due_at: string | null }>;
}

const metricDefinitions = [
  { key: 'total', label: 'Active Records', icon: Users },
  { key: 'taxClients', label: 'Tax Clients', icon: ClipboardList },
  { key: 'consultants', label: 'Consultants', icon: BriefcaseBusiness },
  { key: 'needsAttention', label: 'Needs Attention', icon: CircleAlert },
  { key: 'unassigned', label: 'Unassigned', icon: UserRoundCheck },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
] as const;

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ search: '', journey: 'all', stage: 'all', assignedTo: 'all', page: 1 });
  const [selected, setSelected] = useState<CrmRecord | null>(null);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState('');
  const [editingAction, setEditingAction] = useState({ nextAction: '', nextActionAt: '' });

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
    setLoading(true); setError(null);
    const query = new URLSearchParams({ search: filters.search, journey: filters.journey, stage: filters.stage, assignedTo: filters.assignedTo, page: String(filters.page), pageSize: '20' });
    try {
      const response = await fetch(`/api/admin/dashboard?${query}`, { credentials: 'include', headers: { accept: 'application/json', ...authHeaders(session) } });
      if (!response.ok) throw new Error(await responseError(response, 'Dashboard could not be loaded.'));
      setData((await response.json()) as DashboardData);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Dashboard could not be loaded.'); }
    finally { setLoading(false); }
  }, [filters, identity?.role, session]);

  useEffect(() => { if (isLocalAdminBypass || identity?.role === 'admin') void loadDashboard(); }, [identity?.role, loadDashboard]);

  const updateOpportunity = async (record: CrmRecord, changes: Record<string, unknown>) => {
    setUpdatingId(record.id); setError(null);
    try {
      const response = await fetch(`/api/admin/opportunities/${encodeURIComponent(record.id)}`, { method: 'PATCH', credentials: 'include', headers: authHeaders(session, true), body: JSON.stringify(changes) });
      if (!response.ok) throw new Error(await responseError(response, 'Record update failed.'));
      await loadDashboard();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Record update failed.'); }
    finally { setUpdatingId(null); }
  };

  const openDetail = async (record: CrmRecord) => {
    setSelected(record); setDetail(null); setEditingAction({ nextAction: record.nextAction || '', nextActionAt: record.nextActionAt?.slice(0, 16) || '' }); setDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/contacts/${encodeURIComponent(record.contact.id)}`, { credentials: 'include', headers: authHeaders(session) });
      if (!response.ok) throw new Error(await responseError(response, 'Contact details could not be loaded.'));
      setDetail((await response.json()) as ContactDetail);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Contact details could not be loaded.'); }
    finally { setDetailLoading(false); }
  };

  const addNote = async () => {
    if (!selected || !note.trim()) return;
    const response = await fetch(`/api/admin/contacts/${encodeURIComponent(selected.contact.id)}/notes`, { method: 'POST', credentials: 'include', headers: authHeaders(session, true), body: JSON.stringify({ note }) });
    if (!response.ok) { setError(await responseError(response, 'Note could not be added.')); return; }
    setNote(''); await openDetail(selected);
  };

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

  const stagesFor = useCallback((record: CrmRecord) => (data?.stages || []).filter((stage) => stage.pipeline?.id === record.pipeline.id), [data?.stages]);
  const filteredStageOptions = useMemo(() => !data ? [] : filters.journey === 'all' ? data.stages : data.stages.filter((stage) => stage.pipeline?.journey === filters.journey), [data, filters.journey]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-dominus-black"><RefreshCw className="h-8 w-8 animate-spin text-dominus-gold" /></div>;

  if (!isLocalAdminBypass && !identity && (isTemporaryPasswordAuth || !session)) {
    return <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-dominus-black px-5 text-dominus-text-primary"><div className="absolute inset-0 gold-radial opacity-60" /><div className="relative w-full max-w-md rounded-3xl border border-dominus-gold/25 bg-dominus-charcoal p-8 shadow-card sm:p-10"><button type="button" onClick={() => { window.location.hash = '#home'; }} className="mb-8 flex items-center gap-2 text-sm text-dominus-gold/75"><ArrowLeft className="h-4 w-4" /> Return to website</button><div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-dominus-gold/30 bg-dominus-gold/10"><LogIn className="h-6 w-6 text-dominus-gold" /></div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-dominus-gold/70">Secure CRM Access</p><h1 className="mt-2 font-serif text-4xl font-semibold">Dominus 360 CRM</h1><p className="mt-3 text-sm leading-relaxed text-white/50">{isTemporaryPasswordAuth ? 'Enter the temporary administrator password. The secure session expires after eight hours.' : 'Enter an approved team email to receive a secure sign-in link.'}</p><form onSubmit={isTemporaryPasswordAuth ? signInWithTemporaryPassword : sendMagicLink} className="mt-8 space-y-4"><label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/55">{isTemporaryPasswordAuth ? 'Temporary password' : 'Work email'}</span><span className="flex items-center gap-3 rounded-xl border border-dominus-gold/20 bg-dominus-black px-4 focus-within:border-dominus-gold/60"><Mail className="h-4 w-4 text-dominus-gold/60" /><input type={isTemporaryPasswordAuth ? 'password' : 'email'} required minLength={isTemporaryPasswordAuth ? 12 : undefined} autoComplete={isTemporaryPasswordAuth ? 'current-password' : 'email'} value={isTemporaryPasswordAuth ? password : email} onChange={(event) => isTemporaryPasswordAuth ? setPassword(event.target.value) : setEmail(event.target.value)} className="w-full bg-transparent py-3.5 text-sm outline-none" /></span></label><button className="btn-gold w-full rounded-xl px-5 py-3.5">{isTemporaryPasswordAuth ? 'Unlock CRM Dashboard' : 'Email Secure Sign-In Link'}</button></form>{!isTemporaryPasswordAuth && !isSupabaseConfigured && <p className="mt-4 text-xs text-amber-200">Email authentication configuration is incomplete.</p>}{authMessage && <p className="mt-4 text-center text-sm text-dominus-gold-light">{authMessage}</p>}</div></div>;
  }

  if (!isTemporaryPasswordAuth && !isLocalAdminBypass && session && !identity) return <div className="flex min-h-screen items-center justify-center bg-dominus-black px-5 text-white"><div className="max-w-lg text-center"><AlertTriangle className="mx-auto h-10 w-10 text-red-300" /><h1 className="mt-5 font-serif text-3xl">Access not provisioned</h1><p className="mt-3 text-white/55">{authMessage}</p><button onClick={() => void signOut()} className="btn-gold mt-7 px-6 py-3">Sign out</button></div></div>;
  if (!isLocalAdminBypass && identity?.role === 'consultant') return <div className="flex min-h-screen items-center justify-center bg-dominus-black px-5 text-white"><div className="max-w-xl rounded-3xl border border-dominus-gold/20 bg-dominus-charcoal p-10"><ShieldCheck className="h-10 w-10 text-dominus-gold" /><h1 className="mt-5 font-serif text-4xl">Welcome, {identity.fullName}</h1><p className="mt-4 text-white/55">Your account is restricted to assigned work. The consultant workspace is outside this basic dashboard release.</p><button onClick={() => void signOut()} className="btn-gold-outline mt-8 px-5 py-3">Sign out</button></div></div>;

  return <div className="min-h-screen bg-dominus-black text-dominus-text-primary">
    <header className="border-b border-dominus-gold/20 bg-dominus-charcoal/95"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8"><div className="flex items-center gap-4"><button onClick={() => { window.location.hash = '#home'; }} className="flex h-10 w-10 items-center justify-center rounded-full border border-dominus-gold/25 text-dominus-gold"><ArrowLeft className="h-5 w-5" /></button><div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-dominus-gold/70">Dominus Operations</p><h1 className="font-serif text-3xl font-semibold">Amanda Dashboard</h1><p className="mt-1 text-xs text-white/40">Signed in as {identity?.fullName || 'Local administrator'}</p></div></div><div className="flex items-center gap-2"><span className="hidden items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-300 sm:inline-flex"><ShieldCheck className="h-4 w-4" /> Secure Session</span><button onClick={() => void loadDashboard()} disabled={loading} className="btn-gold-outline flex items-center gap-2 rounded-lg px-4 py-2 text-xs"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>{!isLocalAdminBypass && <button onClick={() => void signOut()} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/55 hover:text-dominus-gold"><LogOut className="h-4 w-4" /> Sign out</button>}</div></div></header>
    <main className="mx-auto max-w-7xl space-y-7 px-5 py-8 lg:px-8">
      {error && <div className="flex items-start justify-between rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"><span>{error}</span><button onClick={() => setError(null)}><X className="h-4 w-4" /></button></div>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{metricDefinitions.map(({ key, label, icon: Icon }) => <div key={key} className="rounded-2xl border border-dominus-gold/15 bg-dominus-charcoal p-5"><div className="flex items-center justify-between text-white/45"><span className="text-xs uppercase tracking-wider">{label}</span><Icon className="h-4 w-4 text-dominus-gold" /></div><p className="mt-4 font-serif text-3xl">{data?.metrics[key] ?? '—'}</p></div>)}</section>
      <section className="rounded-2xl border border-dominus-gold/15 bg-dominus-charcoal p-5"><form onSubmit={(event) => { event.preventDefault(); setFilters((current) => ({ ...current, search: searchInput, page: 1 })); }} className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_220px_220px_auto]"><label className="flex items-center gap-2 rounded-lg border border-white/10 bg-dominus-black px-3"><Search className="h-4 w-4 text-white/35" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name, email, phone…" className="w-full bg-transparent py-2.5 text-sm outline-none" /></label><select value={filters.journey} onChange={(event) => setFilters((current) => ({ ...current, journey: event.target.value, stage: 'all', page: 1 }))} className="rounded-lg border border-white/10 bg-dominus-black px-3 py-2.5 text-sm"><option value="all">All journeys</option><option value="tax-client">Tax clients</option><option value="consultant">Consultants</option></select><select value={filters.stage} onChange={(event) => setFilters((current) => ({ ...current, stage: event.target.value, page: 1 }))} className="rounded-lg border border-white/10 bg-dominus-black px-3 py-2.5 text-sm"><option value="all">All stages</option>{filteredStageOptions.map((stage) => <option key={stage.id} value={stage.id}>{stage.pipeline?.name} — {stage.name}</option>)}</select><select value={filters.assignedTo} onChange={(event) => setFilters((current) => ({ ...current, assignedTo: event.target.value, page: 1 }))} className="rounded-lg border border-white/10 bg-dominus-black px-3 py-2.5 text-sm"><option value="all">All owners</option><option value="unassigned">Unassigned</option>{data?.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.fullName}</option>)}</select><button className="btn-gold flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm"><Filter className="h-4 w-4" /> Apply</button></form></section>
      {data?.attention.length ? <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5"><div className="flex items-center justify-between"><div><h2 className="font-serif text-2xl">Needs Amanda’s Attention</h2><p className="mt-1 text-sm text-white/40">Overdue, urgent, or attention-required stages.</p></div><span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-200">{data.metrics.needsAttention} open</span></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.attention.slice(0, 6).map((record) => <button key={record.id} onClick={() => void openDetail(record)} className="rounded-xl border border-white/10 bg-dominus-black/50 p-4 text-left hover:border-dominus-gold/30"><p className="font-semibold">{record.contact.firstName} {record.contact.lastName}</p><p className="mt-1 text-xs text-amber-200">{record.stage.name} · {record.nextAction || 'Next action missing'}</p><p className="mt-2 text-[11px] text-white/35">{record.ownerName || 'Unassigned'} · due {formatDate(record.nextActionAt)}</p></button>)}</div></section> : null}
      <section className="overflow-hidden rounded-2xl border border-dominus-gold/15 bg-dominus-charcoal"><div className="border-b border-white/5 px-5 py-4"><h2 className="font-serif text-2xl">CRM Records</h2><p className="text-sm text-white/40">{data?.pagination.total || 0} matching records</p></div>{loading && !data ? <div className="flex justify-center py-20"><RefreshCw className="h-7 w-7 animate-spin text-dominus-gold" /></div> : data?.records.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><thead className="bg-dominus-black/40 text-[11px] uppercase tracking-wider text-white/40"><tr><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Journey</th><th className="px-5 py-3">Stage</th><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Priority</th><th className="px-5 py-3">Next action</th><th className="px-5 py-3"></th></tr></thead><tbody>{data.records.map((record) => <tr key={record.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.025]"><td className="px-5 py-4"><p className="font-semibold">{record.contact.firstName} {record.contact.lastName}</p><p className="mt-1 text-xs text-white/40">{record.contact.email || record.contact.phone || 'No contact detail'}</p></td><td className="px-5 py-4 text-sm text-white/65">{record.contact.journey === 'consultant' ? 'Consultant' : 'Tax Client'}</td><td className="px-5 py-4"><select disabled={updatingId === record.id} value={record.stage.id} onChange={(event) => void updateOpportunity(record, { stageId: event.target.value })} className="max-w-48 rounded-lg border border-white/10 bg-dominus-black px-2 py-2 text-xs">{stagesFor(record).map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></td><td className="px-5 py-4"><select disabled={updatingId === record.id} value={record.assignedTo || ''} onChange={(event) => void updateOpportunity(record, { assignedTo: event.target.value || null })} className="max-w-44 rounded-lg border border-white/10 bg-dominus-black px-2 py-2 text-xs"><option value="">Unassigned</option>{data.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.fullName}</option>)}</select></td><td className="px-5 py-4"><select disabled={updatingId === record.id} value={record.priority} onChange={(event) => void updateOpportunity(record, { priority: event.target.value })} className="rounded-lg border border-white/10 bg-dominus-black px-2 py-2 text-xs"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></td><td className="max-w-64 px-5 py-4"><p className="truncate text-sm text-white/70">{record.nextAction || 'Not set'}</p><p className="mt-1 text-[11px] text-white/35">{formatDate(record.nextActionAt)}</p></td><td className="px-5 py-4"><button onClick={() => void openDetail(record)} className="text-xs font-semibold text-dominus-gold hover:text-dominus-gold-light">Open</button></td></tr>)}</tbody></table></div> : <div className="py-20 text-center"><Users className="mx-auto h-9 w-9 text-dominus-gold/40" /><p className="mt-4 font-serif text-xl">No CRM records found</p><p className="mt-2 text-sm text-white/40">New website intakes will appear here after the webhook sends them.</p></div>}{data && <div className="flex items-center justify-between border-t border-white/5 px-5 py-4 text-xs text-white/45"><span>Page {data.pagination.page} of {data.pagination.totalPages}</span><div className="flex gap-2"><button disabled={data.pagination.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} className="rounded-lg border border-white/10 p-2 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><button disabled={data.pagination.page >= data.pagination.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} className="rounded-lg border border-white/10 p-2 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>}</section>
    </main>
    {selected && <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}><aside className="h-full w-full max-w-xl overflow-y-auto border-l border-dominus-gold/20 bg-dominus-charcoal p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-wider text-dominus-gold/70">Contact record</p><h2 className="mt-2 font-serif text-3xl">{selected.contact.firstName} {selected.contact.lastName}</h2><p className="mt-1 text-sm text-white/45">{selected.contact.email} · {selected.contact.phone}</p></div><button onClick={() => setSelected(null)} className="rounded-full border border-white/10 p-2"><X className="h-5 w-5" /></button></div><div className="mt-8 grid gap-4 sm:grid-cols-2"><label className="text-xs text-white/45">Stage<select value={selected.stage.id} onChange={(event) => void updateOpportunity(selected, { stageId: event.target.value })} className="mt-2 w-full rounded-lg border border-white/10 bg-dominus-black px-3 py-2.5 text-sm text-white">{stagesFor(selected).map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label><label className="text-xs text-white/45">Owner<select value={selected.assignedTo || ''} onChange={(event) => void updateOpportunity(selected, { assignedTo: event.target.value || null })} className="mt-2 w-full rounded-lg border border-white/10 bg-dominus-black px-3 py-2.5 text-sm text-white"><option value="">Unassigned</option>{data?.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.fullName}</option>)}</select></label></div><div className="mt-6 rounded-xl border border-white/10 bg-dominus-black/40 p-4"><h3 className="font-semibold">Next action</h3><textarea value={editingAction.nextAction} onChange={(event) => setEditingAction((current) => ({ ...current, nextAction: event.target.value }))} rows={3} className="mt-3 w-full rounded-lg border border-white/10 bg-dominus-black px-3 py-2 text-sm outline-none" placeholder="What should happen next?" /><input type="datetime-local" value={editingAction.nextActionAt} onChange={(event) => setEditingAction((current) => ({ ...current, nextActionAt: event.target.value }))} className="mt-3 w-full rounded-lg border border-white/10 bg-dominus-black px-3 py-2 text-sm" /><button onClick={() => void updateOpportunity(selected, { nextAction: editingAction.nextAction || null, nextActionAt: editingAction.nextActionAt ? new Date(editingAction.nextActionAt).toISOString() : null })} className="btn-gold mt-3 rounded-lg px-4 py-2 text-xs">Save next action</button></div><div className="mt-6"><h3 className="font-semibold">Internal note</h3><div className="mt-3 flex gap-2"><input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Add a note…" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-dominus-black px-3 py-2.5 text-sm outline-none" /><button onClick={() => void addNote()} className="btn-gold rounded-lg px-4 text-xs">Add</button></div></div><div className="mt-8"><h3 className="font-semibold">Activity history</h3>{detailLoading ? <RefreshCw className="mt-5 h-5 w-5 animate-spin text-dominus-gold" /> : detail?.activities.length ? <div className="mt-4 space-y-3">{detail.activities.map((activity) => <div key={activity.id} className="border-l border-dominus-gold/30 pl-4"><p className="text-sm text-white/75">{activity.summary}</p><p className="mt-1 text-[11px] text-white/35">{formatDate(activity.created_at)} · {activity.event_type}</p></div>)}</div> : <p className="mt-3 text-sm text-white/35">No activity recorded yet.</p>}</div></aside></div>}
  </div>;
}
