
import { Province, IssueCategory, SchoolIssue, Feedback } from './types';

export const INITIAL_ISSUES: SchoolIssue[] = [
  {
    id: '1',
    schoolName: 'GPS Koh-e-Noor',
    emisCode: '3124001',
    province: Province.BALOCHISTAN,
    district: 'Quetta',
    category: IssueCategory.WASH,
    description: 'No clean drinking water available for 200 students.',
    severity: 'Critical',
    reportedAt: '2024-03-10',
    status: 'In Progress'
  },
  {
    id: '2',
    schoolName: 'GGPS Model Town',
    emisCode: '3521005',
    province: Province.PUNJAB,
    district: 'Lahore',
    category: IssueCategory.TEACHERS,
    description: 'Shortage of science teachers for secondary grades.',
    severity: 'High',
    reportedAt: '2024-03-12',
    status: 'Reported'
  },
  {
    id: '3',
    schoolName: 'BHS Mingora',
    emisCode: '2105002',
    province: Province.KP,
    district: 'Swat',
    category: IssueCategory.INFRASTRUCTURE,
    description: 'Boundary wall collapsed after heavy rains.',
    severity: 'Critical',
    reportedAt: '2024-03-14',
    status: 'Reported'
  }
];

export const INITIAL_FEEDBACK: Feedback[] = [
  {
    id: 'f1',
    authorType: 'Teacher',
    content: 'The school needs better sanitation facilities for girls to ensure they don\'t miss classes.',
    timestamp: '2024-03-15T10:00:00Z'
  },
  {
    id: 'f2',
    authorType: 'Parent',
    content: 'We are worried about the safety of our children because the gate is broken.',
    timestamp: '2024-03-16T14:30:00Z'
  }
];

export const THEME = {
  primary: '#00ADEF', // UNICEF Blue
  secondary: '#1CABE2',
  accent: '#FFD700',
  text: '#1F2937',
  muted: '#6B7280',
};
