import { db } from './db.ts';
import { ToolExecution } from '../types/saras.ts';

export interface ToolExecutionContext {
  callId: string;
  callerPhone?: string;
  visitorName?: string;
}

export interface OpenAIFunctionTool {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
        items?: any;
      }
    >;
    required?: string[];
  };
}

// ====================================================================
// 1. TOOL FUNCTION DECLARATIONS FOR OPENAI REALTIME API
// ====================================================================
export const SARAS_TOOL_DECLARATIONS: OpenAIFunctionTool[] = [
  {
    type: 'function',
    name: 'retrieve_company_knowledge',
    description:
      'Search the verified Saras Dynamics dynamic knowledge base (ingested website, documents, service specifications, case studies, technologies, and pricing policy) to answer questions with accurate company facts.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'The semantic search query, e.g. "custom LLM integrations", "pricing for mobile app", "DevOps Kubernetes architecture", or "Aegis Neural Engine".',
        },
        category: {
          type: 'string',
          description: 'Optional category filter for targeted retrieval.',
          enum: [
            'COMPANY_OVERVIEW',
            'SERVICES',
            'AI_SYSTEMS',
            'WEB_DEVELOPMENT',
            'MOBILE_ENGINEERING',
            'CLOUD_DEVOPS',
            'AUTOMATION_ETL',
            'UI_UX_DESIGN',
            'PORTFOLIO_CASE_STUDIES',
            'TECHNOLOGIES',
            'BLOG_ARTICLES',
            'CONTACT_ENGAGEMENT',
            'FAQ',
          ],
        },
      },
      required: ['query'],
    },
  },
  {
    type: 'function',
    name: 'capture_customer_lead',
    description:
      'Register a prospective client project enquiry or business lead into the Saras Dynamics CRM system. Call this after collecting the visitor contact info and project requirements.',
    parameters: {
      type: 'object',
      properties: {
        customerName: {
          type: 'string',
          description: 'Full name of the prospective customer.',
        },
        email: {
          type: 'string',
          description: 'Business or personal email address of the customer.',
        },
        phone: {
          type: 'string',
          description: 'Contact phone number with country code, e.g. "+91 98765 43210".',
        },
        companyName: {
          type: 'string',
          description: 'Company, organization, or startup name (if applicable).',
        },
        requiredService: {
          type: 'string',
          description:
            'The primary service required: "AI & Autonomous Systems", "Full-Stack & Web Architecture", "Mobile Engineering", "Cloud & DevOps", "Intelligent Automation", "UI/UX & Product Design", or "General Consultation".',
        },
        projectDescription: {
          type: 'string',
          description: 'Detailed description of the customer project, goals, key features, and requirements.',
        },
        estimatedBudget: {
          type: 'string',
          description: 'Optional budget range discussed by the customer, e.g. "$15,000 - $30,000" or "Undetermined".',
        },
        expectedTimeline: {
          type: 'string',
          description: 'Optional desired completion timeline, e.g. "2 to 3 months" or "Q1 next year".',
        },
        additionalRequirements: {
          type: 'string',
          description: 'Any compliance, security, tech stack preferences, or integrations mentioned.',
        },
      },
      required: ['customerName', 'email', 'phone', 'requiredService', 'projectDescription'],
    },
  },
  {
    type: 'function',
    name: 'get_service_details',
    description:
      'Retrieve official specifications, tech stack options, architecture patterns, and engineering deliverables for a specific Saras Dynamics service.',
    parameters: {
      type: 'object',
      properties: {
        serviceKey: {
          type: 'string',
          description: 'Key identifier of the service.',
          enum: [
            'ai_autonomous_systems',
            'full_stack_web',
            'mobile_engineering',
            'cloud_devops',
            'intelligent_automation',
            'ui_ux_design',
          ],
        },
      },
      required: ['serviceKey'],
    },
  },
  {
    type: 'function',
    name: 'get_portfolio_case_study',
    description:
      'Retrieve verified case study specifications, technical highlights, and outcomes for featured Saras Dynamics production deployments.',
    parameters: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'Identifier of the portfolio case study.',
          enum: [
            'aegis_neural_engine',
            'apex_fintech_terminal',
            'nexus_health_wearable',
            'design_assets_dicons',
          ],
        },
      },
      required: ['projectKey'],
    },
  },
  {
    type: 'function',
    name: 'request_human_callback',
    description:
      'Schedule a human consultation, discovery video call, or callback from a Saras Dynamics solution architect when a visitor requests human assistance or detailed architectural planning.',
    parameters: {
      type: 'object',
      properties: {
        visitorName: {
          type: 'string',
          description: 'Name of the visitor requesting the callback.',
        },
        contactDetails: {
          type: 'string',
          description: 'Phone number or email for the follow-up.',
        },
        preferredChannel: {
          type: 'string',
          description: 'Preferred follow-up channel.',
          enum: ['phone', 'email', 'whatsapp', 'video_discovery_call'],
        },
        topic: {
          type: 'string',
          description: 'Brief summary of what the customer wants to discuss with the engineering team.',
        },
      },
      required: ['visitorName', 'contactDetails', 'topic'],
    },
  },
];

// ====================================================================
// 2. TOOL EXECUTION DISPATCHER & HANDLERS
// ====================================================================
export async function executeSarasTool(
  toolName: string,
  args: Record<string, any>,
  context: ToolExecutionContext
): Promise<{ success: boolean; data?: any; error?: string }> {
  const startTime = Date.now();
  let result: { success: boolean; data?: any; error?: string };

  try {
    switch (toolName) {
      case 'retrieve_company_knowledge':
        result = handleRetrieveKnowledge(args.query, args.category);
        break;

      case 'capture_customer_lead':
        result = handleCaptureLead(args, context);
        break;

      case 'get_service_details':
        result = handleGetServiceDetails(args.serviceKey);
        break;

      case 'get_portfolio_case_study':
        result = handleGetPortfolioCaseStudy(args.projectKey);
        break;

      case 'request_human_callback':
        result = handleRequestHumanCallback(args, context);
        break;

      default:
        result = {
          success: false,
          error: `Unknown tool "${toolName}". Supported tools: retrieve_company_knowledge, capture_customer_lead, get_service_details, get_portfolio_case_study, request_human_callback.`,
        };
        break;
    }
  } catch (err: any) {
    result = {
      success: false,
      error: `Tool execution exception: ${err.message || 'Unknown error'}`,
    };
  }

  const executionTimeMs = Date.now() - startTime;
  db.recordToolExecution(
    context.callId,
    toolName,
    args,
    result,
    result.success ? 'SUCCESS' : 'FAILED',
    executionTimeMs
  );

  return result;
}

// ----------------------------------------------------
// Handlers
// ----------------------------------------------------

function handleRetrieveKnowledge(
  query: string,
  category?: string
): { success: boolean; data?: any; error?: string } {
  if (!query || query.trim().length === 0) {
    return { success: false, error: 'Query parameter is required' };
  }

  const matches = db.searchKnowledge(query, 4);

  if (matches.length === 0) {
    return {
      success: true,
      data: {
        matchesFound: 0,
        message:
          'No direct match found in verified knowledge base. Advise visitor transparently and offer to record their requirements for the solution architects.',
      },
    };
  }

  return {
    success: true,
    data: {
      matchesFound: matches.length,
      retrievedChunks: matches.map((m) => ({
        title: m.title,
        category: m.category,
        source: m.source,
        content: m.content,
        url: m.url || 'https://www.sarasdynamics.com/',
        relevanceScore: m.similarity ? Math.round(m.similarity * 100) / 100 : 0.85,
      })),
    },
  };
}

function handleCaptureLead(
  args: Record<string, any>,
  context: ToolExecutionContext
): { success: boolean; data?: any; error?: string } {
  const {
    customerName,
    email,
    phone,
    companyName,
    requiredService,
    projectDescription,
    estimatedBudget,
    expectedTimeline,
    additionalRequirements,
  } = args;

  if (!customerName || !email || !phone || !requiredService || !projectDescription) {
    return {
      success: false,
      error: 'Missing required fields: customerName, email, phone, requiredService, and projectDescription are mandatory.',
    };
  }

  const newLead = db.createLead({
    customerName,
    email,
    phone,
    companyName,
    requiredService,
    projectDescription,
    estimatedBudget,
    expectedTimeline,
    additionalRequirements,
    status: 'NEW',
    conversationId: context.callId,
    internalNotes: `Lead captured via Saras Dynamics Voice Assistant during call ${context.callId}.`,
  });

  // Mark call session as lead captured
  db.updateCallSession(context.callId, {
    leadCaptured: true,
    leadId: newLead.id,
    customerName,
    customerEmail: email,
  });

  return {
    success: true,
    data: {
      leadId: newLead.id,
      customerName: newLead.customerName,
      status: 'CONFIRMED',
      message: `Enquiry registered successfully with ID ${newLead.id}. The Saras Dynamics engineering team has been notified.`,
    },
  };
}

function handleGetServiceDetails(serviceKey: string): { success: boolean; data?: any; error?: string } {
  const SERVICE_REGISTRY: Record<string, any> = {
    ai_autonomous_systems: {
      title: 'Artificial Intelligence & Autonomous Systems',
      category: 'AI_SYSTEMS',
      overview: 'End-to-end intelligent systems, custom LLMs, RAG, and autonomous workflow agents.',
      capabilities: [
        'Custom Large Language Model (LLM) fine-tuning and domain alignment',
        'Enterprise RAG pipelines with hybrid vector and keyword retrieval',
        'Autonomous AI agents with tool use, webhooks, and task planning',
        'Predictive neural modeling, time-series forecasting, and anomaly detection',
      ],
      techStack: ['PyTorch', 'Hugging Face', 'LangChain', 'LlamaIndex', 'OpenAI', 'vLLM', 'PostgreSQL pgvector', 'Qdrant'],
    },
    full_stack_web: {
      title: 'Full-Stack & Web Architecture',
      category: 'WEB_DEVELOPMENT',
      overview: 'High-performance, mission-critical web applications, micro-frontends, and distributed backends.',
      capabilities: [
        'Next.js 15+ App Router and Server Components',
        'Micro-frontend architecture and modular federated modules',
        'High-concurrency GraphQL and RESTful API platforms',
        'Real-time WebSocket and WebRTC state sync',
      ],
      techStack: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'FastAPI', 'Redis', 'PostgreSQL'],
    },
    mobile_engineering: {
      title: 'Mobile Engineering',
      category: 'MOBILE_ENGINEERING',
      overview: 'Fluid, high-performance native and cross-platform iOS and Android applications.',
      capabilities: [
        'Native iOS (Swift/SwiftUI) and Android (Kotlin/Jetpack Compose)',
        'Cross-platform React Native and Flutter with native bridge modules',
        'Offline-first synchronization with conflict resolution (CRDT / SQLite)',
        'Hardware telemetry, Bluetooth Low Energy (BLE), and biometrics',
      ],
      techStack: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'WatermelonDB', 'SQLite'],
    },
    cloud_devops: {
      title: 'Cloud Infrastructure & DevOps',
      category: 'CLOUD_DEVOPS',
      overview: 'Resilient multi-cloud architectures, Kubernetes clusters, and zero-downtime CI/CD automation.',
      capabilities: [
        'Production Kubernetes (EKS, GKE, AKS) with automated autoscaling',
        'Infrastructure as Code (IaC) via Terraform and OpenTofu',
        'Automated CI/CD pipelines with security scanning and canary releases',
        'Full-stack observability with Prometheus, Grafana, OpenTelemetry',
      ],
      techStack: ['Kubernetes', 'Docker', 'AWS', 'GCP', 'Azure', 'Terraform', 'GitHub Actions', 'Grafana'],
    },
    intelligent_automation: {
      title: 'Intelligent Automation & ETL Pipelines',
      category: 'AUTOMATION_ETL',
      overview: 'Automated business workflows, ETL data transformation pipelines, and legacy ERP integrations.',
      capabilities: [
        'Automated business process pipelines and robotic tasks',
        'High-throughput ETL data ingestion and transformation pipelines',
        'Enterprise ERP and CRM integrations (SAP, Oracle, Salesforce)',
        'Real-time event webhooks and message queuing',
      ],
      techStack: ['Apache Kafka', 'Airflow', 'Python', 'Node.js', 'Celery', 'PostgreSQL', 'RabbitMQ'],
    },
    ui_ux_design: {
      title: 'Experience Architecture & UI/UX Product Design',
      category: 'UI_UX_DESIGN',
      overview: 'Design systems, interactive prototyping, and proprietary design products (DIcons, DShapes, Graaadients).',
      capabilities: [
        'Comprehensive multi-brand design tokens and component libraries',
        'Interactive Figma high-fidelity prototypes and user flow testing',
        'WCAG 2.1 AA accessibility compliance and responsive layout systems',
        'Proprietary icon, geometry, and gradient generation systems',
      ],
      techStack: ['Figma', 'Storybook', 'Tailwind CSS', 'Framer Motion', 'Radix UI', 'Tokens Studio'],
    },
  };

  const details = SERVICE_REGISTRY[serviceKey];
  if (!details) {
    return {
      success: false,
      error: `Invalid serviceKey "${serviceKey}". Valid options: ${Object.keys(SERVICE_REGISTRY).join(', ')}`,
    };
  }

  return { success: true, data: details };
}

function handleGetPortfolioCaseStudy(projectKey: string): { success: boolean; data?: any; error?: string } {
  const CASE_STUDIES: Record<string, any> = {
    aegis_neural_engine: {
      title: 'Aegis Neural Engine',
      category: 'AI Architecture & Autonomous Systems',
      description: 'Autonomous AI decision platform and predictive neural evaluation engine for enterprise operations.',
      metrics: [
        'Sub-50ms inference latency for multi-modal telemetry',
        '99.98% uptime in production across 1.2M daily inferences',
        '85% reduction in manual data processing time',
      ],
      highlights: 'Incorporates dynamic RAG pipelines and custom LLM inference guardrails to eliminate hallucinations.',
    },
    apex_fintech_terminal: {
      title: 'Apex FinTech Terminal',
      category: 'High-Performance Web Architecture',
      description: 'Institutional-grade financial web platform featuring real-time market data streaming and modular dashboards.',
      metrics: [
        'Sub-100ms render cycle for live order books with 60FPS animation',
        'Built with Next.js micro-frontends and encrypted WebSockets',
        'Processed over $500M in simulated order volume with zero state desync',
      ],
      highlights: 'Strict financial security protocols and responsive design with dark mode styling.',
    },
    nexus_health_wearable: {
      title: 'Nexus Health Wearable',
      category: 'Mobile Engineering & Biometric Telemetry',
      description: 'Cross-platform mobile application and digital health ecosystem connected to BLE wearable devices.',
      metrics: [
        'Continuous BLE biometric telemetry with 99.4% packet delivery rate',
        'Offline-first SQLite local store with background cloud sync',
        'Over 100,000 active device pairing sessions tested',
      ],
      highlights: 'End-to-end encrypted biometric telemetry adhering to stringent health data privacy principles.',
    },
    design_assets_dicons: {
      title: 'Proprietary Design Assets: DIcons, DShapes & Graaadients',
      category: 'UI/UX & Product Design System',
      description: 'Suite of proprietary design resources, vector iconography, and mesh gradient generators.',
      metrics: [
        'Over 1,200+ hand-crafted vector icons optimized for code generation',
        'Generative geometric vector libraries used by 15,000+ designers globally',
      ],
      highlights: 'Developed by the Saras Dynamics Experience Architecture team to accelerate rapid UI prototyping.',
    },
  };

  const study = CASE_STUDIES[projectKey];
  if (!study) {
    return {
      success: false,
      error: `Invalid projectKey "${projectKey}". Valid keys: ${Object.keys(CASE_STUDIES).join(', ')}`,
    };
  }

  return { success: true, data: study };
}

function handleRequestHumanCallback(
  args: Record<string, any>,
  context: ToolExecutionContext
): { success: boolean; data?: any; error?: string } {
  const { visitorName, contactDetails, preferredChannel = 'discovery_call', topic } = args;

  if (!visitorName || !contactDetails || !topic) {
    return {
      success: false,
      error: 'visitorName, contactDetails, and topic are required.',
    };
  }

  db.updateCallSession(context.callId, {
    escalatedToHuman: true,
    notes: `Human callback requested: [Channel: ${preferredChannel}] Topic: ${topic}. Contact: ${contactDetails}`,
  });

  db.recordAudit(
    'SARAS_AI_AGENT',
    'AI_AGENT',
    'HUMAN_CALLBACK_REQUESTED',
    context.callId,
    `Visitor ${visitorName} requested ${preferredChannel} callback regarding: ${topic}`,
    'SUCCESS'
  );

  return {
    success: true,
    data: {
      status: 'CONFIRMED',
      message: `Callback scheduled for ${visitorName}. A Saras Dynamics solution architect will reach out via ${preferredChannel} to discuss: "${topic}".`,
    },
  };
}
