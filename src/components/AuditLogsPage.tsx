import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types/saras.ts';
import { formatDateTime } from '../utils/formatters.ts';
import { ShieldCheck, ShieldAlert, Lock, Search, Filter, RefreshCw, Clock, ChevronDown, ChevronUp, Eye, X } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      setLogs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) => {
    if (filterAction !== 'ALL' && l.action !== filterAction) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      l.details.toLowerCase().includes(term) ||
      l.actor.toLowerCase().includes(term) ||
      (l.targetId && l.targetId.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#E50918] dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 uppercase">
              Compliance
            </span>
            <span className="text-xs text-slate-400 font-mono">Immutable Trail</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#E50918]" />
            Audit & Governance Logs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable audit logs tracking AI voice interactions, lead registration events, knowledge base mutations, and administrative staff access.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E5E7] dark:border-[#262626] bg-white dark:bg-[#171717] hover:bg-slate-50 dark:hover:bg-[#202020] text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#E50918]' : ''}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Security Principles Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-4 shadow-2xs border-l-4 border-l-[#E50918]">
          <span className="text-[11px] font-bold text-[#E50918] uppercase tracking-wider block">
            Zero Hallucination Grounding
          </span>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Voice Agent strictly retrieves verified Saras Dynamics knowledge before answering service and technical queries.
          </p>
        </div>
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-4 shadow-2xs border-l-4 border-l-slate-700 dark:border-l-slate-300">
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
            Lead Privacy & CRM Protection
          </span>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Prospect contact numbers, emails, and project specifications are secured in PostgreSQL with access controls.
          </p>
        </div>
        <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl p-4 shadow-2xs border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Role-Based Access Control (RBAC)
          </span>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Granular separation of staff roles: SUPER_ADMIN, SALES_LEAD, AI_ENGINEER, and AUDITOR.
          </p>
        </div>
      </div>

      {/* Audit Log Table Card */}
      <div className="bg-white dark:bg-[#171717] border border-[#E5E5E7] dark:border-[#262626] rounded-2xl shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-[#E5E5E7] dark:border-[#262626] bg-[#F5F5F7]/60 dark:bg-[#141414] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="text-xs rounded-xl border border-[#E5E5E7] dark:border-[#333333] bg-white dark:bg-[#202020] px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
            >
              <option value="ALL">All Event Types</option>
              <option value="LEAD_CAPTURED">LEAD_CAPTURED</option>
              <option value="CALL_COMPLETED">CALL_COMPLETED</option>
              <option value="KNOWLEDGE_CHUNK_CREATED">KNOWLEDGE_CHUNK_CREATED</option>
              <option value="KNOWLEDGE_CHUNK_UPDATED">KNOWLEDGE_CHUNK_UPDATED</option>
              <option value="KNOWLEDGE_CHUNK_DELETED">KNOWLEDGE_CHUNK_DELETED</option>
              <option value="WEBSITE_INGESTED">WEBSITE_INGESTED</option>
              <option value="WEBSITE_INGESTION_COMPLETED">WEBSITE_INGESTION_COMPLETED</option>
              <option value="DOCUMENT_UPLOADED">DOCUMENT_UPLOADED</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by actor, detail or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs rounded-xl border border-[#E5E5E7] dark:border-[#333333] bg-white dark:bg-[#202020] pl-9 pr-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#E50918]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F5F7] dark:bg-[#1a1a1a] text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor / Role</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target / Resource</th>
                <th className="p-3">Details</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E7] dark:divide-[#262626] font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1f1f1f] transition-colors">
                    <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{log.actor}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{log.role}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-[#E50918] whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {log.targetId || 'SYSTEM'}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 max-w-sm line-clamp-1">
                      {log.details}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                        title="View Log Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#171717] rounded-2xl p-6 max-w-md w-full border border-[#E5E5E7] dark:border-[#262626] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] dark:border-[#262626]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#E50918]" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Audit Entry Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Event Action</span>
                <span className="font-mono font-bold text-[#E50918]">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Timestamp</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{formatDateTime(selectedLog.timestamp)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Actor</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLog.actor}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Role</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">{selectedLog.role}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Target ID</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">{selectedLog.targetId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Details</span>
                <div className="p-3 rounded-xl bg-[#F5F5F7] dark:bg-[#202020] border border-[#E5E5E7] dark:border-[#2a2a2a] text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                  {selectedLog.details}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <span
                  className={`inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                    selectedLog.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedLog.status}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-[#222222] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
