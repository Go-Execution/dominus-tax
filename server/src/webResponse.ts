import { ZodError } from 'zod';
import { HttpError } from './httpError.js';

export const MAX_JSON_BYTES = 256 * 1024;

export function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

export async function readLimitedJson(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new HttpError(415, 'Content-Type must be application/json.');
  }
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_JSON_BYTES) throw new HttpError(413, 'Request body is too large.');
  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_JSON_BYTES) {
    throw new HttpError(413, 'Request body is too large.');
  }
  if (!raw) throw new HttpError(400, 'Request body is required.');
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new HttpError(400, 'Request body must contain valid JSON.');
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) return jsonResponse({ error: error.message }, error.status);
  if (error instanceof ZodError) {
    return jsonResponse(
      {
        error: 'Invalid request payload.',
        issues: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      },
      400,
    );
  }
  console.error(error);
  return jsonResponse({ error: 'The request could not be processed.' }, 500);
}
