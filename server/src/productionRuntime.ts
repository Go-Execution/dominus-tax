import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AdminService } from './adminService.js';
import { DisabledGhlAdapter, MockGhlAdapter } from './ghl.js';
import { IntakeService } from './intakeService.js';
import { SupabaseIntakeStore } from './supabaseStore.js';

export interface ProductionRuntime {
  supabase: SupabaseClient;
  intakeService: IntakeService;
  adminService: AdminService;
}

let runtime: ProductionRuntime | null = null;

function requiredEnvironment(name: string, alternatives: string[] = []) {
  const names = [name, ...alternatives];
  for (const candidate of names) {
    const value = process.env[candidate]?.trim();
    if (value) return value;
  }
  throw new Error(`Missing required server environment variable: ${names.join(' or ')}`);
}

export function getProductionRuntime(): ProductionRuntime {
  if (runtime) return runtime;

  const url = requiredEnvironment('SUPABASE_URL');
  const secretKey = requiredEnvironment('SUPABASE_SECRET_KEY', ['SUPABASE_SERVICE_ROLE_KEY']);
  const supabase = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const store = new SupabaseIntakeStore(supabase);
  const ghl = process.env.GHL_INTEGRATION_MODE === 'mock'
    ? new MockGhlAdapter()
    : new DisabledGhlAdapter();

  runtime = {
    supabase,
    intakeService: new IntakeService(store, ghl),
    adminService: new AdminService(store),
  };
  return runtime;
}
