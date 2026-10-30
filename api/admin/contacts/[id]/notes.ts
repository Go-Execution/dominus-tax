import { requireAdmin } from '../../../../server/src/adminAuth.js';
import { getProductionRuntime } from '../../../../server/src/productionRuntime.js';
import { requireSameOrigin } from '../../../../server/src/requestSecurity.js';
import { errorResponse, jsonResponse, readLimitedJson } from '../../../../server/src/webResponse.js';

function routeId(request: Request) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - 2] || '');
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const runtime = getProductionRuntime();
    const actor = await requireAdmin(request, runtime.supabase);
    const activity = await runtime.crmAdminService.addNote(
      routeId(request),
      await readLimitedJson(request),
      actor.id,
    );
    return jsonResponse({ activity }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

