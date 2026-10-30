import { clearTemporaryAdminCookie } from '../../server/src/temporaryAdminAuth.js';
import { jsonResponse } from '../../server/src/webResponse.js';
import { requireSameOrigin } from '../../server/src/requestSecurity.js';

export async function POST(request: Request) {
  requireSameOrigin(request);
  const response = jsonResponse({ ok: true });
  response.headers.set('set-cookie', clearTemporaryAdminCookie());
  return response;
}

