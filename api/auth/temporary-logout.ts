import { clearTemporaryAdminCookie } from '../../server/src/temporaryAdminAuth.js';
import { jsonResponse } from '../../server/src/webResponse.js';

export async function POST() {
  const response = jsonResponse({ ok: true });
  response.headers.set('set-cookie', clearTemporaryAdminCookie());
  return response;
}

