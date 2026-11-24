import { requireAdmin } from '../../../server/src/adminAuth.js';
import { getProductionRuntime } from '../../../server/src/productionRuntime.js';
import { requireSameOrigin } from '../../../server/src/requestSecurity.js';
import { errorResponse, jsonResponse, readLimitedJson } from '../../../server/src/webResponse.js';

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

export async function PATCH(request: Request) {
  try {
    requireSameOrigin(request);
    const runtime = getProductionRuntime();
    const actor = await requireAdmin(request, runtime.supabase);
    const contact = await runtime.crmAdminService.updateContact(
      routeId(request),
      await readLimitedJson(request),
      actor.id,
    );
    return jsonResponse({ contact });
  } catch (error) {
    return errorResponse(error);
  }
}

