import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  RefreshCw,
  ShieldCheck,
  Users,
  LogIn,
  LogOut,
  Mail,
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { isLocalAdminBypass, isSupabaseConfigured, supabase } from '@/lib/supabase';

type Journey = 'tax-client' | 'consultant';
type SyncStatus = 'received' | 'synced' | 'failed';

interface Submission {
  id: string;
  sourceSubmissionId: string;
  journey: Journey;
  status: SyncStatus;
  stage: string;
  phoneLastFour: string;
  externalContactId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  generatedAt: string;
  metrics: {
    total: number;
    taxClients: number;
    consultants: number;
    synced: number;
    failed: number;
    needsAttention: number;
    readyConsultants: number;
  };
  attention: Submission[];
  recent: Submission[];
  stages: {
    taxClient: string[];
    consultant: string[];
  };
}

interface CrmIdentity {
  id: string;
  email?: string;
  fullName: string;
  role: 'admin' | 'consultant';
}

const METRIC_DEFINITIONS = [
  { key: 'total', label: 'Total Intakes', icon: Users },
  { key: 'taxClients', label: 'Tax Clients', icon: CircleDollarSign },
  { key: 'consultants', label: 'Consultants', icon: BriefcaseBusiness },
  { key: 'readyConsultants', label: 'Ready Consultants', icon: CheckCircle2 },
] as const;

function titleCase(value: string) {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace('Ptin', 'PTIN');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function journeyLabel(journey: Journey) {
  return journey === 'consultant' ? 'Consultant' : 'Tax Client';
}

function SyncBadge({ status }: { status: SyncStatus }) {
  const styles = {
    synced: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
    failed: 'border-red-400/25 bg-red-400/10 text-red-300',
    received: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
  }[status];

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${styles}`}>
      {status}
    </span>
  );
}

interface SubmissionRowProps {
  submission: Submission;
  stages: DashboardData['stages'];
  updatingId: string | null;
  onStageChange: (submission: Submission, stage: string) => void;
}

function SubmissionRow({ submission, stages, updatingId, onStageChange }: SubmissionRowProps) {
  const availableStages =
    submission.journey === 'consultant' ? stages.consultant : stages.taxClient;

  return (
    <tr className="border-b border-white/5 last:border-0 hover:bg-white/[0.025]">
      <td className="px-5 py-4">
        <p className="font-montserrat text-sm font-semibold text-dominus-text-primary">
          {submission.sourceSubmissionId}
        </p>
        <p className="mt-1 text-xs text-dominus-text-primary/40">
          Contact •••• {submission.phoneLastFour}
        </p>
      </td>
      <td className="px-5 py-4">
        <span className="text-sm text-dominus-text-primary/75">
          {journeyLabel(submission.journey)}
        </span>
      </td>
      <td className="px-5 py-4">
        <select
          value={submission.stage}
          disabled={updatingId === submission.id}
          onChange={(event) => onStageChange(submission, event.target.value)}
          className="min-w-48 rounded-lg border border-dominus-gold/20 bg-dominus-black px-3 py-2 text-sm text-dominus-text-primary outline-none transition focus:border-dominus-gold disabled:opacity-50"
          aria-label={`Pipeline stage for ${submission.sourceSubmissionId}`}
        >
          {availableStages.map((stage) => (
            <option key={stage} value={stage}>
              {titleCase(stage)}
            </option>
          ))}
        </select>
      </td>
      <td className="px-5 py-4">
        <SyncBadge status={submission.status} />
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-xs text-dominus-text-primary/45">
        {formatDate(submission.updatedAt)}
      </td>
    </tr>
  );
}

export default function AdminDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [identity, setIdentity] = useState<CrmIdentity | null>(null);
  const [authLoading, setAuthLoading] = useState(!isLocalAdminBypass);
  const [email, setEmail] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLocalAdminBypass) return;
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    void supabase.auth.getSession().then(({ data: authData }) => {
      setSession(authData.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLocalAdminBypass || !session) return;
    setAuthLoading(true);
    void fetch('/api/auth/me', {
      headers: { authorization: `Bearer ${session.access_token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || 'This account is not authorized for Dominus CRM.');
        }
        const body = (await response.json()) as { user: CrmIdentity };
        setIdentity(body.user);
        setAuthMessage(null);
      })
      .catch((profileError: unknown) => {
        setIdentity(null);
        setAuthMessage(
          profileError instanceof Error
            ? profileError.message
            : 'This account is not authorized for Dominus CRM.',
        );
      })
      .finally(() => setAuthLoading(false));
  }, [session]);

  const loadDashboard = useCallback(async () => {
    if (!isLocalAdminBypass && (!session || identity?.role !== 'admin')) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          accept: 'application/json',
          ...(session ? { authorization: `Bearer ${session.access_token}` } : {}),
        },
      });
      if (!response.ok) throw new Error('Dashboard API is not available.');
      setData((await response.json()) as DashboardData);
    } catch {
      setError('Start the local API with “npm run dev:api”, then refresh this page.');
    } finally {
      setLoading(false);
    }
  }, [identity?.role, session]);

  useEffect(() => {
    if (isLocalAdminBypass || identity?.role === 'admin') void loadDashboard();
  }, [identity?.role, loadDashboard]);

  const handleStageChange = async (submission: Submission, stage: string) => {
    const previous = data;
    if (!previous) return;
    setUpdatingId(submission.id);
    setError(null);
    setData({
      ...previous,
      recent: previous.recent.map((item) =>
        item.id === submission.id ? { ...item, stage } : item,
      ),
      attention: previous.attention.map((item) =>
        item.id === submission.id ? { ...item, stage } : item,
      ),
    });

    try {
      const response = await fetch(
        `/api/admin/submissions/${encodeURIComponent(submission.id)}/stage`,
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
            ...(session ? { authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ stage }),
        },
      );
      if (!response.ok) throw new Error('Stage update failed.');
      await loadDashboard();
    } catch {
      setData(previous);
      setError('The pipeline stage could not be updated. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const attentionIds = useMemo(
    () => new Set(data?.attention.map((item) => item.id) || []),
    [data],
  );

  const sendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthMessage(null);
    if (!supabase) {
      setAuthMessage('Supabase browser environment variables are not configured.');
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/#admin`,
        shouldCreateUser: false,
      },
    });
    setAuthMessage(
      signInError
        ? signInError.message
        : 'Secure sign-in link sent. Check the approved work email inbox.',
    );
  };

  const signOut = async () => {
    setIdentity(null);
    if (supabase) await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dominus-black">
        <RefreshCw className="h-8 w-8 animate-spin text-dominus-gold" aria-label="Loading login" />
      </div>
    );
  }

  if (!isLocalAdminBypass && !session) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-dominus-black px-5 text-dominus-text-primary">
        <div className="absolute inset-0 gold-radial opacity-60" />
        <div className="relative w-full max-w-md rounded-3xl border border-dominus-gold/25 bg-dominus-charcoal p-8 shadow-card sm:p-10">
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#home';
            }}
            className="mb-8 flex items-center gap-2 text-sm text-dominus-gold/75 transition hover:text-dominus-gold"
          >
            <ArrowLeft className="h-4 w-4" /> Return to website
          </button>
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-dominus-gold/30 bg-dominus-gold/10">
            <LogIn className="h-6 w-6 text-dominus-gold" />
          </div>
          <p className="font-montserrat text-[10px] font-bold uppercase tracking-[0.25em] text-dominus-gold/70">
            Secure CRM Access
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Dominus 360 CRM</h1>
          <p className="mt-3 text-sm leading-relaxed text-dominus-text-primary/50">
            Enter an approved team email. Supabase will send a one-time secure sign-in link and
            apply the account’s CRM role.
          </p>
          <form onSubmit={sendMagicLink} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block font-montserrat text-xs font-semibold uppercase tracking-wider text-dominus-text-primary/55">
                Work email
              </span>
              <span className="flex items-center gap-3 rounded-xl border border-dominus-gold/20 bg-dominus-black px-4 focus-within:border-dominus-gold/60">
                <Mail className="h-4 w-4 text-dominus-gold/60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="amanda@example.com"
                  className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-white/20"
                />
              </span>
            </label>
            <button type="submit" className="btn-gold w-full rounded-xl px-5 py-3.5">
              Email Secure Sign-In Link
            </button>
          </form>
          {!isSupabaseConfigured && (
            <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs text-amber-100">
              Supabase frontend variables must be configured before login can work.
            </p>
          )}
          {authMessage && (
            <p className="mt-4 text-center text-sm text-dominus-gold-light">{authMessage}</p>
          )}
        </div>
      </div>
    );
  }

  if (!isLocalAdminBypass && session && !identity) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dominus-black px-5 text-dominus-text-primary">
        <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-dominus-charcoal p-8 text-center shadow-card">
          <AlertTriangle className="mx-auto h-9 w-9 text-red-300" />
          <h1 className="mt-5 font-serif text-3xl font-semibold">Access not provisioned</h1>
          <p className="mt-3 text-sm text-dominus-text-primary/55">
            {authMessage || 'This authenticated account does not have an active Dominus CRM role.'}
          </p>
          <button type="button" onClick={() => void signOut()} className="btn-gold mt-7 rounded-xl px-6 py-3">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!isLocalAdminBypass && identity?.role === 'consultant') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dominus-black px-5 text-dominus-text-primary">
        <div className="w-full max-w-xl rounded-3xl border border-dominus-gold/20 bg-dominus-charcoal p-8 shadow-card sm:p-10">
          <ShieldCheck className="h-10 w-10 text-dominus-gold" />
          <p className="mt-6 font-montserrat text-[10px] font-bold uppercase tracking-[0.25em] text-dominus-gold/70">
            Consultant Access Verified
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Welcome, {identity.fullName}</h1>
          <p className="mt-4 text-sm leading-relaxed text-dominus-text-primary/55">
            Your account is active and restricted to assigned work. The consultant workspace is the
            next CRM module; Amanda’s administrative dashboard remains inaccessible to this role.
          </p>
          <button type="button" onClick={() => void signOut()} className="btn-gold-outline mt-8 rounded-xl px-5 py-3">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dominus-black text-dominus-text-primary">
      <div className="border-b border-dominus-gold/20 bg-dominus-charcoal/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#home';
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-dominus-gold/25 text-dominus-gold transition hover:bg-dominus-gold/10"
              aria-label="Return to website"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="font-montserrat text-[10px] font-bold uppercase tracking-[0.25em] text-dominus-gold/70">
                Dominus Operations
              </p>
              <h1 className="font-serif text-3xl font-semibold">Amanda Dashboard</h1>
              {identity && (
                <p className="mt-1 text-xs text-dominus-text-primary/40">
                  Signed in as {identity.fullName} · Administrator
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-dominus-emerald/40 bg-dominus-emerald/10 px-4 py-2 font-montserrat text-xs font-semibold text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              {isLocalAdminBypass ? 'Local Prototype' : 'Secure Session'}
            </span>
            {session && supabase && (
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-dominus-text-primary/55 transition hover:text-dominus-gold"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            )}
            <button
              type="button"
              onClick={() => void loadDashboard()}
              disabled={loading}
              className="btn-gold-outline flex items-center gap-2 rounded-lg px-4 py-2 text-xs disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="mb-8 rounded-xl border border-dominus-gold/15 bg-dominus-gold/5 px-5 py-4 text-sm text-dominus-text-primary/65">
          This local view stores masked workflow metadata only. Names, full contact details, tax
          documents, SSNs, and form answers are not stored in this dashboard database.
        </div>

        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-400/10 px-5 py-4 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && !data ? (
          <div className="flex min-h-72 items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-dominus-gold" aria-label="Loading" />
          </div>
        ) : data ? (
          <>
            <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {METRIC_DEFINITIONS.map(({ key, label, icon: Icon }) => (
                <article key={key} className="luxury-card rounded-2xl p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="text-sm text-dominus-text-primary/55">{label}</span>
                    <Icon className="h-5 w-5 text-dominus-gold" />
                  </div>
                  <p className="font-serif text-4xl font-semibold">{data.metrics[key]}</p>
                </article>
              ))}
            </section>

            <section className="mb-10 overflow-hidden rounded-2xl border border-amber-300/20 bg-dominus-charcoal">
              <div className="flex flex-col gap-3 border-b border-white/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-300" />
                    <h2 className="font-serif text-2xl font-semibold">Needs Amanda’s Attention</h2>
                  </div>
                  <p className="mt-1 text-sm text-dominus-text-primary/45">
                    Failed syncs, missing documents, or access blockers.
                  </p>
                </div>
                <span className="w-fit rounded-full bg-amber-300/10 px-3 py-1 text-sm font-semibold text-amber-200">
                  {data.metrics.needsAttention} open
                </span>
              </div>
              {data.attention.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-black/20 font-montserrat text-[10px] uppercase tracking-wider text-dominus-text-primary/40">
                      <tr>
                        <th className="px-5 py-3">Submission</th>
                        <th className="px-5 py-3">Journey</th>
                        <th className="px-5 py-3">Pipeline Stage</th>
                        <th className="px-5 py-3">Sync</th>
                        <th className="px-5 py-3">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.attention.map((submission) => (
                        <SubmissionRow
                          key={submission.id}
                          submission={submission}
                          stages={data.stages}
                          updatingId={updatingId}
                          onStageChange={handleStageChange}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-10 text-center text-sm text-dominus-text-primary/45">
                  Nothing needs attention right now.
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-dominus-gold/15 bg-dominus-charcoal">
              <div className="border-b border-white/5 px-6 py-5">
                <h2 className="font-serif text-2xl font-semibold">Recent Intake Activity</h2>
                <p className="mt-1 text-sm text-dominus-text-primary/45">
                  Update a pipeline stage directly from this local prototype.
                </p>
              </div>
              {data.recent.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-black/20 font-montserrat text-[10px] uppercase tracking-wider text-dominus-text-primary/40">
                      <tr>
                        <th className="px-5 py-3">Submission</th>
                        <th className="px-5 py-3">Journey</th>
                        <th className="px-5 py-3">Pipeline Stage</th>
                        <th className="px-5 py-3">Sync</th>
                        <th className="px-5 py-3">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent.map((submission) => (
                        <SubmissionRow
                          key={submission.id}
                          submission={submission}
                          stages={data.stages}
                          updatingId={updatingId}
                          onStageChange={handleStageChange}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-14 text-center">
                  <p className="font-serif text-xl text-dominus-text-primary/75">No local intakes yet</p>
                  <p className="mt-2 text-sm text-dominus-text-primary/40">
                    Submit a development payload to the local intake API to populate this view.
                  </p>
                </div>
              )}
              {attentionIds.size > 0 && (
                <div className="border-t border-white/5 px-6 py-3 text-xs text-dominus-text-primary/35">
                  Attention items remain visible here as part of the complete activity history.
                </div>
              )}
            </section>

            <p className="mt-5 text-right text-xs text-dominus-text-primary/30">
              Last refreshed {formatDate(data.generatedAt)}
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}
