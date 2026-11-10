export type CrmJourney = 'tax-client' | 'consultant';
export type CrmPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface CrmIdentity {
  id: string;
  email?: string;
  fullName: string;
  role: 'admin' | 'consultant';
}

export interface CrmProfile {
  id: string;
  fullName: string;
  role: 'admin' | 'consultant';
}

export interface CrmStage {
  id: string;
  slug: string;
  name: string;
  position?: number;
  color?: string | null;
  requiresAttention?: boolean;
  isClosed?: boolean;
  pipeline?: { id: string; slug: string; name: string; journey: string };
}

export interface CrmRecord {
  id: string;
  title: string;
  priority: CrmPriority;
  status: string;
  nextAction: string | null;
  nextActionAt: string | null;
  assignedTo: string | null;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
  contact: {
    id: string;
    journey: CrmJourney;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    leadSource: string;
    sourceSubmissionId: string | null;
  };
  stage: CrmStage;
  pipeline: { id: string; slug: string; name: string };
}

export interface DashboardData {
  generatedAt: string;
  metrics: {
    total: number;
    taxClients: number;
    consultants: number;
    needsAttention: number;
    unassigned: number;
    completed: number;
  };
  attention: CrmRecord[];
  records: CrmRecord[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  profiles: CrmProfile[];
  stages: CrmStage[];
}

export interface ContactDetail {
  contact: Record<string, unknown>;
  activities: Array<{ id: string; event_type: string; summary: string; created_at: string }>;
  tasks: Array<{ id: string; title: string; priority: string; status: string; due_at: string | null }>;
}

export type CrmView = 'overview' | 'pipeline' | 'contacts' | 'automations' | 'campaigns';
