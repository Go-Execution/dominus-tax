import { HttpError } from './httpError.js';

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    throw new HttpError(403, 'Cross-origin request is not allowed.');
  }
}

