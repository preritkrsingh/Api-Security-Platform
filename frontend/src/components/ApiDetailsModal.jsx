import React, { useState, useEffect } from 'react';
import {
  Box,
  Globe,
  Key,
  Play,
  Copy,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { platformApi } from '../services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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

  if (!api) return null;

  const isActive = api.status === 'ACTIVE';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-[#27272f] bg-[#09090b]">
        {/* Modal Header */}
        <DialogHeader className="px-6 py-4 border-b border-[#202026] bg-[#0c0c0e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#18181b] border border-[#27272f] text-indigo-400">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-white tracking-wide">{api.name}</DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 font-mono mt-0.5">{api.id}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Status & Routing Strip */}
          <div className="rounded-xl border border-[#202026] bg-[#0c0c0e] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-xs">Protection Status:</span>
              <Badge
                variant={isActive ? 'success' : 'secondary'}
                className="text-[10px] font-semibold uppercase px-2 py-0.5"
              >
                {api.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-xs">Gateway Proxy Route:</span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-200 font-mono text-xs">
                  http://localhost:8080{api.gatewayPath || `/proxy/${api.id}`}
                </span>
                <button
                  onClick={() =>
                    copyText(`http://localhost:8080${api.gatewayPath || `/proxy/${api.id}`}`)
                  }
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Gateway Route"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-xs">Upstream Target:</span>
              <span className="text-zinc-200 font-mono text-xs truncate max-w-[280px]">
                {api.upstreamBaseUrl}
              </span>
            </div>
          </div>

          {/* Configured Policies */}
          <div className="rounded-xl border border-[#202026] bg-[#0c0c0e] p-4 space-y-3">
            <h4 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider">
              Enforced Gateway Policies
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-zinc-500 block text-[11px]">Allowed Path Prefix</span>
                <span className="text-zinc-200 font-mono">{api.allowedPathPrefix || '/api'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 block text-[11px]">Token-Bucket Rate Limit</span>
                <span className="text-zinc-200 font-mono">{api.rateLimitRps || 100} req/sec</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 block text-[11px]">Allowed HTTP Verbs</span>
                <span className="text-zinc-200 font-mono">
                  {api.allowedMethods ? api.allowedMethods.join(', ') : 'GET, POST'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 block text-[11px]">Connection Timeout</span>
                <span className="text-zinc-200 font-mono">{api.connectTimeoutMs || 3000} ms</span>
              </div>
            </div>
          </div>

          {/* Upstream Connectivity Probe Action */}
          <div className="rounded-xl border border-[#202026] bg-[#0c0c0e] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider">
                  Upstream Connectivity Health Probe
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Dispatches an HTTP ping with SSRF boundary inspection.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleProbe}
                disabled={isProbing}
                className="text-xs border-[#27272f] hover:bg-[#18181b] flex items-center gap-1.5"
              >
                <Globe className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
                <span>{isProbing ? 'PROBING...' : 'PROBE UPSTREAM'}</span>
              </Button>
            </div>

            {probeResult && (
              <Alert
                variant={probeResult.connectivityStatus === 'CONNECTED' ? 'success' : 'destructive'}
                className="py-3"
              >
                {probeResult.connectivityStatus === 'CONNECTED' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="font-semibold text-xs uppercase tracking-wide">
                  {probeResult.connectivityStatus}
                </AlertTitle>
                <AlertDescription className="text-[11px] mt-0.5">
                  {probeResult.message}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Recent API Traffic Telemetry */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider">
                Telemetry Log for this Route
              </h4>
              {trafficSummary && (
                <span className="text-xs text-zinc-400 font-mono">
                  Total: {trafficSummary.totalRequests} &bull; 2xx: {trafficSummary.successCount} &bull; Errors: {trafficSummary.errorCount}
                </span>
              )}
            </div>

            {loadingTraffic ? (
              <div className="py-6 text-center text-zinc-500 font-mono">Loading telemetry records...</div>
            ) : !trafficSummary || !trafficSummary.recentRecords || trafficSummary.recentRecords.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-[#202026] rounded-xl text-zinc-500 text-xs">
                No telemetry recorded for this API route yet.
              </div>
            ) : (
              <div className="rounded-xl border border-[#202026] bg-[#0c0c0e] overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#202026]">
                      <TableHead className="py-2.5 px-3.5 text-zinc-400 text-[11px]">Method</TableHead>
                      <TableHead className="py-2.5 px-3.5 text-zinc-400 text-[11px]">Path</TableHead>
                      <TableHead className="py-2.5 px-3.5 text-zinc-400 text-[11px]">Status</TableHead>
                      <TableHead className="py-2.5 px-3.5 text-zinc-400 text-[11px]">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trafficSummary.recentRecords.slice(0, 5).map((r) => (
                      <TableRow key={r.id} className="border-[#202026] hover:bg-[#111114]">
                        <TableCell className="py-2 px-3.5 font-bold text-white font-mono">{r.httpMethod}</TableCell>
                        <TableCell className="py-2 px-3.5 max-w-[180px] truncate font-mono">{r.path}</TableCell>
                        <TableCell className="py-2 px-3.5">
                          <Badge
                            variant={r.statusCode < 400 ? 'success' : 'destructive'}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {r.statusCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 px-3.5 text-zinc-400 font-mono">{r.durationMs}ms</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <DialogFooter className="px-6 py-3.5 border-t border-[#202026] bg-[#0c0c0e] flex items-center justify-between sm:justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(api)}
              className={`text-xs border-[#27272f] ${
                isActive
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              {isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onClose();
                onDeleteApi(api.id, api.name);
              }}
              className="text-xs"
            >
              Delete
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onOpenKeysModal(api);
              }}
              className="border-[#27272f] hover:bg-[#18181b] text-zinc-200 text-xs flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Keys</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                onClose();
                onOpenConsoleModal(api);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Console</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
