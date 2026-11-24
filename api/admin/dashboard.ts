import { requireAdmin } from '../../server/src/adminAuth.js';
import { getProductionRuntime } from '../../server/src/productionRuntime.js';
import { errorResponse, jsonResponse } from '../../server/src/webResponse.js';
import { crmCalendar } from '../../server/src/crmCalendar.js';

export async function GET(request: Request) {
  try {
    const runtime = getProductionRuntime();
    await requireAdmin(request, runtime.supabase);
    const url = new URL(request.url);
    if (url.searchParams.get('view') === 'calendar') {
      return jsonResponse(await crmCalendar(runtime.supabase, url.searchParams.get('month') || ''));
    }
    return jsonResponse(await runtime.crmAdminService.dashboard(url));
  } catch (error) {
    return errorResponse(error);
  }
}
