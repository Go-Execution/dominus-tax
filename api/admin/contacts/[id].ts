import { requireAdmin } from '../../../server/src/adminAuth.js';
import { getProductionRuntime } from '../../../server/src/productionRuntime.js';
import { errorResponse, jsonResponse } from '../../../server/src/webResponse.js';

function routeId(request: Request) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || '');
}

export async function GET(request: Request) {
  try {
    const runtime = getProductionRuntime();
    await requireAdmin(request, runtime.supabase);
    return jsonResponse(await runtime.crmAdminService.contactDetail(routeId(request)));
  } catch (error) {
    return errorResponse(error);
  }
}

