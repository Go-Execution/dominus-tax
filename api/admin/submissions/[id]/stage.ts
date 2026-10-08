import { requireAdmin } from '../../../../server/src/adminAuth.js';
import { getProductionRuntime } from '../../../../server/src/productionRuntime.js';
import {
  errorResponse,
  jsonResponse,
  readLimitedJson,
} from '../../../../server/src/webResponse.js';

export async function PATCH(request: Request) {
  try {
    const runtime = getProductionRuntime();
    await requireAdmin(request, runtime.supabase);
    const body = (await readLimitedJson(request)) as { stage?: unknown };
    const parts = new URL(request.url).pathname.split('/').filter(Boolean);
    const submissionId = decodeURIComponent(parts.at(-2) || '');
    if (!submissionId) return jsonResponse({ error: 'Submission ID is required.' }, 400);
    const submission = await runtime.adminService.updateStage(submissionId, body.stage);
    return jsonResponse({ submission });
  } catch (error) {
    return errorResponse(error);
  }
}
