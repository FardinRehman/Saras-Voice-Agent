import React, { useState, useEffect } from 'react';
import { CallSession, TranscriptItem, ToolExecution } from '../types/saras.ts';
import { formatDuration, formatDateTime } from '../utils/formatters.ts';
import { X, CheckCircle2, AlertCircle, Wrench, Shield, MessageSquare, Clock, User, Phone, Zap } from 'lucide-react';

interface CallDetailsModalProps {
  session: CallSession | null;
  onClose: () => void;
}

export const CallDetailsModal: React.FC<CallDetailsModalProps> = ({ session, onClose }) => {
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [tools, setTools] = useState<ToolExecution[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetch(`/api/calls/${session.id}`)
      .then((res) => res.json())
      .then((data) => {
        setTranscripts(data.transcripts || []);
        setTools(data.toolExecutions || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E7] dark:border-[#262626] bg-[#F5F5F7] dark:bg-[#141414] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-[#E50918]">
                {session.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  session.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : session.status === 'TRANSFERRED'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                }`}
              >
                {session.status}
              </span>
              <span className="text-xs text-slate-400 font-medium">• {session.mode} MODE</span>
              {session.leadCaptured && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-[#E50918] border border-red-200 dark:border-red-900/40">
                  LEAD CAPTURED
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Conversation Session Inspection
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F5F5F7] dark:bg-[#141414] border border-[#E5E5E7] dark:border-[#262626] text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Visitor / Client</span>
              <span className="font-bold text-slate-800 dark:text-white mt-0.5 block truncate">
                {session.customerName || 'Website Visitor'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Caller Identifier</span>
              <span className="font-mono font-bold text-slate-800 dark:text-white mt-0.5 block">
                {session.callerNumber}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
              <span className="font-bold text-slate-800 dark:text-white mt-0.5 block">
                {formatDuration(session.durationSeconds)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Sentiment</span>
              <span
                className={`font-bold mt-0.5 block ${
                  session.sentiment === 'POSITIVE'
                    ? 'text-emerald-500'
                    : session.sentiment === 'FRUSTRATED'
                    ? 'text-[#E50918]'
                    : 'text-slate-400'
                }`}
              >
                {session.sentiment}
              </span>
            </div>
          </div>

          {/* Tools Executed Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#E50918]" />
              Saras Dynamics Tools Executed ({tools.length})
            </h3>
            {tools.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 rounded-xl border border-[#E5E5E7] dark:border-[#262626]">
                No backend tools invoked during this session.
              </p>
            ) : (
              <div className="space-y-2">
                {tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-3.5 rounded-xl border border-[#E5E5E7] dark:border-[#262626] bg-white dark:bg-[#141414] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#E50918]">
                        {tool.toolName}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          tool.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {tool.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="bg-[#F5F5F7] dark:bg-[#1f1f1f] p-2.5 rounded-lg border border-[#E5E5E7] dark:border-[#2a2a2a]">
                        <span className="text-slate-400 block text-[9px] font-sans font-bold uppercase">Args</span>
                        <pre className="text-slate-700 dark:text-slate-300 overflow-x-auto">
                          {JSON.stringify(tool.args, null, 2)}
                        </pre>
                      </div>
                      <div className="bg-[#F5F5F7] dark:bg-[#1f1f1f] p-2.5 rounded-lg border border-[#E5E5E7] dark:border-[#2a2a2a]">
                        <span className="text-slate-400 block text-[9px] font-sans font-bold uppercase">Result</span>
                        <pre className="text-slate-700 dark:text-slate-300 overflow-x-auto">
                          {JSON.stringify(tool.result, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transcript Dialogue */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#E50918]" />
              Dialogue Transcript ({transcripts.length} Turns)
            </h3>
            {loading ? (
              <div className="text-xs text-slate-400 py-4 text-center">Loading transcripts...</div>
            ) : transcripts.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 rounded-xl border border-[#E5E5E7] dark:border-[#262626]">
                No recorded dialogue turns for this call.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {transcripts.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      t.speaker === 'agent'
                        ? 'bg-[#F5F5F7] dark:bg-[#222222] text-slate-800 dark:text-slate-200 border-l-4 border-l-[#E50918]'
                        : 'bg-slate-100 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100 border-l-4 border-l-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[10px] font-bold text-slate-400">
                      <span className="uppercase">
                        {t.speaker === 'agent' ? 'Saras AI Assistant' : 'Visitor'}
                      </span>
                      <span>{formatDateTime(t.timestamp)}</span>
                    </div>
                    <div>{t.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
