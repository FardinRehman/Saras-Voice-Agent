import React, { useState, useEffect, useRef } from 'react';
import { CustomerEnquiry, TranscriptItem, ToolExecution } from '../types/saras.ts';
import { AudioRecorder, GaplessAudioPlayer, VoiceIsolationLevel, ISOLATION_CONFIGS } from '../utils/audioUtils.ts';
import { AudioVisualizer } from './AudioVisualizer.tsx';
import { formatDuration } from '../utils/formatters.ts';
import { BrowserVoiceSession } from '../utils/browserVoiceSession.ts';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Globe,
  Radio,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  Sliders,
  Send,
  Building,
  Mail,
  User,
  Cpu,
  FileText,
  ChevronRight,
  HelpCircle,
  Briefcase,
  Check,
  Trash2,
  AlertTriangle,
  Info,
  DollarSign,
  ShieldCheck,
  Minimize2,
  Maximize2,
} from 'lucide-react';

interface VoiceSimulatorProps {
  speakerVolume: number;
  onCallEnded?: () => void;
  onLeadCaptured?: (lead: CustomerEnquiry) => void;
}

const SUGGESTED_QUESTIONS = [
  'Hey, what do you guys actually do?',
  'Can you build an AI chatbot for my business?',
  'How do RAG-based AI systems work?',
  'Tell me about your software development services.',
  'How much will it cost to build a project?',
  'Can I speak to your engineering team?',
];

export const VoiceSimulator: React.FC<VoiceSimulatorProps> = ({
  speakerVolume,
  onCallEnded,
  onLeadCaptured,
}) => {
  // Call Lifecycle state
  const [callState, setCallState] = useState<'IDLE' | 'CONNECTING' | 'ACTIVE' | 'ERROR'>('IDLE');
  const [callId, setCallId] = useState<string>('');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio / Interaction state
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCustomerSpeaking, setIsCustomerSpeaking] = useState<boolean>(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);

  // Voice Isolation & Background Noise Cancellation state
  const [voiceIsolation, setVoiceIsolation] = useState<boolean>(true);
  const [isolationLevel, setIsolationLevel] = useState<VoiceIsolationLevel>('high');
  const [isGateOpen, setIsGateOpen] = useState<boolean>(false);
  const [isNoiseBlocked, setIsNoiseBlocked] = useState<boolean>(false);

  // Visitor identity
  const [visitorName, setVisitorName] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Auto Detect');

  // Real-time transcript & active tools
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [isTranscriptMinimized, setIsTranscriptMinimized] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<{ name: string; args: any; status: 'EXECUTING' | 'SUCCESS' | 'FAILED' } | null>(null);
  const [toolHistory, setToolHistory] = useState<ToolExecution[]>([]);

  // Text message input for accessibility / quick questions
  const [textInput, setTextInput] = useState<string>('');

  // Quick Enquiry Modal state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState<boolean>(false);
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: 'AI & Autonomous Systems',
    description: '',
    budget: '$25,000 - $50,000',
  });
  const [leadSubmitted, setLeadSubmitted] = useState<boolean>(false);

  // References
  const wsRef = useRef<WebSocket | BrowserVoiceSession | null>(null);
  const speechRecRef = useRef<any>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<GaplessAudioPlayer | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const isMutedRef = useRef<boolean>(false);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(speakerVolume);
    }
  }, [speakerVolume]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, isProcessing, activeTool]);

  // Handle Call Timer
  useEffect(() => {
    if (callState === 'ACTIVE') {
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (callState === 'IDLE') setCallDuration(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [callState]);

  // Start Call Session
  const handleStartCall = async () => {
    try {
      setErrorMessage(null);
      setCallState('CONNECTING');
      setTranscripts([]);
      setToolHistory([]);
      setActiveTool(null);

      // 1. Initialize Player
      const player = new GaplessAudioPlayer((speaking) => {
        setIsAgentSpeaking(speaking);
        if (speaking) {
          setIsProcessing(false);
        }
      });
      player.setVolume(speakerVolume);
      playerRef.current = player;

      // 2. Start Call Session on Server
      const newCallId = `CALL-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      setCallId(newCallId);

      await fetch('/api/calls/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerNumber: '+91 98765 43210',
          mode: 'SIMULATION',
          customerName: visitorName || 'Website Visitor',
        }),
      });

      // 3. Connect via WebSocket or BrowserVoiceSession
      const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
      let ws: any;

      if (isGitHubPages) {
        ws = new BrowserVoiceSession(newCallId, '+91 98765 43210', visitorName);
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/live?callId=${newCallId}&caller=${encodeURIComponent('+91 98765 43210')}&visitorName=${encodeURIComponent(visitorName || '')}`;
        ws = new WebSocket(wsUrl);
      }
      wsRef.current = ws;

      ws.onopen = async () => {
        try {
          const recorder = new AudioRecorder();
          recorder.setIsolationSettings(voiceIsolation, isolationLevel);
          await recorder.start(
            // On audio chunk (24kHz PCM LE base64)
            (base64Audio) => {
              if (ws.readyState === 1 && !isMutedRef.current) {
                ws.send(JSON.stringify({ type: 'audio', audio: base64Audio }));
              }
            },
            // On speaker state changed
            (isSpeaking) => {
              setIsCustomerSpeaking(isSpeaking);
              if (isSpeaking) {
                // Interruption / Barge-in!
                if (playerRef.current) {
                  playerRef.current.stopAndClearQueue();
                }
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                setIsAgentSpeaking(false);
              }
            },
            // On silence detected
            () => {
              setIsCustomerSpeaking(false);
              setIsProcessing(true);
            },
            // Mic volume
            (vol) => {
              setMicVolume(vol);
            },
            // Noise gate
            (isOpen, isBlocked) => {
              setIsGateOpen(isOpen);
              setIsNoiseBlocked(isBlocked);
            }
          );

          recorderRef.current = recorder;
          setCallState('ACTIVE');

          if (isGitHubPages && typeof window !== 'undefined') {
            const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRec) {
              try {
                const rec = new SpeechRec();
                rec.continuous = true;
                rec.interimResults = false;
                rec.lang = 'en-IN';
                rec.onresult = (e: any) => {
                  const lastIdx = e.results.length - 1;
                  const spokenText = e.results[lastIdx][0]?.transcript;
                  if (spokenText) {
                    triggerSimulatedSpeech(spokenText.trim());
                  }
                };
                rec.start();
                speechRecRef.current = rec;
              } catch {}
            }
          }
        } catch (micErr: any) {
          console.warn('Microphone access denied or unsupported:', micErr);
          setMicPermissionDenied(true);
          setCallState('ACTIVE');
        }
      };

      ws.onmessage = (event: any) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'audio':
              if (playerRef.current && msg.audio) {
                playerRef.current.playChunk(msg.audio);
              }
              break;

            case 'interrupted':
              if (playerRef.current) {
                playerRef.current.stopAndClearQueue();
              }
              if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              setIsAgentSpeaking(false);
              setIsProcessing(false);
              break;

            case 'speech_stopped':
              setIsProcessing(true);
              break;

            case 'transcript':
              setIsProcessing(false);
              setTranscripts((prev) => [
                ...prev,
                {
                  id: `TR-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                  speaker: msg.speaker,
                  text: msg.text,
                  timestamp: new Date().toISOString(),
                },
              ]);
              break;

            case 'transcript_delta':
              setTranscripts((prev) => {
                if (prev.length === 0 || prev[prev.length - 1].speaker !== msg.speaker || !prev[prev.length - 1].isPartial) {
                  return [
                    ...prev,
                    {
                      id: `TR-DELTA-${Date.now()}`,
                      speaker: msg.speaker,
                      text: msg.delta,
                      timestamp: new Date().toISOString(),
                      isPartial: true,
                    },
                  ];
                }
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  text: last.text + msg.delta,
                };
                return updated;
              });
              break;

            case 'tool_executing':
              setActiveTool({ name: msg.toolName, args: msg.args, status: 'EXECUTING' });
              break;

            case 'tool_executed':
              setActiveTool({ name: msg.toolName, args: msg.args, status: msg.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED' });
              setToolHistory((prev) => [
                {
                  id: `TH-${Date.now()}`,
                  callId: newCallId,
                  toolName: msg.toolName,
                  args: msg.args,
                  result: msg.result,
                  status: msg.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
                  executionTimeMs: 120,
                  timestamp: new Date().toISOString(),
                },
                ...prev,
              ]);
              if (msg.toolName === 'capture_customer_lead' && onLeadCaptured && msg.result) {
                onLeadCaptured(msg.result);
              }
              break;

            case 'error':
              setErrorMessage(msg.message || 'Voice session error');
              break;

            default:
              break;
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onerror = () => {
        setErrorMessage('WebSocket connection error. Make sure your server is running.');
        setCallState('ERROR');
      };

      ws.onclose = () => {
        handleEndCall();
      };
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start voice assistant');
      setCallState('ERROR');
    }
  };

  const handleEndCall = () => {
    if (callId) {
      fetch(`/api/calls/${callId}/end`, { method: 'POST' }).catch(() => {});
    }
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.stopAndClearQueue();
      playerRef.current = null;
    }
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {}
      speechRecRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
    setCallState('IDLE');
    setIsCustomerSpeaking(false);
    setIsAgentSpeaking(false);
    setIsProcessing(false);
    setActiveTool(null);
    if (onCallEnded) onCallEnded();
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    isMutedRef.current = next;
    if (recorderRef.current) {
      recorderRef.current.setMute(next);
    }
  };

  const triggerSimulatedSpeech = (text: string) => {
    if (!text || callState !== 'ACTIVE') return;
    setTranscripts((prev) => [
      ...prev,
      {
        id: `TR-USER-${Date.now()}`,
        speaker: 'visitor',
        text,
        timestamp: new Date().toISOString(),
      },
    ]);
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'text_input', text }));
    }
  };

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || callState !== 'ACTIVE') return;
    triggerSimulatedSpeech(textInput.trim());
    setTextInput('');
  };

  const handleQuestionChip = (q: string) => {
    if (callState !== 'ACTIVE') {
      handleStartCall().then(() => {
        setTimeout(() => triggerSimulatedSpeech(q), 1000);
      });
    } else {
      triggerSimulatedSpeech(q);
    }
  };

  const handleClearTranscript = () => {
    setTranscripts([]);
  };

  const handleSubmitLeadForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: leadForm.name,
          email: leadForm.email,
          phone: leadForm.phone,
          companyName: leadForm.company,
          requiredService: leadForm.service,
          projectDescription: leadForm.description,
          estimatedBudget: leadForm.budget,
          conversationId: callId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLeadSubmitted(true);
        if (onLeadCaptured) onLeadCaptured(data);
        setTimeout(() => {
          setIsLeadModalOpen(false);
          setLeadSubmitted(false);
        }, 2000);
      }
    } catch (err: any) {
      alert(`Failed to submit enquiry: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Identity Hero Card */}
      <div className="relative rounded-2xl bg-[#171717] text-white p-6 sm:p-8 border border-[#262626] shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E50918]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E50918] text-white flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3 h-3" />
                SARAS DYNAMICS
              </span>
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                OpenAI Realtime Speech-to-Speech Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              AI Voice Representative
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Official virtual representative for Saras Dynamics. Experience real-time speech conversation to discuss autonomous AI systems, custom software platforms, cloud infrastructure, and enterprise digital solutions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsLeadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-[#E50918]" />
              <span>Submit Project Enquiry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Column Enterprise Voice Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Guidance, Settings & Suggested Questions (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Visitor Configuration Card */}
          <div className="bg-white dark:bg-[#171717] rounded-2xl p-5 border border-[#E5E5E7] dark:border-[#262626] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5E5E7] dark:border-[#262626]">
              <User className="w-4 h-4 text-[#E50918]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Visitor Profile
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  disabled={callState === 'ACTIVE'}
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Language Preference
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  disabled={callState === 'ACTIVE'}
                  className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918] disabled:opacity-50"
                >
                  <option value="Auto Detect">Auto Detect (Multi-language)</option>
                  <option value="Indian English">Indian English (Primary)</option>
                  <option value="US English">US English</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                </select>
              </div>
            </div>

            {/* Noise Isolation Level */}
            <div className="pt-3 border-t border-[#E5E5E7] dark:border-[#262626] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Sliders className="w-3.5 h-3.5 text-[#E50918]" />
                  Acoustic Isolation
                </span>
                <span className="text-[10px] font-bold text-[#E50918]">
                  {ISOLATION_CONFIGS[isolationLevel].name}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['balanced', 'high', 'ultra'] as VoiceIsolationLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setIsolationLevel(lvl);
                      if (recorderRef.current) {
                        recorderRef.current.setIsolationSettings(voiceIsolation, lvl);
                      }
                    }}
                    className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer ${
                      isolationLevel === lvl
                        ? 'bg-[#E50918] text-white shadow-2xs'
                        : 'bg-[#F5F5F7] dark:bg-[#222222] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2a2a2a]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {ISOLATION_CONFIGS[isolationLevel].description}
              </p>
            </div>
          </div>

          {/* Suggested Questions Card */}
          <div className="bg-white dark:bg-[#171717] rounded-2xl p-5 border border-[#E5E5E7] dark:border-[#262626] shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E5E7] dark:border-[#262626]">
              <HelpCircle className="w-4 h-4 text-[#E50918]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Suggested Topics
              </h3>
            </div>
            <div className="space-y-1.5">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuestionChip(q)}
                  className="w-full text-left p-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#222222] hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-900/40 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate pr-2">{q}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E50918] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Visualizer, Status & Voice Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 border border-[#E5E5E7] dark:border-[#262626] shadow-xs flex flex-col items-center justify-between min-h-[500px]">
            {/* Top Status & Call Duration Bar */}
            <div className="w-full flex items-center justify-between pb-4 border-b border-[#E5E5E7] dark:border-[#262626]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    callState === 'ACTIVE'
                      ? 'bg-emerald-500 animate-pulse'
                      : callState === 'CONNECTING'
                      ? 'bg-amber-500 animate-ping'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {callState === 'ACTIVE'
                    ? 'Active Session'
                    : callState === 'CONNECTING'
                    ? 'Establishing Link...'
                    : 'System Ready'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-[#F5F5F7] dark:bg-[#222222] px-3 py-1 rounded-full border border-[#E5E5E7] dark:border-[#333333]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDuration(callDuration)}</span>
              </div>
            </div>

            {/* Circular Audio Visualizer Component */}
            <div className="w-full py-4 flex flex-col items-center justify-center">
              <AudioVisualizer
                isActive={callState === 'ACTIVE'}
                isSpeaking={isCustomerSpeaking}
                volume={micVolume}
                agentSpeaking={isAgentSpeaking}
                isNoiseBlocked={isNoiseBlocked}
                isProcessing={isProcessing}
                state={
                  callState === 'ERROR'
                    ? 'ERROR'
                    : callState === 'CONNECTING'
                    ? 'CONNECTING'
                    : callState === 'IDLE'
                    ? 'IDLE'
                    : isAgentSpeaking
                    ? 'SPEAKING'
                    : isProcessing
                    ? 'PROCESSING'
                    : isCustomerSpeaking
                    ? 'LISTENING'
                    : 'IDLE'
                }
                errorMessage={errorMessage}
                onRetry={handleStartCall}
              />
            </div>

            {/* Voice Control Buttons */}
            <div className="w-full space-y-3 pt-4 border-t border-[#E5E5E7] dark:border-[#262626]">
              {callState === 'IDLE' || callState === 'ERROR' ? (
                <button
                  onClick={handleStartCall}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-[#E50918] hover:bg-[#C90012] active:bg-[#B00010] text-white font-extrabold text-sm transition-all shadow-md shadow-[#E50918]/25 hover:shadow-lg hover:shadow-[#E50918]/35 cursor-pointer"
                >
                  <Phone className="w-4 h-4 animate-pulse" />
                  <span>Start Voice Conversation</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleToggleMute}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isMuted
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-300 dark:border-rose-800'
                        : 'bg-[#F5F5F7] dark:bg-[#222222] text-slate-700 dark:text-slate-200 border-[#E5E5E7] dark:border-[#333333] hover:bg-slate-200'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4 text-slate-700 dark:text-slate-300" />}
                    <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-[#E50918] hover:bg-[#C90012] text-white transition-all shadow-md shadow-[#E50918]/20 cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Call</span>
                  </button>
                </div>
              )}

              {/* Mic Permission Warning */}
              {micPermissionDenied && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Microphone access blocked. Please check browser permissions or use the text input.</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Tool Telemetry Card */}
          {activeTool && (
            <div className="bg-[#171717] text-white rounded-2xl p-4 border border-[#262626] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-red-400 font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#E50918]" />
                  {activeTool.name}
                </span>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    activeTool.status === 'EXECUTING'
                      ? 'bg-amber-400 text-black animate-pulse'
                      : activeTool.status === 'SUCCESS'
                      ? 'bg-emerald-400 text-black'
                      : 'bg-rose-400 text-black'
                  }`}
                >
                  {activeTool.status}
                </span>
              </div>
              <pre className="text-[10px] font-mono bg-black/60 p-2.5 rounded-lg text-slate-300 overflow-x-auto max-h-24">
                {JSON.stringify(activeTool.args, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Transcript & Text Input (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {isTranscriptMinimized ? (
            /* Minimized Transcript View */
            <div className="bg-white dark:bg-[#171717] rounded-2xl p-4 border border-[#E5E5E7] dark:border-[#262626] shadow-xs transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#E50918]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Live Transcript
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-[#F5F5F7] dark:bg-[#222222] text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full border border-[#E5E5E7] dark:border-[#333333]">
                    {transcripts.length} {transcripts.length === 1 ? 'turn' : 'turns'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {transcripts.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearTranscript}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#222222] transition-colors cursor-pointer"
                      title="Clear transcript"
                      aria-label="Clear transcript"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsTranscriptMinimized(false)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-[#E50918] hover:text-[#C90012] bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    title="Expand transcript"
                    aria-label="Expand transcript"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Expand</span>
                  </button>
                </div>
              </div>

              {/* Status or Latest turn snippet when minimized */}
              {isProcessing ? (
                <div
                  onClick={() => setIsTranscriptMinimized(false)}
                  className="mt-2.5 pt-2.5 border-t border-[#E5E5E7] dark:border-[#262626] flex items-center gap-2 text-[11px] text-[#E50918] cursor-pointer"
                  title="Click to expand transcript"
                >
                  <span className="w-2 h-2 rounded-full bg-[#E50918] animate-ping" />
                  <span className="italic font-medium">Saras AI is formulating response...</span>
                </div>
              ) : transcripts.length > 0 ? (
                <div
                  onClick={() => setIsTranscriptMinimized(false)}
                  className="mt-2.5 pt-2.5 border-t border-[#E5E5E7] dark:border-[#262626] flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer group"
                  title="Click to view full transcript"
                >
                  <p className="truncate flex-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {transcripts[transcripts.length - 1].speaker === 'agent' ? 'Saras AI: ' : 'You: '}
                    </span>
                    {transcripts[transcripts.length - 1].text}
                  </p>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E50918] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </div>
              ) : (
                <p
                  onClick={() => setIsTranscriptMinimized(false)}
                  className="mt-2.5 pt-2.5 border-t border-[#E5E5E7] dark:border-[#262626] text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer text-center"
                >
                  Click Expand to view real-time transcript stream.
                </p>
              )}
            </div>
          ) : (
            /* Expanded Transcript View */
            <div className="bg-white dark:bg-[#171717] rounded-2xl p-5 border border-[#E5E5E7] dark:border-[#262626] shadow-xs flex flex-col h-[500px]">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] dark:border-[#262626]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#E50918]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Live Transcript
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">
                    {transcripts.length} turns
                  </span>
                  {transcripts.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearTranscript}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-[#222222] transition-colors cursor-pointer"
                      title="Clear transcript"
                      aria-label="Clear transcript"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsTranscriptMinimized(true)}
                    className="p-1 text-slate-400 hover:text-[#E50918] dark:hover:text-white text-xs rounded-md hover:bg-slate-100 dark:hover:bg-[#222222] transition-colors cursor-pointer"
                    title="Minimize transcript"
                    aria-label="Minimize transcript"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Transcript Messages Stream */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3 scrollbar-thin">
                {transcripts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] dark:bg-[#222222] flex items-center justify-center text-slate-400">
                      <Radio className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-xs font-medium text-slate-500 max-w-xs">
                      Start speaking or click a suggested question to see real-time transcription.
                    </p>
                  </div>
                ) : (
                  transcripts.map((t) => (
                    <div
                      key={t.id}
                      className={`flex flex-col ${
                        t.speaker === 'agent' ? 'items-start' : 'items-end'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-slate-400 capitalize">
                          {t.speaker === 'agent' ? 'Saras AI' : 'You (Visitor)'}
                        </span>
                      </div>
                      <div
                        className={`max-w-[90%] rounded-2xl p-3 text-xs leading-relaxed ${
                          t.speaker === 'agent'
                            ? 'bg-[#F5F5F7] dark:bg-[#222222] text-slate-900 dark:text-slate-100 border-l-2 border-[#E50918] rounded-tl-sm'
                            : 'bg-[#171717] dark:bg-[#262626] text-white rounded-tr-sm shadow-2xs'
                        }`}
                      >
                        {t.text}
                      </div>
                    </div>
                  ))
                )}

                {isProcessing && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1">
                    <span className="w-2 h-2 rounded-full bg-[#E50918] animate-ping" />
                    <span>Saras AI is formulating response...</span>
                  </div>
                )}

                <div ref={transcriptEndRef} />
              </div>

              {/* Text Message Fallback Input */}
              <form
                onSubmit={handleSendTextMessage}
                className="pt-3 border-t border-[#E5E5E7] dark:border-[#262626] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={
                    callState === 'ACTIVE'
                      ? 'Type a question to Saras AI...'
                      : 'Start call above to send messages...'
                  }
                  disabled={callState !== 'ACTIVE'}
                  className="flex-1 bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={callState !== 'ACTIVE' || !textInput.trim()}
                  className="p-2 rounded-xl bg-[#E50918] text-white hover:bg-[#C90012] disabled:opacity-40 transition-all shadow-2xs cursor-pointer"
                  title="Send message"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Quick Project Enquiry Modal (Section 13) */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 sm:p-8 max-w-lg w-full border border-[#E5E5E7] dark:border-[#262626] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] dark:border-[#262626]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-[#E50918]">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Submit Project Enquiry
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Connect directly with the Saras Dynamics solutions architecture team
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLeadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {leadSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Enquiry Submitted Successfully!
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Thank you! The Saras Dynamics engineering team has received your project details. A solution architect will contact you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLeadForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      placeholder="e.g. Priya Sundaram"
                      className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={leadForm.company}
                      onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                      placeholder="e.g. Apex Health Corp"
                      className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      placeholder="priya@example.com"
                      className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
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
                      className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Required Service *
                    </label>
                    <select
                      value={leadForm.service}
                      onChange={(e) => setLeadForm({ ...leadForm, service: e.target.value })}
                      className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
                    >
                      <option value="AI & Autonomous Systems">AI & Autonomous Systems</option>
                      <option value="Custom Software Development">Custom Software Development</option>
                      <option value="Web Application Development">Web Application Development</option>
                      <option value="Mobile Application Development">Mobile Application Development</option>
                      <option value="Intelligent Automation">Intelligent Automation</option>
                      <option value="AI Integration">AI Integration</option>
                      <option value="Digital Engineering">Digital Engineering</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Estimated Budget
                    </label>
                    <select
                      value={leadForm.budget}
                      onChange={(e) => setLeadForm({ ...leadForm, budget: e.target.value })}
                      className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
                    >
                      <option value="$10,000 - $25,000">$10,000 - $25,000</option>
                      <option value="$25,000 - $50,000">$25,000 - $50,000</option>
                      <option value="$50,000 - $100,000">$50,000 - $100,000</option>
                      <option value="$100,000+">$100,000+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Project Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={leadForm.description}
                    onChange={(e) => setLeadForm({ ...leadForm, description: e.target.value })}
                    placeholder="Tell us what you want to build, key objectives, and any technical constraints..."
                    className="w-full bg-[#F5F5F7] dark:bg-[#222222] border border-[#E5E5E7] dark:border-[#333333] rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLeadModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#E50918] hover:bg-[#C90012] text-white shadow-sm shadow-[#E50918]/25 cursor-pointer"
                  >
                    Submit Enquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
