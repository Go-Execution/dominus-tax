import type { CrmRecord, CrmStage, DashboardData } from './model';

const pipeline = { id: 'tax-pipeline', slug: 'tax-clients', name: 'Tax Client Pipeline', journey: 'tax-client' };

const stages: CrmStage[] = [
  { id: 'new', slug: 'new-lead', name: 'New Lead', position: 1, color: '#38BDF8', pipeline },
  { id: 'contacted', slug: 'contacted', name: 'Contacted', position: 2, color: '#A78BFA', pipeline },
  { id: 'booked', slug: 'booked-call', name: 'Booked Call', position: 3, color: '#F59E0B', pipeline },
  { id: 'onboarding', slug: 'onboarding', name: 'Onboarding', position: 4, color: '#10B981', pipeline },
  { id: 'active', slug: 'active-client', name: 'Active Client', position: 5, color: '#C9A227', isClosed: true, pipeline },
];

const now = Date.now();
const contacts = [
  ['Olivia', 'Carter', 'olivia.carter@example.com', '(432) 555-0142', 'new', 'urgent', 'Call about business return', -2, 'Website consultation'],
  ['Marcus', 'Hill', 'marcus.hill@example.com', '(432) 555-0186', 'new', 'normal', 'Send service overview', 2, 'Tax savings funnel'],
  ['Ava', 'Reynolds', 'ava.reynolds@example.com', '(432) 555-0124', 'contacted', 'high', 'Confirm document checklist', 1, 'Website consultation'],
  ['Jordan', 'Brooks', 'jordan.brooks@example.com', '(432) 555-0171', 'contacted', 'normal', 'Follow up by text', 3, 'Referral'],
  ['Sophia', 'Turner', 'sophia.turner@example.com', '(432) 555-0133', 'booked', 'high', 'Consultation call', 0, 'Tax advance landing page'],
  ['Ethan', 'Collins', 'ethan.collins@example.com', '(432) 555-0198', 'booked', 'normal', 'Prepare discovery notes', 4, 'Website consultation'],
  ['Mia', 'Foster', 'mia.foster@example.com', '(432) 555-0160', 'onboarding', 'high', 'Review uploaded documents', 1, 'Referral'],
  ['Noah', 'Bennett', 'noah.bennett@example.com', '(432) 555-0117', 'onboarding', 'normal', 'Send welcome packet', 2, 'Tax savings funnel'],
  ['Isabella', 'Price', 'isabella.price@example.com', '(432) 555-0155', 'active', 'normal', 'Quarterly check-in', 14, 'Returning client'],
] as const;

const records: CrmRecord[] = contacts.map(([firstName, lastName, email, phone, stageId, priority, nextAction, dueOffset, leadSource], index) => {
  const stage = stages.find((item) => item.id === stageId) || stages[0];
  return {
    id: `demo-opportunity-${index + 1}`,
    title: `${firstName} ${lastName}`,
    priority,
    status: stage.isClosed ? 'completed' : 'open',
    nextAction,
    nextActionAt: new Date(now + Number(dueOffset) * 86_400_000).toISOString(),
    assignedTo: index % 3 === 1 ? null : index % 2 ? 'profile-amanda' : 'profile-maya',
    ownerName: index % 3 === 1 ? null : index % 2 ? 'Amanda' : 'Maya Johnson',
    createdAt: new Date(now - (index + 1) * 86_400_000).toISOString(),
    updatedAt: new Date(now - index * 3_600_000).toISOString(),
    contact: {
      id: `demo-contact-${index + 1}`,
      journey: 'tax-client',
      firstName,
      lastName,
      email,
      phone,
      leadSource,
      sourceSubmissionId: null,
    },
    stage,
    pipeline: { id: pipeline.id, slug: pipeline.slug, name: pipeline.name },
  };
});

export const demoDashboardData: DashboardData = {
  generatedAt: new Date(now).toISOString(),
  metrics: { total: records.length, taxClients: records.length, consultants: 0, needsAttention: 3, unassigned: 3, completed: 1 },
  attention: records.filter((record) => record.priority === 'urgent' || record.priority === 'high').slice(0, 3),
  records,
  pagination: { page: 1, pageSize: 20, total: records.length, totalPages: 1 },
  profiles: [
    { id: 'profile-amanda', fullName: 'Amanda', role: 'admin' },
    { id: 'profile-maya', fullName: 'Maya Johnson', role: 'consultant' },
  ],
  stages,
};
