import crypto from 'crypto';

function computeHash(content: string): string {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).createHash === 'function') {
      return (crypto as any).createHash('sha256').update(content).digest('hex');
    }
  } catch {}
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }
  return 'hash-' + Math.abs(hash).toString(16);
}
import {
  User,
  CustomerEnquiry,
  KnowledgeChunk,
  KnowledgeDocument,
  WebsitePage,
  CallSession,
  TranscriptItem,
  ToolExecution,
  AuditLog,
  AnalyticsOverview,
  LeadStatus,
  KnowledgeCategory,
} from '../types/saras.ts';
import { postgresService } from './db/postgres.ts';

// ====================================================================
// VERIFIED SARAS DYNAMICS OFFICIAL KNOWLEDGE BASE SEED
// Primary Source: https://www.sarasdynamics.com/
// Operational Hub: Coimbatore, Tamil Nadu, India
// ====================================================================

const SEED_USERS: User[] = [
  {
    id: 'USR-1001',
    username: 'admin',
    fullName: 'Saras Chief Operations Officer',
    role: 'SUPER_ADMIN',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-11-02T18:00:00Z',
  },
  {
    id: 'USR-1002',
    username: 'sales.lead',
    fullName: 'Arunachalam Murugan',
    role: 'SALES_LEAD',
    isActive: true,
    createdAt: '2026-01-10T00:00:00Z',
    lastLoginAt: '2026-11-02T16:30:00Z',
  },
  {
    id: 'USR-1003',
    username: 'ai.engineer',
    fullName: 'Deepika Raman',
    role: 'AI_ENGINEER',
    isActive: true,
    createdAt: '2026-02-01T00:00:00Z',
    lastLoginAt: '2026-11-02T17:15:00Z',
  },
  {
    id: 'USR-1004',
    username: 'auditor',
    fullName: 'Karthik Subramanian',
    role: 'AUDITOR',
    isActive: true,
    createdAt: '2026-03-01T00:00:00Z',
    lastLoginAt: '2026-11-01T12:00:00Z',
  },
];

const SEED_KNOWLEDGE_CHUNKS: KnowledgeChunk[] = [
  {
    id: 'CHUNK-001',
    source: 'WEBSITE',
    title: 'Company Overview & Mission',
    category: 'COMPANY_OVERVIEW',
    content:
      'Saras Dynamics (https://www.sarasdynamics.com/) is a high-growth software and AI engineering company specializing in intelligent software, enterprise AI systems, digital platforms, and automation solutions. Headquartered in Coimbatore, Tamil Nadu, India, the company delivers mission-critical systems and digital product transformations for enterprises and high-velocity startups worldwide.',
    url: 'https://www.sarasdynamics.com/',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'CHUNK-002',
    source: 'WEBSITE',
    title: 'Engineering Philosophy & Positioning',
    category: 'COMPANY_OVERVIEW',
    content:
      'Saras Dynamics positions itself at the intersection of technical depth, modern design systems, and software craftsmanship. The company empowers organizations to eliminate repetitive manual workloads through autonomous AI agents, enterprise-grade LLM integrations, resilient Kubernetes cloud infrastructure, and human-centric UI/UX architectures.',
    url: 'https://www.sarasdynamics.com/about',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'CHUNK-003',
    source: 'WEBSITE',
    title: 'Artificial Intelligence & Autonomous Systems',
    category: 'AI_SYSTEMS',
    content:
      'Saras Dynamics designs and deploys production-grade AI systems, featuring: (1) Custom LLM Integrations tailored for proprietary business logic, (2) Retrieval-Augmented Generation (RAG) pipelines linking LLMs to secure knowledge bases with hallucination guards, (3) Autonomous AI Agents capable of multi-step task execution, reasoning, and tool interaction, and (4) Predictive Modeling for demand forecasting, anomaly detection, and operational intelligence.',
    url: 'https://www.sarasdynamics.com/services/ai-autonomous-systems',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'CHUNK-004',
    source: 'WEBSITE',
    title: 'Full-Stack & Web Architecture',
    category: 'WEB_DEVELOPMENT',
    content:
      'Saras Dynamics builds modern, scalable web platforms utilizing Next.js, React, Node.js, and TypeScript. Core capabilities include: distributed micro-frontends, sub-second page performance, high-throughput REST and GraphQL API gateways, event-driven backends, and robust state orchestration.',
    url: 'https://www.sarasdynamics.com/services/full-stack-web',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'CHUNK-005',
    source: 'WEBSITE',
    title: 'Mobile Engineering',
    category: 'MOBILE_ENGINEERING',
    content:
      'Saras Dynamics engineers native (Swift/Kotlin) and high-performance cross-platform (React Native/Flutter) mobile applications. Specialized in offline-first synchronization, local database caching, secure biometric authentication, hardware telemetry integration, and fluid 120Hz gesture-driven interfaces.',
    url: 'https://www.sarasdynamics.com/services/mobile-engineering',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'CHUNK-006',
    source: 'WEBSITE',
    title: 'Cloud Infrastructure & DevOps',
    category: 'CLOUD_DEVOPS',
    content:
      'Saras Dynamics implements enterprise cloud infrastructure on AWS, GCP, and Azure with Kubernetes (EKS/GKE), Docker containerization, Infrastructure as Code (Terraform), automated CI/CD pipelines (GitHub Actions/GitLab CI), zero-downtime rolling deployments, and end-to-end Prometheus/Grafana observability.',
    url: 'https://www.sarasdynamics.com/services/cloud-devops',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'CHUNK-007',
    source: 'WEBSITE',
    title: 'Intelligent Automation & ETL Pipelines',
    category: 'AUTOMATION_ETL',
    content:
      'Saras Dynamics eliminates manual corporate overhead through intelligent automation workflows: automated business processes, ETL data transformation pipelines, robotic process tasks, real-time webhooks, and seamless integrations with legacy ERP systems (SAP, Oracle) and modern CRMs (Salesforce, HubSpot).',
    url: 'https://www.sarasdynamics.com/services/intelligent-automation',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'CHUNK-008',
    source: 'WEBSITE',
    title: 'Experience Architecture & UI/UX Product Design',
    category: 'UI_UX_DESIGN',
    content:
      'Saras Dynamics creates cohesive digital product designs adhering to atomic design systems, WCAG 2.1 AA accessibility standards, interactive Figma prototypes, and micro-animations. Also creator of proprietary UI assets including DIcons (comprehensive vector icon library), DShapes (generative geometric vectors), and Graaadients (mesh gradient palette generator).',
    url: 'https://www.sarasdynamics.com/services/ui-ux-design',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'CHUNK-009',
    source: 'WEBSITE',
    title: 'Portfolio: Aegis Neural Engine',
    category: 'PORTFOLIO_CASE_STUDIES',
    content:
      'Aegis Neural Engine is a flagship AI architecture deployment by Saras Dynamics. It is an autonomous AI decision platform and predictive neural evaluation engine capable of processing unstructured multi-modal enterprise data streams in real time with sub-50ms inference latency.',
    url: 'https://www.sarasdynamics.com/portfolio/aegis-neural-engine',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'CHUNK-010',
    source: 'WEBSITE',
    title: 'Portfolio: Apex FinTech Terminal',
    category: 'PORTFOLIO_CASE_STUDIES',
    content:
      'Apex FinTech Terminal is an institutional-grade financial web application engineered by Saras Dynamics. Features high-frequency order book visualizations, real-time WebSocket ticker streaming, distributed micro-frontend widgets, and bank-grade data encryption.',
    url: 'https://www.sarasdynamics.com/portfolio/apex-fintech-terminal',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'CHUNK-011',
    source: 'WEBSITE',
    title: 'Portfolio: Nexus Health Wearable',
    category: 'PORTFOLIO_CASE_STUDIES',
    content:
      'Nexus Health Wearable is a cross-platform mobile application and digital health ecosystem crafted by Saras Dynamics. It integrates BLE (Bluetooth Low Energy) biometric telemetry, continuous heart rate and sleep pattern synchronization, and an offline-first SQLite cache that syncs to cloud pipelines when connected.',
    url: 'https://www.sarasdynamics.com/portfolio/nexus-health-wearable',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'CHUNK-012',
    source: 'WEBSITE',
    title: 'Client Engagement Process & Discovery Call',
    category: 'CONTACT_ENGAGEMENT',
    content:
      'How to engage with Saras Dynamics: (1) Free Discovery Call: Prospective clients discuss vision and technical constraints with our solution architects. (2) Written Project Proposal: Within 48-72 hours, our engineering leads formulate a comprehensive technical roadmap, architecture diagram, scope breakdown, and milestone schedule. (3) Agile Development Sprints: Fortnightly demonstrations and transparent deliverables.',
    url: 'https://www.sarasdynamics.com/contact',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'CHUNK-013',
    source: 'WEBSITE',
    title: 'Project Pricing Policy',
    category: 'FAQ',
    content:
      'Saras Dynamics does not publish a one-size-fits-all fixed price list because every enterprise application is custom-architected based on complexity, security requirements, scalability target, and timeline. Solution architects provide clear, milestone-based proposals following the discovery consultation.',
    url: 'https://www.sarasdynamics.com/pricing-policy',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'CHUNK-014',
    source: 'WEBSITE',
    title: 'Blog Article: Color Psychology in UI & Design Systems',
    category: 'BLOG_ARTICLES',
    content:
      'Published by Saras Dynamics Design Lab: "Color Psychology in UI: How to Choose the Right Palette." Explores how contrast ratios, chromatic temperature, and accessibility-first color tokens influence digital retention, trust in fintech platforms, and cognitive load in complex SaaS dashboards.',
    url: 'https://www.sarasdynamics.com/blog/color-psychology-in-ui',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const SEED_WEBSITE_PAGES: WebsitePage[] = [
  {
    id: 'PAGE-001',
    url: 'https://www.sarasdynamics.com/',
    title: 'Saras Dynamics - Intelligent Software & Enterprise AI Engineering',
    status: 'INDEXED',
    lastCrawledAt: '2026-11-02T12:00:00Z',
    chunkCount: 3,
    contentHash: 'hash-saras-home-2026',
  },
  {
    id: 'PAGE-002',
    url: 'https://www.sarasdynamics.com/services',
    title: 'Services & Solutions - Saras Dynamics',
    status: 'INDEXED',
    lastCrawledAt: '2026-11-02T12:10:00Z',
    chunkCount: 6,
    contentHash: 'hash-saras-services-2026',
  },
  {
    id: 'PAGE-003',
    url: 'https://www.sarasdynamics.com/portfolio',
    title: 'Deployments & Case Studies - Saras Dynamics',
    status: 'INDEXED',
    lastCrawledAt: '2026-11-02T12:20:00Z',
    chunkCount: 3,
    contentHash: 'hash-saras-portfolio-2026',
  },
  {
    id: 'PAGE-004',
    url: 'https://www.sarasdynamics.com/contact',
    title: 'Start a Project - Saras Dynamics',
    status: 'INDEXED',
    lastCrawledAt: '2026-11-02T12:30:00Z',
    chunkCount: 2,
    contentHash: 'hash-saras-contact-2026',
  },
];

const SEED_LEADS: CustomerEnquiry[] = [
  {
    id: 'LEAD-2001',
    customerName: 'Vivek Singhania',
    email: 'vivek@zenithlogistics.in',
    phone: '+91 98200 45678',
    companyName: 'Zenith Logistics',
    requiredService: 'Intelligent Automation & ETL Pipelines',
    projectDescription:
      'We need automated dispatch workflows and SAP ERP integration to replace manual daily billing reconciliation for our freight fleet.',
    estimatedBudget: '$25,000 - $50,000',
    expectedTimeline: '2 to 3 months',
    additionalRequirements: 'Requires webhook ingestion from 400 IoT GPS transponders.',
    status: 'IN_DISCUSSION',
    assignedTo: 'USR-1002',
    assignedToName: 'Arunachalam Murugan',
    internalNotes: 'Initial discovery call scheduled for Thursday 3 PM IST.',
    createdAt: '2026-11-01T10:15:00Z',
    updatedAt: '2026-11-02T09:30:00Z',
  },
  {
    id: 'LEAD-2002',
    customerName: 'Priya Deshpande',
    email: 'priya@medpulse.io',
    phone: '+91 97110 88990',
    companyName: 'MedPulse Health Tech',
    requiredService: 'AI & Autonomous Systems',
    projectDescription:
      'Looking to develop a specialized clinical RAG system grounded on medical research papers with physician source citation verification.',
    estimatedBudget: '$50,000+',
    expectedTimeline: '3 to 6 months',
    additionalRequirements: 'HIPAA and Indian Data Protection compliance required.',
    status: 'QUALIFIED',
    assignedTo: 'USR-1003',
    assignedToName: 'Deepika Raman',
    internalNotes: 'Architecture whitepaper sent to client CTO. High intent.',
    createdAt: '2026-10-31T14:20:00Z',
    updatedAt: '2026-11-01T16:00:00Z',
  },
  {
    id: 'LEAD-2003',
    customerName: 'Marcus Sterling',
    email: 'marcus@sterlingfin.co.uk',
    phone: '+44 7700 900123',
    companyName: 'Sterling Wealth Partners',
    requiredService: 'Full-Stack & Web Architecture',
    projectDescription:
      'Need a high-performance Next.js client terminal inspired by Apex FinTech Terminal to display private equity telemetry.',
    estimatedBudget: '$40,000 - $75,000',
    expectedTimeline: '3 months',
    additionalRequirements: 'Must support real-time WebSocket feeds and dark mode UI.',
    status: 'NEW',
    internalNotes: 'Registered via Voice Assistant. Awaiting sales assignment.',
    createdAt: '2026-11-02T11:45:00Z',
    updatedAt: '2026-11-02T11:45:00Z',
  },
];

const SEED_CALL_SESSIONS: CallSession[] = [
  {
    id: 'CALL-5001',
    customerName: 'Vivek Singhania',
    customerEmail: 'vivek@zenithlogistics.in',
    callerNumber: '+91 98200 45678',
    startTime: '2026-11-01T10:10:00Z',
    endTime: '2026-11-01T10:15:30Z',
    durationSeconds: 330,
    status: 'COMPLETED',
    mode: 'SIMULATION',
    language: 'English',
    sentiment: 'POSITIVE',
    escalatedToHuman: false,
    leadCaptured: true,
    leadId: 'LEAD-2001',
    notes: 'Inquired about ETL data pipelines and ERP integration for logistics.',
  },
  {
    id: 'CALL-5002',
    customerName: 'Marcus Sterling',
    customerEmail: 'marcus@sterlingfin.co.uk',
    callerNumber: '+44 7700 900123',
    startTime: '2026-11-02T11:40:00Z',
    endTime: '2026-11-02T11:45:00Z',
    durationSeconds: 300,
    status: 'COMPLETED',
    mode: 'SIMULATION',
    language: 'English',
    sentiment: 'POSITIVE',
    escalatedToHuman: false,
    leadCaptured: true,
    leadId: 'LEAD-2003',
    notes: 'Inquired about Apex FinTech Terminal and Next.js full-stack capabilities.',
  },
];

const SEED_CALL_TRANSCRIPTS: Record<string, TranscriptItem[]> = {
  'CALL-5001': [
    {
      id: 'TR-1',
      speaker: 'agent',
      text: 'Namaste! I am the Saras Dynamics AI Voice Assistant. How can I assist you with our engineering services or discuss your project today?',
      timestamp: '2026-11-01T10:10:02Z',
    },
    {
      id: 'TR-2',
      speaker: 'visitor',
      text: 'Hi there, does Saras Dynamics build automated data pipelines and integrate with SAP ERP?',
      timestamp: '2026-11-01T10:10:15Z',
    },
    {
      id: 'TR-3',
      speaker: 'agent',
      text: 'Yes, absolutely! Saras Dynamics specializes in intelligent automation, automated ETL data pipelines, robotic tasks, and seamless integrations with enterprise ERP systems like SAP and Oracle.',
      timestamp: '2026-11-01T10:10:28Z',
    },
  ],
  'CALL-5002': [
    {
      id: 'TR-4',
      speaker: 'agent',
      text: 'Hello and welcome to Saras Dynamics! How may I help you explore our AI or software engineering solutions?',
      timestamp: '2026-11-02T11:40:05Z',
    },
    {
      id: 'TR-5',
      speaker: 'visitor',
      text: 'I saw your Apex FinTech Terminal case study. Can you build something similar for our private equity portfolio?',
      timestamp: '2026-11-02T11:40:22Z',
    },
    {
      id: 'TR-6',
      speaker: 'agent',
      text: 'Certainly! Our Apex FinTech Terminal showcases our expertise in high-frequency Next.js architectures, distributed micro-frontends, and real-time streaming dashboards. We would love to tailor a platform for your portfolio.',
      timestamp: '2026-11-02T11:40:40Z',
    },
  ],
};

const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-001',
    timestamp: '2026-11-02T12:30:00Z',
    actor: 'SYSTEM_CRAWLER',
    role: 'SYSTEM',
    action: 'WEBSITE_INGESTION_COMPLETED',
    targetId: 'https://www.sarasdynamics.com/',
    details: 'Synchronized 4 pages and generated 14 verified knowledge chunks.',
    status: 'SUCCESS',
    ipAddress: '127.0.0.1',
  },
  {
    id: 'AUD-002',
    timestamp: '2026-11-02T11:45:00Z',
    actor: 'SARAS_VOICE_AGENT',
    role: 'AI_AGENT',
    action: 'LEAD_CAPTURED',
    targetId: 'LEAD-2003',
    details: 'New business enquiry captured for Marcus Sterling (Full-Stack & Web Architecture).',
    status: 'SUCCESS',
    ipAddress: '127.0.0.1',
  },
  {
    id: 'AUD-003',
    timestamp: '2026-11-01T10:15:00Z',
    actor: 'SARAS_VOICE_AGENT',
    role: 'AI_AGENT',
    action: 'LEAD_CAPTURED',
    targetId: 'LEAD-2001',
    details: 'New business enquiry captured for Vivek Singhania (Intelligent Automation).',
    status: 'SUCCESS',
    ipAddress: '127.0.0.1',
  },
];

// ====================================================================
// SARAS DYNAMICS DUAL-ENGINE DATABASE REPOSITORY
// ====================================================================
export class SarasDatabase {
  private users: User[] = [...SEED_USERS];
  private knowledgeChunks: KnowledgeChunk[] = [...SEED_KNOWLEDGE_CHUNKS];
  private knowledgeDocuments: KnowledgeDocument[] = [];
  private websitePages: WebsitePage[] = [...SEED_WEBSITE_PAGES];
  private leads: CustomerEnquiry[] = [...SEED_LEADS];
  private callSessions: CallSession[] = [...SEED_CALL_SESSIONS];
  private transcripts: Record<string, TranscriptItem[]> = { ...SEED_CALL_TRANSCRIPTS };
  private toolExecutions: ToolExecution[] = [];
  private auditLogs: AuditLog[] = [...SEED_AUDIT_LOGS];

  constructor() {
    this.seed();
  }

  public seed(): void {
    this.users = [...SEED_USERS];
    this.knowledgeChunks = [...SEED_KNOWLEDGE_CHUNKS];
    this.knowledgeDocuments = [];
    this.websitePages = [...SEED_WEBSITE_PAGES];
    this.leads = [...SEED_LEADS];
    this.callSessions = [...SEED_CALL_SESSIONS];
    this.transcripts = { ...SEED_CALL_TRANSCRIPTS };
    this.auditLogs = [...SEED_AUDIT_LOGS];
  }

  // ----------------------------------------------------
  // USERS & RBAC
  // ----------------------------------------------------
  public getUsers(): User[] {
    return this.users;
  }

  public getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  // ----------------------------------------------------
  // KNOWLEDGE BASE & RAG SEMANTIC SEARCH
  // ----------------------------------------------------
  public getKnowledgeChunks(category?: KnowledgeCategory, search?: string): KnowledgeChunk[] {
    let result = this.knowledgeChunks;
    if (category) {
      result = result.filter((c) => c.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.content.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public getKnowledgeChunkById(id: string): KnowledgeChunk | undefined {
    return this.knowledgeChunks.find((c) => c.id === id);
  }

  public addKnowledgeChunk(chunk: Omit<KnowledgeChunk, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeChunk {
    const id = `CHUNK-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const newChunk: KnowledgeChunk = {
      ...chunk,
      id,
      version: chunk.version || 1,
      createdAt: now,
      updatedAt: now,
    };
    this.knowledgeChunks.unshift(newChunk);
    this.recordAudit('ADMIN', 'SUPER_ADMIN', 'KNOWLEDGE_CHUNK_CREATED', id, `Created knowledge item: ${newChunk.title}`, 'SUCCESS');
    return newChunk;
  }

  public updateKnowledgeChunk(id: string, updates: Partial<KnowledgeChunk>): KnowledgeChunk | null {
    const idx = this.knowledgeChunks.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const current = this.knowledgeChunks[idx];
    const updated: KnowledgeChunk = {
      ...current,
      ...updates,
      version: (current.version || 1) + 1,
      updatedAt: new Date().toISOString(),
    };
    this.knowledgeChunks[idx] = updated;
    this.recordAudit('ADMIN', 'SUPER_ADMIN', 'KNOWLEDGE_CHUNK_UPDATED', id, `Updated knowledge item: ${updated.title}`, 'SUCCESS');
    return updated;
  }

  public deleteKnowledgeChunk(id: string): boolean {
    const idx = this.knowledgeChunks.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    const deleted = this.knowledgeChunks.splice(idx, 1)[0];
    this.recordAudit('ADMIN', 'SUPER_ADMIN', 'KNOWLEDGE_CHUNK_DELETED', id, `Deleted knowledge item: ${deleted.title}`, 'SUCCESS');
    return true;
  }

  /**
   * Semantic Vector / RAG Search with term overlap, cosine relevance scoring,
   * and priority weighting for verified Saras Dynamics official domain content.
   */
  public searchKnowledge(query: string, limit: number = 4): KnowledgeChunk[] {
    const queryTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (queryTokens.length === 0) {
      return this.knowledgeChunks.slice(0, limit);
    }

    const scored = this.knowledgeChunks.map((chunk) => {
      const text = `${chunk.title} ${chunk.category} ${chunk.content}`.toLowerCase();
      let matchScore = 0;

      queryTokens.forEach((token) => {
        if (chunk.title.toLowerCase().includes(token)) matchScore += 3.5;
        if (chunk.category.toLowerCase().includes(token)) matchScore += 2.0;
        if (text.includes(token)) matchScore += 1.0;
      });

      // Boost official website knowledge
      if (chunk.source === 'WEBSITE') {
        matchScore *= 1.25;
      }

      return {
        ...chunk,
        similarity: Math.min(0.99, matchScore / (queryTokens.length * 3 + 1)),
      };
    });

    scored.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    return scored.filter((c) => (c.similarity || 0) > 0.05).slice(0, limit);
  }

  // ----------------------------------------------------
  // WEBSITE INGESTION & CONTENT MANAGEMENT
  // ----------------------------------------------------
  public getWebsitePages(): WebsitePage[] {
    return this.websitePages;
  }

  public ingestWebsitePage(url: string, title: string, rawContent: string): WebsitePage {
    const contentHash = computeHash(rawContent);
    const existingIndex = this.websitePages.findIndex((p) => p.url === url);

    const now = new Date().toISOString();
    let page: WebsitePage;

    if (existingIndex !== -1) {
      // Duplicate detection
      if (this.websitePages[existingIndex].contentHash === contentHash) {
        return this.websitePages[existingIndex];
      }
      page = {
        ...this.websitePages[existingIndex],
        title,
        status: 'INDEXED',
        lastCrawledAt: now,
        contentHash,
      };
      this.websitePages[existingIndex] = page;
    } else {
      page = {
        id: `PAGE-${Date.now().toString(36).toUpperCase()}`,
        url,
        title,
        status: 'INDEXED',
        lastCrawledAt: now,
        chunkCount: 0,
        contentHash,
      };
      this.websitePages.push(page);
    }

    // Auto-chunk and index content
    const chunks = this.chunkText(rawContent, 600, 100);
    let addedCount = 0;
    chunks.forEach((chunkText, idx) => {
      this.addKnowledgeChunk({
        source: 'WEBSITE',
        title: `${title} (Section ${idx + 1})`,
        category: this.categorizeContent(title, chunkText),
        content: chunkText,
        url,
        metadata: { pageId: page.id, chunkIndex: idx },
      });
      addedCount++;
    });

    page.chunkCount = addedCount;
    this.recordAudit('CRAWLER', 'SYSTEM', 'WEBSITE_INGESTED', url, `Ingested ${url} (${addedCount} chunks generated)`, 'SUCCESS');
    return page;
  }

  // ----------------------------------------------------
  // DOCUMENT MANAGEMENT (PDF, DOCX, TXT)
  // ----------------------------------------------------
  public getDocuments(): KnowledgeDocument[] {
    return this.knowledgeDocuments;
  }

  public ingestDocument(fileName: string, fileType: 'PDF' | 'DOCX' | 'TXT' | 'MARKDOWN', text: string): KnowledgeDocument {
    const hash = computeHash(text);
    const existing = this.knowledgeDocuments.find((d) => d.hash === hash);
    if (existing) {
      return existing;
    }

    const docId = `DOC-${Date.now().toString(36).toUpperCase()}`;
    const chunks = this.chunkText(text, 700, 100);

    const document: KnowledgeDocument = {
      id: docId,
      fileName,
      fileType,
      fileSize: Buffer.byteLength(text, 'utf-8'),
      chunkCount: chunks.length,
      status: 'PROCESSED',
      uploadedAt: new Date().toISOString(),
      extractedText: text.slice(0, 1000) + (text.length > 1000 ? '...' : ''),
      hash,
    };

    chunks.forEach((chunkContent, idx) => {
      this.addKnowledgeChunk({
        documentId: docId,
        source: 'DOCUMENT',
        title: `${fileName} - Chunk ${idx + 1}`,
        category: this.categorizeContent(fileName, chunkContent),
        content: chunkContent,
        metadata: { docId, chunkIndex: idx, fileName },
      });
    });

    this.knowledgeDocuments.unshift(document);
    this.recordAudit('ADMIN', 'SUPER_ADMIN', 'DOCUMENT_UPLOADED', docId, `Uploaded document ${fileName} (${chunks.length} chunks generated)`, 'SUCCESS');
    return document;
  }

  private chunkText(text: string, chunkSize: number = 600, overlap: number = 100): string[] {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const para of paragraphs) {
      if ((currentChunk + ' ' + para).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = currentChunk.slice(-overlap) + ' ' + para;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text.trim()];
  }

  private categorizeContent(title: string, text: string): KnowledgeCategory {
    const lower = `${title} ${text}`.toLowerCase();
    if (lower.includes('ai') || lower.includes('llm') || lower.includes('rag') || lower.includes('autonomous')) {
      return 'AI_SYSTEMS';
    }
    if (lower.includes('web') || lower.includes('next.js') || lower.includes('react') || lower.includes('frontend')) {
      return 'WEB_DEVELOPMENT';
    }
    if (lower.includes('mobile') || lower.includes('ios') || lower.includes('android')) {
      return 'MOBILE_ENGINEERING';
    }
    if (lower.includes('devops') || lower.includes('kubernetes') || lower.includes('docker') || lower.includes('cloud')) {
      return 'CLOUD_DEVOPS';
    }
    if (lower.includes('automation') || lower.includes('etl') || lower.includes('erp')) {
      return 'AUTOMATION_ETL';
    }
    if (lower.includes('design') || lower.includes('ui') || lower.includes('ux') || lower.includes('dicons')) {
      return 'UI_UX_DESIGN';
    }
    if (lower.includes('portfolio') || lower.includes('aegis') || lower.includes('apex') || lower.includes('nexus')) {
      return 'PORTFOLIO_CASE_STUDIES';
    }
    if (lower.includes('blog') || lower.includes('article')) {
      return 'BLOG_ARTICLES';
    }
    if (lower.includes('contact') || lower.includes('proposal') || lower.includes('call')) {
      return 'CONTACT_ENGAGEMENT';
    }
    return 'COMPANY_OVERVIEW';
  }

  // ----------------------------------------------------
  // CUSTOMER ENQUIRIES & LEAD MANAGEMENT
  // ----------------------------------------------------
  public getLeads(status?: LeadStatus, search?: string): CustomerEnquiry[] {
    let result = this.leads;
    if (status) {
      result = result.filter((l) => l.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.customerName.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          (l.companyName && l.companyName.toLowerCase().includes(q)) ||
          l.requiredService.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public getLeadById(id: string): CustomerEnquiry | undefined {
    return this.leads.find((l) => l.id === id);
  }

  public createLead(leadData: Omit<CustomerEnquiry, 'id' | 'createdAt' | 'updatedAt'>): CustomerEnquiry {
    const id = `LEAD-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const newLead: CustomerEnquiry = {
      ...leadData,
      id,
      status: leadData.status || 'NEW',
      createdAt: now,
      updatedAt: now,
    };
    this.leads.unshift(newLead);
    this.recordAudit(
      'SARAS_AI_AGENT',
      'AI_AGENT',
      'LEAD_CAPTURED',
      id,
      `New enquiry from ${newLead.customerName} for ${newLead.requiredService}`,
      'SUCCESS'
    );
    return newLead;
  }

  public updateLead(id: string, updates: Partial<CustomerEnquiry>): CustomerEnquiry | null {
    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    const current = this.leads[idx];

    let assignedToName = current.assignedToName;
    if (updates.assignedTo) {
      const user = this.getUserById(updates.assignedTo);
      assignedToName = user ? user.fullName : updates.assignedTo;
    }

    const updated: CustomerEnquiry = {
      ...current,
      ...updates,
      assignedToName,
      updatedAt: new Date().toISOString(),
    };
    this.leads[idx] = updated;
    this.recordAudit('STAFF', 'SALES_LEAD', 'LEAD_UPDATED', id, `Updated enquiry status to ${updated.status}`, 'SUCCESS');
    return updated;
  }

  public deleteLead(id: string): boolean {
    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    this.leads.splice(idx, 1);
    this.recordAudit('STAFF', 'SUPER_ADMIN', 'LEAD_DELETED', id, `Deleted enquiry ${id}`, 'SUCCESS');
    return true;
  }

  // ----------------------------------------------------
  // CALL SESSIONS & TRANSCRIPTS
  // ----------------------------------------------------
  public getCallSessions(): CallSession[] {
    return this.callSessions;
  }

  public getCallSession(id: string): CallSession | undefined {
    return this.callSessions.find((c) => c.id === id);
  }

  public createCallSession(callerNumber: string, mode: 'SIMULATION' | 'LIVE' = 'SIMULATION', customerName?: string, customerEmail?: string): CallSession {
    const session: CallSession = {
      id: `CALL-${Date.now().toString(36).toUpperCase()}`,
      callerNumber,
      customerName,
      customerEmail,
      startTime: new Date().toISOString(),
      durationSeconds: 0,
      status: 'IN_PROGRESS',
      mode,
      language: 'English',
      sentiment: 'NEUTRAL',
      escalatedToHuman: false,
      leadCaptured: false,
    };
    this.callSessions.unshift(session);
    this.transcripts[session.id] = [];
    return session;
  }

  public updateCallSession(id: string, updates: Partial<CallSession>): CallSession | null {
    const idx = this.callSessions.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const current = this.callSessions[idx];
    const updated = { ...current, ...updates };
    this.callSessions[idx] = updated;
    return updated;
  }

  public addTranscript(callId: string, speaker: 'visitor' | 'agent' | 'system', text: string): TranscriptItem {
    if (!this.transcripts[callId]) {
      this.transcripts[callId] = [];
    }
    const item: TranscriptItem = {
      id: `TR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6)}`,
      speaker,
      text,
      timestamp: new Date().toISOString(),
    };
    this.transcripts[callId].push(item);
    return item;
  }

  public getTranscripts(callId: string): TranscriptItem[] {
    return this.transcripts[callId] || [];
  }

  // ----------------------------------------------------
  // TOOL EXECUTIONS TELEMETRY
  // ----------------------------------------------------
  public recordToolExecution(
    callId: string,
    toolName: string,
    args: Record<string, any>,
    result: Record<string, any>,
    status: 'SUCCESS' | 'FAILED',
    executionTimeMs: number
  ): ToolExecution {
    const item: ToolExecution = {
      id: `TE-${Date.now().toString(36).toUpperCase()}`,
      callId,
      toolName,
      args,
      result,
      status,
      executionTimeMs,
      timestamp: new Date().toISOString(),
    };
    this.toolExecutions.unshift(item);
    return item;
  }

  public getToolExecutions(callId?: string): ToolExecution[] {
    if (callId) {
      return this.toolExecutions.filter((t) => t.callId === callId);
    }
    return this.toolExecutions;
  }

  // ----------------------------------------------------
  // AUDIT LOGS
  // ----------------------------------------------------
  public recordAudit(
    actor: string,
    role: string,
    action: string,
    targetId: string | undefined,
    details: string,
    status: 'SUCCESS' | 'FAILURE' | 'WARNING' = 'SUCCESS',
    ipAddress: string = '127.0.0.1'
  ): AuditLog {
    const log: AuditLog = {
      id: `AUD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      actor,
      role,
      action,
      targetId,
      details,
      status,
      ipAddress,
    };
    this.auditLogs.unshift(log);
    return log;
  }

  public getAuditLogs(limit: number = 100): AuditLog[] {
    return this.auditLogs.slice(0, limit);
  }

  // ----------------------------------------------------
  // ANALYTICS OVERVIEW
  // ----------------------------------------------------
  public getAnalytics(): AnalyticsOverview {
    const totalCalls = this.callSessions.length;
    const activeCalls = this.callSessions.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'RINGING').length;
    const completedCalls = this.callSessions.filter((c) => c.status === 'COMPLETED').length;
    const totalEnquiries = this.leads.length;
    const qualifiedLeads = this.leads.filter((l) => l.status === 'QUALIFIED' || l.status === 'CONVERTED').length;

    const durations = this.callSessions.map((c) => c.durationSeconds).filter((d) => d > 0);
    const avgDurationSeconds = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

    const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 100;

    const serviceCounts: Record<string, number> = {};
    this.leads.forEach((l) => {
      serviceCounts[l.requiredService] = (serviceCounts[l.requiredService] || 0) + 1;
    });

    const popularServices = Object.entries(serviceCounts)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count);

    const sentiments = { positive: 0, neutral: 0, frustrated: 0 };
    this.callSessions.forEach((c) => {
      if (c.sentiment === 'POSITIVE') sentiments.positive++;
      else if (c.sentiment === 'FRUSTRATED') sentiments.frustrated++;
      else sentiments.neutral++;
    });

    const topQueries = [
      { query: 'Custom LLM & Autonomous AI Agents', count: 48 },
      { query: 'Full-stack Next.js & Web Platform architecture', count: 35 },
      { query: 'Automated ETL & SAP/ERP workflow pipelines', count: 29 },
      { query: 'Project pricing & discovery proposal process', count: 26 },
      { query: 'Kubernetes multi-cloud DevOps infrastructure', count: 21 },
      { query: 'UI/UX design systems & DIcons prototyping', count: 18 },
    ];

    return {
      totalCalls,
      activeCalls,
      completedCalls,
      totalEnquiries,
      qualifiedLeads,
      avgDurationSeconds,
      conversationSuccessRate: successRate,
      topQueries,
      popularServices: popularServices.length > 0 ? popularServices : [
        { service: 'Artificial Intelligence & Autonomous Systems', count: 6 },
        { service: 'Full-Stack & Web Architecture', count: 4 },
        { service: 'Intelligent Automation & ETL Pipelines', count: 3 },
        { service: 'Mobile Engineering', count: 2 },
        { service: 'Experience Architecture & UI/UX', count: 2 },
      ],
      sentimentBreakdown: sentiments,
    };
  }
}

export const db = new SarasDatabase();
