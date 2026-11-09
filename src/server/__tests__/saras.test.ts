import { db } from '../db.ts';
import { executeSarasTool, SARAS_TOOL_DECLARATIONS, ToolExecutionContext } from '../tools.ts';
import { telephonyAdapter } from '../telephony.ts';
import { authService } from '../auth.ts';
import { SARAS_SYSTEM_INSTRUCTION } from '../systemPrompt.ts';

async function runAcceptanceTests() {
  console.log('====================================================================');
  console.log('SARAS DYNAMICS AI VOICE AGENT — ACCEPTANCE & VERIFICATION TEST SUITE');
  console.log('Official Source: https://www.sarasdynamics.com/');
  console.log('====================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail || ''}`);
      failed++;
    }
  }

  // Reset database to ensure clean synthetic seed state
  db.seed();

  const mockContext: ToolExecutionContext = {
    callId: 'CALL-TEST-SARAS-001',
    callerPhone: '+91 98765 43210',
    visitorName: 'Prospective Client',
  };

  // ------------------------------------------------------------------
  // 1. OpenAI Function Calling & Realtime Tool Declarations Schema
  // ------------------------------------------------------------------
  console.log('--- Phase 1: OpenAI Realtime Tool Declarations Schema ---');
  const allToolsHaveFunctionType = SARAS_TOOL_DECLARATIONS.every(
    (t) => t.type === 'function' && typeof t.name === 'string' && typeof t.description === 'string'
  );
  assert(allToolsHaveFunctionType, '1. All tool declarations comply with OpenAI function tool schema');

  const requiredTools = [
    'retrieve_company_knowledge',
    'capture_customer_lead',
    'get_service_details',
    'get_portfolio_case_study',
    'request_human_callback',
  ];
  const allRequiredToolsPresent = requiredTools.every((rt) =>
    SARAS_TOOL_DECLARATIONS.some((t) => t.name === rt)
  );
  assert(allRequiredToolsPresent, '2. All mandatory Saras Dynamics tools present in tool registry');

  // ------------------------------------------------------------------
  // 2. Verified Knowledge Base & RAG Retrieval
  // ------------------------------------------------------------------
  console.log('\n--- Phase 2: Verified Knowledge Base & RAG Semantic Search ---');
  const chunks = db.getKnowledgeChunks();
  assert(chunks.length >= 14, `3. Knowledge base initialized with verified chunks (found ${chunks.length})`);

  // Test RAG search for AI & Autonomous Systems
  const aiSearch = db.searchKnowledge('custom LLM integrations and RAG pipelines', 3);
  assert(aiSearch.length > 0, '4. RAG retrieves relevant chunks for AI & LLM queries');
  assert(
    aiSearch.some((c) => c.category === 'AI_SYSTEMS' || c.content.includes('LLM')),
    '5. Retrieved chunk contains verified AI systems content'
  );

  // Test RAG search for Next.js / Web architecture
  const webSearch = db.searchKnowledge('Next.js web development and micro-frontends', 3);
  assert(webSearch.length > 0, '6. RAG retrieves relevant chunks for full-stack web development');
  assert(
    webSearch.some((c) => c.category === 'WEB_DEVELOPMENT' || c.content.includes('Next.js')),
    '7. Retrieved chunk contains verified Next.js web architecture specifications'
  );

  // Test tool execution: retrieve_company_knowledge
  const knowledgeExec = await executeSarasTool(
    'retrieve_company_knowledge',
    { query: 'Aegis Neural Engine autonomous decision platform' },
    mockContext
  );
  assert(knowledgeExec.success, '8. Tool retrieve_company_knowledge executes successfully');
  assert(
    knowledgeExec.data?.retrievedChunks?.length > 0,
    '9. Tool returns grounded knowledge chunks for Aegis Neural Engine'
  );

  // Test tool execution: get_service_details
  const serviceExec = await executeSarasTool(
    'get_service_details',
    { serviceKey: 'cloud_devops' },
    mockContext
  );
  assert(serviceExec.success, '10. Tool get_service_details executes for cloud_devops');
  assert(
    serviceExec.data?.capabilities?.some((c: string) => c.includes('Kubernetes')),
    '11. Cloud DevOps service details contain Kubernetes specs'
  );

  // Test tool execution: get_portfolio_case_study
  const portfolioExec = await executeSarasTool(
    'get_portfolio_case_study',
    { projectKey: 'apex_fintech_terminal' },
    mockContext
  );
  assert(portfolioExec.success, '12. Tool get_portfolio_case_study executes for apex_fintech_terminal');
  assert(
    portfolioExec.data?.title === 'Apex FinTech Terminal',
    '13. Portfolio case study metadata verified'
  );

  // ------------------------------------------------------------------
  // 3. Lead Capture & CRM Pipeline
  // ------------------------------------------------------------------
  console.log('\n--- Phase 3: Lead Capture & CRM Pipeline ---');
  const leadExec = await executeSarasTool(
    'capture_customer_lead',
    {
      customerName: 'Aditya Kulkarni',
      email: 'aditya@nexora.ai',
      phone: '+91 98450 99887',
      companyName: 'Nexora AI Labs',
      requiredService: 'AI & Autonomous Systems',
      projectDescription: 'Building a specialized enterprise LLM fine-tuned on financial compliance rules.',
      estimatedBudget: '$50,000+',
      expectedTimeline: '3 months',
    },
    mockContext
  );
  assert(leadExec.success, '14. Tool capture_customer_lead registers lead successfully');
  assert(!!leadExec.data?.leadId, '15. Lead ID assigned to registered lead');

  const registeredLead = db.getLeadById(leadExec.data.leadId);
  assert(!!registeredLead, '16. Lead successfully persisted in database');
  assert(registeredLead?.status === 'NEW', '17. Initial lead status set to NEW');

  // Test Lead Status Updates & Assignment
  const updatedLead = db.updateLead(leadExec.data.leadId, {
    status: 'QUALIFIED',
    assignedTo: 'USR-1002',
    internalNotes: 'Client contacted via discovery video call. Highly qualified requirements.',
  });
  assert(updatedLead?.status === 'QUALIFIED', '18. Lead status updated to QUALIFIED');
  assert(!!updatedLead?.assignedToName, '19. Team member assigned to lead with resolved name');

  // ------------------------------------------------------------------
  // 4. Website Ingestion & Content Deduplication
  // ------------------------------------------------------------------
  console.log('\n--- Phase 4: Website Ingestion & Content Deduplication ---');
  const page1 = db.ingestWebsitePage(
    'https://www.sarasdynamics.com/services/cloud',
    'Cloud Engineering & Kubernetes',
    'Saras Dynamics engineers resilient multi-cloud Kubernetes clusters with zero downtime.'
  );
  assert(page1.status === 'INDEXED', '20. Website page ingested and indexed');

  const chunkCountBefore = db.getKnowledgeChunks().length;
  // Re-ingest same content -> Duplicate detection
  const page2 = db.ingestWebsitePage(
    'https://www.sarasdynamics.com/services/cloud',
    'Cloud Engineering & Kubernetes',
    'Saras Dynamics engineers resilient multi-cloud Kubernetes clusters with zero downtime.'
  );
  const chunkCountAfter = db.getKnowledgeChunks().length;
  assert(chunkCountBefore === chunkCountAfter, '21. Duplicate website content rejected by content hash');

  // ------------------------------------------------------------------
  // 5. Document Management (PDF, DOCX, TXT)
  // ------------------------------------------------------------------
  console.log('\n--- Phase 5: Document Ingestion & Chunking ---');
  const doc = db.ingestDocument(
    'Saras_Dynamics_Whitepaper_2026.pdf',
    'PDF',
    'Saras Dynamics proprietary AI architecture whitepaper. Discussing sub-50ms neural inference latency and dynamic RAG pipelines.'
  );
  assert(doc.status === 'PROCESSED', '22. Document processed and status set to PROCESSED');
  assert(doc.chunkCount > 0, '23. Document text parsed and chunked into knowledge base');

  // ------------------------------------------------------------------
  // 6. Authentication & RBAC Governance
  // ------------------------------------------------------------------
  console.log('\n--- Phase 6: Authentication & Role-Based Access Control ---');
  const authSuccess = authService.authenticate('admin', 'Saras_SuperAdmin@2026!');
  assert(authSuccess.success, '24. Admin authentication succeeds with valid credentials');
  assert(authSuccess.user?.role === 'SUPER_ADMIN', '25. Admin role mapped to SUPER_ADMIN');

  const authFail = authService.authenticate('admin', 'WrongPassword123!');
  assert(!authFail.success, '26. Authentication rejects incorrect password');

  const salesAuth = authService.authenticate('sales_lead', 'Saras_SalesLead@2026!');
  assert(salesAuth.success && salesAuth.user?.role === 'SALES_LEAD', '27. Sales lead authenticated with SALES_LEAD role');

  // ------------------------------------------------------------------
  // 7. System Persona & Identity Verification
  // ------------------------------------------------------------------
  console.log('\n--- Phase 7: System Persona & Identity Integrity ---');
  assert(
    SARAS_SYSTEM_INSTRUCTION.includes('Saras Dynamics'),
    '28. System instructions state Saras Dynamics identity'
  );
  assert(
    !SARAS_SYSTEM_INSTRUCTION.toLowerCase().includes('xyz bank'),
    '29. Zero references to XYZ Bank in system instructions'
  );
  assert(
    !SARAS_SYSTEM_INSTRUCTION.toLowerCase().includes('ananya'),
    '30. Zero references to Ananya persona in system instructions'
  );

  // ------------------------------------------------------------------
  // 8. Human-Like Indian English Voice Personality Verification
  // ------------------------------------------------------------------
  console.log('\n--- Phase 8: Human-Like Indian English Voice Personality & Scenarios ---');
  assert(
    SARAS_SYSTEM_INSTRUCTION.includes("Welcome to Saras Dynamics. I'm Saras, your AI assistant"),
    '31. Preferred human-like welcoming greeting present in system prompt'
  );
  assert(
    SARAS_SYSTEM_INSTRUCTION.includes('Coimbatore') &&
    SARAS_SYSTEM_INSTRUCTION.includes('PostgreSQL') &&
    SARAS_SYSTEM_INSTRUCTION.includes('SaaS'),
    '32. Indian English phonetic pronunciation guidance present'
  );
  assert(
    SARAS_SYSTEM_INSTRUCTION.includes('Natural Acknowledgements') &&
    SARAS_SYSTEM_INSTRUCTION.includes('Natural Conversational Transitions'),
    '33. Natural acknowledgements and transitions explicitly specified'
  );
  assert(
    SARAS_SYSTEM_INSTRUCTION.includes('HUMAN-LIKE CONVERSATIONAL LEAD CAPTURE') &&
    SARAS_SYSTEM_INSTRUCTION.includes('capture_customer_lead'),
    '34. Conversational step-by-step lead capture protocol specified'
  );
  assert(
    SARAS_SYSTEM_INSTRUCTION.includes('Hindi') &&
    SARAS_SYSTEM_INSTRUCTION.includes('Tamil') &&
    SARAS_SYSTEM_INSTRUCTION.includes('Telugu'),
    '35. Multilingual Indian language adaptation supported'
  );
  assert(
    SARAS_SYSTEM_INSTRUCTION.includes('identify yourself as an AI assistant') &&
    SARAS_SYSTEM_INSTRUCTION.includes('Never claim to be a human employee'),
    '36. AI transparency policy enforced (never claims to be a human employee)'
  );

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log('\n====================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} assertions.`);
  console.log('====================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAcceptanceTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

