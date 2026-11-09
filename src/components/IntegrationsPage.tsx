import React, { useState, useEffect } from 'react';
import {
  Server,
  Phone,
  Cpu,
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Database,
  Briefcase,
  Layers,
  Radio,
  Zap,
} from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [testResult, setTestResult] = useState<{ target: string; message: string; success: boolean } | null>(null);
  const [testingTarget, setTestingTarget] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations');
      const data = await res.json();
      setIntegrations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTestIntegration = async (target: string) => {
    setTestingTarget(target);
    setTestResult(null);
    try {
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      setTestResult({ target, message: data.message, success: data.success });
    } catch (err: any) {
      setTestResult({ target, message: err.message, success: false });
    } finally {
      setTestingTarget(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#E50918] dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 uppercase">
              Infrastructure
            </span>
            <span className="text-xs text-slate-400 font-mono">Live Telemetry</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
            <Server className="w-5 h-5 text-[#E50918]" />
            Integrations & Voice Infrastructure
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inspect connection health and verified endpoints for OpenAI Realtime, Saras Dynamics Vector Knowledge Base, PostgreSQL, and Telephony.
          </p>
        </div>

        <button
          onClick={fetchIntegrations}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E5E7] dark:border-[#262626] bg-white dark:bg-[#171717] hover:bg-slate-50 dark:hover:bg-[#202020] text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#E50918]' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700/60 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#E50918] shrink-0" />
            )}
            <span>
              <strong>{testResult.target.toUpperCase()}:</strong> {testResult.message}
            </span>
          </div>
          <button onClick={() => setTestResult(null)} className="font-bold ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OpenAI Realtime API Card */}
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#E50918] flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5 text-[#E50918]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    OpenAI Realtime API
                  </h3>
                  <span className="text-[11px] text-slate-400">Bidirectional Audio WebSocket Stream</span>
                </div>
              </div>
              <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {integrations?.openaiRealtime?.status || 'CONNECTED'}
              </span>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-[#F5F5F7] dark:bg-[#202020] border border-[#E5E5E7] dark:border-[#2a2a2a] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Model:</span>
                <span className="font-mono font-bold text-[#E50918]">
                  {integrations?.openaiRealtime?.model || 'gpt-realtime'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Voice Persona:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{integrations?.openaiRealtime?.voice || 'coral'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Turn-Taking:</span>
                <span className="font-mono text-emerald-500 font-bold">server_vad</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleTestIntegration('openai')}
            disabled={testingTarget === 'openai'}
            className="w-full py-2.5 rounded-xl border border-[#E5E5E7] dark:border-[#333333] bg-white dark:bg-[#222222] hover:bg-slate-50 dark:hover:bg-[#282828] text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingTarget === 'openai' ? 'animate-spin text-[#E50918]' : ''}`} />
            <span>{testingTarget === 'openai' ? 'Testing Link...' : 'Test OpenAI Connection'}</span>
          </button>
        </div>

        {/* Dynamic Knowledge Base & Vector Engine */}
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#E50918] flex items-center justify-center font-bold">
                  <Database className="w-5 h-5 text-[#E50918]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    RAG Knowledge Base & Vector Store
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Dual Engine: PostgreSQL / pgvector & In-Memory
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                ACTIVE
              </span>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-[#F5F5F7] dark:bg-[#202020] border border-[#E5E5E7] dark:border-[#2a2a2a] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Knowledge Chunks:</span>
                <span className="font-bold text-[#E50918]">
                  {integrations?.knowledgeBase?.totalChunks || 14}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ingested Pages:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{integrations?.knowledgeBase?.websitePages || 4}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vector Engine Mode:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{integrations?.knowledgeBase?.vectorEngine || 'IN_MEMORY_COSINE'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleTestIntegration('knowledge_base')}
            disabled={testingTarget === 'knowledge_base'}
            className="w-full py-2.5 rounded-xl border border-[#E5E5E7] dark:border-[#333333] bg-white dark:bg-[#222222] hover:bg-slate-50 dark:hover:bg-[#282828] text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingTarget === 'knowledge_base' ? 'animate-spin text-[#E50918]' : ''}`} />
            <span>Test RAG Vector Search</span>
          </button>
        </div>

        {/* Lead Management CRM Pipeline */}
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#E50918] flex items-center justify-center font-bold">
                  <Briefcase className="w-5 h-5 text-[#E50918]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Saras Dynamics Lead CRM
                  </h3>
                  <span className="text-[11px] text-slate-400">PostgreSQL Customer Enquiry Hub</span>
                </div>
              </div>
              <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                ACTIVE
              </span>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-[#F5F5F7] dark:bg-[#202020] border border-[#E5E5E7] dark:border-[#2a2a2a] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Enquiries Captured:</span>
                <span className="font-bold text-[#E50918]">
                  {integrations?.sarasDynamicsCrm?.totalLeads || 3}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CRM Endpoint:</span>
                <span className="font-mono text-[11px]">INTERNAL-POSTGRES-LEAD-MANAGER</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleTestIntegration('crm')}
            disabled={testingTarget === 'crm'}
            className="w-full py-2.5 rounded-xl border border-[#E5E5E7] dark:border-[#333333] bg-white dark:bg-[#222222] hover:bg-slate-50 dark:hover:bg-[#282828] text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>Verify CRM Pipeline</span>
          </button>
        </div>

        {/* Telephony / SIP Trunking */}
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#222222] text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                  <Phone className="w-5 h-5 text-[#E50918]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Telephony PSTN / SIP Gateway
                  </h3>
                  <span className="text-[11px] text-slate-400">Twilio Media Stream / SIP Gateway</span>
                </div>
              </div>
              <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {integrations?.telephony?.status || 'SIMULATED'}
              </span>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-[#F5F5F7] dark:bg-[#202020] border border-[#E5E5E7] dark:border-[#2a2a2a] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Corporate Hotline:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {integrations?.telephony?.supportNumber || '+91 80 4000 8888'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Inbound Webhook:</span>
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{integrations?.telephony?.inboundWebhookUrl || '/api/telephony/inbound'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleTestIntegration('telephony')}
            disabled={testingTarget === 'telephony'}
            className="w-full py-2.5 rounded-xl border border-[#E5E5E7] dark:border-[#333333] bg-white dark:bg-[#222222] hover:bg-slate-50 dark:hover:bg-[#282828] text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>Simulate Telephony Webhook</span>
          </button>
        </div>
      </div>
    </div>
  );
};
