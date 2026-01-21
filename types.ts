
export enum Province {
  PUNJAB = 'Punjab',
  SINDH = 'Sindh',
  KP = 'Khyber Pakhtunkhwa',
  BALOCHISTAN = 'Balochistan',
  GB = 'Gilgit-Baltistan',
  AJK = 'Azad Jammu & Kashmir',
  ICT = 'Islamabad'
}

export enum IssueCategory {
  INFRASTRUCTURE = 'Infrastructure',
  WASH = 'WASH',
  TEACHERS = 'Teachers/Staff',
  MATERIALS = 'Learning Materials',
  SAFETY = 'Security/Safety'
}

export interface SchoolIssue {
  id: string;
  schoolName: string;
  emisCode: string;
  province: Province;
  district: string;
  category: IssueCategory;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  reportedAt: string;
  status: 'Reported' | 'In Progress' | 'Resolved';
}

export interface Feedback {
  id: string;
  authorType: 'Parent' | 'Teacher' | 'Student' | 'Community Member';
  content: string;
  timestamp: string;
}

export interface AppState {
  issues: SchoolIssue[];
  feedback: Feedback[];
  language: 'EN' | 'UR';
}
