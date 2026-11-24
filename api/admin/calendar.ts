import { requireAdmin } from '../../server/src/adminAuth.js';
import { getProductionRuntime } from '../../server/src/productionRuntime.js';
import { HttpError } from '../../server/src/httpError.js';
import { errorResponse, jsonResponse } from '../../server/src/webResponse.js';

export async function GET(request: Request) {
  try {
    const runtime = getProductionRuntime();
    await requireAdmin(request, runtime.supabase);
    const month = new URL(request.url).searchParams.get('month') || '';
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new HttpError(400, 'A valid month is required.');
    const [year, number] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, number - 1, 0)).toISOString();
    const end = new Date(Date.UTC(year, number, 2)).toISOString();
    const [actions, tasks] = await Promise.all([
      runtime.supabase.from('crm_opportunities').select('id,title,next_action,next_action_at,status').eq('status', 'open').gte('next_action_at', start).lt('next_action_at', end).order('next_action_at').limit(1001),
      runtime.supabase.from('crm_tasks').select('id,title,due_at,status').in('status', ['open', 'in-progress']).gte('due_at', start).lt('due_at', end).order('due_at').limit(1001),
    ]);
    if (actions.error || tasks.error) throw new HttpError(503, 'Calendar data is temporarily unavailable.');
    const events = [
      ...(actions.data || []).slice(0, 1000).map((item) => ({ id: item.id, kind: 'follow-up', title: item.next_action || item.title, at: item.next_action_at })),
      ...(tasks.data || []).slice(0, 1000).map((item) => ({ id: item.id, kind: 'task', title: item.title, at: item.due_at })),
    ].sort((a, b) => String(a.at).localeCompare(String(b.at)));
    return jsonResponse({ month, events, truncated: (actions.data?.length || 0) > 1000 || (tasks.data?.length || 0) > 1000 });
  } catch (error) {
    return errorResponse(error);
  }
}
