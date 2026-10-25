import React, { useState } from 'react';
import {
  Terminal,
  Send,
  Copy,
  Clock
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export default function ConsoleModal({
  api,
  isOpen,
  onClose,
  onTrafficGenerated,
  showToast
}) {
  const [method, setMethod] = useState('GET');
  const [subpath, setSubpath] = useState('/api/health');
  const [apiKey, setApiKey] = useState('');
  const [bodyPayload, setBodyPayload] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);

  if (!api) return null;

  const handleSend = async () => {
    setIsLoading(true);
    setResponse(null);

    const prefix = api.allowedPathPrefix && api.allowedPathPrefix !== '/' ? api.allowedPathPrefix : '';
    const cleanSub = subpath.startsWith('/') ? subpath : '/' + subpath;
    const fullPath = subpath.startsWith(prefix) ? cleanSub : `${prefix}${cleanSub}`;

    try {
      const res = await platformApi.sendGatewayRequest(
        api.id,
        fullPath,
        method,
        apiKey.trim() || undefined,
        bodyPayload.trim() || undefined
      );
      setResponse(res);

      if (res.status === 200) {
        showToast('success', `HTTP 200 OK (${res.durationMs}ms)`);
      } else if (res.status === 401) {
        showToast('error', '401 Unauthorized: Valid X-API-Key required');
      } else if (res.status === 403) {
        showToast('error', '403 Forbidden: Path prefix or API status blocked');
      } else if (res.status === 405) {
        showToast('error', `405 Method Not Allowed: Method ${method} is not permitted`);
      } else if (res.status === 429) {
        showToast('error', '429 Rate Limit Exceeded: Token bucket exhausted');
      } else if (res.status >= 500) {
        showToast('error', `HTTP ${res.status}: Upstream failure or timeout`);
      }

      if (onTrafficGenerated) {
        onTrafficGenerated();
      }
    } catch (err) {
      setResponse({
        status: 0,
        durationMs: 0,
        headers: {},
        body: { error: 'CONNECTION_ERROR', message: err.message || 'Network request failed' }
      });
      showToast('error', err.message || 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (txt, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(txt);
    showToast('success', label);
  };

  const curlCommand = `curl -i -X ${method} http://localhost:8080/proxy/${api.id}${
    subpath.startsWith('/') ? subpath : '/' + subpath
  }${apiKey ? ` \\\n  -H "X-API-Key: ${apiKey}"` : ''}${
    bodyPayload ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyPayload.replace(/'/g, "'\\''")}'` : ''
  }`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-[#27272f] bg-[#09090b]">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-[#202026] bg-[#0c0c0e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#18181b] border border-[#27272f] text-emerald-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-white tracking-wide">
                Gateway Traffic Probe & Console
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 font-mono mt-0.5">
                Route: <span className="text-zinc-200">/proxy/{api.id}/**</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Request Bar */}
          <div className="flex items-center gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="bg-[#0c0c0e] border border-[#27272f] rounded-lg px-3 py-2 text-white font-mono font-semibold text-xs focus:outline-none focus:border-indigo-500 cursor-pointer h-9"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>

            <div className="flex-1 flex items-center bg-[#0c0c0e] border border-[#27272f] rounded-lg px-3 py-1 h-9">
              <span className="text-zinc-500 select-none text-xs font-mono">/proxy/{api.id}</span>
              <input
                type="text"
                value={subpath}
                onChange={(e) => setSubpath(e.target.value)}
                placeholder="/api/health"
                className="flex-1 bg-transparent border-0 text-white font-mono focus:outline-none pl-1 text-xs placeholder-zinc-600"
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={isLoading}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 h-9 px-4 shrink-0 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isLoading ? 'PROBING...' : 'DISPATCH'}</span>
            </Button>
          </div>

          {/* Key & Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-[11px] font-medium">
                API Key (<span className="font-mono text-zinc-300">X-API-Key</span> Header)
              </Label>
              <Input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="asp_live_... (omit to test 401 Unauthorized)"
                className="font-mono text-xs h-9 bg-[#0c0c0e] border-[#27272f]"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyText(curlCommand, 'cURL command copied!')}
                className="w-full h-9 border-[#27272f] bg-[#0c0c0e] hover:bg-[#18181b] text-zinc-300 flex items-center justify-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Equivalent cURL</span>
              </Button>
            </div>
          </div>

          {/* Body Payload (for non-GET) */}
          {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
            <div>
              <label className="block text-zinc-400 text-[11px] font-medium mb-1.5">
                Request JSON Payload
              </label>
              <textarea
                rows={3}
                value={bodyPayload}
                onChange={(e) => setBodyPayload(e.target.value)}
                placeholder='{"testKey": "testValue"}'
                className="w-full bg-[#0c0c0e] border border-[#27272f] rounded-lg p-3 text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          )}

          {/* Response Inspector */}
          {response && (
            <div className="rounded-xl border border-[#202026] bg-[#0c0c0e] p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#202026] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-zinc-400 text-xs">Status:</span>
                  <Badge
                    variant={
                      response.status === 200
                        ? 'success'
                        : response.status === 401
                        ? 'warning'
                        : 'destructive'
                    }
                    className="font-mono text-[11px]"
                  >
                    {response.status || 'ERROR'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{response.durationMs}ms</span>
                </div>
              </div>

              {/* Response Body */}
              <div>
                <span className="text-[11px] font-medium text-zinc-400 block mb-1.5">
                  Response Body Payload
                </span>
                <pre className="p-3.5 rounded-lg bg-black border border-[#202026] font-mono text-xs text-zinc-300 overflow-x-auto max-h-52 leading-relaxed">
                  {typeof response.body === 'object'
                    ? JSON.stringify(response.body, null, 2)
                    : String(response.body)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3.5 border-t border-[#202026] bg-[#0c0c0e]">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs border-[#27272f] hover:bg-[#18181b]"
          >
            Close Console
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
