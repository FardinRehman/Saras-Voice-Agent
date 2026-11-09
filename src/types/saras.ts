export type UserRole = 'SUPER_ADMIN' | 'SALES_LEAD' | 'AI_ENGINEER' | 'AUDITOR';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'IN_DISCUSSION'
  | 'QUALIFIED'
  | 'CONVERTED'
  | 'CLOSED';

export interface CustomerEnquiry {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  companyName?: string;
  requiredService: string;
  projectDescription: string;
  estimatedBudget?: string;
  expectedTimeline?: string;
  additionalRequirements?: string;
  status: LeadStatus;
  assignedTo?: string;
  assignedToName?: string;
  internalNotes?: string;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeCategory =
  | 'COMPANY_OVERVIEW'
  | 'SERVICES'
  | 'AI_SYSTEMS'
  | 'WEB_DEVELOPMENT'
  | 'MOBILE_ENGINEERING'
  | 'CLOUD_DEVOPS'
  | 'AUTOMATION_ETL'
  | 'UI_UX_DESIGN'
  | 'PORTFOLIO_CASE_STUDIES'
  | 'TECHNOLOGIES'
  | 'BLOG_ARTICLES'
  | 'CONTACT_ENGAGEMENT'
  | 'FAQ';

export interface KnowledgeChunk {
  id: string;
  documentId?: string;
  source: 'WEBSITE' | 'DOCUMENT' | 'MANUAL';
  title: string;
  category: KnowledgeCategory;
  content: string;
  url?: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  similarity?: number;
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocument {
  id: string;
  fileName: string;
  fileType: 'PDF' | 'DOCX' | 'TXT' | 'MARKDOWN';
  fileSize: number;
  chunkCount: number;
  status: 'PROCESSED' | 'PROCESSING' | 'FAILED';
  uploadedAt: string;
  extractedText?: string;
  hash: string;
}

export interface WebsitePage {
  id: string;
  url: string;
  title: string;
  status: 'INDEXED' | 'PENDING' | 'FAILED';
  lastCrawledAt: string;
  chunkCount: number;
  contentHash: string;
}

export interface VoiceAgentConfig {
  model: string;
  voice: string;
  temperature: number;
  vadThreshold: number;
  prefixPaddingMs: number;
  silenceDurationMs: number;
  systemPrompt: string;
  language: string;
}

export interface CallSession {
  id: string;
  customerName?: string;
  customerEmail?: string;
  callerNumber: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  status: 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'TRANSFERRED' | 'FAILED';
  mode: 'SIMULATION' | 'LIVE';
  language: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'FRUSTRATED';
  escalatedToHuman: boolean;
  leadCaptured: boolean;
  leadId?: string;
  notes?: string;
}

export interface TranscriptItem {
  id: string;
  speaker: 'visitor' | 'agent' | 'system';
  text: string;
  timestamp: string;
  isPartial?: boolean;
}

export interface ToolExecution {
  id: string;
  callId: string;
  toolName: string;
  args: Record<string, any>;
  result: Record<string, any>;
  status: 'SUCCESS' | 'FAILED';
  executionTimeMs: number;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  targetId?: string;
  details: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  ipAddress: string;
}

export interface AnalyticsOverview {
  totalCalls: number;
  activeCalls: number;
  completedCalls: number;
  totalEnquiries: number;
  qualifiedLeads: number;
  avgDurationSeconds: number;
  conversationSuccessRate: number;
  topQueries: { query: string; count: number }[];
  popularServices: { service: string; count: number }[];
  sentimentBreakdown: { positive: number; neutral: number; frustrated: number };
}

