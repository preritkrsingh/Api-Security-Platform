import React, { useState, useEffect } from 'react';
import {
  Box,
  Globe,
  Key,
  Play,
  Copy,
  Power,
  Trash2,
  Clock,
  Shield,
  Activity,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { platformApi } from '../services/api';

export default function ApiDetailsModal({
  api,
  isOpen,
  onClose,
  onOpenKeysModal,
  onOpenConsoleModal,
  onToggleStatus,
  onDeleteApi,
  showToast
}) {
  const [trafficSummary, setTrafficSummary] = useState(null);
  const [loadingTraffic, setLoadingTraffic] = useState(false);
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState(null);

  useEffect(() => {
    if (api && isOpen) {
      loadTraffic();
      setProbeResult(null);
    }
  }, [api, isOpen]);

  const loadTraffic = async () => {
    if (!api) return;
    setLoadingTraffic(true);
    try {
      const summary = await platformApi.getTrafficSummary(api.id, 20);
      setTrafficSummary(summary);
    } catch {
      setTrafficSummary(null);
    } finally {
      setLoadingTraffic(false);
    }
  };

  const handleProbe = async () => {
    if (!api) return;
    setIsProbing(true);
    try {
      const res = await platformApi.testConnectivity(api.id);
      setProbeResult(res);
      showToast('success', res.message || 'Connectivity check completed.');
    } catch (err) {
      setProbeResult({
        connectivityStatus: 'UNREACHABLE',
        message: err.message || 'Probe failed.'
      });
      showToast('error', err.message || 'Probe failed.');
    } finally {
      setIsProbing(false);
    }
  };

  const copyText = (txt, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(txt);
    showToast('success', label);
  };

  if (!isOpen || !api) return null;

  const isActive = api.status === 'ACTIVE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-neutral-100 font-sans">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800/90 bg-[#09090b] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800/80 flex items-center justify-between bg-[#0c0c0e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">{api.name}</h3>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">{api.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Status & Routing Strip */}
          <div className="rounded-xl border border-neutral-800 bg-[#0c0c0e] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-xs">Protection Status:</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {api.status}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-xs">Gateway Proxy Route:</span>
              <div className="flex items-center gap-2">
                <span className="text-neutral-200 font-mono text-xs">
                  http://localhost:8080{api.gatewayPath || `/proxy/${api.id}`}
                </span>
                <button
                  onClick={() =>
                    copyText(`http://localhost:8080${api.gatewayPath || `/proxy/${api.id}`}`)
                  }
                  className="text-neutral-400 hover:text-white transition-colors"
                  title="Copy Gateway Route"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-400 text-xs">Upstream Target:</span>
              <span className="text-neutral-200 font-mono text-xs truncate max-w-[280px]">
                {api.upstreamBaseUrl}
              </span>
            </div>
          </div>

          {/* Configured Policies */}
          <div className="rounded-xl border border-neutral-800 bg-[#0c0c0e] p-4 space-y-3">
            <h4 className="text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">
              Enforced Gateway Policies
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-neutral-500 block text-[11px]">Allowed Path Prefix</span>
                <span className="text-neutral-200 font-mono">{api.allowedPathPrefix || '/api'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-neutral-500 block text-[11px]">Token-Bucket Rate Limit</span>
                <span className="text-neutral-200 font-mono">{api.rateLimitRps || 100} req/sec</span>
              </div>
              <div className="space-y-1">
                <span className="text-neutral-500 block text-[11px]">Allowed HTTP Verbs</span>
                <span className="text-neutral-200 font-mono">
                  {api.allowedMethods ? api.allowedMethods.join(', ') : 'GET, POST'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-neutral-500 block text-[11px]">Connection Timeout</span>
                <span className="text-neutral-200 font-mono">{api.connectTimeoutMs || 3000} ms</span>
              </div>
            </div>
          </div>

          {/* Upstream Connectivity Probe Action */}
          <div className="rounded-xl border border-neutral-800 bg-[#0c0c0e] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">
                  Upstream Connectivity Health Probe
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Dispatches an HTTP ping with SSRF boundary inspection.
                </p>
              </div>
              <button
                onClick={handleProbe}
                disabled={isProbing}
                className="px-3.5 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Globe className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
                <span>{isProbing ? 'PROBING...' : 'PROBE UPSTREAM'}</span>
              </button>
            </div>

            {probeResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                  probeResult.connectivityStatus === 'CONNECTED'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                }`}
              >
                {probeResult.connectivityStatus === 'CONNECTED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{probeResult.connectivityStatus}</p>
                  <p className="text-[11px] mt-0.5 text-neutral-300">{probeResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Recent API Traffic Telemetry */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold uppercase text-neutral-400 tracking-wider">
                Telemetry Log for this Route
              </h4>
              {trafficSummary && (
                <span className="text-xs text-neutral-400 font-mono">
                  Total: {trafficSummary.totalRequests} &bull; 2xx: {trafficSummary.successCount} &bull; Errors: {trafficSummary.errorCount}
                </span>
              )}
            </div>

            {loadingTraffic ? (
              <div className="py-6 text-center text-neutral-500">Loading telemetry records...</div>
            ) : !trafficSummary || !trafficSummary.recentRecords || trafficSummary.recentRecords.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-neutral-800 rounded-xl text-neutral-500 text-xs">
                No telemetry recorded for this API route yet.
              </div>
            ) : (
              <div className="rounded-xl border border-neutral-800 bg-[#0c0c0e] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-800 text-neutral-400 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5 font-medium">Method</th>
                      <th className="py-2.5 px-3.5 font-medium">Path</th>
                      <th className="py-2.5 px-3.5 font-medium">Status</th>
                      <th className="py-2.5 px-3.5 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80 text-neutral-300 font-mono text-xs">
                    {trafficSummary.recentRecords.slice(0, 5).map((r) => (
                      <tr key={r.id} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="py-2 px-3.5 font-bold text-white">{r.httpMethod}</td>
                        <td className="py-2 px-3.5 max-w-[180px] truncate">{r.path}</td>
                        <td className="py-2 px-3.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              r.statusCode < 400 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {r.statusCode}
                          </span>
                        </td>
                        <td className="py-2 px-3.5 text-neutral-400">{r.durationMs}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 border-t border-neutral-800/80 bg-[#0c0c0e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleStatus(api)}
              className={`px-3 py-1.5 rounded-xl border border-neutral-800 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-amber-400 hover:bg-amber-500/10'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => {
                onClose();
                onDeleteApi(api.id, api.name);
              }}
              className="px-3 py-1.5 rounded-xl border border-neutral-800 hover:border-rose-500/40 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 text-xs font-medium transition-colors"
            >
              Delete
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenKeysModal(api);
              }}
              className="px-3.5 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Keys</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenConsoleModal(api);
              }}
              className="px-4 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Console</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
