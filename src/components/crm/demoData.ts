import type { CrmRecord, CrmStage, DashboardData } from './model';

const pipeline = { id: 'tax-pipeline', slug: 'tax-clients', name: 'Tax Client Pipeline', journey: 'tax-client' };
const consultantPipeline = { id: 'consultant-pipeline', slug: 'consultant-recruitment', name: 'Consultant Recruitment', journey: 'consultant' };

const stages: CrmStage[] = [
  { id: 'new', slug: 'new-lead', name: 'New Lead', position: 1, color: '#D4AF37', pipeline },
  { id: 'contacted', slug: 'contacted', name: 'Contacted', position: 2, color: '#C9A96E', pipeline },
  { id: 'booked', slug: 'appointment-booked', name: 'Appointment Booked', position: 3, color: '#4F8A8B', pipeline },
  { id: 'onboarding', slug: 'intake-started', name: 'Intake Started', position: 4, color: '#2F7D6D', pipeline },
  { id: 'tax-documents-needed', slug: 'documents-needed', name: 'Documents Needed', position: 5, color: '#C06C3B', requiresAttention: true, pipeline },
  { id: 'tax-ready', slug: 'ready-for-preparation', name: 'Ready for Preparation', position: 6, color: '#38755B', pipeline },
  { id: 'tax-in-progress', slug: 'return-in-progress', name: 'Return in Progress', position: 7, color: '#305F72', pipeline },
  { id: 'tax-submitted', slug: 'submitted', name: 'Submitted', position: 8, color: '#655D8A', pipeline },
  { id: 'tax-funded', slug: 'funded', name: 'Funded', position: 9, color: '#3D8361', pipeline },
  { id: 'active', slug: 'completed', name: 'Completed', position: 10, color: '#26634F', isClosed: true, pipeline },
  { id: 'tax-follow-up', slug: 'follow-up', name: 'Follow-Up', position: 11, color: '#A36A2D', requiresAttention: true, pipeline },
  { id: 'application-received', slug: 'application-received', name: 'Application Received', position: 1, color: '#D4AF37', pipeline: consultantPipeline },
  { id: 'call-booked', slug: 'call-booked', name: 'Call Booked', position: 2, color: '#4F8A8B', pipeline: consultantPipeline },
  { id: 'interviewed', slug: 'interviewed', name: 'Interviewed', position: 3, color: '#305F72', pipeline: consultantPipeline },
  { id: 'accepted', slug: 'accepted', name: 'Accepted', position: 4, color: '#38755B', pipeline: consultantPipeline },
  { id: 'consultant-onboarding', slug: 'onboarding', name: 'Onboarding', position: 5, color: '#2F7D6D', pipeline: consultantPipeline },
  { id: 'documents-pending', slug: 'documents-pending', name: 'Documents Pending', position: 6, color: '#C06C3B', requiresAttention: true, pipeline: consultantPipeline },
  { id: 'ptin-verified', slug: 'ptin-verified', name: 'PTIN Verified', position: 7, color: '#3D8361', pipeline: consultantPipeline },
  { id: 'training-in-progress', slug: 'training-in-progress', name: 'Training in Progress', position: 8, color: '#655D8A', pipeline: consultantPipeline },
  { id: 'software-access-pending', slug: 'software-access-pending', name: 'Software Access Pending', position: 9, color: '#A36A2D', requiresAttention: true, pipeline: consultantPipeline },
  { id: 'active-tax-pro', slug: 'active-tax-pro', name: 'Active Tax Pro', position: 10, color: '#26634F', isClosed: true, pipeline: consultantPipeline },
  { id: 'rejected-inactive', slug: 'rejected-inactive', name: 'Rejected / Inactive', position: 11, color: '#6B6B6B', isClosed: true, pipeline: consultantPipeline },
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

const consultantRecords: CrmRecord[] = [
  { firstName: 'Nia', lastName: 'Taylor', stageId: 'application-received', priority: 'high' as const, nextAction: 'Review consultant application' },
  { firstName: 'Derrick', lastName: 'Moore', stageId: 'call-booked', priority: 'normal' as const, nextAction: 'Conduct introductory call' },
  { firstName: 'Camila', lastName: 'Lewis', stageId: 'consultant-onboarding', priority: 'normal' as const, nextAction: 'Confirm training access' },
].map((person, index) => {
  const stage = stages.find((item) => item.id === person.stageId)!;
  return {
    id: `demo-consultant-opportunity-${index + 1}`,
    title: `${person.firstName} ${person.lastName}`,
    priority: person.priority,
    status: 'open',
    nextAction: person.nextAction,
    nextActionAt: new Date(now + (index + 1) * 86_400_000).toISOString(),
    assignedTo: index === 0 ? null : 'profile-amanda',
    ownerName: index === 0 ? null : 'Amanda',
    createdAt: new Date(now - (index + 2) * 86_400_000).toISOString(),
    updatedAt: new Date(now - index * 3_600_000).toISOString(),
    contact: {
      id: `demo-consultant-${index + 1}`,
      journey: 'consultant' as const,
      firstName: person.firstName,
      lastName: person.lastName,
      email: `${person.firstName.toLowerCase()}.${person.lastName.toLowerCase()}@example.com`,
      phone: null,
      leadSource: 'Consultant application',
      sourceSubmissionId: null,
    },
    stage,
    pipeline: { id: consultantPipeline.id, slug: consultantPipeline.slug, name: consultantPipeline.name },
  };
});

const allRecords = [...records, ...consultantRecords];

export const demoDashboardData: DashboardData = {
  generatedAt: new Date(now).toISOString(),
  metrics: { total: allRecords.length, taxClients: records.length, consultants: consultantRecords.length, needsAttention: 4, unassigned: 4, completed: 1 },
  attention: allRecords.filter((record) => record.priority === 'urgent' || record.priority === 'high').slice(0, 4),
  records: allRecords,
  pagination: { page: 1, pageSize: 20, total: allRecords.length, totalPages: 1 },
  profiles: [
    { id: 'profile-amanda', fullName: 'Amanda', role: 'admin' },
    { id: 'profile-maya', fullName: 'Maya Johnson', role: 'consultant' },
  ],
  stages,
};
