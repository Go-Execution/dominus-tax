import { requireAdmin } from '../../../server/src/adminAuth.js';
import { getProductionRuntime } from '../../../server/src/productionRuntime.js';
import { requireSameOrigin } from '../../../server/src/requestSecurity.js';
import { errorResponse, jsonResponse, readLimitedJson } from '../../../server/src/webResponse.js';

function routeId(request: Request) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || '');
}

export async function PATCH(request: Request) {
  try {
    requireSameOrigin(request);
    const runtime = getProductionRuntime();
    const actor = await requireAdmin(request, runtime.supabase);
    const opportunity = await runtime.crmAdminService.updateOpportunity(
      routeId(request),
      await readLimitedJson(request),
      actor.id,
    );
    return jsonResponse({ opportunity });
  } catch (error) {
    return errorResponse(error);
  }
}

