import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL?.trim();
const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();

function fail(message, code = 1) {
  console.error(`Supabase check failed: ${message}`);
  process.exit(code);
}

if (!url || !key) fail('SUPABASE_URL and a server secret key are required.');

let endpoint;
try {
  endpoint = new URL(url);
  if (endpoint.protocol !== 'https:') fail('SUPABASE_URL must use HTTPS.');
} catch {
  fail('SUPABASE_URL is invalid.');
}

const timeoutFetch = (input, init = {}) => fetch(input, {
  ...init,
  signal: AbortSignal.timeout(10_000),
});

try {
  const health = await timeoutFetch(new URL('/auth/v1/health', endpoint));
  if (!health.ok) fail(`project endpoint returned HTTP ${health.status}.`, 2);
} catch {
  fail('project endpoint is unreachable. Check project access and whether it is active.', 2);
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: timeoutFetch },
});

for (const [table, column] of [
  ['intake_submissions', 'crm_contact_id'],
  ['crm_profiles', 'user_id'],
  ['crm_contacts', 'id'],
  ['crm_opportunities', 'id'],
  ['crm_tasks', 'id'],
  ['crm_activity_events', 'id'],
]) {
  const { error } = await client.from(table).select(column).limit(1);
  if (error) fail(`${table} is unavailable. Apply the checked-in migrations or verify the server key.`, 3);
}

const { data: pipelines, error: pipelineError } = await client
  .from('crm_pipelines')
  .select('id, slug, contact_type');
if (pipelineError) fail('crm_pipelines is unavailable.', 3);

for (const [slug, journey] of [
  ['tax-client', 'tax-client'],
  ['consultant-recruitment', 'consultant'],
]) {
  const pipeline = pipelines?.find((item) => item.slug === slug && item.contact_type === journey);
  if (!pipeline) fail(`${slug} pipeline seed is missing.`, 4);
  const { count, error } = await client
    .from('crm_pipeline_stages')
    .select('id', { count: 'exact', head: true })
    .eq('pipeline_id', pipeline.id);
  if (error || count !== 11) fail(`${slug} requires 11 stages; found ${count ?? 'unknown'}.`, 4);
}

console.log('Supabase connection, CRM schema, and both seeded pipelines are ready.');
