import { requireCrmUser } from '../../server/src/adminAuth.js';
import { getProductionRuntime } from '../../server/src/productionRuntime.js';
import { errorResponse, jsonResponse } from '../../server/src/webResponse.js';

export async function GET(request: Request) {
  try {
    const runtime = getProductionRuntime();
    const identity = await requireCrmUser(request, runtime.supabase);
    return jsonResponse({
      user: {
        id: identity.user.id,
        email: identity.user.email,
        fullName: identity.profile.fullName,
        role: identity.profile.role,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
