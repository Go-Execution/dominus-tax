import { requireAdmin } from '../../server/src/adminAuth.js';
import { getProductionRuntime } from '../../server/src/productionRuntime.js';
import { errorResponse, jsonResponse } from '../../server/src/webResponse.js';

export async function GET(request: Request) {
  try {
    const runtime = getProductionRuntime();
    await requireAdmin(request, runtime.supabase);
    return jsonResponse(await runtime.crmAdminService.dashboard(new URL(request.url)));
  } catch (error) {
    return errorResponse(error);
  }
}
