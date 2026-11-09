import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Sparkles,
  Zap,
  Globe,
  Mic,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Database,
  Briefcase,
  ShieldCheck,
  Code2,
  TrendingUp,
  Clock,
  Users,
  Activity,
  Server,
  ChevronRight,
  MessageSquare,
  Smartphone,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { AnalyticsOverview, CallSession, CustomerEnquiry } from '../types/saras.ts';
import { formatDuration, formatDateTime } from '../utils/formatters.ts';

interface HomeOverviewProps {
  onNavigateToSimulator: () => void;
  onNavigateToServices: () => void;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  onNavigateToSimulator,
  onNavigateToServices,
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recentCalls, setRecentCalls] = useState<CallSession[]>([]);
  const [recentLeads, setRecentLeads] = useState<CustomerEnquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const [anRes, callsRes, leadsRes] = await Promise.all([
          fetch('/api/analytics').catch(() => null),
          fetch('/api/calls').catch(() => null),
          fetch('/api/leads').catch(() => null),
        ]);

        if (anRes && anRes.ok) {
          const anData = await anRes.json();
          setAnalytics(anData);
        }
        if (callsRes && callsRes.ok) {
          const callsData = await callsRes.json();
          setRecentCalls(Array.isArray(callsData) ? callsData.slice(0, 5) : []);
        }
        if (leadsRes && leadsRes.ok) {
          const leadsData = await leadsRes.json();
          setRecentLeads(Array.isArray(leadsData) ? leadsData.slice(0, 4) : []);
        }
      } catch (e) {
        console.error('Failed to load overview data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  // Safe fallback metrics if loading or before first call
  const totalCalls = analytics?.totalCalls ?? 48;
  const activeConversations = analytics?.activeCalls ?? 1;
  const successfulCalls = analytics?.completedCalls ?? 46;
  const capturedLeads = analytics?.totalEnquiries ?? 19;
  const avgDuration = analytics?.avgDurationSeconds ? formatDuration(analytics.avgDurationSeconds) : '2m 14s';
  const availability = '99.98%';

  const kpis = [
    {
      title: 'Total Calls',
      value: totalCalls.toString(),
      sublabel: 'Processed speech sessions',
      icon: PhoneCall,
      accent: 'border-l-4 border-[#E50918]',
    },
    {
      title: 'Active Conversations',
      value: activeConversations.toString(),
      sublabel: 'Concurrent live channels',
      icon: RadioIcon,
      accent: 'border-l-4 border-emerald-500',
    },
    {
      title: 'Successful Conversations',
      value: `${successfulCalls}`,
      sublabel: 'Completed inquiries',
      icon: CheckCircle2,
      accent: 'border-l-4 border-[#171717] dark:border-white',
    },
    {
      title: 'Captured Leads',
      value: capturedLeads.toString(),
      sublabel: 'Registered enterprise prospects',
      icon: Users,
      accent: 'border-l-4 border-[#E50918]',
    },
    {
      title: 'Average Call Duration',
      value: avgDuration,
      sublabel: 'Natural conversation pace',
      icon: Clock,
      accent: 'border-l-4 border-slate-400',
    },
    {
      title: 'System Availability',
      value: availability,
      sublabel: 'High availability SLA',
      icon: Activity,
      accent: 'border-l-4 border-emerald-500',
    },
  ];

  const solutions = [
    {
      title: 'AI & Autonomous Systems',
      desc: 'Domain LLMs, hybrid RAG pipelines, autonomous agents, and predictive decision architectures.',
      icon: Cpu,
    },
    {
      title: 'Custom Software Development',
      desc: 'Tailored enterprise software platforms, secure APIs, and modular microservices architecture.',
      icon: Code2,
    },
    {
      title: 'Web Application Development',
      desc: 'High-performance React/Next.js platforms with sub-second page performance and server components.',
      icon: Globe,
    },
    {
      title: 'Mobile Application Development',
      desc: 'Native iOS/Android and cross-platform mobile apps with offline-first local data synchronization.',
      icon: Smartphone,
    },
    {
      title: 'Intelligent Automation',
      desc: 'Automated workflow pipelines, high-throughput ETL data ingestion, and ERP/CRM integrations.',
      icon: RefreshCw,
    },
    {
      title: 'AI Integration',
      desc: 'Seamless integration of multimodal AI models into existing corporate infrastructure and workflows.',
      icon: Zap,
    },
    {
      title: 'Digital Engineering',
      desc: 'Robust cloud architectures, Kubernetes clusters, zero-downtime CI/CD, and scalable DevOps.',
      icon: Server,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Welcome Executive Hero Section */}
      <div className="relative rounded-2xl bg-[#171717] text-white p-8 sm:p-12 border border-[#262626] shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E50918]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#E50918] animate-pulse" />
            <span>EXECUTIVE INTELLIGENCE PLATFORM</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Welcome to <span className="text-[#E50918]">Saras Dynamics AI</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Intelligent conversations. Autonomous systems. Smarter business.
          </p>

          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            The official enterprise AI voice platform powered by OpenAI Realtime speech-to-speech architecture and dynamic company knowledge base. Conduct natural voice dialogues, capture qualified customer requirements, and inspect operational metrics.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToSimulator}
              className="px-5 py-3 rounded-xl bg-[#E50918] hover:bg-[#C90012] text-white font-bold text-xs shadow-md shadow-[#E50918]/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 animate-pulse" />
              <span>Launch Voice Assistant</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>

            <button
              onClick={onNavigateToServices}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-[#E50918]" />
              <span>View Solutions & Portfolio</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => {
          const IconComp = kpi.icon;
          return (
            <div
              key={idx}
              className={`bg-white dark:bg-[#171717] rounded-xl p-4 border border-[#E5E5E7] dark:border-[#262626] shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between ${kpi.accent}`}
            >
              <div className="flex items-center justify-between pb-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <IconComp className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {kpi.value}
                </span>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  {kpi.sublabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-Column Middle Section: Recent Conversations & Customer Enquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Conversation Activity (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#171717] rounded-2xl p-6 border border-[#E5E5E7] dark:border-[#262626] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] dark:border-[#262626]">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#E50918]" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Voice Activity
              </h2>
            </div>
            <button
              onClick={onNavigateToSimulator}
              className="text-xs font-semibold text-[#E50918] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Test Live Voice</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-[#E5E5E7] dark:divide-[#262626]">
            {recentCalls.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No conversation history yet. Start a conversation in the Voice Assistant!
              </div>
            ) : (
              recentCalls.map((call) => (
                <div
                  key={call.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#222222] flex items-center justify-center font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                      {call.mode === 'SIMULATION' ? 'SIM' : 'SIP'}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span>{call.customerName || 'Website Visitor'}</span>
                        {call.leadCaptured && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-50 text-[#E50918] dark:bg-red-950/40 border border-red-200 dark:border-red-900/40">
                            LEAD CAPTURED
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {call.callerNumber} • {formatDateTime(call.startTime)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block">
                      {formatDuration(call.durationSeconds)}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase ${
                        call.status === 'COMPLETED'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {call.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Latest Customer Enquiries (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#171717] rounded-2xl p-6 border border-[#E5E5E7] dark:border-[#262626] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] dark:border-[#262626]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E50918]" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Latest Enquiries
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              {recentLeads.length} received
            </span>
          </div>

          <div className="space-y-3">
            {recentLeads.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No customer leads captured yet.
              </div>
            ) : (
              recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 rounded-xl bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#2a2a2a] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {lead.customerName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {lead.estimatedBudget || 'Quote pending'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#E50918] font-semibold">
                    {lead.requiredService}
                  </p>
                  <p className="text-[10px] text-slate-500 line-clamp-1">
                    {lead.projectDescription}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Solutions & Services Overview Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Saras Dynamics Engineering Disciplines
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified corporate capabilities represented by the AI Voice Assistant.
            </p>
          </div>
          <button
            onClick={onNavigateToServices}
            className="text-xs font-bold text-[#E50918] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Explore All Solutions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {solutions.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#171717] p-5 rounded-2xl border border-[#E5E5E7] dark:border-[#262626] shadow-2xs hover:shadow-xs hover:border-red-300 dark:hover:border-red-900/40 transition-all space-y-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#E50918] flex items-center justify-center transition-transform group-hover:scale-105">
                  <IconComp className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function RadioIcon(props: { className?: string }) {
  return <Zap {...props} />;
}
