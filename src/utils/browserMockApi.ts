import { db } from '../server/db.ts';

/**
 * Initializes client-side mock API interceptor for environments without a running Node.js backend
 * (such as GitHub Pages static hosting).
 */
export function initBrowserMockApi(): void {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;
  const isGitHubPages = window.location.hostname.includes('github.io');

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (urlString.startsWith('/api/') || urlString.includes('/api/')) {
      if (isGitHubPages || window.location.protocol === 'file:') {
        return handleMockApi(urlString, init);
      }

      try {
        const response = await originalFetch(input, init);
        if (response.status === 404) {
          return handleMockApi(urlString, init);
        }
        return response;
      } catch {
        return handleMockApi(urlString, init);
      }
    }

    return originalFetch(input, init);
  };
}

async function handleMockApi(urlString: string, init?: RequestInit): Promise<Response> {
  const url = new URL(urlString, window.location.origin);
  const pathname = url.pathname;
  const method = (init?.method || 'GET').toUpperCase();
  let body: any = null;

  if (init?.body && typeof init.body === 'string') {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = init.body;
    }
  }

  // 1. GET /api/knowledge
  if (pathname === '/api/knowledge' && method === 'GET') {
    const category = url.searchParams.get('category') || undefined;
    const search = url.searchParams.get('search') || undefined;
    return jsonResponse(db.getKnowledgeChunks(category as any, search));
  }

  if (pathname === '/api/knowledge' && method === 'POST') {
    const chunk = db.addKnowledgeChunk(body);
    return jsonResponse(chunk, 201);
  }

  const chunkDeleteMatch = pathname.match(/^\/api\/knowledge\/([^\/]+)$/);
  if (chunkDeleteMatch && method === 'DELETE') {
    const ok = db.deleteKnowledgeChunk(chunkDeleteMatch[1]);
    return jsonResponse({ success: ok });
  }

  // 2. GET & POST /api/leads
  if (pathname === '/api/leads' && method === 'GET') {
    const status = url.searchParams.get('status') || undefined;
    const search = url.searchParams.get('search') || undefined;
    return jsonResponse(db.getLeads(status as any, search));
  }

  if (pathname === '/api/leads' && method === 'POST') {
    const lead = db.createLead(body);
    return jsonResponse(lead, 201);
  }

  const leadPutMatch = pathname.match(/^\/api\/leads\/([^\/]+)$/);
  if (leadPutMatch && method === 'PUT') {
    const updated = db.updateLead(leadPutMatch[1], body);
    return jsonResponse(updated || { error: 'Not found' }, updated ? 200 : 404);
  }

  // 3. GET & POST /api/website/pages
  if (pathname === '/api/website/pages' && method === 'GET') {
    return jsonResponse(db.getWebsitePages());
  }

  if (pathname === '/api/website/ingest' && method === 'POST') {
    const page = db.ingestWebsitePage(body.url, body.title || body.url, body.content || 'Website section');
    return jsonResponse({ success: true, page }, 201);
  }

  // 4. GET & POST /api/documents
  if (pathname === '/api/documents' && method === 'GET') {
    return jsonResponse(db.getDocuments());
  }

  if (pathname === '/api/documents/upload' && method === 'POST') {
    const doc = db.ingestDocument(body.fileName, body.fileType || 'PDF', body.content);
    return jsonResponse({ success: true, document: doc }, 201);
  }

  // 5. Calls
  if (pathname === '/api/calls' && method === 'GET') {
    return jsonResponse(db.getCallSessions());
  }

  const callMatch = pathname.match(/^\/api\/calls\/([^\/]+)$/);
  if (callMatch && method === 'GET') {
    const id = callMatch[1];
    const session = db.getCallSession(id);
    const transcripts = db.getTranscripts(id);
    const toolExecutions = db.getToolExecutions(id);
    return jsonResponse({ session, transcripts, toolExecutions });
  }

  if (pathname === '/api/calls/start' && method === 'POST') {
    const session = db.createCallSession(body?.callerNumber || '+91 98765 43210', 'SIMULATION', body?.customerName);
    return jsonResponse(session, 201);
  }

  const endCallMatch = pathname.match(/^\/api\/calls\/([^\/]+)\/end$/);
  if (endCallMatch && method === 'POST') {
    const session = db.getCallSession(endCallMatch[1]);
    const duration = session ? Math.max(1, Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000)) : 10;
    const updated = db.updateCallSession(endCallMatch[1], {
      status: 'COMPLETED',
      endTime: new Date().toISOString(),
      durationSeconds: duration,
    });
    return jsonResponse(updated || { success: true });
  }

  // 6. Analytics & Audit
  if (pathname === '/api/analytics' && method === 'GET') {
    return jsonResponse(db.getAnalytics());
  }

  if (pathname === '/api/audit-logs' && method === 'GET') {
    return jsonResponse(db.getAuditLogs(100));
  }

  if (pathname === '/api/team' && method === 'GET') {
    return jsonResponse(db.getUsers());
  }

  if (pathname === '/api/config/voice') {
    return jsonResponse({
      model: 'gpt-realtime',
      voice: 'coral',
      temperature: 0.7,
      vadThreshold: 0.78,
      language: 'Indian English',
    });
  }

  if (pathname === '/api/simulation/reset' && method === 'POST') {
    db.seed();
    return jsonResponse({ success: true, message: 'Reset to Saras Dynamics seed.' });
  }

  // 7. Integrations status
  if (pathname === '/api/integrations') {
    return jsonResponse({
      openaiRealtime: { status: 'CONNECTED', model: 'gpt-realtime', voice: 'coral', configured: true },
      knowledgeBase: { status: 'ACTIVE', totalChunks: db.getKnowledgeChunks().length, vectorEngine: 'IN_MEMORY_COSINE' },
      telephony: { status: 'SIMULATED', supportNumber: '+91 80 4000 8888', liveModeEnabled: false },
      sarasDynamicsCrm: { status: 'ACTIVE', totalLeads: db.getLeads().length },
    });
  }

  if (pathname === '/api/integrations/test' && method === 'POST') {
    return jsonResponse({ success: true, message: `${body?.target || 'Integration'} test simulated successfully.` });
  }

  return jsonResponse({ error: 'Endpoint not found in mock router' }, 404);
}

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Mock-API': 'true',
    },
  });
}
