import { z } from 'zod';
import { createHmac } from 'node:crypto';
import {
  createTemporaryAdminSession,
  isTemporaryAdminAuthEnabled,
  temporaryAdminCookie,
  verifyTemporaryAdminPassword,
} from '../../server/src/temporaryAdminAuth.js';
import { HttpError } from '../../server/src/httpError.js';
import { errorResponse, jsonResponse, readLimitedJson } from '../../server/src/webResponse.js';
import { requireSameOrigin } from '../../server/src/requestSecurity.js';
import { getProductionRuntime } from '../../server/src/productionRuntime.js';

const LoginBody = z.object({
  password: z.string().min(12).max(128),
});

const attempts = new Map<string, { count: number; resetAt: number }>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientKey(request: Request) {
  return (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
}

function shouldUsePersistentLimiter() {
  return process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

async function takeAttempt(request: Request) {
  if (!shouldUsePersistentLimiter()) {
    requireAttemptAvailable(request);
    return null;
  }
  const secret = process.env.TEMP_ADMIN_SESSION_SECRET?.trim() || '';
  if (secret.length < 43) throw new HttpError(503, 'Temporary administrator login is not configured safely.');
  const keyHash = createHmac('sha256', secret).update(clientKey(request)).digest('hex');
  const { data, error } = await getProductionRuntime().supabase.rpc('crm_temp_login_attempt', {
    p_key_hash: keyHash, p_success: false,
  });
  if (error || typeof data !== 'number') {
    throw new HttpError(503, 'Login protection is temporarily unavailable. Please try again later.');
  }
  if (data > MAX_ATTEMPTS) throw new HttpError(429, 'Too many login attempts. Try again in 15 minutes.');
  return keyHash;
}

async function clearAttempt(request: Request, keyHash: string | null) {
  if (!keyHash) {
    attempts.delete(clientKey(request));
    return;
  }
  const { error } = await getProductionRuntime().supabase.rpc('crm_temp_login_attempt', {
    p_key_hash: keyHash, p_success: true,
  });
  if (error) throw new HttpError(503, 'Login protection is temporarily unavailable. Please try again later.');
}

function requireAttemptAvailable(request: Request) {
  const now = Date.now();
  const key = clientKey(request);
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 0, resetAt: now + ATTEMPT_WINDOW_MS });
    return;
  }
  if (current.count >= MAX_ATTEMPTS) {
    throw new HttpError(429, 'Too many login attempts. Try again in 15 minutes.');
  }
}

function recordFailure(request: Request) {
  const key = clientKey(request);
  const current = attempts.get(key) || { count: 0, resetAt: Date.now() + ATTEMPT_WINDOW_MS };
  attempts.set(key, { ...current, count: current.count + 1 });
}

export async function POST(request: Request) {
  try {
    if (!isTemporaryAdminAuthEnabled()) {
      throw new HttpError(404, 'Temporary administrator login is not enabled.');
    }
    requireSameOrigin(request);
    const body = LoginBody.parse(await readLimitedJson(request));
    const keyHash = await takeAttempt(request);
    if (!verifyTemporaryAdminPassword(body.password)) {
      if (!keyHash) recordFailure(request);
      throw new HttpError(401, 'Invalid password.');
    }
    await clearAttempt(request, keyHash);
    const response = jsonResponse({
      user: {
        id: 'temporary-admin',
        fullName: 'Temporary Administrator',
        role: 'admin',
      },
    });
    response.headers.set('set-cookie', temporaryAdminCookie(createTemporaryAdminSession()));
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
