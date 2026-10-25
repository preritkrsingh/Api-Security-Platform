import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  AlertOctagon,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import Pagination from './Pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';

export default function IncidentsView({
  securityEvents = [],
  currentProject: _currentProject,
  onRefresh,
  isRefreshing,
  searchQuery = '',
  setSearchQuery,
  onNavigate,
}) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [threatTypeFilter, setThreatTypeFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Extract unique threat types
  const threatTypes = Array.from(
    new Set(securityEvents.map((e) => e.threatType || e.eventType).filter(Boolean))
  );

  const filteredEvents = securityEvents.filter((evt) => {
    if (severityFilter !== 'ALL' && evt.severity !== severityFilter) {
      return false;
    }
    const type = evt.threatType || evt.eventType;
    if (threatTypeFilter !== 'ALL' && type !== threatTypeFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (type && type.toLowerCase().includes(q)) ||
        (evt.clientIp && evt.clientIp.toLowerCase().includes(q)) ||
        (evt.uriPath && evt.uriPath.toLowerCase().includes(q)) ||
        (evt.path && evt.path.toLowerCase().includes(q)) ||
        (evt.details && evt.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const paginatedEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const criticalCount = securityEvents.filter((e) => e.severity === 'CRITICAL').length;
  const highCount = securityEvents.filter((e) => e.severity === 'HIGH').length;
  const mediumCount = securityEvents.filter((e) => e.severity === 'MEDIUM').length;
  const lowCount = securityEvents.filter((e) => e.severity === 'LOW' || e.severity === 'INFO').length;

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
      {/* Top Header & Audit Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Security Incidents & Intercepts
            </h2>
            <Badge variant="outline" className="text-[10px] border-zinc-800 bg-zinc-900 text-zinc-400 font-mono py-0 px-1.5">
              {securityEvents.length} INCIDENTS
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Audit log of perimeter blocks, cryptographic auth mismatches, and token-bucket mitigations
          </p>
        </div>

        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="h-7 px-2.5 gap-1.5 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 shadow-none"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Severity Triage KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setSeverityFilter(severityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            severityFilter === 'CRITICAL'
              ? 'bg-rose-950/30 border-rose-800/70'
              : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider font-mono">Critical</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-rose-400">{criticalCount}</div>
        </button>

        <button
          onClick={() => {
            setSeverityFilter(severityFilter === 'HIGH' ? 'ALL' : 'HIGH');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            severityFilter === 'HIGH'
              ? 'bg-amber-950/30 border-amber-800/70'
              : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider font-mono">High</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-amber-400">{highCount}</div>
        </button>

        <button
          onClick={() => {
            setSeverityFilter(severityFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            severityFilter === 'MEDIUM'
              ? 'bg-purple-950/30 border-purple-800/70'
              : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider font-mono">Medium</span>
            <AlertTriangle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-purple-400">{mediumCount}</div>
        </button>

        <button
          onClick={() => {
            setSeverityFilter(severityFilter === 'LOW' ? 'ALL' : 'LOW');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            severityFilter === 'LOW'
              ? 'bg-sky-950/30 border-sky-800/70'
              : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider font-mono">Informational</span>
            <Info className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-sky-400">{lowCount}</div>
        </button>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-zinc-800/80 bg-zinc-950 shadow-none">
        <CardContent className="p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500 font-medium">Signature:</span>
            <select
              value={threatTypeFilter}
              onChange={(e) => {
                setThreatTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600 h-7"
            >
              <option value="ALL">All Threat Signatures</option>
              {threatTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search threat, path, IP..."
              value={searchQuery}
              onChange={(e) => {
                if (setSearchQuery) setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-2.5 py-1 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 h-7 w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Incident List */}
      {filteredEvents.length === 0 ? (
        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none">
          <CardContent className="py-16 text-center p-8 space-y-2">
            <ShieldCheck className="w-8 h-8 text-emerald-500/80 mx-auto" />
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">No Incidents Detected</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Perimeter guardrails are operational. Any blocked routes, rate-limit exhausts, or SSRF probes will log here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <Card className="border-zinc-800/80 bg-zinc-950 shadow-none overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/40">
                <TableRow className="border-b border-zinc-800/80 hover:bg-transparent">
                  <TableHead className="w-8 py-2.5 px-3"></TableHead>
                  <TableHead className="py-2.5 px-3 font-medium text-zinc-400 text-xs h-9">Timestamp</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium text-zinc-400 text-xs h-9">Threat Signature</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium text-zinc-400 text-xs h-9">Target Path</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium text-zinc-400 text-xs h-9">Attacker IP</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium text-zinc-400 text-xs h-9">Severity</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium text-zinc-400 text-xs h-9">Action Taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEvents.map((evt, idx) => {
                  const isExpanded = expandedId === evt.id;
                  const type = evt.threatType || evt.eventType || 'PERIMETER_BLOCK';
                  const path = evt.uriPath || evt.path || evt.target || '/api';

                  return (
                    <React.Fragment key={evt.id || `incident-${idx}`}>
                      <TableRow
                        onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                        className={`border-b border-zinc-800/60 hover:bg-zinc-900/40 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-zinc-900/60' : ''
                        }`}
                      >
                        <TableCell className="py-2.5 px-3 text-zinc-500">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-300" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-zinc-400 text-xs font-mono">
                          {formatTimestamp(evt.timestamp)}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-zinc-200 font-medium text-xs">
                          {type}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-zinc-300 font-mono text-xs max-w-[200px] truncate">
                          {path}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-zinc-400 font-mono text-xs">
                          {evt.clientIp || '198.51.100.24'}
                        </TableCell>
                        <TableCell className="py-2.5 px-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono px-1.5 py-0 ${
                              evt.severity === 'CRITICAL'
                                ? 'border-rose-800/50 bg-rose-950/40 text-rose-400'
                                : evt.severity === 'HIGH'
                                ? 'border-amber-800/50 bg-amber-950/40 text-amber-400'
                                : 'border-zinc-800 bg-zinc-900 text-zinc-300'
                            }`}
                          >
                            {evt.severity || 'HIGH'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5 px-3">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono px-1.5 py-0 border-zinc-800 bg-zinc-900 text-zinc-300"
                          >
                            BLOCKED (429/401)
                          </Badge>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="border-b border-zinc-800 bg-zinc-950">
                          <TableCell colSpan={7} className="p-4 text-xs font-mono space-y-2">
                            <div className="text-zinc-400 text-xs leading-relaxed font-sans">
                              {evt.details || evt.description || 'Perimeter signature tripped on gateway reverse-proxy.'}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-zinc-800/60 text-xs">
                              <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-mono">Event ID:</span>
                                <span className="text-zinc-300">{evt.id}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-mono">Mitigation Rule:</span>
                                <span className="text-zinc-300">Token-Bucket / SSRF</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-mono">Proxy Gateway:</span>
                                <span className="text-zinc-300">:8080 Spring Cloud</span>
                              </div>
                              <div className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onNavigate && onNavigate('traffic')}
                                  className="h-6 px-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
                                >
                                  <span>View Stream</span>
                                  <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

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
