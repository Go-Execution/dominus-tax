import { z } from 'zod';

export const leadJourneySchema = z.enum(['tax-client', 'consultant']);

export const intakePayloadSchema = z.object({
  sourceSubmissionId: z.string().trim().min(1).max(128),
  journey: leadJourneySchema,
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().min(7).max(30),
  consent: z.boolean(),
  submittedAt: z.iso.datetime().optional(),
  details: z.record(z.string(), z.unknown()).default({}),
});

export type IntakePayload = z.infer<typeof intakePayloadSchema>;
export type LeadJourney = z.infer<typeof leadJourneySchema>;

export type SubmissionStatus = 'received' | 'synced' | 'failed';

export const taxClientStageSchema = z.enum([
  'new-lead',
  'contacted',
  'appointment-booked',
  'documents-needed',
  'ready-for-preparation',
  'submitted',
  'funded',
  'closed',
]);

export const consultantStageSchema = z.enum([
  'form-submitted',
  'documents-pending',
  'ptin-verification',
  'training-in-progress',
  'software-access-pending',
  'ready-to-prepare-returns',
]);

export const pipelineStageSchema = z.union([taxClientStageSchema, consultantStageSchema]);
export type PipelineStage = z.infer<typeof pipelineStageSchema>;

export interface SubmissionRecord {
  id: string;
  sourceSubmissionId: string;
  journey: LeadJourney;
  status: SubmissionStatus;
  stage: PipelineStage;
  phoneLastFour: string;
  externalContactId: string | null;
  externalOpportunityId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function defaultStageForJourney(journey: LeadJourney): PipelineStage {
  return journey === 'consultant' ? 'form-submitted' : 'new-lead';
}

export function stageBelongsToJourney(stage: PipelineStage, journey: LeadJourney) {
  return journey === 'consultant'
    ? consultantStageSchema.safeParse(stage).success
    : taxClientStageSchema.safeParse(stage).success;
}

export function needsAmandaAttention(submission: SubmissionRecord) {
  if (submission.status === 'failed') return true;
  return ['documents-pending', 'software-access-pending', 'documents-needed'].includes(
    submission.stage,
  );
}
