import { timingSafeEqual } from 'node:crypto';
import { HttpError } from './httpError.js';

export function requireWebhookSecret(request: Request) {
  const expected = process.env.INTAKE_WEBHOOK_SECRET?.trim();
  if (!expected) throw new HttpError(503, 'Intake webhook is not configured.');
  const received = request.headers.get('x-dominus-webhook-secret') || '';
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw new HttpError(401, 'Invalid webhook credentials.');
  }
}
