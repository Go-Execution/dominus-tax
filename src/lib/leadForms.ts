export const LEAD_FORM_EVENT = 'open-lead-form';

export type LeadJourney = 'tax-client' | 'consultant';

export const LEAD_FORMS = {
  'tax-client': {
    label: 'Tax Client Intake',
    shortLabel: 'Tax Client',
    description: 'Request tax preparation or advisory support.',
    formSrc:
      import.meta.env.VITE_CLIENT_INTAKE_FORM_URL ||
      'https://form.jotform.com/jsform/262376514662461',
  },
  consultant: {
    label: 'Consultant Onboarding',
    shortLabel: 'Consultant',
    description: 'Apply to join the Dominus consultant network.',
    formSrc:
      import.meta.env.VITE_CONSULTANT_ONBOARDING_FORM_URL ||
      'https://form.jotform.com/jsform/262339213591053',
  },
} as const satisfies Record<
  LeadJourney,
  { label: string; shortLabel: string; description: string; formSrc: string }
>;

export function isLeadJourney(value: unknown): value is LeadJourney {
  return value === 'tax-client' || value === 'consultant';
}

export function openLeadForm(journey: LeadJourney = 'tax-client') {
  window.dispatchEvent(
    new CustomEvent(LEAD_FORM_EVENT, {
      detail: { journey },
    }),
  );
}
