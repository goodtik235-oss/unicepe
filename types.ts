
export interface Caption {
  id: string;
  start: number;
  end: number;
  text: string;
}

export enum ProcessingStatus {
  IDLE = 'idle',
  EXTRACTING_AUDIO = 'extracting_audio',
  TRANSCRIBING = 'transcribing',
  TRANSLATING = 'translating',
  GENERATING_SPEECH = 'generating_speech',
  RENDERING = 'rendering',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export const SUPPORTED_LANGUAGES = [
  { code: 'ur-PK', name: 'Urdu (Pakistan)' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
];

export enum Province {
  BALOCHISTAN = 'Balochistan',
  PUNJAB = 'Punjab',
  KP = 'KP',
  SINDH = 'Sindh'
}

export enum IssueCategory {
  WASH = 'WASH',
  TEACHERS = 'Teachers',
  INFRASTRUCTURE = 'Infrastructure'
}

export interface SchoolIssue {
  id: string;
  schoolName: string;
  emisCode: string;
  province: Province;
  district: string;
  category: IssueCategory;
  description: string;
  severity: string;
  reportedAt: string;
  status: string;
}

export interface Feedback {
  id: string;
  authorType: string;
  content: string;
  timestamp: string;
}
