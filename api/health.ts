import { jsonResponse } from '../server/src/webResponse.js';
import { getProductionRuntime } from '../server/src/productionRuntime.js';

export async function GET() {
  const base = {
    service: 'dominus-api',
    storage: 'supabase',
    integration: 'internal-crm',
  };

  try {
    const { error } = await getProductionRuntime().supabase
      .from('crm_pipelines')
      .select('id')
      .limit(1);
    if (error) throw error;
    return jsonResponse({ ok: true, status: 'healthy', ...base });
  } catch {
    return jsonResponse({ ok: false, status: 'degraded', ...base }, 503);
  }
}
