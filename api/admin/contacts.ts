import { requireAdmin } from '../../server/src/adminAuth.js';
import { getProductionRuntime } from '../../server/src/productionRuntime.js';
import { requireSameOrigin } from '../../server/src/requestSecurity.js';
import { errorResponse, jsonResponse, readLimitedJson } from '../../server/src/webResponse.js';

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const runtime = getProductionRuntime();
    const actor = await requireAdmin(request, runtime.supabase);
    const lead = await runtime.crmAdminService.createManualLead(
      await readLimitedJson(request),
      actor.id,
    );
    return jsonResponse({ lead }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
