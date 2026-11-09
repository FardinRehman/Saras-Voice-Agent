import React, { useMemo } from 'react';
import { Sparkles, AlertCircle, RefreshCw, Mic, Volume2 } from 'lucide-react';

export type VoiceVisualizerState =
  | 'IDLE'
  | 'CONNECTING'
  | 'LISTENING'
  | 'PROCESSING'
  | 'SPEAKING'
  | 'ERROR';

interface AudioVisualizerProps {
  isActive: boolean;
  isSpeaking: boolean;
  volume: number; // 0..1
  agentSpeaking: boolean;
  color?: string;
  isNoiseBlocked?: boolean;
  isProcessing?: boolean;
  state?: VoiceVisualizerState;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isActive,
  isSpeaking,
  volume,
  agentSpeaking,
  isNoiseBlocked = false,
  isProcessing = false,
  state: explicitState,
  errorMessage,
  onRetry,
}) => {
  // Infer active state if not explicitly passed
  const currentState: VoiceVisualizerState = useMemo(() => {
    if (explicitState) return explicitState;
    if (errorMessage) return 'ERROR';
    if (!isActive) return 'IDLE';
    if (isProcessing) return 'PROCESSING';
    if (agentSpeaking) return 'SPEAKING';
    if (isSpeaking) return 'LISTENING';
    return 'IDLE';
  }, [explicitState, errorMessage, isActive, isProcessing, agentSpeaking, isSpeaking]);

  // Generate 32 radial audio bars
  const totalBars = 32;
  const bars = Array.from({ length: totalBars });

  // State metadata
  const stateMeta = {
    IDLE: {
      label: 'Ready to assist you',
      sublabel: 'Click microphone or ask a question to start',
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-[#222222] dark:text-slate-300 border-slate-200 dark:border-[#333333]',
      dotColor: 'bg-slate-400',
    },
    CONNECTING: {
      label: 'Connecting to Saras AI...',
      sublabel: 'Initializing OpenAI Realtime audio stream',
      badgeColor: 'bg-red-50 text-[#E50918] dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900/50',
      dotColor: 'bg-[#E50918] animate-ping',
    },
    LISTENING: {
      label: 'Listening to you',
      sublabel: 'Speak naturally, Saras AI is processing your voice',
      badgeColor: 'bg-red-50 text-[#E50918] dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900/50',
      dotColor: 'bg-[#E50918] animate-pulse',
    },
    PROCESSING: {
      label: 'Understanding your request...',
      sublabel: 'Querying knowledge base & synthesizing response',
      badgeColor: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-700',
      dotColor: 'bg-[#E50918] animate-ping',
    },
    SPEAKING: {
      label: 'Saras AI is responding',
      sublabel: 'Streaming natural speech synthesis',
      badgeColor: 'bg-red-50 text-[#E50918] dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900/50',
      dotColor: 'bg-[#E50918] animate-pulse',
    },
    ERROR: {
      label: 'Connection issue',
      sublabel: errorMessage || 'An unexpected voice error occurred',
      badgeColor: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/50',
      dotColor: 'bg-rose-600',
    },
  }[currentState];

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto py-4 select-none">
      {/* Circular Visualization Container */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        {/* Subtle Ambient Red Glow */}
        <div
          className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 pointer-events-none ${
            currentState === 'SPEAKING'
              ? 'bg-[#E50918]/25 scale-110'
              : currentState === 'LISTENING'
              ? 'bg-[#E50918]/20 scale-105'
              : currentState === 'PROCESSING'
              ? 'bg-[#E50918]/15 scale-100'
              : 'bg-[#E50918]/5 scale-90'
          }`}
        />

        {/* Concentric Outer Ring 1 */}
        <div
          className={`absolute inset-1 rounded-full border border-dashed transition-all duration-700 ${
            currentState === 'SPEAKING'
              ? 'border-[#E50918]/40 animate-[spin_18s_linear_infinite]'
              : currentState === 'LISTENING'
              ? 'border-[#E50918]/30 animate-[spin_24s_linear_infinite]'
              : currentState === 'PROCESSING'
              ? 'border-[#E50918]/20 animate-pulse'
              : 'border-slate-200 dark:border-[#2a2a2a]'
          }`}
        />

        {/* Concentric Middle Ring 2 */}
        <div
          className={`absolute inset-6 rounded-full border transition-all duration-500 ${
            currentState === 'SPEAKING'
              ? 'border-[#E50918]/50 ring-4 ring-[#E50918]/10'
              : currentState === 'LISTENING'
              ? 'border-[#E50918]/40 ring-2 ring-[#E50918]/10'
              : 'border-slate-200/80 dark:border-[#222222]'
          }`}
        />

        {/* Radial Waveform Bars SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          viewBox="0 0 200 200"
        >
          {bars.map((_, i) => {
            const angle = (i / totalBars) * 360;
            const rad = (angle * Math.PI) / 180;
            const innerRadius = 56;

            // Bar length calculation based on dynamic voice state
            let barLength = 6;
            if (currentState === 'SPEAKING') {
              const wave = Math.sin((i / totalBars) * Math.PI * 4 + Date.now() / 200) * 16;
              barLength = Math.max(8, Math.min(28, 14 + wave + Math.random() * 6));
            } else if (currentState === 'LISTENING') {
              const spread = Math.sin((i / totalBars) * Math.PI * 2) * 10;
              barLength = Math.max(6, Math.min(26, volume * 32 + spread + Math.random() * 4));
            } else if (currentState === 'PROCESSING') {
              barLength = 8 + Math.sin(Date.now() / 250 + i * 0.4) * 6;
            } else if (currentState === 'IDLE' && isActive) {
              barLength = 6 + Math.sin(Date.now() / 400 + i * 0.3) * 3;
            }

            const x1 = 100 + innerRadius * Math.cos(rad);
            const y1 = 100 + innerRadius * Math.sin(rad);
            const x2 = 100 + (innerRadius + barLength) * Math.cos(rad);
            const y2 = 100 + (innerRadius + barLength) * Math.sin(rad);

            const strokeColor =
              currentState === 'SPEAKING'
                ? '#E50918'
                : currentState === 'LISTENING'
                ? '#C90012'
                : currentState === 'PROCESSING'
                ? '#E50918'
                : '#777777';

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={strokeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-all duration-75"
                opacity={currentState === 'IDLE' ? 0.35 : 0.9}
              />
            );
          })}
        </svg>

        {/* Central Core Disk */}
        <div
          className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl ${
            currentState === 'SPEAKING'
              ? 'bg-[#171717] border-2 border-[#E50918] scale-105 shadow-[#E50918]/25'
              : currentState === 'LISTENING'
              ? 'bg-[#171717] border-2 border-[#E50918] scale-102 shadow-[#E50918]/20'
              : currentState === 'PROCESSING'
              ? 'bg-[#171717] border border-[#E50918]/50 shadow-md'
              : 'bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#2a2a2a]'
          }`}
        >
          {/* Logo Mark or Animated Core */}
          <div className="flex flex-col items-center justify-center space-y-1">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform ${
                currentState === 'SPEAKING'
                  ? 'bg-[#E50918] text-white animate-pulse'
                  : currentState === 'LISTENING'
                  ? 'bg-[#E50918] text-white'
                  : currentState === 'PROCESSING'
                  ? 'bg-slate-800 text-red-400'
                  : 'bg-slate-100 dark:bg-[#222222] text-slate-700 dark:text-slate-300'
              }`}
            >
              {currentState === 'SPEAKING' ? (
                <Volume2 className="w-5 h-5 animate-bounce" />
              ) : currentState === 'LISTENING' ? (
                <Mic className="w-5 h-5 animate-pulse" />
              ) : currentState === 'PROCESSING' ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 text-[#E50918]" />
              )}
            </div>
            <span className="text-[10px] font-black tracking-widest text-[#171717] dark:text-white uppercase font-sans">
              SARAS AI
            </span>
          </div>
        </div>
      </div>

      {/* State Status Banner & Sublabel */}
      <div className="mt-5 flex flex-col items-center text-center space-y-2">
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold transition-all shadow-2xs ${stateMeta.badgeColor}`}
        >
          <span className={`w-2 h-2 rounded-full ${stateMeta.dotColor}`} />
          <span>{stateMeta.label}</span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          {stateMeta.sublabel}
        </p>

        {/* Retry Button on Error */}
        {currentState === 'ERROR' && onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E50918] hover:bg-[#C90012] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        )}

        {/* Secondary Sound Blocked Alert */}
        {isNoiseBlocked && (
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 pt-1 animate-pulse">
            <span>🛡️ Secondary acoustic noise suppressed</span>
          </div>
        )}
      </div>
    </div>
  );
};
