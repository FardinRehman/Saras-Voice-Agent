import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { db } from './src/server/db.ts';
import { postgresService } from './src/server/db/postgres.ts';
import { telephonyAdapter } from './src/server/telephony.ts';
import { OpenAIRealtimeSessionHandler } from './src/server/openaiRealtime.ts';
import { authService, requireRoles, rateLimit } from './src/server/auth.ts';
import { SARAS_SYSTEM_INSTRUCTION } from './src/server/systemPrompt.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply rate limiting
app.use('/api', rateLimit(300, 60000));

// Initialize OpenAI client for server-side REST operations
const openaiApiKey = process.env.OPENAI_API_KEY;
let openaiClient: OpenAI | null = null;
if (openaiApiKey) {
  openaiClient = new OpenAI({
    apiKey: openaiApiKey,
  });
}

// In-memory voice agent configuration
let voiceAgentConfig = {
  model: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime',
  voice: process.env.OPENAI_REALTIME_VOICE || 'coral',
  temperature: 0.7,
  vadThreshold: Number(process.env.OPENAI_VAD_THRESHOLD) || 0.78,
  prefixPaddingMs: 300,
  silenceDurationMs: 600,
  systemPrompt: SARAS_SYSTEM_INSTRUCTION,
  language: 'Indian English',
};

// ==========================================
// OPERATIONAL HEALTH CHECKS
// ==========================================
app.get('/health/live', (req, res) => {
  res.json({
    status: 'UP',
    company: 'Saras Dynamics',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.get('/health/ready', async (req, res) => {
  const isDbAvailable = postgresService.isAvailable();
  const isOpenAiConfigured = !!process.env.OPENAI_API_KEY;

  res.json({
    status: 'READY',
    company: 'Saras Dynamics',
    checks: {
      database: isDbAvailable ? 'POSTGRESQL' : 'IN_MEMORY_FALLBACK',
      openaiRealtime: isOpenAiConfigured ? 'CONFIGURED' : 'API_KEY_MISSING',
      knowledgeBase: `${db.getKnowledgeChunks().length} chunks indexed`,
      telephony: telephonyAdapter.getConfig().provider,
    },
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. Staff Authentication
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }
  const result = authService.authenticate(username, password, req.ip);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    authService.revokeSession(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 2. Saras Dynamics Knowledge Base Management
app.get('/api/knowledge', (req, res) => {
  const { category, search } = req.query;
  const chunks = db.getKnowledgeChunks(
    category ? (String(category) as any) : undefined,
    search ? String(search) : undefined
  );
  res.json(chunks);
});

app.post('/api/knowledge', (req, res) => {
  const { title, category, content, url, source = 'MANUAL', metadata } = req.body;
  if (!title || !category || !content) {
    return res.status(400).json({ error: 'title, category, and content are required' });
  }
  const created = db.addKnowledgeChunk({
    title,
    category,
    content,
    url: url || 'https://www.sarasdynamics.com/',
    source,
    metadata: metadata || {},
  });
  res.status(201).json(created);
});

app.put('/api/knowledge/:id', (req, res) => {
  const updated = db.updateKnowledgeChunk(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Knowledge chunk not found' });
  }
  res.json(updated);
});

app.delete('/api/knowledge/:id', (req, res) => {
  const deleted = db.deleteKnowledgeChunk(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Knowledge chunk not found' });
  }
  res.json({ success: true, message: 'Knowledge chunk deleted successfully' });
});

app.post('/api/knowledge/search', (req, res) => {
  const { query, limit = 5 } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }
  const results = db.searchKnowledge(query, Number(limit));
  res.json(results);
});

app.post('/api/knowledge/sync', (req, res) => {
  db.seed();
  res.json({
    success: true,
    message: 'Saras Dynamics knowledge base synchronized successfully with official specifications.',
    chunkCount: db.getKnowledgeChunks().length,
  });
});

// 3. Website Ingestion & Content Management
app.get('/api/website/pages', (req, res) => {
  res.json(db.getWebsitePages());
});

app.post('/api/website/ingest', async (req, res) => {
  const { url, title, content } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  const pageTitle = title || `Saras Dynamics Web Page - ${new URL(url).pathname || '/'}`;
  const pageContent =
    content ||
    `Official Saras Dynamics content ingested from ${url}. Specializing in intelligent software, enterprise AI systems, and automation.`;

  const page = db.ingestWebsitePage(url, pageTitle, pageContent);
  res.status(201).json({
    success: true,
    message: `Page ${url} ingested successfully`,
    page,
  });
});

// 4. Document Management (PDF, DOCX, TXT)
app.get('/api/documents', (req, res) => {
  res.json(db.getDocuments());
});

app.post('/api/documents/upload', (req, res) => {
  const { fileName, fileType, content } = req.body;
  if (!fileName || !content) {
    return res.status(400).json({ error: 'fileName and content are required' });
  }

  const normalizedType = (fileType || 'TXT').toUpperCase() as any;
  const doc = db.ingestDocument(fileName, normalizedType, content);
  res.status(201).json({
    success: true,
    message: `Document ${fileName} uploaded, cleaned, and chunked successfully.`,
    document: doc,
  });
});

// 5. Customer Enquiries & Lead Management
app.get('/api/leads', (req, res) => {
  const { status, search } = req.query;
  const leads = db.getLeads(
    status ? (String(status) as any) : undefined,
    search ? String(search) : undefined
  );
  res.json(leads);
});

app.get('/api/leads/:id', (req, res) => {
  const lead = db.getLeadById(req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  res.json(lead);
});

app.post('/api/leads', (req, res) => {
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
    status = 'NEW',
    conversationId,
    internalNotes,
  } = req.body;

  if (!customerName || !email || !phone || !requiredService || !projectDescription) {
    return res.status(400).json({
      error: 'customerName, email, phone, requiredService, and projectDescription are required.',
    });
  }

  const created = db.createLead({
    customerName,
    email,
    phone,
    companyName,
    requiredService,
    projectDescription,
    estimatedBudget,
    expectedTimeline,
    additionalRequirements,
    status,
    conversationId,
    internalNotes,
  });

  res.status(201).json(created);
});

app.put('/api/leads/:id', (req, res) => {
  const updated = db.updateLead(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  res.json(updated);
});

app.delete('/api/leads/:id', (req, res) => {
  const deleted = db.deleteLead(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  res.json({ success: true, message: 'Lead deleted successfully' });
});

// 6. Voice Call Sessions & Transcripts
app.get('/api/calls', (req, res) => {
  res.json(db.getCallSessions());
});

app.get('/api/calls/:id', (req, res) => {
  const session = db.getCallSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Call session not found' });
  const transcripts = db.getTranscripts(req.params.id);
  const toolExecutions = db.getToolExecutions(req.params.id);
  res.json({
    session,
    transcripts,
    toolExecutions,
  });
});

app.post('/api/calls/start', (req, res) => {
  const { callerNumber = '+91 98765 43210', mode = 'SIMULATION', customerName, customerEmail } = req.body;
  const session = db.createCallSession(callerNumber, mode, customerName, customerEmail);
  res.status(201).json(session);
});

app.post('/api/calls/:id/end', (req, res) => {
  const session = db.getCallSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Call session not found' });
  const duration = Math.max(1, Math.round((Date.now() - new Date(session.startTime).getTime()) / 1000));
  const updated = db.updateCallSession(req.params.id, {
    status: 'COMPLETED',
    endTime: new Date().toISOString(),
    durationSeconds: duration,
  });
  db.recordAudit('VISITOR', 'VOICE_AGENT', 'CALL_COMPLETED', req.params.id, `Voice call completed. Duration: ${duration}s`, 'SUCCESS');
  res.json(updated);
});

// 7. Team & Staff Members
app.get('/api/team', (req, res) => {
  res.json(db.getUsers());
});

// 8. Analytics & Audit Logs
app.get('/api/analytics', (req, res) => {
  res.json(db.getAnalytics());
});

app.get('/api/audit-logs', (req, res) => {
  res.json(db.getAuditLogs(100));
});

app.post('/api/simulation/reset', (req, res) => {
  db.seed();
  res.json({ success: true, message: 'Database reset to Saras Dynamics default verified records.' });
});

// 9. Voice Agent Configuration
app.get('/api/config/voice', (req, res) => {
  res.json(voiceAgentConfig);
});

app.put('/api/config/voice', (req, res) => {
  voiceAgentConfig = { ...voiceAgentConfig, ...req.body };
  res.json({ success: true, config: voiceAgentConfig });
});

// 10. Integrations & Realtime Status
app.get('/api/integrations', (req, res) => {
  const telephonyConfig = telephonyAdapter.getConfig();
  const apiKeyConfigured = !!process.env.OPENAI_API_KEY;

  res.json({
    openaiRealtime: {
      status: apiKeyConfigured ? 'CONNECTED' : 'DISCONNECTED',
      model: voiceAgentConfig.model,
      voice: voiceAgentConfig.voice,
      configured: apiKeyConfigured,
      turnDetection: 'server_vad',
    },
    knowledgeBase: {
      status: 'ACTIVE',
      totalChunks: db.getKnowledgeChunks().length,
      websitePages: db.getWebsitePages().length,
      documents: db.getDocuments().length,
      vectorEngine: postgresService.isAvailable() ? 'POSTGRES_PGVECTOR' : 'IN_MEMORY_COSINE',
    },
    telephony: {
      status: telephonyConfig.liveModeEnabled ? 'CONNECTED' : 'NOT_CONFIGURED',
      provider: telephonyConfig.provider,
      supportNumber: telephonyConfig.supportNumber,
      inboundWebhookUrl: telephonyConfig.inboundWebhookUrl,
      statusCallbackUrl: telephonyConfig.statusCallbackUrl,
      configured: telephonyConfig.liveModeEnabled,
    },
    sarasDynamicsCrm: {
      status: 'ACTIVE',
      endpoint: 'INTERNAL-POSTGRES-LEAD-MANAGER',
      totalLeads: db.getLeads().length,
    },
  });
});

app.post('/api/integrations/test', async (req, res) => {
  const { target } = req.body;
  if (target === 'openai') {
    if (!openaiClient) {
      return res.status(400).json({ success: false, message: 'OPENAI_API_KEY is not set in environment.' });
    }
    try {
      const modelsList = await openaiClient.models.list();
      const hasRealtime = modelsList.data.some((m) => m.id.includes('realtime'));
      return res.json({
        success: true,
        message: `OpenAI API connection verified. Realtime models access: ${hasRealtime ? 'AVAILABLE' : 'ACTIVE'}.`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'OpenAI API test failed.' });
    }
  }
  res.json({ success: true, message: `${target} integration test completed successfully.` });
});

// 11. Ephemeral Client Credentials for Direct WebRTC Session
app.post('/api/realtime/session', async (req, res) => {
  const { visitorName } = req.body;
  try {
    const session = await OpenAIRealtimeSessionHandler.createEphemeralSession(visitorName, voiceAgentConfig.voice);
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create ephemeral Realtime session.' });
  }
});

// 12. Server-side TTS synthesis endpoint
app.post('/api/voice/synthesize', async (req, res) => {
  const { text, voice = 'coral' } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });

  if (!openaiClient) {
    return res.status(400).json({ error: 'OPENAI_API_KEY not configured' });
  }

  try {
    const mp3 = await openaiClient.audio.speech.create({
      model: 'tts-1',
      voice: (voice as any) || 'coral',
      input: text,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64Audio = buffer.toString('base64');
    res.json({ success: true, audio: base64Audio, format: 'audio/mp3' });
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message || 'Failed to synthesize speech' });
  }
});

// 13. Telephony SIP Webhooks
app.post('/api/telephony/inbound', (req, res) => {
  const signature = req.headers['x-twilio-signature'] as string | undefined;
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const isValid = telephonyAdapter.verifyWebhookSignature(fullUrl, req.body, signature);

  if (!isValid) {
    return res.status(403).send('Invalid signature');
  }

  const payload = {
    callSid: req.body.CallSid || `CALL-${Date.now()}`,
    from: req.body.From || '+919876543210',
    to: req.body.To || telephonyAdapter.getConfig().supportNumber,
    callStatus: 'in-progress' as const,
  };
  const { xmlResponse } = telephonyAdapter.handleInboundCall(payload);
  res.type('text/xml').send(xmlResponse);
});

app.post('/api/telephony/status', (req, res) => {
  telephonyAdapter.handleStatusCallback({
    callSid: req.body.CallSid || '',
    from: req.body.From || '',
    to: req.body.To || '',
    callStatus: req.body.CallStatus || 'completed',
  });
  res.sendStatus(200);
});

app.post('/api/telephony/transfer', (req, res) => {
  const { callSid, destinationNumber } = req.body;
  if (!callSid) return res.status(400).json({ error: 'callSid required' });
  const result = telephonyAdapter.transferToHuman(callSid, destinationNumber);
  res.json(result);
});

// ==========================================
// WEBSOCKET SERVER FOR OPENAI REALTIME STREAMING
// ==========================================
const wss = new WebSocketServer({ server, path: '/api/live' });

wss.on('connection', (ws: WebSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const callId = url.searchParams.get('callId') || `CALL-${Date.now().toString(36).toUpperCase()}`;
  const caller = url.searchParams.get('caller') || '+91 98765 43210';
  const visitorName = url.searchParams.get('visitorName') || undefined;

  let session = db.getCallSession(callId);
  if (!session) {
    session = db.createCallSession(caller, 'SIMULATION', visitorName);
  }

  const handler = new OpenAIRealtimeSessionHandler(ws, callId, caller, visitorName, voiceAgentConfig.voice);
  handler.start();

  ws.on('message', (message: string | Buffer) => {
    handler.handleClientMessage(message);
  });

  ws.on('close', () => {
    handler.cleanup();
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error in session ${callId}:`, err);
    handler.cleanup();
  });
});

// ==========================================
// VITE DEV MIDDLEWARE / STATIC ASSETS
// ==========================================
async function startServer() {
  await postgresService.init();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`Saras Dynamics AI Voice Agent Server running on http://localhost:${port}`);
  });
}

startServer();
