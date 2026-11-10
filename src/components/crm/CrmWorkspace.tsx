import { useMemo, useState } from 'react';
import {
  Activity, Bell, Bot, CalendarDays, CheckCircle2, ChevronDown, CircleAlert, ContactRound,
  Filter, LayoutDashboard, LogOut, Mail, Menu, MessageSquareText, MoreHorizontal, PanelLeftClose,
  Phone, Plus, RefreshCw, Search, Send, Settings, Sparkles, TrendingUp, Users, Workflow, X,
} from 'lucide-react';
import type { CrmRecord, CrmView, DashboardData } from './model';

interface WorkspaceProps {
  data: DashboardData | null;
  isPreview: boolean;
  loading: boolean;
  error: string | null;
  identityName: string;
  activeView: CrmView;
  searchInput: string;
  updatingId: string | null;
  onViewChange: (view: CrmView) => void;
  onSearchInput: (value: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
  onSignOut?: () => void;
  onDismissError: () => void;
  onOpenRecord: (record: CrmRecord) => void;
  onUpdateRecord: (record: CrmRecord, changes: Record<string, unknown>) => void;
}

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
  { id: 'contacts', label: 'Contacts', icon: ContactRound },
  { id: 'automations', label: 'Automations', icon: Workflow },
  { id: 'campaigns', label: 'Campaigns', icon: Send },
] as const;

const viewLabels: Record<CrmView, { title: string; eyebrow: string; description: string }> = {
  overview: { title: 'Command Center', eyebrow: 'CRM Overview', description: 'Your lead flow, follow-ups, and client movement at a glance.' },
  pipeline: { title: 'Opportunity Pipeline', eyebrow: 'Sales Workspace', description: 'Move every prospect from new inquiry to active client.' },
  contacts: { title: 'Contacts', eyebrow: 'Client Directory', description: 'Search, review, and manage every relationship from one place.' },
  automations: { title: 'Automations', eyebrow: 'Workflow Engine', description: 'Follow-up sequences that keep working while your team is busy.' },
  campaigns: { title: 'Campaigns', eyebrow: 'Email & SMS', description: 'Create focused outreach for leads, clients, and tax-season reminders.' },
};

function initials(record: CrmRecord) {
  return `${record.contact.firstName[0] || ''}${record.contact.lastName[0] || ''}`.toUpperCase();
}

function shortDate(value: string | null) {
  if (!value) return 'No due date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No due date' : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function EmptyState({ message }: { message: string }) {
  return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center"><Users className="h-8 w-8 text-dominus-gold/45" /><p className="mt-4 font-medium text-white/70">{message}</p><p className="mt-1 text-sm text-white/35">Website submissions will appear here automatically.</p></div>;
}

export default function CrmWorkspace(props: WorkspaceProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { data } = props;
  const meta = viewLabels[props.activeView];

  const stageGroups = useMemo(() => {
    if (!data) return [];
    return data.stages
      .filter((stage) => stage.pipeline?.journey === 'tax-client')
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map((stage) => ({ stage, records: data.records.filter((record) => record.stage.id === stage.id) }));
  }, [data]);

  const closeAndNavigate = (view: CrmView) => {
    props.onViewChange(view);
    setMobileNavOpen(false);
  };

  const sidebar = <>
    <div className="flex h-20 items-center justify-between border-b border-white/[0.07] px-5">
      <button type="button" onClick={() => { window.location.hash = '#home'; }} className="flex items-center gap-3 text-left" aria-label="Return to Dominus website">
        <img src="/logo-320.webp" alt="" className="h-10 w-10 rounded-xl object-cover" />
        <span><span className="block font-display text-sm font-semibold tracking-[0.16em] text-dominus-gold-light">DOMINUS 360</span><span className="mt-0.5 block text-[9px] uppercase tracking-[0.22em] text-white/35">Client Intelligence</span></span>
      </button>
      <button onClick={() => setMobileNavOpen(false)} className="rounded-lg p-2 text-white/45 lg:hidden" aria-label="Close navigation"><X className="h-5 w-5" /></button>
    </div>
    <nav className="flex-1 space-y-1 px-3 py-5" aria-label="CRM navigation">
      <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.24em] text-white/25">Workspace</p>
      {navigation.map(({ id, label, icon: Icon }) => {
        const active = props.activeView === id;
        return <button key={id} type="button" onClick={() => closeAndNavigate(id)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active ? 'bg-dominus-emerald text-white shadow-emerald-glow' : 'text-white/50 hover:bg-white/[0.05] hover:text-white'}`} aria-current={active ? 'page' : undefined}><Icon className={`h-[18px] w-[18px] ${active ? 'text-dominus-gold-light' : 'text-white/35 group-hover:text-dominus-gold'}`} /><span className="font-medium">{label}</span>{id === 'contacts' && data && <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{data.metrics.total}</span>}</button>;
      })}
      <p className="mb-3 mt-8 px-3 text-[9px] font-bold uppercase tracking-[0.24em] text-white/25">Tools</p>
      <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/40 transition hover:bg-white/[0.05] hover:text-white"><CalendarDays className="h-[18px] w-[18px]" /> Calendar <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-white/30">Soon</span></button>
      <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/40 transition hover:bg-white/[0.05] hover:text-white"><Settings className="h-[18px] w-[18px]" /> Settings</button>
    </nav>
    <div className="border-t border-white/[0.07] p-4">
      <div className="rounded-2xl border border-dominus-gold/15 bg-dominus-gold/[0.06] p-4"><div className="flex items-center gap-2 text-xs font-semibold text-dominus-gold-light"><Sparkles className="h-4 w-4" /> Tax season ready</div><p className="mt-2 text-[11px] leading-relaxed text-white/35">Lead capture, pipeline, and follow-up are connected in one workspace.</p></div>
    </div>
  </>;

  return <div className="min-h-screen bg-[#080b0a] text-dominus-text-primary">
    <a href="#crm-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-dominus-gold focus:px-4 focus:py-2 focus:text-black">Skip to CRM content</a>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col border-r border-white/[0.07] bg-[#0c100e] lg:flex">{sidebar}</aside>
    {mobileNavOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} /><aside className="relative flex h-full w-[286px] max-w-[86vw] flex-col border-r border-white/10 bg-[#0c100e]">{sidebar}</aside></div>}

    <div className="lg:pl-[252px]">
      <header className="sticky top-0 z-30 flex h-20 items-center border-b border-white/[0.07] bg-[#080b0a]/90 px-4 backdrop-blur-xl sm:px-6 xl:px-8">
        <button onClick={() => setMobileNavOpen(true)} className="mr-3 rounded-xl border border-white/10 p-2.5 text-white/65 lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
        <div className="hidden max-w-sm flex-1 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 sm:flex"><Search className="h-4 w-4 text-white/25" /><input value={props.searchInput} onChange={(event) => props.onSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') props.onSearch(); }} placeholder="Search contacts, email, phone…" className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/25" /><kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/25">⌘K</kbd></div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3"><button onClick={props.onRefresh} disabled={props.loading} className="rounded-xl border border-white/[0.08] p-2.5 text-white/45 transition hover:border-dominus-gold/30 hover:text-dominus-gold disabled:opacity-40" aria-label="Refresh CRM"><RefreshCw className={`h-[18px] w-[18px] ${props.loading ? 'animate-spin' : ''}`} /></button><button className="relative rounded-xl border border-white/[0.08] p-2.5 text-white/45 transition hover:text-white" aria-label="Notifications"><Bell className="h-[18px] w-[18px]" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-dominus-gold" /></button><div className="relative"><button onClick={() => setProfileOpen((current) => !current)} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] py-1.5 pl-1.5 pr-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-dominus-emerald text-xs font-bold text-white">{props.identityName.slice(0, 1).toUpperCase()}</span><span className="hidden text-left md:block"><span className="block text-xs font-semibold">{props.identityName}</span><span className="block text-[10px] text-white/35">Administrator</span></span><ChevronDown className="h-3.5 w-3.5 text-white/35" /></button>{profileOpen && <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#121714] p-2 shadow-2xl"><button onClick={() => { window.location.hash = '#home'; }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-white/60 hover:bg-white/5 hover:text-white"><PanelLeftClose className="h-4 w-4" /> Website</button>{props.onSignOut && <button onClick={props.onSignOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-300/75 hover:bg-red-400/10"><LogOut className="h-4 w-4" /> Sign out</button>}</div>}</div></div>
      </header>

      <main id="crm-main" className="px-4 py-7 sm:px-6 xl:px-8 xl:py-9">
        {props.isPreview && <div className="mb-6 flex items-center gap-3 rounded-xl border border-sky-400/20 bg-sky-400/[0.07] px-4 py-3 text-xs text-sky-100"><Sparkles className="h-4 w-4 shrink-0 text-sky-300" /><span><strong>Local preview data.</strong> The interface is interactive; production records will come from Supabase when the project is active.</span></div>}
        {props.error && !props.isPreview && <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-100" role="alert"><span>{props.error}</span><button onClick={props.onDismissError} aria-label="Dismiss error"><X className="h-4 w-4" /></button></div>}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-dominus-gold/70">{meta.eyebrow}</p><h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">{meta.title}</h1><p className="mt-2 max-w-2xl text-sm text-white/38">{meta.description}</p></div><button type="button" className="btn-gold inline-flex items-center justify-center gap-2 self-start rounded-xl px-4 py-3 text-sm sm:self-auto"><Plus className="h-4 w-4" /> Add new lead</button></div>

        {props.activeView === 'overview' && <Overview data={data} onOpenRecord={props.onOpenRecord} />}
        {props.activeView === 'pipeline' && <Pipeline groups={stageGroups} profiles={data?.profiles || []} updatingId={props.updatingId} onOpenRecord={props.onOpenRecord} onUpdateRecord={props.onUpdateRecord} />}
        {props.activeView === 'contacts' && <Contacts data={data} searchInput={props.searchInput} onSearchInput={props.onSearchInput} onSearch={props.onSearch} onOpenRecord={props.onOpenRecord} />}
        {props.activeView === 'automations' && <Automations />}
        {props.activeView === 'campaigns' && <Campaigns />}
      </main>
    </div>
  </div>;
}

function Overview({ data, onOpenRecord }: { data: DashboardData | null; onOpenRecord: (record: CrmRecord) => void }) {
  if (!data) return <EmptyState message="CRM data is currently unavailable" />;
  const cards = [
    { label: 'Active leads', value: data.metrics.total, delta: '+12.5%', icon: Users, color: 'text-sky-300', bg: 'bg-sky-400/10' },
    { label: 'Needs attention', value: data.metrics.needsAttention, delta: 'Action today', icon: CircleAlert, color: 'text-amber-300', bg: 'bg-amber-400/10' },
    { label: 'Unassigned', value: data.metrics.unassigned, delta: 'Team queue', icon: ContactRound, color: 'text-violet-300', bg: 'bg-violet-400/10' },
    { label: 'Converted', value: data.metrics.completed, delta: 'This pipeline', icon: CheckCircle2, color: 'text-emerald-300', bg: 'bg-emerald-400/10' },
  ];
  const maxStage = Math.max(...data.stages.map((stage) => data.records.filter((record) => record.stage.id === stage.id).length), 1);
  return <div className="space-y-6"><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="CRM metrics">{cards.map(({ label, value, delta, icon: Icon, color, bg }) => <article key={label} className="rounded-2xl border border-white/[0.07] bg-[#101512] p-5 shadow-card"><div className="flex items-start justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></span><span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/40">{delta}</span></div><p className="mt-5 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-white/38">{label}</p></article>)}</section>
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,.75fr)]"><article className="rounded-2xl border border-white/[0.07] bg-[#101512] p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-serif text-xl">Pipeline health</h2><p className="mt-1 text-xs text-white/35">Current lead distribution by stage</p></div><Activity className="h-5 w-5 text-dominus-gold/70" /></div><div className="mt-7 space-y-5">{data.stages.filter((stage) => stage.pipeline?.journey === 'tax-client').map((stage) => { const count = data.records.filter((record) => record.stage.id === stage.id).length; return <div key={stage.id}><div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium text-white/65">{stage.name}</span><span className="text-white/35">{count} lead{count === 1 ? '' : 's'}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-gradient-to-r from-dominus-emerald to-dominus-gold transition-all" style={{ width: `${Math.max(5, (count / maxStage) * 100)}%` }} /></div></div>; })}</div></article>
      <article className="rounded-2xl border border-white/[0.07] bg-[#101512] p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-serif text-xl">Priority queue</h2><p className="mt-1 text-xs text-white/35">What needs attention next</p></div><span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] text-amber-200">{data.attention.length} items</span></div><div className="mt-5 space-y-3">{data.attention.slice(0, 4).map((record) => <button key={record.id} onClick={() => onOpenRecord(record)} className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-left transition hover:border-dominus-gold/25 hover:bg-white/[0.04]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dominus-emerald/25 text-[11px] font-bold text-emerald-100">{initials(record)}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{record.contact.firstName} {record.contact.lastName}</span><span className="mt-0.5 block truncate text-[10px] text-white/35">{record.nextAction || 'Next action missing'}</span></span><span className="text-[10px] text-amber-200/75">{shortDate(record.nextActionAt)}</span></button>)}</div></article></section>
    <section className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-white/[0.07] bg-[#101512] p-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-400/10 p-2.5"><MessageSquareText className="h-5 w-5 text-emerald-300" /></span><div><p className="text-sm font-semibold">Instant lead response</p><p className="mt-0.5 text-[11px] text-white/35">New website leads enter the queue automatically.</p></div></div></div><div className="rounded-2xl border border-white/[0.07] bg-[#101512] p-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-sky-400/10 p-2.5"><CalendarDays className="h-5 w-5 text-sky-300" /></span><div><p className="text-sm font-semibold">Consultation booking</p><p className="mt-0.5 text-[11px] text-white/35">Reminders and booking flow are ready to connect.</p></div></div></div><div className="rounded-2xl border border-white/[0.07] bg-[#101512] p-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-dominus-gold/10 p-2.5"><Bot className="h-5 w-5 text-dominus-gold-light" /></span><div><p className="text-sm font-semibold">Follow-up automations</p><p className="mt-0.5 text-[11px] text-white/35">Sequences are designed and awaiting channel setup.</p></div></div></div></section>
  </div>;
}

function Pipeline({ groups, profiles, updatingId, onOpenRecord, onUpdateRecord }: { groups: Array<{ stage: DashboardData['stages'][number]; records: CrmRecord[] }>; profiles: DashboardData['profiles']; updatingId: string | null; onOpenRecord: (record: CrmRecord) => void; onUpdateRecord: (record: CrmRecord, changes: Record<string, unknown>) => void }) {
  if (!groups.length) return <EmptyState message="No pipeline stages are configured" />;
  return <div className="overflow-x-auto pb-4"><div className="grid min-w-[1180px] gap-4" style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(220px, 1fr))` }}>{groups.map(({ stage, records }) => <section key={stage.id} className="rounded-2xl border border-white/[0.07] bg-[#0d110f] p-3" aria-label={`${stage.name} pipeline stage`}><div className="mb-3 flex items-center justify-between px-1"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color || '#C9A227' }} /><h2 className="text-xs font-semibold uppercase tracking-wide text-white/60">{stage.name}</h2><span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/35">{records.length}</span></div><button aria-label={`More options for ${stage.name}`} className="text-white/25 hover:text-white"><MoreHorizontal className="h-4 w-4" /></button></div><div className="space-y-3">{records.map((record) => <article key={record.id} className="group rounded-xl border border-white/[0.075] bg-[#151b17] p-4 shadow-lg transition hover:-translate-y-0.5 hover:border-dominus-gold/25"><button onClick={() => onOpenRecord(record)} className="w-full text-left"><div className="flex items-start justify-between gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-dominus-emerald/25 text-[11px] font-bold text-emerald-100">{initials(record)}</span><span className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase ${record.priority === 'urgent' ? 'bg-red-400/10 text-red-300' : record.priority === 'high' ? 'bg-amber-400/10 text-amber-200' : 'bg-white/[0.05] text-white/35'}`}>{record.priority}</span></div><p className="mt-3 text-sm font-semibold">{record.contact.firstName} {record.contact.lastName}</p><p className="mt-1 truncate text-[11px] text-white/35">{record.contact.email || record.contact.phone}</p><div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3"><span className="flex items-center gap-1.5 text-[10px] text-white/35"><CalendarDays className="h-3.5 w-3.5 text-dominus-gold/65" /> {shortDate(record.nextActionAt)}</span><span className="text-[10px] text-white/30">{record.ownerName || 'Unassigned'}</span></div></button><label className="mt-3 block"><span className="sr-only">Move {record.contact.firstName} to another stage</span><select disabled={updatingId === record.id} value={record.stage.id} onChange={(event) => onUpdateRecord(record, { stageId: event.target.value })} className="w-full rounded-lg border border-white/[0.07] bg-black/25 px-2 py-2 text-[10px] text-white/50 outline-none focus:border-dominus-gold/40">{groups.map(({ stage: option }) => <option key={option.id} value={option.id}>Move to {option.name}</option>)}</select></label>{!record.assignedTo && profiles.length > 0 && <button onClick={() => onUpdateRecord(record, { assignedTo: profiles[0].id })} className="mt-2 text-[10px] font-semibold text-dominus-gold/75 hover:text-dominus-gold">Assign to {profiles[0].fullName}</button>}</article>)}{records.length === 0 && <div className="rounded-xl border border-dashed border-white/[0.07] px-4 py-8 text-center text-[11px] text-white/20">Drop leads here</div>}</div></section>)}</div></div>;
}

function Contacts({ data, searchInput, onSearchInput, onSearch, onOpenRecord }: { data: DashboardData | null; searchInput: string; onSearchInput: (value: string) => void; onSearch: () => void; onOpenRecord: (record: CrmRecord) => void }) {
  return <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101512]"><div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/[0.08] bg-black/20 px-3 sm:max-w-md"><Search className="h-4 w-4 text-white/25" /><input value={searchInput} onChange={(event) => onSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onSearch(); }} placeholder="Search contacts…" className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-white/25" /></div><div className="flex gap-2"><button onClick={onSearch} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-white/55 hover:text-white"><Filter className="h-4 w-4" /> Filter</button><button className="btn-gold inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"><Plus className="h-4 w-4" /> Add contact</button></div></div>{data?.records.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-black/20 text-[9px] font-bold uppercase tracking-[0.16em] text-white/25"><tr><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Source</th><th className="px-5 py-3">Stage</th><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Next action</th><th className="px-5 py-3"></th></tr></thead><tbody>{data.records.map((record) => <tr key={record.id} className="border-t border-white/[0.055] transition hover:bg-white/[0.025]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-dominus-emerald/25 text-[11px] font-bold text-emerald-100">{initials(record)}</span><div><p className="text-sm font-semibold">{record.contact.firstName} {record.contact.lastName}</p><p className="mt-0.5 text-[10px] text-white/35">{record.contact.email || record.contact.phone || 'No contact details'}</p></div></div></td><td className="px-5 py-4 text-xs text-white/45">{record.contact.leadSource}</td><td className="px-5 py-4"><span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] text-white/55">{record.stage.name}</span></td><td className="px-5 py-4 text-xs text-white/45">{record.ownerName || 'Unassigned'}</td><td className="px-5 py-4"><p className="max-w-48 truncate text-xs text-white/55">{record.nextAction || 'Not set'}</p><p className="mt-1 text-[10px] text-white/25">{shortDate(record.nextActionAt)}</p></td><td className="px-5 py-4"><button onClick={() => onOpenRecord(record)} className="rounded-lg border border-white/[0.08] px-3 py-2 text-[10px] font-semibold text-dominus-gold hover:border-dominus-gold/30">Open</button></td></tr>)}</tbody></table></div> : <div className="p-5"><EmptyState message="No contacts found" /></div>}</section>;
}

function Automations() {
  const flows = [
    { name: 'New lead instant response', trigger: 'Website form submitted', channels: ['SMS', 'Email'], status: 'Active', icon: Sparkles, stats: '98% delivered' },
    { name: 'Consultation reminders', trigger: 'Appointment booked', channels: ['SMS', 'Email'], status: 'Ready', icon: CalendarDays, stats: '3-step sequence' },
    { name: 'Incomplete onboarding', trigger: 'Form not completed in 24h', channels: ['Email'], status: 'Draft', icon: ContactRound, stats: 'Needs content review' },
    { name: 'No-show recovery', trigger: 'Appointment marked no-show', channels: ['SMS'], status: 'Ready', icon: RefreshCw, stats: '2-step sequence' },
  ];
  return <div className="space-y-5"><div className="rounded-2xl border border-dominus-gold/15 bg-gradient-to-br from-dominus-emerald/25 to-[#101512] p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-xs font-semibold text-dominus-gold-light"><Bot className="h-4 w-4" /> Automation command center</div><h2 className="mt-3 font-serif text-2xl sm:text-3xl">Follow up without chasing every lead</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">Each workflow starts from a real client action, sends the right message, and creates a team task when human attention is needed.</p></div><button className="btn-gold inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm"><Plus className="h-4 w-4" /> New workflow</button></div></div><section className="grid gap-4 lg:grid-cols-2">{flows.map(({ name, trigger, channels, status, icon: Icon, stats }) => <article key={name} className="rounded-2xl border border-white/[0.07] bg-[#101512] p-5"><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-dominus-emerald/20"><Icon className="h-5 w-5 text-emerald-300" /></span><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${status === 'Active' ? 'bg-emerald-400/10 text-emerald-300' : status === 'Draft' ? 'bg-white/[0.05] text-white/35' : 'bg-dominus-gold/10 text-dominus-gold-light'}`}>{status}</span></div><h3 className="mt-4 font-semibold">{name}</h3><p className="mt-1 text-xs text-white/35">When: {trigger}</p><div className="mt-5 flex items-center gap-2">{channels.map((channel) => <span key={channel} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-black/20 px-2.5 py-1.5 text-[10px] text-white/50">{channel === 'SMS' ? <Phone className="h-3 w-3" /> : <Mail className="h-3 w-3" />}{channel}</span>)}<span className="ml-auto text-[10px] text-white/25">{stats}</span></div><div className="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4"><span className="h-2 w-2 rounded-full bg-dominus-gold" /><span className="h-px flex-1 bg-gradient-to-r from-dominus-gold/50 to-white/10" /><span className="h-2 w-2 rounded-full bg-dominus-emerald" /><span className="h-px flex-1 bg-gradient-to-r from-dominus-emerald/50 to-white/10" /><span className="h-2 w-2 rounded-full bg-white/25" /></div></article>)}</section></div>;
}

function Campaigns() {
  const campaigns = [
    { name: '2027 tax season opening', audience: 'All active leads', channel: 'Email + SMS', status: 'Draft', sent: '—' },
    { name: 'Document checklist reminder', audience: 'Onboarding clients', channel: 'Email', status: 'Ready', sent: '—' },
    { name: 'Consultation follow-up', audience: 'Contacted leads', channel: 'SMS', status: 'Active', sent: '124' },
  ];
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"><section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101512]"><div className="flex items-center justify-between border-b border-white/[0.07] p-5"><div><h2 className="font-serif text-xl">Recent campaigns</h2><p className="mt-1 text-xs text-white/35">Targeted messages across email and SMS</p></div><button className="btn-gold inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"><Plus className="h-4 w-4" /> Create</button></div><div className="divide-y divide-white/[0.06]">{campaigns.map((campaign) => <div key={campaign.name} className="grid gap-3 p-5 sm:grid-cols-[1fr_150px_100px_36px] sm:items-center"><div><p className="text-sm font-semibold">{campaign.name}</p><p className="mt-1 text-[10px] text-white/30">Audience: {campaign.audience}</p></div><span className="text-xs text-white/45">{campaign.channel}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${campaign.status === 'Active' ? 'bg-emerald-400/10 text-emerald-300' : campaign.status === 'Ready' ? 'bg-dominus-gold/10 text-dominus-gold-light' : 'bg-white/[0.05] text-white/35'}`}>{campaign.status}</span><button aria-label={`More options for ${campaign.name}`} className="text-white/25 hover:text-white"><MoreHorizontal className="h-4 w-4" /></button></div>)}</div></section><aside className="rounded-2xl border border-white/[0.07] bg-[#101512] p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-dominus-gold/10"><Send className="h-5 w-5 text-dominus-gold-light" /></span><h2 className="mt-4 font-serif text-xl">Channel setup</h2><p className="mt-2 text-sm leading-relaxed text-white/38">Connect verified sending providers before campaigns can go live.</p><div className="mt-6 space-y-3"><div className="flex items-center justify-between rounded-xl border border-white/[0.07] p-3"><span className="flex items-center gap-2 text-xs text-white/55"><Mail className="h-4 w-4" /> Business email</span><span className="text-[10px] text-amber-200">Pending</span></div><div className="flex items-center justify-between rounded-xl border border-white/[0.07] p-3"><span className="flex items-center gap-2 text-xs text-white/55"><Phone className="h-4 w-4" /> SMS number</span><span className="text-[10px] text-amber-200">Pending</span></div></div><button className="mt-5 w-full rounded-xl border border-dominus-gold/25 py-3 text-xs font-semibold text-dominus-gold">Configure channels</button></aside></div>;
}
