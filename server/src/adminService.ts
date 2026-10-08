import { randomUUID } from 'node:crypto';
import {
  consultantStageSchema,
  needsAmandaAttention,
  pipelineStageSchema,
  stageBelongsToJourney,
  taxClientStageSchema,
  type PipelineStage,
  type SubmissionRecord,
} from './domain.js';
import type { IntakeStore } from './store.js';

export interface AdminDashboardData {
  generatedAt: string;
  metrics: {
    total: number;
    taxClients: number;
    consultants: number;
    synced: number;
    failed: number;
    needsAttention: number;
    readyConsultants: number;
  };
  attention: SubmissionRecord[];
  recent: SubmissionRecord[];
  stages: {
    taxClient: PipelineStage[];
    consultant: PipelineStage[];
  };
}

export class AdminService {
  constructor(private readonly repository: IntakeStore) {}

  async dashboard(): Promise<AdminDashboardData> {
    const recent = await this.repository.listRecent(100);
    const attention = recent.filter(needsAmandaAttention);

    return {
      generatedAt: new Date().toISOString(),
      metrics: {
        total: recent.length,
        taxClients: recent.filter((item) => item.journey === 'tax-client').length,
        consultants: recent.filter((item) => item.journey === 'consultant').length,
        synced: recent.filter((item) => item.status === 'synced').length,
        failed: recent.filter((item) => item.status === 'failed').length,
        needsAttention: attention.length,
        readyConsultants: recent.filter(
          (item) => item.stage === 'ready-to-prepare-returns',
        ).length,
      },
      attention,
      recent,
      stages: {
        taxClient: [...taxClientStageSchema.options],
        consultant: [...consultantStageSchema.options],
      },
    };
  }

  async updateStage(submissionId: string, rawStage: unknown): Promise<SubmissionRecord> {
    const stage = pipelineStageSchema.parse(rawStage);
    const submission = await this.repository.getById(submissionId);
    if (!submission) {
      const error = new Error('Submission not found.');
      Object.assign(error, { statusCode: 404 });
      throw error;
    }
    if (!stageBelongsToJourney(stage, submission.journey)) {
      const error = new Error(`Stage does not belong to the ${submission.journey} journey.`);
      Object.assign(error, { statusCode: 400 });
      throw error;
    }

    const now = new Date().toISOString();
    const updated = (await this.repository.updateStage(submissionId, stage, now))!;
    await this.repository.addEvent({
      id: randomUUID(),
      submissionId,
      eventType: 'pipeline.stage.changed',
      status: 'success',
      message: stage,
      now,
    });
    return updated;
  }
}
