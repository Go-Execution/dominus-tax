import { jsonResponse } from '../server/src/webResponse.js';

export function GET() {
  return jsonResponse({
    ok: true,
    service: 'dominus-api',
    storage: 'supabase',
    ghlMode: process.env.GHL_INTEGRATION_MODE || 'disabled',
  });
}
