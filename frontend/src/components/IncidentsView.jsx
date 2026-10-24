import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Info,
  Clock,
  ArrowUpDown,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import Pagination from './Pagination';

export default function IncidentsView({
  securityEvents = [],
  currentProject,
  onRefresh,
  isRefreshing,
  searchQuery = '',
  setSearchQuery,
  onNavigate
}) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [threatTypeFilter, setThreatTypeFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Extract unique threat types
  const threatTypes = Array.from(
    new Set(securityEvents.map((e) => e.threatType).filter(Boolean))
  );

  const filteredEvents = securityEvents.filter((evt) => {
    if (severityFilter !== 'ALL' && evt.severity !== severityFilter) {
      return false;
    }
    if (threatTypeFilter !== 'ALL' && evt.threatType !== threatTypeFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (evt.threatType && evt.threatType.toLowerCase().includes(q)) ||
        (evt.clientIp && evt.clientIp.toLowerCase().includes(q)) ||
        (evt.uriPath && evt.uriPath.toLowerCase().includes(q)) ||
        (evt.details && evt.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const paginatedEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const criticalCount = securityEvents.filter((e) => e.severity === 'CRITICAL').length;
  const highCount = securityEvents.filter((e) => e.severity === 'HIGH').length;
  const mediumCount = securityEvents.filter((e) => e.severity === 'MEDIUM').length;
  const lowCount = securityEvents.filter((e) => e.severity === 'LOW').length;

  const formatTimestamp = (ts) => {
    if (!ts) return '-';
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return (
          d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) +
          ' ' +
          d.toLocaleDateString([], { month: 'short', day: 'numeric' })
        );
      }
    } catch {
      // fallback
    }
    return ts;
  };

  return (
    <div className="space-y-4 animate-fade-in text-white">
      {/* Top Header & Audit Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Threats & Security Incidents
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-900 text-neutral-300 border border-neutral-800">
              {securityEvents.length} Incidents Logged
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Audit log of perimeter blocks, credential stuffing, rate-limit triggers, and malicious ingress.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-800 bg-[#08080a] hover:bg-neutral-900 text-neutral-300 hover:text-white text-xs font-medium transition-colors disabled:opacity-50 btn-click"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Severity Triage KPI Cards (Minimal Cards with rounded corners) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setSeverityFilter(severityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL');
            setCurrentPage(1);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all btn-click ${
            severityFilter === 'CRITICAL'
              ? 'bg-rose-950/20 border-rose-500/50 shadow-md ring-1 ring-rose-500/30'
              : 'bg-[#08080a] border-neutral-800/80 hover:border-neutral-700/80'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Critical</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-rose-400">{criticalCount}</div>
        </button>

        <button
          onClick={() => {
            setSeverityFilter(severityFilter === 'HIGH' ? 'ALL' : 'HIGH');
            setCurrentPage(1);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all btn-click ${
            severityFilter === 'HIGH'
              ? 'bg-amber-950/20 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
              : 'bg-[#08080a] border-neutral-800/80 hover:border-neutral-700/80'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">High Severity</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-amber-400">{highCount}</div>
        </button>

        <button
          onClick={() => {
            setSeverityFilter(severityFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM');
            setCurrentPage(1);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all btn-click ${
            severityFilter === 'MEDIUM'
              ? 'bg-yellow-950/20 border-yellow-500/50 shadow-md ring-1 ring-yellow-500/30'
              : 'bg-[#08080a] border-neutral-800/80 hover:border-neutral-700/80'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Medium</span>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-yellow-400">{mediumCount}</div>
        </button>

        <button
          onClick={() => {
            setSeverityFilter(severityFilter === 'LOW' ? 'ALL' : 'LOW');
            setCurrentPage(1);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all btn-click ${
            severityFilter === 'LOW'
              ? 'bg-blue-950/20 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
              : 'bg-[#08080a] border-neutral-800/80 hover:border-neutral-700/80'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Low / Informational</span>
            <Info className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-sky-400">{lowCount}</div>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl border border-neutral-800/80 bg-[#08080a] text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-neutral-400 font-medium">Threat Type:</span>
          <select
            value={threatTypeFilter}
            onChange={(e) => {
              setThreatTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#050507] border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Threat Signatures</option>
            {threatTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {severityFilter !== 'ALL' && (
            <button
              onClick={() => {
                setSeverityFilter('ALL');
                setCurrentPage(1);
              }}
              className="text-xs text-neutral-400 hover:text-white underline"
            >
              Clear Severity Filter
            </button>
          )}
        </div>
      </div>

      {/* Incident List */}
      {filteredEvents.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-neutral-800 rounded-2xl bg-[#08080a] p-8 space-y-3">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Security Incidents Found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {securityEvents.length === 0
              ? 'Perimeter policies are actively enforcing zero-trust ingress. Unauthorized attempts will appear here automatically.'
              : 'No incidents match the active search and severity filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#050507] border-b border-neutral-800/80 text-neutral-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-medium w-8"></th>
                    <th className="py-3 px-4 font-medium">Timestamp</th>
                    <th className="py-3 px-4 font-medium">Severity</th>
                    <th className="py-3 px-4 font-medium">Threat Classification</th>
                    <th className="py-3 px-4 font-medium">Client IP</th>
                    <th className="py-3 px-4 font-medium">Target Path</th>
                    <th className="py-3 px-4 font-medium text-right">Risk Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                  {paginatedEvents.map((evt) => {
                    const isExpanded = expandedId === evt.id;
                    const isCritical = evt.severity === 'CRITICAL';
                    const isHigh = evt.severity === 'HIGH';
                    const isMedium = evt.severity === 'MEDIUM';

                    return (
                      <React.Fragment key={evt.id}>
                        <tr
                          onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                          className={`hover:bg-neutral-900/50 transition-colors cursor-pointer ${
                            isExpanded ? 'bg-neutral-900/70' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-neutral-500">
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-neutral-400 text-[11px]">
                            {formatTimestamp(evt.timestamp)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                isCritical
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : isHigh
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : isMedium
                                  ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {evt.severity}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            {evt.threatType}
                          </td>
                          <td className="py-3 px-4 text-neutral-300">{evt.clientIp || '127.0.0.1'}</td>
                          <td className="py-3 px-4 text-white max-w-[200px] truncate" title={evt.uriPath}>
                            {evt.httpMethod ? `${evt.httpMethod} ` : ''}
                            {evt.uriPath}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-rose-400">
                              {Math.round((evt.riskScore || 0) * 100)}%
                            </span>
                          </td>
                        </tr>

                        {/* Expandable Forensic Details Drawer */}
                        {isExpanded && (
                          <tr className="bg-[#050507]">
                            <td colSpan={7} className="p-4 border-t border-neutral-800/80">
                              <div className="space-y-3 font-mono text-xs">
                                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                                  <span className="text-[11px] font-semibold text-white">
                                    Incident Forensics &bull; ID: {evt.id}
                                  </span>
                                  <span className="text-neutral-500 text-[11px]">
                                    Project: {evt.projectId || 'Global'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                                  <div className="p-3 rounded-xl bg-[#08080a] border border-neutral-800/80">
                                    <span className="text-neutral-500 block mb-1">Threat Type:</span>
                                    <span className="text-rose-400 font-bold">{evt.threatType}</span>
                                  </div>
                                  <div className="p-3 rounded-xl bg-[#08080a] border border-neutral-800/80">
                                    <span className="text-neutral-500 block mb-1">Source Client IP:</span>
                                    <span className="text-white">{evt.clientIp}</span>
                                  </div>
                                  <div className="p-3 rounded-xl bg-[#08080a] border border-neutral-800/80">
                                    <span className="text-neutral-500 block mb-1">Perimeter Action:</span>
                                    <span className="text-emerald-400 font-semibold">REQUEST BLOCKED</span>
                                  </div>
                                </div>

                                {evt.details && (
                                  <div className="p-3 rounded-xl bg-[#08080a] border border-neutral-800/80">
                                    <span className="text-neutral-500 block mb-1">Technical Mitigation Notes:</span>
                                    <p className="text-neutral-200 font-sans leading-relaxed text-[11px]">
                                      {evt.details}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredEvents.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
}
