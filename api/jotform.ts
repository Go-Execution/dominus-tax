import { timingSafeEqual } from 'node:crypto';
import { getProductionRuntime } from '../server/src/productionRuntime.js';
import { HttpError } from '../server/src/httpError.js';
import { errorResponse, jsonResponse } from '../server/src/webResponse.js';

const CLIENT_FORM_ID = '262376514662461';
const CONSULTANT_FORM_ID = '262339213591053';
const MAX_JOTFORM_BYTES = 1024 * 1024;

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function value(form: FormData, ...names: string[]) {
  for (const name of names) {
    const item = form.get(name);
    if (typeof item === 'string' && item.trim()) return item.trim();
  }
  return '';
}

export function mapJotformPayload(form: FormData) {
  const formId = value(form, 'formID', 'formId');
  if (formId !== CLIENT_FORM_ID && formId !== CONSULTANT_FORM_ID) {
    throw new HttpError(400, 'Unknown Jotform form ID.');
  }
  const consultant = formId === CONSULTANT_FORM_ID;
  const sourceSubmissionId = value(form, 'submissionID', 'submission_id');
  if (!sourceSubmissionId) throw new HttpError(400, 'Jotform submission ID is required.');

  return {
    sourceSubmissionId: `jotform:${formId}:${sourceSubmissionId}`,
    journey: consultant ? 'consultant' as const : 'tax-client' as const,
    firstName: value(form, consultant ? 'q3_name[first]' : 'q3_fullName[first]'),
    lastName: value(form, consultant ? 'q3_name[last]' : 'q3_fullName[last]'),
    email: value(form, consultant ? 'q4_email' : 'q4_emailAddress'),
    phone: value(form, consultant ? 'q6_phoneNumber[full]' : 'q5_phoneNumber[full]'),
    consent: consultant ? false : Boolean(value(form, 'q30_typeA30')),
    submittedAt: new Date().toISOString(),
    details: { source: 'jotform', formId },
  };
}

export async function POST(request: Request) {
  try {
    const expected = process.env.INTAKE_WEBHOOK_SECRET?.trim() || '';
    const received = request.headers.get('x-dominus-webhook-secret')?.trim()
      || new URL(request.url).searchParams.get('token')
      || '';
    if (!expected || !safeEqual(expected, received)) throw new HttpError(401, 'Invalid webhook credentials.');

    const contentType = request.headers.get('content-type')?.toLowerCase() || '';
    if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
      throw new HttpError(415, 'Jotform webhook must use form data.');
    }
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_JOTFORM_BYTES) throw new HttpError(413, 'Jotform payload is too large.');

    const form = await request.formData();
    const payload = mapJotformPayload(form);

    const result = await getProductionRuntime().intakeService.receive(payload);
    return jsonResponse({ ok: true, duplicate: result.duplicate, submissionId: result.submission.id }, result.duplicate ? 200 : 201);
  } catch (error) {
    return errorResponse(error);
  }
}

