import { z } from 'zod';
import {
  createTemporaryAdminSession,
  isTemporaryAdminAuthEnabled,
  temporaryAdminCookie,
  verifyTemporaryAdminPassword,
} from '../../server/src/temporaryAdminAuth.js';
import { HttpError } from '../../server/src/httpError.js';
import { errorResponse, jsonResponse, readLimitedJson } from '../../server/src/webResponse.js';

const LoginBody = z.object({
  password: z.string().min(12).max(128),
});

const attempts = new Map<string, { count: number; resetAt: number }>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientKey(request: Request) {
  return (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
}

function requireSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    throw new HttpError(403, 'Cross-origin login is not allowed.');
  }
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
    requireAttemptAvailable(request);
    const body = LoginBody.parse(await readLimitedJson(request));
    if (!verifyTemporaryAdminPassword(body.password)) {
      recordFailure(request);
      throw new HttpError(401, 'Invalid password.');
    }
    attempts.delete(clientKey(request));
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
