import React from 'react';
import { Sparkles, PhoneCall, Volume2, Globe, ExternalLink, Menu, X, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  volume: number;
  onChangeVolume: (v: number) => void;
  onTestVoice: () => void;
  isTestingVoice: boolean;
  onNavigateToSimulator: () => void;
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  volume,
  onChangeVolume,
  onTestVoice,
  isTestingVoice,
  onNavigateToSimulator,
  onToggleMobileSidebar,
  isMobileSidebarOpen,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#111111] border-b border-[#E5E5E7] dark:border-[#262626] shadow-xs">
      {/* Top Corporate Status Ribbon */}
      <div className="bg-[#171717] dark:bg-[#0a0a0a] text-white px-4 py-1 text-center flex items-center justify-between text-[11px] font-medium border-b border-[#262626]">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#E50918] animate-pulse" />
            <span className="font-semibold text-white">SARAS DYNAMICS</span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-400">Enterprise AI Voice Representative</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span className="hidden md:flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>OpenAI Realtime Stream Active</span>
            </span>
            <a
              href="https://sarasdynamics.com/"
              target="_blank"
              rel="noreferrer"
              className="text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>sarasdynamics.com</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-[#F5F5F7] dark:hover:bg-[#1a1a1a] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="flex items-center gap-3">
            <img
              src="/assets/saras-logo.png"
              alt="Saras Dynamics"
              className="h-8 sm:h-9 w-auto object-contain cursor-pointer"
              onClick={onNavigateToSimulator}
            />
            <div className="hidden sm:block h-5 w-px bg-[#E5E5E7] dark:bg-[#262626]" />
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-red-50 dark:bg-red-950/40 text-[#E50918] border border-red-200 dark:border-red-900/50">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E50918]" />
                AI Voice Agent
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions, Volume & Voice CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Website Link */}
          <a
            href="https://sarasdynamics.com/"
            target="_blank"
            rel="noreferrer"
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E7] dark:border-[#262626] bg-white dark:bg-[#171717] hover:bg-[#F5F5F7] dark:hover:bg-[#222222] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-[#E50918]" />
            <span>Official Website</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* System Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F5F7] dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Realtime Ready</span>
          </div>

          {/* Speaker Volume Slider */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F7] dark:bg-[#171717] rounded-lg border border-[#E5E5E7] dark:border-[#262626] text-xs">
            <Volume2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#E50918]"
              title="Speaker Volume"
            />
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono w-7 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Voice Preview Button */}
          <button
            onClick={onTestVoice}
            disabled={isTestingVoice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E7] dark:border-[#262626] bg-white dark:bg-[#171717] hover:bg-[#F5F5F7] dark:hover:bg-[#222222] text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
            title="Listen to synthesized voice sample"
          >
            <Sparkles className={`w-3.5 h-3.5 text-[#E50918] ${isTestingVoice ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isTestingVoice ? 'Playing...' : 'Voice Sample'}</span>
            <span className="sm:hidden">{isTestingVoice ? '...' : 'Sample'}</span>
          </button>

          {/* Primary Voice Assistant Action */}
          <button
            onClick={onNavigateToSimulator}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#E50918] hover:bg-[#C90012] active:bg-[#B00010] text-white font-bold text-xs transition-all shadow-sm shadow-[#E50918]/25 hover:shadow-md hover:shadow-[#E50918]/30 cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
            <span>Voice Assistant</span>
          </button>
        </div>
      </div>
    </header>
  );
};
