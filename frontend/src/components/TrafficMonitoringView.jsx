import React, { useState } from 'react';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
} from 'lucide-react';
import Pagination from './Pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
  setSearchQuery,
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
    <div className="space-y-4 animate-page-enter text-white">
      {/* Top Header & Telemetry Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Ingress Telemetry
            </h2>
            <Badge variant="outline" className="font-mono text-[10px] border-zinc-800 text-zinc-400 bg-zinc-900 px-1.5 py-0">
              {totalCaptured} CAPTURED
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time reverse-proxy access logs, token verification, and gateway latency
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live Auto-Refresh Switch */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-950">
            <Switch
              id="live-stream-toggle"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="live-stream-toggle" className="text-xs cursor-pointer flex items-center gap-1.5 select-none">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  autoRefresh ? 'bg-emerald-400' : 'bg-zinc-600'
                }`}
              />
              <span className={autoRefresh ? 'text-zinc-200 font-medium' : 'text-zinc-500'}>
                {autoRefresh ? 'Live Stream' : 'Paused'}
              </span>
            </Label>
          </div>

          {/* Manual Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-7 px-2.5 gap-1.5 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 shadow-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Telemetry Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider font-mono">Ingress Volume</div>
              <div className="text-xl font-bold text-zinc-100 mt-0.5 font-mono">{totalCaptured}</div>
            </div>
            <Activity className="w-4 h-4 text-zinc-600" />
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider font-mono">2xx Passed</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5 font-mono">
                {count2xx}{' '}
                <span className="text-xs font-normal text-zinc-500">
                  ({totalCaptured > 0 ? Math.round((count2xx / totalCaptured) * 100) : 0}%)
                </span>
              </div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-500/70" />
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider font-mono">4xx/5xx Intercepted</div>
              <div className="text-xl font-bold text-rose-400 mt-0.5 font-mono">
                {count4xx}{' '}
                <span className="text-xs font-normal text-zinc-500">
                  ({totalCaptured > 0 ? Math.round((count4xx / totalCaptured) * 100) : 0}%)
                </span>
              </div>
            </div>
            <AlertCircle className="w-4 h-4 text-rose-500/70" />
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider font-mono">Mean Latency</div>
              <div className="text-xl font-bold text-sky-400 mt-0.5 font-mono">
                {avgLatency} <span className="text-xs font-normal text-zinc-500">ms</span>
              </div>
            </div>
            <Clock className="w-4 h-4 text-sky-500/70" />
          </CardContent>
        </Card>
      </div>

      {/* Scope Switcher & Filter Ribbon */}
      <Card className="border-zinc-800/80 bg-zinc-950 shadow-none">
        <CardContent className="p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500 text-xs font-medium">Scope:</span>
            <div className="flex items-center bg-zinc-900 p-0.5 rounded-md border border-zinc-800">
              <button
                onClick={() => setTrafficScope && setTrafficScope('project')}
                className={`h-6 px-2.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  trafficScope === 'project'
                    ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {currentProject ? `Workspace: ${currentProject.name}` : 'Isolated Workspace'}
              </button>
              <button
                onClick={() => setTrafficScope && setTrafficScope('global')}
                className={`h-6 px-2.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  trafficScope === 'global'
                    ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Global Gateway Stream
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter path, IP, method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-2.5 py-1 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 h-7 w-44"
              />
            </div>

            {/* API Filter */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedApiFilter}
                onChange={(e) => setSelectedApiFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600 h-7"
              >
                <option value="ALL">All Routes ({apis.length})</option>
                {apis.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600 h-7"
              >
                <option value="ALL">All Statuses</option>
                <option value="2XX">2xx OK</option>
                <option value="4XX">4xx Client / Blocked</option>
                <option value="5XX">5xx Upstream Drop</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Table */}
      {filteredRecords.length === 0 ? (
        <Card className="border border-zinc-800/80 bg-zinc-950 shadow-none">
          <CardContent className="py-16 text-center p-8 space-y-2">
            <Activity className="w-8 h-8 text-zinc-700 mx-auto" />
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">No Telemetry Recorded</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {trafficRecords.length === 0
                ? 'Requests routed through Spring Cloud Gateway (:8080) stream into this telemetry table in real time.'
                : 'No records matched the selected query or filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <Card className="border-zinc-800/80 bg-zinc-950 shadow-none overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/40">
                <TableRow className="border-b border-zinc-800/80 hover:bg-transparent">
                  <TableHead className="py-2.5 px-3.5 font-medium text-zinc-400 text-xs h-9">Timestamp</TableHead>
                  {trafficScope === 'global' && (
                    <TableHead className="py-2.5 px-3.5 font-medium text-zinc-400 text-xs h-9">Workspace</TableHead>
                  )}
                  <TableHead className="py-2.5 px-3.5 font-medium text-zinc-400 text-xs h-9">Method</TableHead>
                  <TableHead className="py-2.5 px-3.5 font-medium text-zinc-400 text-xs h-9">Gateway Path</TableHead>
                  <TableHead className="py-2.5 px-3.5 font-medium text-zinc-400 text-xs h-9">Client IP</TableHead>
                  <TableHead className="py-2.5 px-3.5 font-medium text-zinc-400 text-xs h-9">Status</TableHead>
                  <TableHead className="py-2.5 px-3.5 font-medium text-zinc-400 text-xs h-9">Roundtrip</TableHead>
                  <TableHead className="py-2.5 px-3.5 font-medium text-zinc-400 text-xs h-9 text-right">Payload</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.map((r) => {
                  const isSuccess = r.statusCode < 400;
                  const isBlocked = r.statusCode === 401 || r.statusCode === 403 || r.statusCode === 429;

                  return (
                    <TableRow
                      key={r.id}
                      onClick={() => setSelectedRecord(selectedRecord?.id === r.id ? null : r)}
                      className={`border-b border-zinc-800/60 hover:bg-zinc-900/40 cursor-pointer transition-colors ${
                        selectedRecord?.id === r.id ? 'bg-zinc-900/60' : ''
                      }`}
                    >
                      <TableCell className="py-2 px-3.5 text-zinc-400 text-xs font-mono">
                        {formatTimestamp(r.timestamp)}
                      </TableCell>
                      {trafficScope === 'global' && (
                        <TableCell className="py-2 px-3.5 text-[11px] text-zinc-400 font-mono">
                          {r.projectId ? (
                            <Badge variant="outline" className="text-[10px] border-zinc-800 bg-zinc-900 text-zinc-300 py-0 px-1.5 font-mono">
                              {r.projectId}
                            </Badge>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="py-2 px-3.5 font-mono text-xs">
                        <span
                          className={`font-semibold ${
                            r.httpMethod === 'GET'
                              ? 'text-sky-400'
                              : r.httpMethod === 'POST'
                              ? 'text-emerald-400'
                              : r.httpMethod === 'DELETE'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {r.httpMethod}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-3.5 text-zinc-200 max-w-[240px] truncate font-mono text-xs" title={r.path}>
                        {r.path}
                      </TableCell>
                      <TableCell className="py-2 px-3.5 text-zinc-400 font-mono text-xs">{r.clientIp || '127.0.0.1'}</TableCell>
                      <TableCell className="py-2 px-3.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 font-mono ${
                            isSuccess
                              ? 'border-emerald-800/50 bg-emerald-950/40 text-emerald-400'
                              : isBlocked
                              ? 'border-amber-800/50 bg-amber-950/40 text-amber-400'
                              : 'border-rose-800/50 bg-rose-950/40 text-rose-400'
                          }`}
                        >
                          {r.statusCode || 'ERR'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3.5 text-zinc-300 font-mono text-xs">{r.durationMs}ms</TableCell>
                      <TableCell className="py-2 px-3.5 text-zinc-400 text-right font-mono text-xs">
                        {r.requestSize > 0 ? `${r.requestSize} B` : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Quick Inspector Drawer */}
            {selectedRecord && (
              <div className="border-t border-zinc-800 bg-zinc-950 p-4 text-xs font-mono space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-2">
                  <span className="text-xs font-medium text-zinc-200">
                    Telemetry Inspector &bull; <span className="text-zinc-400">{selectedRecord.id}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRecord(null)}
                    className="text-zinc-400 hover:text-white text-xs h-6 px-2 hover:bg-zinc-900"
                  >
                    &times; Close
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-mono">Method & Path:</span>
                    <span className="text-zinc-100 font-semibold">{selectedRecord.httpMethod} {selectedRecord.path}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-mono">Status & Latency:</span>
                    <span className="text-zinc-200">{selectedRecord.statusCode} ({selectedRecord.durationMs}ms)</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-mono">Client IP:</span>
                    <span className="text-zinc-200">{selectedRecord.clientIp}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-mono">Target API:</span>
                    <span className="text-zinc-100">{selectedRecord.apiId || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

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
