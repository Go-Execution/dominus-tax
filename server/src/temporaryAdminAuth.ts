import {
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { HttpError } from './httpError.js';

const COOKIE_NAME = '__Host-dominus_temp_admin';
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const MINIMUM_ITERATIONS = 210_000;

interface TemporarySessionPayload {
  sub: 'temporary-admin';
  role: 'admin';
  exp: number;
  nonce: string;
}

function environment(name: string) {
  return process.env[name]?.trim() || '';
}

function safeEqual(left: Buffer, right: Buffer) {
  return left.length === right.length && timingSafeEqual(left, right);
}

function passwordHashParts() {
  const value = environment('TEMP_ADMIN_PASSWORD_HASH');
  const [algorithm, iterationsText, salt, digest] = value.split('$');
  const iterations = Number(iterationsText);
  if (
    algorithm !== 'pbkdf2-sha256' ||
    !Number.isSafeInteger(iterations) ||
    iterations < MINIMUM_ITERATIONS ||
    !salt ||
    !digest
  ) {
    throw new HttpError(503, 'Temporary administrator login is not configured safely.');
  }
  return { iterations, salt, digest };
}

function sessionSecret() {
  const value = environment('TEMP_ADMIN_SESSION_SECRET');
  if (value.length < 43) {
    throw new HttpError(503, 'Temporary administrator login is not configured safely.');
  }
  return value;
}

function signature(payload: string) {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function cookieValue(request: Request) {
  const cookies = request.headers.get('cookie') || '';
  for (const item of cookies.split(';')) {
    const [name, ...value] = item.trim().split('=');
    if (name === COOKIE_NAME) return value.join('=');
  }
  return null;
}

export function isTemporaryAdminAuthEnabled() {
  return environment('TEMP_ADMIN_AUTH_ENABLED') === 'true';
}

export function verifyTemporaryAdminPassword(password: string) {
  if (!isTemporaryAdminAuthEnabled()) return false;
  const { iterations, salt, digest } = passwordHashParts();
  const candidate = pbkdf2Sync(password, Buffer.from(salt, 'base64url'), iterations, 32, 'sha256');
  return safeEqual(candidate, Buffer.from(digest, 'base64url'));
}

export function createTemporaryAdminSession(now = Date.now()) {
  if (!isTemporaryAdminAuthEnabled()) {
    throw new HttpError(404, 'Temporary administrator login is not enabled.');
  }
  const payload: TemporarySessionPayload = {
    sub: 'temporary-admin',
    role: 'admin',
    exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS,
    nonce: randomBytes(16).toString('base64url'),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${signature(encoded)}`;
}

export function verifyTemporaryAdminSession(request: Request, now = Date.now()) {
  if (!isTemporaryAdminAuthEnabled()) return false;
  const token = cookieValue(request);
  if (!token) return false;
  const [encoded, suppliedSignature, ...extra] = token.split('.');
  if (!encoded || !suppliedSignature || extra.length) return false;
  if (!safeEqual(Buffer.from(suppliedSignature), Buffer.from(signature(encoded)))) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TemporarySessionPayload;
    return (
      payload.sub === 'temporary-admin' &&
      payload.role === 'admin' &&
      Number.isSafeInteger(payload.exp) &&
      payload.exp > Math.floor(now / 1000)
    );
  } catch {
    return false;
  }
}

export function temporaryAdminCookie(token: string) {
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearTemporaryAdminCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}
