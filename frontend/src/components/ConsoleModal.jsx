import React, { useState } from 'react';
import {
  Play,
  Terminal,
  Send,
  X,
  Copy,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { platformApi } from '../services/api';

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

  if (!isOpen || !api) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-neutral-100">
      <div className="relative w-full max-w-3xl rounded-2xl border border-neutral-800/90 bg-[#09090b] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800/80 flex items-center justify-between bg-[#0c0c0e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Gateway Traffic Probe & Console
              </h3>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Route: <span className="text-neutral-200">/proxy/{api.id}/**</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Request Bar */}
          <div className="flex items-center gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="bg-[#0c0c0e] border border-neutral-800 rounded-xl px-3.5 py-2 text-white font-mono font-semibold text-xs focus:outline-none focus:border-neutral-600 cursor-pointer"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>

            <div className="flex-1 flex items-center bg-[#0c0c0e] border border-neutral-800 rounded-xl px-3.5 py-2">
              <span className="text-neutral-500 select-none text-xs font-mono">/proxy/{api.id}</span>
              <input
                type="text"
                value={subpath}
                onChange={(e) => setSubpath(e.target.value)}
                placeholder="/api/health"
                className="flex-1 bg-transparent border-0 text-white font-mono focus:outline-none pl-1 text-xs placeholder-neutral-600"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 text-xs shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isLoading ? 'PROBING...' : 'DISPATCH'}</span>
            </button>
          </div>

          {/* Key & Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 text-[11px] font-medium mb-1.5">
                API Key (<span className="font-mono text-neutral-300">X-API-Key</span> Header)
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="asp_live_... (omit to test 401 Unauthorized)"
                className="w-full bg-[#0c0c0e] border border-neutral-800 rounded-xl px-3.5 py-2 text-neutral-200 font-mono placeholder-neutral-600 focus:outline-none focus:border-neutral-600 text-xs"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => copyText(curlCommand, 'cURL command copied!')}
                className="w-full py-2 px-3.5 rounded-xl border border-neutral-800 bg-[#0c0c0e] hover:bg-neutral-850 hover:text-white text-neutral-300 flex items-center justify-center gap-2 transition-colors text-xs font-medium"
              >
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Copy Equivalent cURL</span>
              </button>
            </div>
          </div>

          {/* Body Payload (for non-GET) */}
          {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
            <div>
              <label className="block text-neutral-400 text-[11px] font-medium mb-1.5">
                Request JSON Payload
              </label>
              <textarea
                rows={3}
                value={bodyPayload}
                onChange={(e) => setBodyPayload(e.target.value)}
                placeholder='{"testKey": "testValue"}'
                className="w-full bg-[#0c0c0e] border border-neutral-800 rounded-xl p-3 text-neutral-200 font-mono placeholder-neutral-600 focus:outline-none focus:border-neutral-600 text-xs"
              />
            </div>
          )}

          {/* Response Inspector */}
          {response && (
            <div className="rounded-xl border border-neutral-800 bg-[#0c0c0e] p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-neutral-400 text-xs">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold ${
                      response.status === 200
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : response.status === 401
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {response.status || 'ERROR'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{response.durationMs}ms</span>
                </div>
              </div>

              {/* Response Body */}
              <div>
                <span className="text-[11px] font-medium text-neutral-400 block mb-1.5">
                  Response Body Payload
                </span>
                <pre className="p-3.5 rounded-xl bg-black border border-neutral-800 font-mono text-xs text-neutral-300 overflow-x-auto max-h-52 leading-relaxed">
                  {typeof response.body === 'object'
                    ? JSON.stringify(response.body, null, 2)
                    : String(response.body)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800/80 bg-[#0c0c0e] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
}
