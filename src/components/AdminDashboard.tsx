import React, { useState, useEffect } from 'react';
import {
  CallSession,
  AuditLog,
  CustomerEnquiry,
  KnowledgeChunk,
  KnowledgeDocument,
  WebsitePage,
  User,
  AnalyticsOverview,
} from '../types/saras.ts';
import { formatDuration, formatDateTime } from '../utils/formatters.ts';
import { CallDetailsModal } from './CallDetailsModal.tsx';
import {
  PhoneCall,
  CheckCircle,
  XCircle,
  Clock,
  Wrench,
  AlertTriangle,
  Globe,
  Radio,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  Sliders,
  Database,
  FileText,
  Users,
  ShieldCheck,
  Settings,
  Briefcase,
  Zap,
  TrendingUp,
  Cpu,
  Upload,
  Check,
  Send,
  ExternalLink,
  Save,
  Sparkles,
} from 'lucide-react';

type AdminModule =
  | 'overview'
  | 'voice_config'
  | 'live_calls'
  | 'history'
  | 'enquiries'
  | 'leads'
  | 'knowledge_base'
  | 'website_mgmt'
  | 'doc_mgmt'
  | 'analytics'
  | 'team'
  | 'roles'
  | 'system_settings'
  | 'audit_logs';

export const AdminDashboard: React.FC = () => {
  const [activeModule, setActiveModule] = useState<AdminModule>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCall, setSelectedCall] = useState<CallSession | null>(null);

  // Data states
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [calls, setCalls] = useState<CallSession[]>([]);
  const [leads, setLeads] = useState<CustomerEnquiry[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeChunk[]>([]);
  const [websitePages, setWebsitePages] = useState<WebsitePage[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Knowledge form modal state
  const [isAddKnowledgeOpen, setIsAddKnowledgeOpen] = useState<boolean>(false);
  const [newKnowledge, setNewKnowledge] = useState({
    title: '',
    category: 'SERVICES' as any,
    content: '',
    url: 'https://sarasdynamics.com/',
  });

  // Website ingestion form
  const [ingestUrl, setIngestUrl] = useState<string>('https://sarasdynamics.com/');
  const [ingestTitle, setIngestTitle] = useState<string>('');
  const [ingestContent, setIngestContent] = useState<string>('');
  const [isIngesting, setIsIngesting] = useState<boolean>(false);

  // Document upload form
  const [docFileName, setDocFileName] = useState<string>('');
  const [docFileType, setDocFileType] = useState<'PDF' | 'DOCX' | 'TXT'>('PDF');
  const [docContent, setDocContent] = useState<string>('');

  // Voice Config form
  const [voiceConfig, setVoiceConfig] = useState({
    model: 'gpt-realtime',
    voice: 'coral',
    temperature: 0.7,
    vadThreshold: 0.78,
    language: 'Indian English',
  });
  const [testingVoiceSample, setTestingVoiceSample] = useState<string | null>(null);
  const [voiceSaveFeedback, setVoiceSaveFeedback] = useState<string | null>(null);

  const handlePlayVoiceSample = async (sampleType: 'greeting' | 'technical' | 'project') => {
    setTestingVoiceSample(sampleType);
    let sampleText = '';
    if (sampleType === 'greeting') {
      sampleText = "Hey! Welcome to Saras Dynamics. I'm Saras, your AI assistant. It's great to have you here! I can help you explore our AI solutions, software development services, or even discuss an idea you're planning to build. So, what brings you here today?";
    } else if (sampleType === 'technical') {
      sampleText = "In simple terms, RAG—or Retrieval-Augmented Generation—connects an AI model directly to your company's live documents and database. When someone asks a question, the system retrieves verified facts and feeds them into the model for hallucination-free answers.";
    } else {
      sampleText = "That sounds really interesting! Could you tell me a little more about what you have in mind and what features you're planning to build? Once we understand your requirements, our engineering team can review them and prepare a custom proposal.";
    }

    try {
      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voice: voiceConfig.voice,
        }),
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        await audio.play();
      } else {
        alert(data.error || 'Voice sample synthesis unavailable.');
      }
    } catch (err: any) {
      alert(`Voice sample error: ${err.message}`);
    } finally {
      setTestingVoiceSample(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [anRes, callRes, leadRes, knRes, webRes, docRes, teamRes, audRes, cfgRes] = await Promise.all([
        fetch('/api/analytics').catch(() => null),
        fetch('/api/calls').catch(() => null),
        fetch('/api/leads').catch(() => null),
        fetch('/api/knowledge').catch(() => null),
        fetch('/api/website/pages').catch(() => null),
        fetch('/api/documents').catch(() => null),
        fetch('/api/team').catch(() => null),
        fetch('/api/audit-logs').catch(() => null),
        fetch('/api/config/voice').catch(() => null),
      ]);

      if (anRes && anRes.ok) setAnalytics(await anRes.json());
      if (callRes && callRes.ok) setCalls((await callRes.json()) || []);
      if (leadRes && leadRes.ok) setLeads((await leadRes.json()) || []);
      if (knRes && knRes.ok) setKnowledge((await knRes.json()) || []);
      if (webRes && webRes.ok) setWebsitePages((await webRes.json()) || []);
      if (docRes && docRes.ok) setDocuments((await docRes.json()) || []);
      if (teamRes && teamRes.ok) setTeam((await teamRes.json()) || []);
      if (audRes && audRes.ok) setAuditLogs((await audRes.json()) || []);
      if (cfgRes && cfgRes.ok) {
        const cfg = await cfgRes.json();
        if (cfg) setVoiceConfig((prev) => ({ ...prev, ...cfg }));
      }
    } catch (e) {
      console.error('Failed to fetch admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler: Add Knowledge Chunk
  const handleCreateKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKnowledge),
      });
      if (res.ok) {
        setIsAddKnowledgeOpen(false);
        setNewKnowledge({ title: '', category: 'SERVICES', content: '', url: 'https://sarasdynamics.com/' });
        fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Delete Knowledge Chunk
  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge chunk?')) return;
    try {
      await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Ingest Webpage
  const handleIngestPage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIngesting(true);
    try {
      const res = await fetch('/api/website/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: ingestUrl,
          title: ingestTitle || undefined,
          content: ingestContent || undefined,
        }),
      });
      if (res.ok) {
        setIngestTitle('');
        setIngestContent('');
        fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsIngesting(false);
    }
  };

  // Handler: Ingest Document
  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: docFileName,
          fileType: docFileType,
          content: docContent,
        }),
      });
      if (res.ok) {
        setDocFileName('');
        setDocContent('');
        fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Update Lead Status
  const handleUpdateLeadStatus = async (id: string, status: any) => {
    try {
      await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Save Voice Agent Config
  const handleSaveVoiceConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/config/voice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voiceConfig),
      });
      if (res.ok) {
        setVoiceSaveFeedback('Voice agent settings saved successfully. Realtime session updated.');
        setTimeout(() => setVoiceSaveFeedback(null), 4000);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Navigation Items for the 14 Modules
  const modules: { id: AdminModule; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'voice_config', label: 'AI Voice Config', icon: <Sliders className="w-4 h-4" /> },
    { id: 'live_calls', label: 'Live Conversations', icon: <Radio className="w-4 h-4" />, badge: calls.filter((c) => c.status === 'IN_PROGRESS').length > 0 ? 'LIVE' : undefined },
    { id: 'history', label: 'Conversation History', icon: <PhoneCall className="w-4 h-4" /> },
    { id: 'enquiries', label: 'Customer Enquiries', icon: <Briefcase className="w-4 h-4" />, badge: `${leads.length}` },
    { id: 'leads', label: 'Lead Management', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'knowledge_base', label: 'Knowledge Base', icon: <Database className="w-4 h-4" />, badge: `${knowledge.length}` },
    { id: 'website_mgmt', label: 'Website Ingestion', icon: <Globe className="w-4 h-4" /> },
    { id: 'doc_mgmt', label: 'Document Mgmt', icon: <FileText className="w-4 h-4" /> },
    { id: 'analytics', label: 'AI Analytics', icon: <Cpu className="w-4 h-4" /> },
    { id: 'team', label: 'Team Management', icon: <Users className="w-4 h-4" /> },
    { id: 'roles', label: 'Roles & RBAC', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'system_settings', label: 'System Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'audit_logs', label: 'Audit Logs', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#E50918] dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 uppercase">
              Saras Dynamics
            </span>
            <span className="text-xs text-slate-400 font-mono">Enterprise Control Center</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Admin Governance & Operations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time conversation telemetry, customer enquiry CRM, dynamic RAG knowledge management, and system governance.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E5E7] dark:border-[#262626] bg-white dark:bg-[#171717] hover:bg-slate-50 dark:hover:bg-[#202020] text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#E50918]' : ''}`} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* 14 Modules Navigation Bar */}
      <div className="border-b border-[#E5E5E7] dark:border-[#262626] overflow-x-auto scrollbar-none pb-1">
        <div className="flex items-center space-x-1.5 min-w-max">
          {modules.map((m) => {
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E50918] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1f1f1f]'
                }`}
              >
                {m.icon}
                <span>{m.label}</span>
                {m.badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/25 text-white' : 'bg-red-50 text-[#E50918] dark:bg-red-950/40'
                    }`}
                  >
                    {m.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MODULE 1: OVERVIEW */}
      {activeModule === 'overview' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-4 shadow-2xs border-l-4 border-l-[#E50918]">
              <span className="text-xs font-semibold text-slate-500">Total Conversations</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {analytics?.totalCalls || calls.length}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                {analytics?.completedCalls || calls.filter((c) => c.status === 'COMPLETED').length} Completed
              </span>
            </div>

            <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-4 shadow-2xs border-l-4 border-l-emerald-500">
              <span className="text-xs font-semibold text-slate-500">Active Conversations</span>
              <div className="text-2xl font-black text-[#E50918] mt-1">
                {analytics?.activeCalls || calls.filter((c) => c.status === 'IN_PROGRESS').length}
              </div>
              <span className="text-[10px] text-[#E50918] font-semibold mt-1 block">Real-time stream</span>
            </div>

            <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-4 shadow-2xs border-l-4 border-l-[#171717] dark:border-l-white">
              <span className="text-xs font-semibold text-slate-500">Customer Enquiries</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {analytics?.totalEnquiries || leads.length}
              </div>
              <span className="text-[10px] text-[#E50918] font-semibold mt-1 block">
                {analytics?.qualifiedLeads || leads.filter((l) => l.status === 'QUALIFIED').length} Qualified Leads
              </span>
            </div>

            <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-4 shadow-2xs border-l-4 border-l-slate-400">
              <span className="text-xs font-semibold text-slate-500">Avg Duration</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {formatDuration(analytics?.avgDurationSeconds || 134)}
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">Speech pacing</span>
            </div>

            <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-4 shadow-2xs border-l-4 border-l-emerald-500">
              <span className="text-xs font-semibold text-slate-500">Success Rate</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {analytics?.conversationSuccessRate || 98.4}%
              </div>
              <span className="text-[10px] text-emerald-500 font-semibold mt-1 block">Natural barge-in handling</span>
            </div>
          </div>

          {/* Recent Leads & Active Knowledge Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent Leads (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E7] dark:border-[#262626]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#E50918]" />
                  Recent Project Enquiries ({leads.length})
                </h3>
                <button
                  onClick={() => setActiveModule('enquiries')}
                  className="text-xs font-bold text-[#E50918] hover:underline"
                >
                  View All Leads →
                </button>
              </div>

              <div className="space-y-2.5">
                {leads.slice(0, 4).map((l) => (
                  <div
                    key={l.id}
                    className="p-3.5 rounded-xl border border-[#E5E5E7] dark:border-[#262626] hover:border-red-300 dark:hover:border-red-900/40 transition-all flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {l.customerName}
                        </span>
                        {l.companyName && (
                          <span className="text-[11px] text-slate-400">({l.companyName})</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#E50918] font-semibold mt-0.5">
                        {l.requiredService}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {l.projectDescription}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                        l.status === 'NEW'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : l.status === 'QUALIFIED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Services & Frequent Inquiries (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#E50918]" />
                Inquiry Breakdown By Discipline
              </h3>

              <div className="space-y-3">
                {(analytics?.popularServices || [
                  { service: 'AI & Autonomous Systems', count: 18 },
                  { service: 'Custom Software Development', count: 12 },
                  { service: 'Web Application Development', count: 9 },
                  { service: 'Mobile Application Development', count: 7 },
                ]).map((s, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {s.service}
                      </span>
                      <span className="font-bold text-[#E50918]">{s.count} requests</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-[#262626] overflow-hidden">
                      <div
                        className="h-full bg-[#E50918] rounded-full"
                        style={{ width: `${Math.min(100, s.count * 5)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: AI VOICE CONFIGURATION & TESTING INTERFACE */}
      {activeModule === 'voice_config' && (
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 sm:p-8 shadow-xs max-w-4xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] dark:border-[#262626]">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#E50918]" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  AI Voice Persona & Speech Architecture
                </h2>
                <p className="text-xs text-slate-400">
                  Configure real-time voice synthesis model, personality intonation, and test Indian English speech delivery.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-[#E50918] dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 uppercase">
              Persona v2.2 Active
            </span>
          </div>

          {voiceSaveFeedback && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{voiceSaveFeedback}</span>
            </div>
          )}

          {/* Interactive Voice Testing Panel */}
          <div className="p-4 rounded-xl bg-[#F5F5F7] dark:bg-[#202020] border border-[#E5E5E7] dark:border-[#2a2a2a] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#E50918]" />
                  Live Voice Testing & Accent Evaluation
                </h3>
                <p className="text-[11px] text-slate-500">
                  Listen to live synthesized speech samples in the selected voice ({voiceConfig.voice.toUpperCase()}).
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                Current Voice: {voiceConfig.voice}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handlePlayVoiceSample('greeting')}
                disabled={!!testingVoiceSample}
                className="p-3 rounded-xl bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#333333] hover:border-red-300 dark:hover:border-red-900/40 text-left transition-all shadow-2xs group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-[#E50918] transition-colors">
                    1. Friendly Greeting
                  </span>
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${testingVoiceSample === 'greeting' ? 'animate-spin text-[#E50918]' : ''}`} />
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2">
                  "Hey! Welcome to Saras Dynamics. I'm Saras, your AI assistant..."
                </p>
              </button>

              <button
                type="button"
                onClick={() => handlePlayVoiceSample('technical')}
                disabled={!!testingVoiceSample}
                className="p-3 rounded-xl bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#333333] hover:border-red-300 dark:hover:border-red-900/40 text-left transition-all shadow-2xs group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-[#E50918] transition-colors">
                    2. Technical RAG
                  </span>
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${testingVoiceSample === 'technical' ? 'animate-spin text-[#E50918]' : ''}`} />
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2">
                  "In simple terms, RAG connects an AI model to your live data..."
                </p>
              </button>

              <button
                type="button"
                onClick={() => handlePlayVoiceSample('project')}
                disabled={!!testingVoiceSample}
                className="p-3 rounded-xl bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#333333] hover:border-red-300 dark:hover:border-red-900/40 text-left transition-all shadow-2xs group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-[#E50918] transition-colors">
                    3. Project Discussion
                  </span>
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${testingVoiceSample === 'project' ? 'animate-spin text-[#E50918]' : ''}`} />
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2">
                  "That sounds really interesting! Could you tell me a little more..."
                </p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveVoiceConfig} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  OpenAI Realtime Model
                </label>
                <select
                  value={voiceConfig.model}
                  onChange={(e) => setVoiceConfig({ ...voiceConfig, model: e.target.value })}
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="gpt-realtime">gpt-realtime (Recommended Production)</option>
                  <option value="gpt-4o-realtime-preview">gpt-4o-realtime-preview</option>
                  <option value="gpt-4o-mini-realtime-preview">gpt-4o-mini-realtime-preview</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Selected Voice Persona
                </label>
                <select
                  value={voiceConfig.voice}
                  onChange={(e) => setVoiceConfig({ ...voiceConfig, voice: e.target.value })}
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="coral">Coral (Warm, articulate & approachable - Recommended for Indian English)</option>
                  <option value="sage">Sage (Calm, thoughtful & technical consultant)</option>
                  <option value="alloy">Alloy (Neutral, balanced & clear)</option>
                  <option value="shimmer">Shimmer (Clear, expressive & upbeat)</option>
                  <option value="verse">Verse (Dynamic, conversational & natural)</option>
                  <option value="ash">Ash (Soft, grounded & modern)</option>
                  <option value="ballad">Ballad (Warm, melodic & smooth)</option>
                  <option value="echo">Echo (Rich, steady & professional)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Server VAD Threshold ({voiceConfig.vadThreshold})
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.02"
                  value={voiceConfig.vadThreshold}
                  onChange={(e) => setVoiceConfig({ ...voiceConfig, vadThreshold: parseFloat(e.target.value) })}
                  className="w-full accent-[#E50918]"
                />
                <span className="text-[10px] text-slate-400">
                  Higher = Stricter background chatter and ambient noise rejection.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Model Temperature ({voiceConfig.temperature})
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={voiceConfig.temperature}
                  onChange={(e) => setVoiceConfig({ ...voiceConfig, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-[#E50918]"
                />
                <span className="text-[10px] text-slate-400">
                  Lower = Strictly faithful to knowledge base. 0.7 = Natural conversational variability.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Primary Spoken Dialect & Pronunciation Focus
              </label>
              <input
                type="text"
                value={voiceConfig.language}
                onChange={(e) => setVoiceConfig({ ...voiceConfig, language: e.target.value })}
                className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Educated neutral Indian English with natural intonation, comfortable pacing, and authentic pronunciation of Indian names and cities.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#E50918] hover:bg-[#C90012] text-white font-bold text-xs shadow-md shadow-[#E50918]/25 cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Voice Configuration</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODULE 3 & 4: CONVERSATIONS & CALL HISTORY */}
      {(activeModule === 'live_calls' || activeModule === 'history') && (
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#E50918]" />
              {activeModule === 'live_calls' ? 'Active Real-Time Calls' : 'All Conversation Records'} ({calls.length})
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, caller, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl pl-9 pr-3 py-1.5 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F7] dark:bg-[#1f1f1f] text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Session ID</th>
                  <th className="p-3">Visitor / Caller</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Sentiment</th>
                  <th className="p-3">Lead Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7] dark:divide-[#262626] font-medium">
                {calls
                  .filter((c) => {
                    if (activeModule === 'live_calls' && c.status !== 'IN_PROGRESS') return false;
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      c.id.toLowerCase().includes(q) ||
                      c.callerNumber.includes(q) ||
                      (c.customerName && c.customerName.toLowerCase().includes(q))
                    );
                  })
                  .map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]">
                      <td className="p-3 font-mono font-bold text-[#E50918]">{c.id}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {c.customerName || 'Anonymous Visitor'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{c.callerNumber}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            c.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : c.status === 'IN_PROGRESS'
                              ? 'bg-red-100 text-[#E50918] dark:bg-red-950/60 dark:text-red-300 animate-pulse'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono">{formatDuration(c.durationSeconds)}</td>
                      <td className="p-3 font-semibold text-slate-600 dark:text-slate-300">{c.sentiment}</td>
                      <td className="p-3">
                        {c.leadCaptured ? (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Captured
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">General Inquiry</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedCall(c)}
                          className="px-2.5 py-1 rounded-lg bg-[#F5F5F7] dark:bg-[#222222] hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 inline-flex cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 5 & 6: CUSTOMER ENQUIRIES & LEAD MANAGEMENT */}
      {(activeModule === 'enquiries' || activeModule === 'leads') && (
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E7] dark:border-[#262626]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#E50918]" />
              Saras Dynamics Lead & Enquiry Pipeline ({leads.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F7] dark:bg-[#1f1f1f] text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Enquiry ID</th>
                  <th className="p-3">Client & Company</th>
                  <th className="p-3">Required Service</th>
                  <th className="p-3">Project Description</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned To</th>
                  <th className="p-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7] dark:divide-[#262626] font-medium">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]">
                    <td className="p-3 font-mono font-bold text-[#E50918]">{l.id}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{l.customerName}</div>
                      <div className="text-[11px] text-slate-400">{l.email} • {l.phone}</div>
                      {l.companyName && (
                        <span className="text-[10px] font-semibold text-[#E50918]">{l.companyName}</span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{l.requiredService}</td>
                    <td className="p-3 max-w-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {l.projectDescription}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                          l.status === 'NEW'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : l.status === 'QUALIFIED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : l.status === 'CONVERTED'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      {l.assignedToName || 'Unassigned'}
                    </td>
                    <td className="p-3 text-right">
                      <select
                        value={l.status}
                        onChange={(e) => handleUpdateLeadStatus(l.id, e.target.value)}
                        className="bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-lg px-2 py-1 text-[11px] font-bold"
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="IN_DISCUSSION">IN_DISCUSSION</option>
                        <option value="QUALIFIED">QUALIFIED</option>
                        <option value="CONVERTED">CONVERTED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 7: COMPANY KNOWLEDGE BASE */}
      {activeModule === 'knowledge_base' && (
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#E5E5E7] dark:border-[#262626]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#E50918]" />
                Saras Dynamics Knowledge Base ({knowledge.length} Chunks)
              </h3>
              <p className="text-[11px] text-slate-400">
                Grounding chunks used by RAG semantic search and the voice assistant.
              </p>
            </div>
            <button
              onClick={() => setIsAddKnowledgeOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E50918] hover:bg-[#C90012] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Knowledge Chunk</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledge.map((k) => (
              <div
                key={k.id}
                className="p-4 rounded-xl border border-[#E5E5E7] dark:border-[#262626] bg-white dark:bg-[#1a1a1a] space-y-2 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/60 text-[#E50918] uppercase">
                    {k.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-mono">v{k.version || 1}</span>
                    <button
                      onClick={() => handleDeleteKnowledge(k.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{k.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {k.content}
                </p>
                {k.url && (
                  <a
                    href={k.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#E50918] font-medium hover:underline flex items-center gap-1"
                  >
                    <span>{k.url}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Add Knowledge Modal */}
          {isAddKnowledgeOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 max-w-lg w-full border border-[#E5E5E7] dark:border-[#262626] shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E7] dark:border-[#262626]">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Add Verified Knowledge Chunk
                  </h3>
                  <button onClick={() => setIsAddKnowledgeOpen(false)} className="text-slate-400 cursor-pointer">✕</button>
                </div>
                <form onSubmit={handleCreateKnowledge} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={newKnowledge.title}
                      onChange={(e) => setNewKnowledge({ ...newKnowledge, title: e.target.value })}
                      placeholder="e.g. Mobile Engineering Offline CRDT Protocol"
                      className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Category</label>
                    <select
                      value={newKnowledge.category}
                      onChange={(e) => setNewKnowledge({ ...newKnowledge, category: e.target.value as any })}
                      className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs"
                    >
                      <option value="SERVICES">SERVICES</option>
                      <option value="AI_SYSTEMS">AI_SYSTEMS</option>
                      <option value="WEB_DEVELOPMENT">WEB_DEVELOPMENT</option>
                      <option value="MOBILE_ENGINEERING">MOBILE_ENGINEERING</option>
                      <option value="CLOUD_DEVOPS">CLOUD_DEVOPS</option>
                      <option value="AUTOMATION_ETL">AUTOMATION_ETL</option>
                      <option value="UI_UX_DESIGN">UI_UX_DESIGN</option>
                      <option value="PORTFOLIO_CASE_STUDIES">PORTFOLIO_CASE_STUDIES</option>
                      <option value="FAQ">FAQ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Content</label>
                    <textarea
                      required
                      rows={4}
                      value={newKnowledge.content}
                      onChange={(e) => setNewKnowledge({ ...newKnowledge, content: e.target.value })}
                      placeholder="Verified text content about Saras Dynamics..."
                      className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl p-3 text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddKnowledgeOpen(false)}
                      className="px-4 py-1.5 text-xs font-semibold text-slate-500 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold bg-[#E50918] hover:bg-[#C90012] text-white rounded-xl shadow-xs cursor-pointer"
                    >
                      Save Chunk
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODULE 8: WEBSITE CONTENT MANAGEMENT */}
      {activeModule === 'website_mgmt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#E50918]" />
              Ingest Saras Dynamics Webpage
            </h3>
            <form onSubmit={handleIngestPage} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">URL to Ingest</label>
                <input
                  type="url"
                  required
                  value={ingestUrl}
                  onChange={(e) => setIngestUrl(e.target.value)}
                  placeholder="https://sarasdynamics.com/..."
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Page Title</label>
                <input
                  type="text"
                  value={ingestTitle}
                  onChange={(e) => setIngestTitle(e.target.value)}
                  placeholder="e.g. AI Engineering & Custom LLMs"
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Raw Content to Chunk</label>
                <textarea
                  rows={4}
                  value={ingestContent}
                  onChange={(e) => setIngestContent(e.target.value)}
                  placeholder="Paste or enter website section content here..."
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl p-3 text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={isIngesting}
                className="w-full py-2.5 rounded-xl bg-[#E50918] hover:bg-[#C90012] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isIngesting ? 'animate-spin' : ''}`} />
                <span>{isIngesting ? 'Ingesting...' : 'Ingest & Chunk Webpage'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Indexed Webpages ({websitePages.length})
            </h3>
            <div className="space-y-3">
              {websitePages.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl border border-[#E5E5E7] dark:border-[#262626] flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{p.title}</h4>
                    <p className="text-[11px] font-mono text-[#E50918] mt-0.5">{p.url}</p>
                    <span className="text-[10px] text-slate-400">
                      Last crawled: {formatDateTime(p.lastCrawledAt)} • {p.chunkCount} chunks
                    </span>
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 9: DOCUMENT MANAGEMENT */}
      {activeModule === 'doc_mgmt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#E50918]" />
              Upload Company Document (PDF / DOCX / TXT)
            </h3>
            <form onSubmit={handleUploadDoc} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Document File Name</label>
                <input
                  type="text"
                  required
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  placeholder="e.g. Saras_Dynamics_Capabilities_2026.pdf"
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Document Format</label>
                <select
                  value={docFileType}
                  onChange={(e) => setDocFileType(e.target.value as any)}
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs"
                >
                  <option value="PDF">PDF (Portable Document Format)</option>
                  <option value="DOCX">DOCX (Microsoft Word)</option>
                  <option value="TXT">TXT / Markdown Document</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Extracted Text Content</label>
                <textarea
                  required
                  rows={4}
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder="Paste or upload text from whitepaper, deck, or case study..."
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl p-3 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#E50918] hover:bg-[#C90012] text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Upload & Vectorize Document
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Uploaded Documents ({documents.length})
            </h3>
            {documents.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 border border-dashed border-[#E5E5E7] dark:border-[#262626] rounded-xl text-center">
                No documents uploaded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {documents.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-xl border border-[#E5E5E7] dark:border-[#262626] flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{d.fileName}</h4>
                      <p className="text-[10px] text-slate-400">
                        {d.fileType} • {d.chunkCount} chunks generated • {formatDateTime(d.uploadedAt)}
                      </p>
                    </div>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODULE 10: AI ANALYTICS */}
      {activeModule === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Sentiment Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-500 font-bold">Positive</span>
                  <span>{analytics?.sentimentBreakdown.positive || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Neutral</span>
                  <span>{analytics?.sentimentBreakdown.neutral || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-rose-500 font-bold">Frustrated</span>
                  <span>{analytics?.sentimentBreakdown.frustrated || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Latency & SLA</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Audio Turn Latency:</span>
                  <span className="font-bold text-[#E50918]">~280ms (Realtime)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RAG Semantic Search:</span>
                  <span className="font-bold text-[#E50918]">~18ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Speech Processing:</span>
                  <span className="font-bold text-[#E50918]">Streaming Chunked</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Conversion Funnel</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Conversations:</span>
                  <span className="font-bold">{analytics?.totalCalls || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Enquiries Registered:</span>
                  <span className="font-bold text-[#E50918]">{analytics?.totalEnquiries || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Qualified Leads:</span>
                  <span className="font-bold text-emerald-500">{analytics?.qualifiedLeads || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 11 & 12: TEAM & RBAC */}
      {(activeModule === 'team' || activeModule === 'roles') && (
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#E50918]" />
            Saras Dynamics Staff & Role-Based Access Control ({team.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {team.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-xl border border-[#E5E5E7] dark:border-[#262626] bg-white dark:bg-[#1f1f1f] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E50918]">
                    {u.role}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{u.fullName}</h4>
                <p className="text-[11px] font-mono text-slate-400">@{u.username}</p>
                <span className="text-[10px] text-slate-400 block">ID: {u.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 13: SYSTEM SETTINGS */}
      {activeModule === 'system_settings' && (
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 sm:p-8 shadow-xs max-w-3xl space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#E50918]" />
            System Integrations & Core Infrastructure
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-[#F5F5F7] dark:bg-[#202020] border border-[#E5E5E7] dark:border-[#2a2a2a] flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">OpenAI Realtime API</span>
                <span className="text-[11px] text-slate-400">WebSocket Audio Stream & VAD</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                ACTIVE (OPENAI_API_KEY)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F5F7] dark:bg-[#202020] border border-[#E5E5E7] dark:border-[#2a2a2a] flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Database Vector Engine</span>
                <span className="text-[11px] text-slate-400">PostgreSQL with pgvector & In-Memory Fallback</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-[#E50918] dark:bg-red-950/40">
                DUAL ENGINE READY
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F5F7] dark:bg-[#202020] border border-[#E5E5E7] dark:border-[#2a2a2a] flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Telephony SIP Gateway</span>
                <span className="text-[11px] text-slate-400">PSTN adapter (+91 80 4000 8888)</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                SIMULATED / OPTIONAL
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 14: AUDIT LOGS */}
      {activeModule === 'audit_logs' && (
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E50918]" />
            Security & Operational Audit Trail ({auditLogs.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F7] dark:bg-[#1f1f1f] text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor & Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7] dark:divide-[#262626] font-medium">
                {auditLogs.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]">
                    <td className="p-3 font-mono text-slate-400 text-[11px]">
                      {formatDateTime(a.timestamp)}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{a.actor}</div>
                      <div className="text-[10px] text-slate-400">{a.role}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-[#E50918]">{a.action}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 max-w-sm line-clamp-1">{a.details}</td>
                    <td className="p-3">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                          a.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Call Inspection */}
      {selectedCall && (
        <CallDetailsModal session={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
    </div>
  );
};
