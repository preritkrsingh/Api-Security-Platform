import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  AlertTriangle,
  X
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from '@/components/ui/alert-dialog';

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

  if (!api) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-[#27272f] bg-[#09090b]">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-[#202026] bg-[#0c0c0e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#18181b] border border-[#27272f] text-amber-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-white tracking-wide">
                API Key Management
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                Target Route: <span className="text-zinc-200 font-medium">{api.name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Security Alert: Single Display */}
          {createdSecret && (
            <Alert variant="warning" className="animate-slide-down">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold text-amber-300">
                Save Your Plaintext Secret Key (Single Display)
              </AlertTitle>
              <AlertDescription className="text-xs text-zinc-300 mt-1 leading-relaxed">
                For security reasons, only the one-way SHA-256 hash is persisted in the database.
                This plaintext key will not be shown again.
              </AlertDescription>
              <div className="flex items-center justify-between p-2.5 mt-2 rounded-lg bg-black border border-[#27272f] text-xs text-amber-300 font-mono break-all select-all">
                <span className="font-semibold">{createdSecret}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyText(createdSecret)}
                  className="h-7 px-2.5 ml-2 border border-[#27272f]"
                  title="Copy Key"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Alert>
          )}

          {/* Form to Generate Key */}
          <form onSubmit={handleGenerate} className="flex gap-2">
            <Input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Key label (e.g. Production Ingress Key)"
              className="flex-1 bg-[#0c0c0e] border-[#27272f] text-xs h-9"
            />
            <Button
              type="submit"
              disabled={isGenerating}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 h-9 px-4 shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'CREATING...' : 'CREATE KEY'}</span>
            </Button>
          </form>

          {/* Keys List */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Active Credentials ({keys.length})
            </h4>

            {loading ? (
              <div className="py-6 text-center text-zinc-500 font-mono">Loading credentials...</div>
            ) : keys.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-[#202026] rounded-xl text-zinc-500">
                No API keys generated yet. Create a key to access protected routes.
              </div>
            ) : (
              <div className="divide-y divide-[#202026] rounded-xl border border-[#202026] bg-[#0c0c0e] overflow-hidden">
                {keys.map((k) => {
                  const isActive = k.status === 'ACTIVE';

                  return (
                    <div
                      key={k.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#111114] transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white truncate text-xs">
                            {k.keyName || 'API Access Key'}
                          </span>
                          <Badge
                            variant={isActive ? 'success' : 'secondary'}
                            className="text-[10px] uppercase font-mono px-1.5 py-0"
                          >
                            {k.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-400 font-mono">
                          Prefix: <span className="text-zinc-200">{k.keyPrefix}...</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isActive && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Revoke Key"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-border bg-card">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Revoke Key "{k.keyName || k.keyPrefix}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Any client requests or automations using this cryptographic key will immediately be rejected by the API Gateway with 401 Unauthorized.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRevoke(k.id, k.keyName)}
                                >
                                  Revoke Key
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
        <DialogFooter className="px-6 py-3.5 border-t border-[#202026] bg-[#0c0c0e]">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs border-[#27272f] hover:bg-[#18181b]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
