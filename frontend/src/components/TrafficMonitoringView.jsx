import React, { useState } from 'react';
import {
  Activity,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpDown,
  Radio,
  Sliders,
  ChevronDown
} from 'lucide-react';
import Pagination from './Pagination';

export default function TrafficMonitoringView({
  trafficRecords = [],
  trafficStats = null,
  apis = [],
  currentProject,
  trafficScope = 'project',
  setTrafficScope,
  onRefresh,
  isRefreshing,
  autoRefresh,
  setAutoRefresh,
  searchQuery = '',
  setSearchQuery
}) {
  const [selectedApiFilter, setSelectedApiFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const filteredRecords = trafficRecords.filter((r) => {
    if (selectedApiFilter !== 'ALL' && r.apiId !== selectedApiFilter) {
      return false;
    }
    if (statusFilter === '2XX' && (r.statusCode < 200 || r.statusCode >= 300)) {
      return false;
    }
    if (statusFilter === '4XX' && (r.statusCode < 400 || r.statusCode >= 500)) {
      return false;
    }
    if (statusFilter === '5XX' && r.statusCode < 500) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (r.path && r.path.toLowerCase().includes(q)) ||
        (r.clientIp && r.clientIp.toLowerCase().includes(q)) ||
        (r.httpMethod && r.httpMethod.toLowerCase().includes(q)) ||
        (r.apiId && r.apiId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isFiltered = selectedApiFilter !== 'ALL' || statusFilter !== 'ALL' || Boolean(searchQuery);

  const totalCaptured = !isFiltered && trafficStats?.totalCaptured != null
    ? Math.max(trafficStats.totalCaptured, trafficRecords.length)
    : filteredRecords.length;

  const count2xx = !isFiltered && trafficStats?.successCount != null
    ? trafficStats.successCount
    : filteredRecords.filter((r) => r.statusCode >= 200 && r.statusCode < 300).length;

  const count4xx = !isFiltered && trafficStats?.errorCount != null
    ? trafficStats.errorCount
    : filteredRecords.filter((r) => r.statusCode >= 400 && r.statusCode < 500).length;

  const count5xx = filteredRecords.filter((r) => r.statusCode >= 500).length;

  const avgLatency =
    !isFiltered && trafficStats?.avgDurationMs != null && trafficStats.avgDurationMs > 0
      ? Math.round(trafficStats.avgDurationMs)
      : trafficRecords.length > 0
      ? Math.round(
          trafficRecords.reduce((acc, curr) => acc + (curr.durationMs || 0), 0) /
            trafficRecords.length
        )
      : 0;

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
      {/* Top Header & Telemetry Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Traffic Telemetry
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-900 text-neutral-300 border border-neutral-800">
              {totalCaptured} Events Captured
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Privacy-sanitized operational logs and latency captured at the Spring Cloud Gateway perimeter.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Auto-Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all btn-click ${
              autoRefresh
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-[#08080a] border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'
              }`}
            />
            <span>{autoRefresh ? 'Live Stream Active' : 'Stream Paused'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-[#08080a] hover:bg-neutral-900 text-neutral-300 hover:text-white text-xs font-medium transition-colors disabled:opacity-50 btn-click"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Telemetry Distribution Summary Bar (Minimal Cards with rounded corners) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-medium text-neutral-400">Total Captured</div>
            <div className="text-xl font-bold text-white mt-0.5 font-mono">{totalCaptured}</div>
          </div>
          <Activity className="w-4 h-4 text-neutral-500" />
        </div>

        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-medium text-neutral-400">2xx Success</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">
              {count2xx}{' '}
              <span className="text-xs font-normal text-neutral-400">
                ({totalCaptured > 0 ? Math.round((count2xx / totalCaptured) * 100) : 0}%)
              </span>
            </div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>

        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-medium text-neutral-400">4xx Client Errors / Blocked</div>
            <div className="text-xl font-bold text-rose-400 mt-0.5 font-mono">
              {count4xx}{' '}
              <span className="text-xs font-normal text-neutral-400">
                ({totalCaptured > 0 ? Math.round((count4xx / totalCaptured) * 100) : 0}%)
              </span>
            </div>
          </div>
          <AlertCircle className="w-4 h-4 text-rose-500" />
        </div>

        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-medium text-neutral-400">Avg Roundtrip</div>
            <div className="text-xl font-bold text-sky-400 mt-0.5 font-mono">
              {avgLatency} <span className="text-xs font-normal text-neutral-400">ms</span>
            </div>
          </div>
          <Clock className="w-4 h-4 text-sky-400" />
        </div>
      </div>

      {/* Scope Switcher & Filter Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl border border-neutral-800/80 bg-[#08080a] text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-neutral-400 text-xs font-medium">Scope:</span>
          <div className="flex items-center bg-[#050507] p-1 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setTrafficScope && setTrafficScope('project')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                trafficScope === 'project'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {currentProject ? `Project: ${currentProject.name}` : 'Isolated Project'}
            </button>
            <button
              type="button"
              onClick={() => setTrafficScope && setTrafficScope('global')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                trafficScope === 'global'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Global Gateway Audit
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* API Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 text-xs">API:</span>
            <select
              value={selectedApiFilter}
              onChange={(e) => setSelectedApiFilter(e.target.value)}
              className="bg-[#050507] border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All APIs ({apis.length})</option>
              {apis.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.id})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 text-xs">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#050507] border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="2XX">2xx OK</option>
              <option value="4XX">4xx Blocked / Client Error</option>
              <option value="5XX">5xx Upstream Error</option>
            </select>
          </div>
        </div>
      </div>

      {/* Traffic Table */}
      {filteredRecords.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-neutral-800 rounded-2xl bg-[#08080a] p-8 space-y-3">
          <Activity className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Telemetry Logs Recorded</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {trafficRecords.length === 0
              ? trafficScope === 'project' && currentProject
                ? `No requests recorded for project "${currentProject.name}" yet. Send a request through http://localhost:8080/proxy/{apiId}/... to inspect live traffic.`
                : 'Requests sent through Spring Cloud Gateway will stream into this audit inspector in real time.'
              : 'No records matched the selected filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#050507] border-b border-neutral-800/80 text-neutral-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-medium">Timestamp</th>
                    {trafficScope === 'global' && (
                      <th className="py-3 px-4 font-medium">Project</th>
                    )}
                    <th className="py-3 px-4 font-medium">Method</th>
                    <th className="py-3 px-4 font-medium">Gateway Path</th>
                    <th className="py-3 px-4 font-medium">Client IP</th>
                    <th className="py-3 px-4 font-medium">HTTP Status</th>
                    <th className="py-3 px-4 font-medium">Roundtrip</th>
                    <th className="py-3 px-4 font-medium text-right">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-neutral-300 text-[11px]">
                  {paginatedRecords.map((r) => {
                    const isSuccess = r.statusCode < 400;
                    const isBlocked = r.statusCode === 401 || r.statusCode === 403 || r.statusCode === 429;
                    const isError = r.statusCode >= 500;

                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedRecord(selectedRecord?.id === r.id ? null : r)}
                        className={`hover:bg-neutral-900/50 transition-colors cursor-pointer ${
                          selectedRecord?.id === r.id ? 'bg-neutral-900/70' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 text-neutral-400 text-[11px]">
                          {formatTimestamp(r.timestamp)}
                        </td>
                        {trafficScope === 'global' && (
                          <td className="py-2.5 px-4 text-[10px] text-neutral-400">
                            {r.projectId ? (
                              <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800">
                                {r.projectId}
                              </span>
                            ) : (
                              <span className="text-neutral-600">-</span>
                            )}
                          </td>
                        )}
                        <td className="py-2.5 px-4 font-bold">
                          <span
                            className={
                              r.httpMethod === 'GET'
                                ? 'text-sky-400'
                                : r.httpMethod === 'POST'
                                ? 'text-emerald-400'
                                : r.httpMethod === 'DELETE'
                                ? 'text-rose-400'
                                : 'text-amber-400'
                            }
                          >
                            {r.httpMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-white max-w-[220px] truncate" title={r.path}>
                          {r.path}
                        </td>
                        <td className="py-2.5 px-4 text-neutral-400">{r.clientIp || '127.0.0.1'}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isSuccess
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : isBlocked
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {r.statusCode || 'ERR'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-neutral-300">{r.durationMs}ms</td>
                        <td className="py-2.5 px-4 text-neutral-400 text-right">
                          {r.requestSize > 0 ? `${r.requestSize} B` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick Inspector Row */}
            {selectedRecord && (
              <div className="border-t border-neutral-800 bg-[#050507] p-4 text-xs font-mono space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between text-neutral-400 border-b border-neutral-800/80 pb-2">
                  <span className="text-[11px] font-semibold text-white">
                    Request Telemetry Inspector &bull; {selectedRecord.id}
                  </span>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="text-neutral-500 hover:text-white text-xs"
                  >
                    &times; Close
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px]">
                  <div>
                    <span className="text-neutral-500 block">Method & Path:</span>
                    <span className="text-white font-semibold">{selectedRecord.httpMethod} {selectedRecord.path}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Status & Latency:</span>
                    <span className="text-neutral-200">{selectedRecord.statusCode} ({selectedRecord.durationMs}ms)</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Client IP:</span>
                    <span className="text-neutral-200">{selectedRecord.clientIp}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Target API:</span>
                    <span className="text-white">{selectedRecord.apiId || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredRecords.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
}
