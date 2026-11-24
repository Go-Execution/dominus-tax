import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

type CalendarEvent = { id: string; kind: 'task' | 'follow-up'; title: string; at: string };
type CalendarResponse = { events: CalendarEvent[]; truncated: boolean };
const bookingUrl = 'https://calendly.com/dominustaxconsultantsllc/30min';
const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const dayKey = (date: Date) => `${monthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;

export default function CalendarView({ token, preview }: { token?: string; preview: boolean }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(() => dayKey(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = monthKey(month);

  useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    setLoading(true); setError(null);
    void fetch(`/api/admin/dashboard?view=calendar&month=${key}`, { credentials: 'include', headers: token ? { authorization: `Bearer ${token}` } : {}, signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Calendar could not be loaded.');
        return response.json() as Promise<CalendarResponse>;
      })
      .then((result) => { setEvents(result.events); setTruncated(result.truncated); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Calendar could not be loaded.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [key, token, preview]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const date = new Date(event.at);
      if (Number.isNaN(date.getTime())) continue;
      const day = dayKey(date);
      map.set(day, [...(map.get(day) || []), event]);
    }
    return map;
  }, [events]);
  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const selectedEvents = byDay.get(selectedDay) || [];
  const changeMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next); setSelectedDay(dayKey(next));
  };

  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
    <section className="rounded-2xl border border-white/[0.07] bg-[#101512] p-4 sm:p-6" aria-label="CRM calendar">
      <div className="mb-6 flex items-center justify-between gap-3"><div><h2 className="font-serif text-xl">{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(month)}</h2><p className="mt-1 text-xs text-white/40">Due tasks and CRM follow-ups · times shown in your local timezone</p></div><div className="flex gap-2"><button onClick={() => changeMonth(-1)} aria-label="Previous month" className="rounded-lg border border-white/10 p-2 text-white/65"><ChevronLeft className="h-4 w-4" /></button><button onClick={() => changeMonth(1)} aria-label="Next month" className="rounded-lg border border-white/10 p-2 text-white/65"><ChevronRight className="h-4 w-4" /></button></div></div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
      {truncated && <p className="mb-4 text-xs text-amber-200">This month has more than 1,000 items of one type; some are not shown.</p>}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-white/35">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((name) => <span key={name} className="py-2">{name}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">{Array.from({ length: firstWeekday }, (_, index) => <span key={`empty-${index}`} />)}{Array.from({ length: dayCount }, (_, index) => { const date = new Date(month.getFullYear(), month.getMonth(), index + 1); const day = dayKey(date); const count = byDay.get(day)?.length || 0; return <button key={day} onClick={() => setSelectedDay(day)} aria-label={`${date.toDateString()}, ${count} scheduled items`} aria-pressed={selectedDay === day} className={`min-h-16 rounded-xl border p-2 text-left transition sm:min-h-24 ${selectedDay === day ? 'border-dominus-gold/60 bg-dominus-gold/10' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20'}`}><span className="text-xs text-white/70">{index + 1}</span>{count > 0 && <span className="mt-2 block rounded bg-dominus-emerald/35 px-1 py-0.5 text-center text-[10px] text-emerald-100">{count} item{count === 1 ? '' : 's'}</span>}</button>; })}</div>
    </section>
    <aside className="space-y-4"><div className="rounded-2xl border border-white/[0.07] bg-[#101512] p-5"><h2 className="font-serif text-lg">{new Date(`${selectedDay}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2><p className="mt-1 text-xs text-white/35">{loading ? 'Loading…' : `${selectedEvents.length} scheduled item${selectedEvents.length === 1 ? '' : 's'}`}</p><div className="mt-5 space-y-3">{selectedEvents.map((event) => <div key={`${event.kind}-${event.id}`} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3"><span className="text-[10px] font-bold uppercase tracking-wider text-dominus-gold">{event.kind === 'task' ? 'Task' : 'Follow-up'}</span><p className="mt-1 text-sm text-white/80">{event.title}</p><p className="mt-1 text-xs text-white/40">{new Date(event.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p></div>)}{!loading && selectedEvents.length === 0 && <p className="text-sm text-white/35">Nothing due on this day.</p>}</div></div><div className="rounded-2xl border border-dominus-gold/15 bg-dominus-gold/[0.05] p-5"><CalendarDays className="h-5 w-5 text-dominus-gold" /><h3 className="mt-3 text-sm font-semibold">Consultation booking</h3><p className="mt-2 text-xs leading-relaxed text-white/40">Open the existing Calendly booking page. Confirmed Calendly appointments are not synced into this CRM calendar yet.</p><a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-dominus-gold-light">Open booking page <ExternalLink className="h-3 w-3" /></a></div></aside>
  </div>;
}
