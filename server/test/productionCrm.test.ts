import assert from 'node:assert/strict';
import test from 'node:test';
import { mapJotformPayload } from '../../api/jotform.js';
import { opportunityUpdateSchema } from '../src/crmAdminService.js';
import { requireSameOrigin } from '../src/requestSecurity.js';

test('maps the approved tax-client Jotform fields into the intake contract', () => {
  const form = new FormData();
  form.set('formID', '262376514662461');
  form.set('submissionID', 'submission-1');
  form.set('q3_fullName[first]', 'Ada');
  form.set('q3_fullName[last]', 'Lovelace');
  form.set('q4_emailAddress', 'ADA@example.com');
  form.set('q5_phoneNumber[full]', '(432) 555-0100');
  form.set('q30_typeA30', 'I agree');

  const payload = mapJotformPayload(form);
  assert.equal(payload.journey, 'tax-client');
  assert.equal(payload.sourceSubmissionId, 'jotform:262376514662461:submission-1');
  assert.equal(payload.firstName, 'Ada');
  assert.equal(payload.consent, true);
});

test('maps the approved consultant Jotform fields into the intake contract', () => {
  const form = new FormData();
  form.set('formID', '262339213591053');
  form.set('submissionID', 'submission-2');
  form.set('q3_name[first]', 'Grace');
  form.set('q3_name[last]', 'Hopper');
  form.set('q4_email', 'grace@example.com');
  form.set('q6_phoneNumber[full]', '4325550101');

  const payload = mapJotformPayload(form);
  assert.equal(payload.journey, 'consultant');
  assert.equal(payload.firstName, 'Grace');
  assert.equal(payload.consent, false);
});

test('CRM updates require a valid field and same-origin mutations', () => {
  assert.equal(opportunityUpdateSchema.parse({ priority: 'urgent' }).priority, 'urgent');
  assert.throws(() => opportunityUpdateSchema.parse({}), /At least one field/);
  assert.throws(
    () => requireSameOrigin(new Request('https://dominus.test/api/admin', { headers: { origin: 'https://attacker.test' } })),
    /Cross-origin/,
  );
});
