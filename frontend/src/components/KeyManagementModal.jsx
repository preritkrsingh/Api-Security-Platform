import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  ShieldCheck
} from 'lucide-react';
import { platformApi } from '../services/api';

export default function KeyManagementModal({
  api,
  isOpen,
  onClose,
  showToast
}) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [createdSecret, setCreatedSecret] = useState(null);

  useEffect(() => {
    if (api && isOpen) {
      loadKeys();
      setCreatedSecret(null);
      setKeyName('');
    }
  }, [api, isOpen]);

  const loadKeys = async () => {
    if (!api) return;
    setLoading(true);
    try {
      const res = await platformApi.getApiKeys(api.id);
      setKeys(res || []);
    } catch (err) {
      showToast('error', err.message || 'Failed to load keys.');
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!api) return;
    setIsGenerating(true);
    try {
      const res = await platformApi.generateApiKey(api.id, keyName.trim() || 'Standard Access Key');
      setCreatedSecret(res.apiKey);
      setKeyName('');
      showToast('success', 'SHA-256 API Key created.');
      await loadKeys();
    } catch (err) {
      showToast('error', err.message || 'Failed to generate key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (keyId, name) => {
    if (!confirm(`Are you sure you want to revoke key '${name || keyId}'? Requests using this key will immediately be rejected with 401 Unauthorized.`)) {
      return;
    }
    try {
      await platformApi.revokeApiKey(api.id, keyId);
      showToast('delete', 'API key has been permanently revoked.', 'Key Revoked');
      await loadKeys();
    } catch (err) {
      showToast('error', err.message || 'Failed to revoke key.');
    }
  };

  const copyText = (txt, label = 'API Key copied to clipboard') => {
    navigator.clipboard.writeText(txt);
    showToast('success', label);
  };

  if (!isOpen || !api) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-neutral-100 font-sans">
      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-800/90 bg-[#09090b] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800/80 flex items-center justify-between bg-[#0c0c0e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                API Key Management
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Target Route: <span className="text-neutral-200 font-medium">{api.name}</span>
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
          {/* Security Alert: Single Display */}
          {createdSecret && (
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2.5 animate-slide-down">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Save Your Plaintext Secret Key (Single Display)</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                For security reasons, only the one-way SHA-256 hash is persisted in the database.
                This plaintext key will not be shown again.
              </p>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-black border border-neutral-800 text-xs text-amber-300 font-mono break-all select-all">
                <span className="font-semibold">{createdSecret}</span>
                <button
                  onClick={() => copyText(createdSecret)}
                  className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 shrink-0 ml-2 border border-neutral-800 transition-colors"
                  title="Copy Key"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Form to Generate Key */}
          <form onSubmit={handleGenerate} className="flex gap-2">
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Key label (e.g. Production Ingress Key)"
              className="flex-1 bg-[#0c0c0e] border border-neutral-800 rounded-xl px-3.5 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 text-xs"
            />
            <button
              type="submit"
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 text-xs shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'CREATING...' : 'CREATE KEY'}</span>
            </button>
          </form>

          {/* Keys List */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Active Credentials ({keys.length})
            </h4>

            {loading ? (
              <div className="py-6 text-center text-neutral-500">Loading credentials...</div>
            ) : keys.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-neutral-800 rounded-xl text-neutral-500">
                No API keys generated yet. Create a key to access protected routes.
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/80 rounded-xl border border-neutral-800 bg-[#0c0c0e] overflow-hidden">
                {keys.map((k) => {
                  const isActive = k.status === 'ACTIVE';

                  return (
                    <div
                      key={k.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-neutral-900/50 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white truncate text-xs">
                            {k.keyName || 'API Access Key'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                              isActive
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-neutral-800 text-neutral-500'
                            }`}
                          >
                            {k.status}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 font-mono">
                          Prefix: <span className="text-neutral-200">{k.keyPrefix}...</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isActive && (
                          <button
                            onClick={() => handleRevoke(k.id, k.keyName)}
                            className="p-2 rounded-lg border border-neutral-800 hover:border-rose-500/40 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 transition-colors"
                            title="Revoke Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800/80 bg-[#0c0c0e] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
