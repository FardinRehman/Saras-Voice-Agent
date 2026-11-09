import React, { useState } from 'react';
import {
  PhoneCall,
  LayoutDashboard,
  ShieldCheck,
  Server,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Radio,
  Sliders,
  ShieldAlert,
  HelpCircle,
  X,
} from 'lucide-react';

export type ActiveTab = 'overview' | 'simulator' | 'services' | 'admin' | 'audit' | 'integrations';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const navItems: {
    id: ActiveTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      description: 'Executive dashboard & activity',
      icon: LayoutDashboard,
    },
    {
      id: 'simulator',
      label: 'Voice Assistant',
      description: 'Realtime speech-to-speech AI',
      icon: Radio,
      badge: 'LIVE VAD',
    },
    {
      id: 'services',
      label: 'Solutions & Portfolio',
      description: 'Engineering disciplines & case studies',
      icon: Briefcase,
    },
    {
      id: 'admin',
      label: 'Admin Dashboard',
      description: 'Lead CRM, RAG & system controls',
      icon: Sliders,
      badge: '14 MODULES',
    },
    {
      id: 'audit',
      label: 'Audit & Governance',
      description: 'Security audit trail & compliance',
      icon: ShieldCheck,
    },
    {
      id: 'integrations',
      label: 'Integrations & SIP',
      description: 'OpenAI, PostgreSQL & telephony',
      icon: Server,
    },
  ];

  const handleSelect = (id: ActiveTab) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Header / Nav Items */}
      <div className="space-y-6">
        {/* Navigation Category Label */}
        <div className="px-3 pt-2">
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Enterprise Navigation
              </span>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setIsCollapsed(false)}
                className="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Expand Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5 px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const IconComponent = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all relative group cursor-pointer ${
                  isActive
                    ? 'bg-red-50 dark:bg-red-950/40 text-[#E50918] font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1e1e1e] font-medium'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#E50918] rounded-r-md" />
                )}

                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#E50918] text-white shadow-xs'
                      : 'text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white bg-slate-100 dark:bg-[#222222]'
                  }`}
                >
                  <IconComponent className="w-4 h-4 shrink-0" />
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                            isActive
                              ? 'bg-[#E50918]/15 text-[#E50918]'
                              : 'bg-slate-200 dark:bg-[#2a2a2a] text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-normal">
                      {item.description}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Info Card */}
      <div className="p-3 border-t border-[#E5E5E7] dark:border-[#262626] space-y-3">
        {!isCollapsed ? (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                System Status
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                99.98% Uptime
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Saras Dynamics AI Voice Agent v2.1 • OpenAI Realtime Engine
            </p>
            <a
              href="https://sarasdynamics.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#E50918] hover:underline"
            >
              <span>Visit Corporate Portal</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online (99.98%)" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white dark:bg-[#141414] border-r border-[#E5E5E7] dark:border-[#262626] transition-all duration-200 shrink-0 select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto py-4">
          {navContent}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#141414] border-r border-[#E5E5E7] dark:border-[#262626] h-full flex flex-col p-4 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7] dark:border-[#262626]">
              <div className="flex items-center gap-2">
                <img src="/assets/saras-logo.png" alt="Saras Dynamics" className="h-7 w-auto" />
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pt-4">{navContent}</div>
          </div>
        </div>
      )}
    </>
  );
};
