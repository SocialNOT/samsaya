export interface SourcePrimary {
  text: string;
  section?: string;
  concept_focus?: string;
  author?: string;
  language?: string;
  note?: string;
}

export interface SourceSecondary {
  author: string;
  works?: string[];
  focus: string;
  language?: string;
}

export interface SyllabusData {
  project_title: string;
  core_concept: string;
  primary_sources_en: SourcePrimary[];
  primary_sources_bn: SourcePrimary[];
  secondary_sources: SourceSecondary[];
  key_terms: string[];
}

export interface Attachment {
  mimeType: string;
  data: string; // Base64
  name?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  attachments?: Attachment[];
}

export enum TabView {
  SYLLABUS = 'SYLLABUS',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS'
}

export type Theme = 'scholarly' | 'minimalist' | 'manuscript';
export type ThemeMode = 'dark' | 'light';
