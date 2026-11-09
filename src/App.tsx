import React, { useState } from 'react';
import { CustomerEnquiry } from './types/saras.ts';
import { Header } from './components/Header.tsx';
import { Sidebar, ActiveTab } from './components/Sidebar.tsx';
import { VoiceSimulator } from './components/VoiceSimulator.tsx';
import { CustomerDashboard } from './components/CustomerDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { IntegrationsPage } from './components/IntegrationsPage.tsx';
import { AuditLogsPage } from './components/AuditLogsPage.tsx';
import { HomeOverview } from './components/HomeOverview.tsx';
import { Sparkles, CheckCircle2, Globe, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [speakerVolume, setSpeakerVolume] = useState<number>(0.9);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Voice Preview Test using server-side TTS
  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    try {
      // Fetch currently configured voice from server
      let currentVoice = 'coral';
      try {
        const cfgRes = await fetch('/api/config/voice');
        if (cfgRes.ok) {
          const cfg = await cfgRes.json();
          if (cfg?.voice) currentVoice = cfg.voice;
        }
      } catch {}

      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "Hey! Welcome to Saras Dynamics. I'm Saras, your AI assistant. It's great to have you here! I can help you explore our AI solutions, software development services, or even discuss an idea you're planning to build. So, what brings you here today?",
          voice: currentVoice,
        }),
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audio.volume = speakerVolume;
        await audio.play();
      } else {
        alert(data.error || 'Voice preview unavailable');
      }
    } catch (err: any) {
      alert(`Voice preview error: ${err.message}`);
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleLeadCaptured = (lead: CustomerEnquiry) => {
    setToastMessage(`Project enquiry registered for ${lead.customerName} (${lead.requiredService})`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#111111] text-[#171717] dark:text-[#F5F5F7] flex flex-col font-sans selection:bg-[#E50918] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#171717] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-red-500/40 animate-in slide-in-from-bottom-2 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#E50918] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Enterprise Header */}
      <Header
        volume={speakerVolume}
        onChangeVolume={setSpeakerVolume}
        onTestVoice={handleTestVoice}
        isTestingVoice={isTestingVoice}
        onNavigateToSimulator={() => setActiveTab('simulator')}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      {/* App Body Layout: Sidebar + Main Content Area */}
      <div className="flex-1 flex w-full">
        {/* Navigation Sidebar (Desktop persistent + Mobile drawer) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <main className="flex-1 pb-16">
            {activeTab === 'overview' && (
              <HomeOverview
                onNavigateToSimulator={() => setActiveTab('simulator')}
                onNavigateToServices={() => setActiveTab('services')}
              />
            )}

            {activeTab === 'simulator' && (
              <VoiceSimulator
                speakerVolume={speakerVolume}
                onLeadCaptured={handleLeadCaptured}
              />
            )}

            {activeTab === 'services' && <CustomerDashboard />}

            {activeTab === 'admin' && <AdminDashboard />}

            {activeTab === 'audit' && <AuditLogsPage />}

            {activeTab === 'integrations' && <IntegrationsPage />}
          </main>

          {/* Corporate Footer */}
          <footer className="border-t border-[#E5E5E7] dark:border-[#262626] bg-white dark:bg-[#141414] py-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src="/assets/saras-logo.png" alt="Saras Dynamics" className="h-6 w-auto" />
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  AI Voice Agent v2.1
                </span>
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                <span className="hidden sm:inline text-slate-400">Enterprise AI Voice Architecture</span>
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                <a
                  href="https://sarasdynamics.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#E50918] transition-colors"
                >
                  Official Website
                </a>
                <a
                  href="https://sarasdynamics.com/contact"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#E50918] transition-colors"
                >
                  Start a Project
                </a>
                <span className="text-slate-400">Coimbatore, Tamil Nadu, India</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
