import React, { useState } from 'react';
import { CustomerEnquiry } from '../types/saras.ts';
import {
  Sparkles,
  Cpu,
  Layers,
  Smartphone,
  Cloud,
  RefreshCw,
  Palette,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Send,
  Zap,
  Check,
  Briefcase,
  Code2,
  Globe,
  Server,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  X,
} from 'lucide-react';

interface ServiceDetailModalState {
  isOpen: boolean;
  service: typeof SERVICES[0] | null;
}

const SERVICES = [
  {
    id: 'ai_systems',
    title: 'AI & Autonomous Systems',
    category: 'Enterprise Intelligence',
    icon: Cpu,
    tagline: 'Custom LLM integrations, RAG pipelines, and autonomous workflow agents',
    description:
      'Architecting and deploying proprietary large language models, enterprise vector retrieval pipelines (pgvector/Pinecone), and autonomous multi-agent decision systems with enterprise guardrails.',
    features: [
      'Domain-specific LLM fine-tuning & prompt alignment',
      'Hybrid semantic RAG with hallucination protection',
      'Autonomous multi-step agents with API and tool execution',
      'Predictive neural modeling and anomaly detection',
    ],
    deliverables: ['Custom Model Weights', 'Vector Index Infrastructure', 'Evaluation Benchmarks', 'Production APIs'],
    tech: ['PyTorch', 'LangChain', 'LlamaIndex', 'OpenAI', 'pgvector', 'vLLM'],
  },
  {
    id: 'custom_software',
    title: 'Custom Software Development',
    category: 'Core Engineering',
    icon: Code2,
    tagline: 'Tailored enterprise software platforms, secure APIs, and modular microservices',
    description:
      'End-to-end bespoke software engineering solving mission-critical business challenges with high concurrency, distributed state management, and enterprise-grade reliability.',
    features: [
      'High-throughput distributed systems & microservices',
      'Enterprise database architecture & query optimization',
      'Event-driven architectures with Kafka & RabbitMQ',
      'Comprehensive unit, integration, and security testing',
    ],
    deliverables: ['Full Source Code & Repository', 'CI/CD Pipeline', 'Architecture Documentation', 'API Contracts'],
    tech: ['Node.js', 'Go', 'Python', 'PostgreSQL', 'Redis', 'Docker'],
  },
  {
    id: 'web_development',
    title: 'Web Application Development',
    category: 'Digital Platforms',
    icon: Globe,
    tagline: 'High-performance React and Next.js web applications with server components',
    description:
      'Modern, accessible, and blindingly fast web platforms built on Next.js App Router, featuring sub-second time-to-interactive, micro-frontends, and seamless WebSocket streaming.',
    features: [
      'Next.js App Router and React Server Components',
      'Distributed micro-frontends and federated state',
      'Sub-second real-time streaming over WebSockets',
      'High-concurrency GraphQL and RESTful gateways',
    ],
    deliverables: ['Production Web Build', 'Design System Integration', 'SEO & Core Web Vitals Audit', 'Admin CMS'],
    tech: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'GraphQL', 'PostgreSQL'],
  },
  {
    id: 'mobile_development',
    title: 'Mobile Application Development',
    category: 'Mobile Engineering',
    icon: Smartphone,
    tagline: 'Native and cross-platform mobile apps with offline-first synchronization',
    description:
      'Native iOS (Swift/SwiftUI) and Android (Kotlin/Compose) alongside React Native and Flutter applications engineered for flawless performance, biometric security, and offline resilience.',
    features: [
      'iOS (Swift/SwiftUI) and Android (Kotlin/Jetpack Compose)',
      'Cross-platform React Native and Flutter with native modules',
      'Offline-first synchronization with local SQLite/CRDT',
      'BLE hardware connectivity and biometric telemetry',
    ],
    deliverables: ['App Store & Play Store Submissions', 'Native SDK Bindings', 'Offline Sync Engine', 'Push Services'],
    tech: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'WatermelonDB', 'Firebase'],
  },
  {
    id: 'intelligent_automation',
    title: 'Intelligent Automation',
    category: 'Process Engineering',
    icon: RefreshCw,
    tagline: 'Automated business workflows, high-throughput ETL pipelines, and ERP integrations',
    description:
      'Transform manual, error-prone corporate processes into autonomous workflows. Automate data extraction, reconciliation, CRM data routing, and ERP orchestrations.',
    features: [
      'Robotic process tasks and automated business pipelines',
      'High-throughput ETL data ingestion and transformation',
      'Direct enterprise ERP (SAP/Oracle) and CRM integration',
      'Real-time webhook and event-driven architecture',
    ],
    deliverables: ['Automated Workflow Dag', 'ETL Data Connectors', 'Error Recovery Rules', 'Audit Logs'],
    tech: ['Apache Kafka', 'Airflow', 'Python', 'Node.js', 'Celery', 'PostgreSQL'],
  },
  {
    id: 'ai_integration',
    title: 'AI Integration',
    category: 'System Modernization',
    icon: Zap,
    tagline: 'Embedding multimodal AI models into existing corporate infrastructure',
    description:
      'Infuse your existing web applications, mobile apps, and internal databases with state-of-the-art vision, speech-to-speech, and semantic search models without rebuilding from scratch.',
    features: [
      'Speech-to-speech voice agent integration (OpenAI Realtime)',
      'Document parsing & multimodal vision intelligence',
      'Enterprise SSO & security boundary compliance',
      'Model performance monitoring & latency optimization',
    ],
    deliverables: ['Integration SDK / Middleware', 'Model Proxy & Cache', 'Security Audit', 'Telemetry Dashboard'],
    tech: ['OpenAI Realtime', 'Whisper', 'Embeddings API', 'Redis Cache', 'TypeScript'],
  },
  {
    id: 'digital_engineering',
    title: 'Digital Engineering',
    category: 'Cloud & Infrastructure',
    icon: Server,
    tagline: 'Resilient Kubernetes clusters, multi-cloud setups, and DevOps automation',
    description:
      'Hardened cloud infrastructure and automated deployment pipelines ensuring zero-downtime releases, automated scaling, multi-region failover, and comprehensive system telemetry.',
    features: [
      'Production Kubernetes (EKS/GKE/AKS) with autoscaling',
      'Infrastructure as Code (Terraform / OpenTofu)',
      'Automated zero-downtime canary release pipelines',
      'Full-stack Prometheus and Grafana observability',
    ],
    deliverables: ['Terraform Modules', 'Helm Charts', 'CI/CD Pipelines', 'Monitoring Runbooks'],
    tech: ['Kubernetes', 'Docker', 'AWS', 'GCP', 'Terraform', 'GitHub Actions'],
  },
];

const PORTFOLIO_PROJECTS = [
  {
    title: 'Aegis Neural Engine',
    category: 'AI Architecture & Autonomous Decision Platform',
    metrics: 'Sub-50ms inference latency • 99.98% production uptime • 1.2M daily inferences',
    description:
      'Flagship AI deployment by Saras Dynamics. Processes unstructured multi-modal enterprise data in real time with custom RAG guardrails.',
  },
  {
    title: 'Apex FinTech Terminal',
    category: 'High-Performance Financial Web Platform',
    metrics: 'Sub-100ms render cycle • Real-time order books • 60FPS visualizations',
    description:
      'Institutional-grade wealth management terminal built with Next.js micro-frontends, real-time WebSockets, and strict security protocols.',
  },
  {
    title: 'Nexus Health Wearable',
    category: 'Mobile Engineering & Biometric Telemetry',
    metrics: 'BLE biometric telemetry • Offline-first SQLite • 99.4% packet delivery rate',
    description:
      'Digital health mobile ecosystem connecting Bluetooth Low Energy health sensors with seamless offline caching and background synchronization.',
  },
];

export const CustomerDashboard: React.FC = () => {
  const [selectedService, setSelectedService] = useState<string>('ai_systems');
  const [modalState, setModalState] = useState<ServiceDetailModalState>({
    isOpen: false,
    service: null,
  });
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    description: '',
    budget: '$25,000 - $50,000',
    timeline: '2 to 3 months',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedLead, setSubmittedLead] = useState<CustomerEnquiry | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const activeServiceObj = SERVICES.find((s) => s.id === selectedService);
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: leadForm.name,
          email: leadForm.email,
          phone: leadForm.phone,
          companyName: leadForm.company,
          requiredService: activeServiceObj ? activeServiceObj.title : 'AI & Autonomous Systems',
          projectDescription: leadForm.description,
          estimatedBudget: leadForm.budget,
          expectedTimeline: leadForm.timeline,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmittedLead(data);
        setLeadForm({
          name: '',
          email: '',
          phone: '',
          company: '',
          description: '',
          budget: '$25,000 - $50,000',
          timeline: '2 to 3 months',
        });
      } else {
        alert(data.error || 'Failed to submit enquiry');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscussService = (serviceId: string) => {
    setSelectedService(serviceId);
    const element = document.getElementById('consultation-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLearnMore = (service: typeof SERVICES[0]) => {
    setModalState({ isOpen: true, service });
  };

  const activeServiceData = SERVICES.find((s) => s.id === selectedService) || SERVICES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-10">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-[#171717] text-white p-8 sm:p-10 border border-[#262626] shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E50918]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#E50918] animate-pulse" />
            <span>SARAS DYNAMICS SOLUTIONS</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Solutions & Engineering Portfolio
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Explore our verified software engineering disciplines, production AI deployments, and architectural capabilities. Our solutions team delivers enterprise-grade digital systems globally from Coimbatore, Tamil Nadu, India.
          </p>
        </div>
      </div>

      {/* Services Grid (Requirement 9) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Enterprise Services
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select a service to inspect architectural deliverables and schedule a discovery consultation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s) => {
            const IconComp = s.icon;
            const isSelected = selectedService === s.id;

            return (
              <div
                key={s.id}
                className={`bg-white dark:bg-[#171717] rounded-2xl p-6 border transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-md ${
                  isSelected
                    ? 'border-[#E50918] ring-1 ring-[#E50918]/30 shadow-xs'
                    : 'border-[#E5E5E7] dark:border-[#262626] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#E50918]">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {s.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {s.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {s.tagline}
                    </p>
                  </div>

                  {/* Capabilities Bullet points */}
                  <div className="space-y-1.5 pt-2">
                    {s.features.slice(0, 2).map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#E50918] shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions: Learn More & Discuss This Service */}
                <div className="pt-4 border-t border-[#E5E5E7] dark:border-[#262626] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleLearnMore(s)}
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#E50918] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDiscussService(s.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#E50918] hover:bg-[#C90012] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    Discuss This Service
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flagship Production Deployments (Case Studies) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Production Deployments & Case Studies
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified enterprise applications delivered by Saras Dynamics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PORTFOLIO_PROJECTS.map((proj, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#171717] rounded-2xl p-6 border border-[#E5E5E7] dark:border-[#262626] shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#E50918] uppercase tracking-wider">
                  CASE STUDY #{idx + 1}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {proj.title}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400">
                {proj.category}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {proj.description}
              </p>
              <div className="p-3 rounded-xl bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#2a2a2a] text-[11px] font-mono text-slate-700 dark:text-slate-300">
                {proj.metrics}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Discovery Consultation Form */}
      <div id="consultation-form" className="bg-white dark:bg-[#171717] rounded-2xl p-6 sm:p-10 border border-[#E5E5E7] dark:border-[#262626] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E7] dark:border-[#262626]">
          <div>
            <span className="text-[10px] font-black uppercase text-[#E50918] tracking-wider block">
              Direct Solution Architecture
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              Configure Your Project Discovery Session
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Currently selected capability:{' '}
              <strong className="text-[#E50918]">{activeServiceData.title}</strong>
            </p>
          </div>
        </div>

        {submittedLead ? (
          <div className="p-8 text-center space-y-3 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/40">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Project Enquiry Registered Successfully!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              Thank you {submittedLead.customerName}. Our solution architecture team has received your project requirements for {submittedLead.requiredService}. We will be in contact shortly.
            </p>
            <button
              onClick={() => setSubmittedLead(null)}
              className="mt-2 px-4 py-2 rounded-xl bg-[#E50918] hover:bg-[#C90012] text-white text-xs font-bold transition-all shadow-xs"
            >
              Submit Another Enquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  placeholder="e.g. Maya Chen"
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={leadForm.company}
                  onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                  placeholder="e.g. Global Tech Labs"
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Business Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  placeholder="maya@company.com"
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Budget Tier
                </label>
                <select
                  value={leadForm.budget}
                  onChange={(e) => setLeadForm({ ...leadForm, budget: e.target.value })}
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
                >
                  <option value="$10,000 - $25,000">$10,000 - $25,000 (Sprint POC)</option>
                  <option value="$25,000 - $50,000">$25,000 - $50,000 (Standard MVP)</option>
                  <option value="$50,000 - $100,000">$50,000 - $100,000 (Full Production Platform)</option>
                  <option value="$100,000+">$100,000+ (Enterprise Multi-phase)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Expected Timeline
                </label>
                <select
                  value={leadForm.timeline}
                  onChange={(e) => setLeadForm({ ...leadForm, timeline: e.target.value })}
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
                >
                  <option value="Under 1 month">Under 1 month (Expedited)</option>
                  <option value="2 to 3 months">2 to 3 months (Standard)</option>
                  <option value="4 to 6 months">4 to 6 months</option>
                  <option value="Ongoing Retainer">Ongoing Architecture Retainer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Project Scope & Technical Objectives *
              </label>
              <textarea
                required
                rows={4}
                value={leadForm.description}
                onChange={(e) => setLeadForm({ ...leadForm, description: e.target.value })}
                placeholder="Describe your technical requirements, user goals, and current infrastructure constraints..."
                className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl p-3.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
              />
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl bg-[#E50918] hover:bg-[#C90012] text-white font-bold text-xs transition-all shadow-md shadow-[#E50918]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Transmitting Enquiry...' : 'Submit Project Enquiry'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Learn More Modal */}
      {modalState.isOpen && modalState.service && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 sm:p-8 max-w-2xl w-full border border-[#E5E5E7] dark:border-[#262626] shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7] dark:border-[#262626]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#E50918]">
                  {React.createElement(modalState.service.icon, { className: 'w-6 h-6' })}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {modalState.service.category}
                  </span>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                    {modalState.service.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setModalState({ isOpen: false, service: null })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {modalState.service.description}
              </p>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Key Technical Capabilities
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {modalState.service.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#E50918] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Deliverables & Artifacts
                </h4>
                <div className="flex flex-wrap gap-2">
                  {modalState.service.deliverables.map((deliv, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#2a2a2a] text-slate-700 dark:text-slate-300 text-xs font-medium"
                    >
                      {deliv}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Technology Stack
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {modalState.service.tech.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-[#E50918] border border-red-200 dark:border-red-900/40 text-[11px] font-mono font-bold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E5E7] dark:border-[#262626]">
              <button
                onClick={() => setModalState({ isOpen: false, service: null })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const sId = modalState.service!.id;
                  setModalState({ isOpen: false, service: null });
                  handleDiscussService(sId);
                }}
                className="px-5 py-2 rounded-xl bg-[#E50918] hover:bg-[#C90012] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Configure Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
