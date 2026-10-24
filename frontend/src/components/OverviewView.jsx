import React from 'react';
import {
  Box,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  Clock,
  Layers,
  Terminal,
  ShieldCheck,
  Radio,
  Server,
  Zap,
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function OverviewView({
  apis = [],
  projects = [],
  currentProject,
  trafficRecords = [],
  trafficStats = null,
  serviceStatus = { gateway: 'UP', controlPlane: 'UP' },
  onNavigate,
  onOpenConsole,
  onRegisterApi
}) {
  const activeApis = apis.filter((a) => a.status === 'ACTIVE').length;
  const inactiveApis = apis.length - activeApis;

  const totalRequests =
    trafficStats?.totalCaptured != null
      ? Math.max(trafficStats.totalCaptured, trafficRecords.length)
      : trafficRecords.length;

  const blockedOrErrorRequests =
    trafficStats?.errorCount != null
      ? trafficStats.errorCount
      : trafficRecords.filter((t) => t.statusCode >= 400 || t.blocked === true).length;

  const blockRate =
    totalRequests > 0
      ? ((blockedOrErrorRequests / totalRequests) * 100).toFixed(1)
      : '0.0';

  const avgLatency =
    trafficStats?.avgDurationMs != null && trafficStats.avgDurationMs > 0
      ? Math.round(trafficStats.avgDurationMs)
      : trafficRecords.length > 0
      ? Math.round(
          trafficRecords.reduce((acc, curr) => acc + (curr.durationMs || 0), 0) /
            trafficRecords.length
        )
      : null;

  return (
    <div className="space-y-5 animate-fade-in text-white font-sans">
      {/* Top Posture Status & Perimeter Strip */}
      <div className="border border-neutral-800/80 bg-[#08080a] p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-wide text-white">
                  Perimeter Defense Active
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  GATEWAY :8080 {serviceStatus.gateway}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-neutral-900 text-neutral-300 border border-neutral-800">
                  CONTROL PLANE :8082 {serviceStatus.controlPlane}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Active reverse-proxy filtering: SSRF IP bounds, SHA-256 HMAC key auth, and token-bucket rate limiting.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {apis.length === 0 ? (
              <button
                onClick={onRegisterApi}
                className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all"
              >
                Onboard First API
              </button>
            ) : (
              <button
                onClick={onOpenConsole}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-800 bg-[#0c0c0e] hover:bg-neutral-900 text-white text-xs font-medium transition-colors"
              >
                <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                <span>Test Console</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('traffic')}
              className="px-3.5 py-2 rounded-xl border border-neutral-800 bg-[#0c0c0e] hover:bg-neutral-900 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
            >
              Live Telemetry &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Project Environment Pill Banner */}
      {currentProject && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border border-neutral-800/80 bg-[#08080a] text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-neutral-500 text-[11px] font-medium uppercase">Workspace:</span>
            <span className="font-semibold text-white truncate">{currentProject.name}</span>
            <span className="font-mono text-[11px] text-neutral-500 shrink-0">({currentProject.id})</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-900 text-neutral-300 border border-neutral-800 uppercase shrink-0">
              {currentProject.environment}
            </span>
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className="text-neutral-400 hover:text-white font-medium text-xs flex items-center gap-1 shrink-0 transition-colors"
          >
            Switch Project &rarr;
          </button>
        </div>
      )}

      {/* Executive KPI Bar (4 Clean Cards with rounded-2xl) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Ingress & Block Rate */}
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-4 relative shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Gateway Ingress</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{totalRequests}</span>
            <span className="text-xs text-neutral-400">requests</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">
              Error / Block: <span className="text-neutral-200 font-mono font-semibold">{blockRate}%</span>
            </span>
            <button
              onClick={() => onNavigate('traffic')}
              className="text-neutral-400 hover:text-white font-medium flex items-center gap-0.5 transition-colors"
            >
              Inspect <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 2: Active Workspaces */}
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-4 relative shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Workspaces</span>
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{projects.length}</span>
            <span className="text-xs text-neutral-400 truncate max-w-[120px]">
              {currentProject ? currentProject.name : 'Default'}
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">
              {currentProject?.environment || 'DEV'} Tier
            </span>
            <button
              onClick={() => onNavigate('projects')}
              className="text-neutral-400 hover:text-white font-medium flex items-center gap-0.5 transition-colors"
            >
              Projects <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 3: API Protection Surface */}
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-4 relative shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Protected APIs</span>
            <Box className="w-4 h-4 text-white" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{apis.length}</span>
            <span className="text-xs text-neutral-400">
              ({activeApis} active / {inactiveApis} off)
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">
              {apis.length > 0 ? 'Reverse proxy active' : 'None registered'}
            </span>
            <button
              onClick={() => onNavigate('apis')}
              className="text-neutral-400 hover:text-white font-medium flex items-center gap-0.5 transition-colors"
            >
              Inventory <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 4: Proxy Roundtrip Latency */}
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-4 relative shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Gateway Latency</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            {avgLatency !== null ? (
              <>
                <span className="text-2xl font-bold font-mono text-white">{avgLatency}</span>
                <span className="text-xs text-neutral-400">ms roundtrip</span>
              </>
            ) : (
              <span className="text-xs text-neutral-500 italic">0 requests logged</span>
            )}
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Netty filter overhead</span>
            <button
              onClick={() => onNavigate('policies')}
              className="text-neutral-400 hover:text-white font-medium flex items-center gap-0.5 transition-colors"
            >
              Policies <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Column 1: Live Ingress Stream */}
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-4 flex flex-col shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                Recent Gateway Ingress
              </h3>
            </div>
            <button
              onClick={() => onNavigate('traffic')}
              className="text-xs text-neutral-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
            >
              <span>View All ({totalRequests})</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {trafficRecords.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Activity className="w-6 h-6 text-neutral-600 mx-auto" />
              <p className="text-xs text-neutral-400">No requests have passed through the gateway yet.</p>
              <button
                onClick={onOpenConsole}
                className="text-xs text-white hover:underline font-mono"
              >
                Launch Test Console &rarr;
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-neutral-800/80 text-neutral-400 text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 font-medium">Method</th>
                    <th className="py-2.5 font-medium">Path</th>
                    <th className="py-2.5 font-medium">Status</th>
                    <th className="py-2.5 font-medium">Client IP</th>
                    <th className="py-2.5 font-medium text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                  {trafficRecords.slice(0, 6).map((r) => {
                    const isSuccess = r.statusCode < 400;
                    return (
                      <tr key={r.id} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="py-2 text-[11px] font-bold text-white">
                          {r.httpMethod}
                        </td>
                        <td className="py-2 text-[11px] text-neutral-300 max-w-[150px] truncate" title={r.path}>
                          {r.path}
                        </td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isSuccess
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : r.statusCode === 401
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {r.statusCode || 'ERR'}
                          </span>
                        </td>
                        <td className="py-2 text-neutral-400 text-[11px] truncate max-w-[100px]">
                          {r.clientIp || '127.0.0.1'}
                        </td>
                        <td className="py-2 text-right text-neutral-400 text-[11px]">
                          {r.durationMs}ms
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Column 2: Protected API Routes Inventory */}
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-4 flex flex-col shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-white" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                Protected API Endpoints
              </h3>
            </div>
            <button
              onClick={() => onNavigate('apis')}
              className="text-xs text-neutral-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
            >
              <span>Catalog ({apis.length})</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {apis.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Box className="w-6 h-6 text-neutral-600 mx-auto" />
              <p className="text-xs text-neutral-300 font-medium">No APIs registered yet.</p>
              <p className="text-xs text-neutral-500">Onboard an upstream microservice to route through the gateway.</p>
              <button
                onClick={onRegisterApi}
                className="mt-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors"
              >
                Register API
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/60 mt-1">
              {apis.slice(0, 5).map((api) => {
                const isActive = api.status === 'ACTIVE';
                return (
                  <div
                    key={api.id}
                    className="py-2.5 hover:bg-neutral-900/50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">
                          {api.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {api.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate font-mono">
                        /proxy/{api.id} &rarr; <span className="text-neutral-300">{api.upstreamBaseUrl}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => onNavigate('apis')}
                      className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors shrink-0"
                      title="Inspect API"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Perimeter Enforcement Layer Quick Matrix */}
      <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
            Active Perimeter Guardrails Matrix
          </h3>
          <button
            onClick={() => onNavigate('policies')}
            className="text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Manage Policies &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 text-xs">
          <div className="p-3.5 rounded-xl border border-neutral-800/80 bg-[#0c0c0e] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">SSRF Filter</span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">ACTIVE</span>
            </div>
            <p className="text-xs text-neutral-400">
              Blocks private RFC-1918 ranges, AWS metadata 169.254.169.254, and loopbacks.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-neutral-800/80 bg-[#0c0c0e] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Rate Limiting</span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">TOKEN-BUCKET</span>
            </div>
            <p className="text-xs text-neutral-400">
              Per-route and per-client burst thresholds enforced with 429 Too Many Requests.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-neutral-800/80 bg-[#0c0c0e] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Key Cryptography</span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">SHA-256 HMAC</span>
            </div>
            <p className="text-xs text-neutral-400">
              Keys hashed at rest. Reverse-proxy validates <code className="text-white font-mono">X-API-Key</code> on ingress.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-neutral-800/80 bg-[#0c0c0e] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Payload Bounds</span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">10 MB MAX</span>
            </div>
            <p className="text-xs text-neutral-400">
              Rejects large buffer overflows and malformed body framing attacks before proxying.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
