import { jsonResponse } from '../server/src/webResponse.js';

export function GET() {
  return jsonResponse({
    ok: true,
    service: 'dominus-api',
    storage: 'supabase',
    integration: 'internal-crm',
  });
}
