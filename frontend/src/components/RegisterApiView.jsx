import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Key,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { platformApi } from '../services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterApiView({
  projects = [],
  currentProject,
  onSelectProject,
  onApiRegistered,
  onNavigate,
  showToast
}) {
  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState(
    currentProject?.id || (projects[0]?.id || '')
  );
  const [name, setName] = useState('');
  const [upstreamBaseUrl, setUpstreamBaseUrl] = useState('');
  const [allowedMethods, setAllowedMethods] = useState(['GET', 'POST', 'PUT', 'DELETE']);
  const [allowedPathPrefix, setAllowedPathPrefix] = useState('/');
  const [rateLimitRps, setRateLimitRps] = useState(100);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success State
  const [registeredApi, setRegisteredApi] = useState(null);
  const [generatedApiKey, setGeneratedApiKey] = useState(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedRoute, setCopiedRoute] = useState(false);

  // Sync selected project if currentProject changes
  useEffect(() => {
    if (currentProject?.id && !registeredApi) {
      setSelectedProjectId(currentProject.id);
    }
  }, [currentProject?.id, registeredApi]);

  const handleMethodToggle = (method) => {
    if (allowedMethods.includes(method)) {
      if (allowedMethods.length === 1) {
        showToast?.('error', 'At least one HTTP method must remain allowed.');
        return;
      }
      setAllowedMethods(allowedMethods.filter((m) => m !== method));
    } else {
      setAllowedMethods([...allowedMethods, method]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedProjectId) {
      setErrorMsg('Please select a project workspace.');
      showToast?.('error', 'Please select a project workspace.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('API Name is required.');
      showToast?.('error', 'API Name is required.');
      return;
    }

    if (!upstreamBaseUrl.trim()) {
      setErrorMsg('Upstream Base URL is required.');
      showToast?.('error', 'Upstream Base URL is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeProj = projects.find((p) => p.id === selectedProjectId) || currentProject;
      const payload = {
        name: name.trim(),
        upstreamBaseUrl: upstreamBaseUrl.trim(),
        environment: activeProj?.environment || 'DEVELOPMENT',
        allowedMethods,
        allowedPathPrefix: allowedPathPrefix.trim() || '/',
        rateLimitRps: Number(rateLimitRps) || 100,
        connectTimeoutMs: 3000,
        maxRequestBodyBytes: 1048576
      };

      const created = await platformApi.registerApi(selectedProjectId, payload);
      setRegisteredApi(created);
      onApiRegistered?.(created);
      showToast?.('success', `API '${created.name}' registered to gateway.`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to register API.');
      showToast?.('error', err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!registeredApi) return;
    setIsGeneratingKey(true);
    try {
      const res = await platformApi.generateApiKey(registeredApi.id, 'Standard Access Key');
      setGeneratedApiKey(res.apiKey);
      showToast?.('success', 'API Key generated successfully.');
    } catch (err) {
      showToast?.('error', err.message || 'Failed to generate API Key.');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const copyToClipboard = (text, isKey = false) => {
    navigator.clipboard.writeText(text);
    if (isKey) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedRoute(true);
      setTimeout(() => setCopiedRoute(false), 2000);
    }
    showToast?.('success', 'Copied to clipboard');
  };

  const handleReset = () => {
    setRegisteredApi(null);
    setGeneratedApiKey(null);
    setName('');
    setUpstreamBaseUrl('');
    setAllowedMethods(['GET', 'POST', 'PUT', 'DELETE']);
    setAllowedPathPrefix('/');
    setRateLimitRps(100);
    setErrorMsg('');
  };

  const allMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-page-enter font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('apis')}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 h-7 px-2 hover:bg-zinc-900 -ml-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Endpoints</span>
            </Button>
            <span className="text-zinc-600">/</span>
            <span className="text-xs font-mono text-zinc-400">Onboarding</span>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Onboard API Route</h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
            Configure upstream microservice routing through Spring Cloud Gateway with cryptographic HMAC verification and token-bucket rate limiting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-zinc-900/60 border border-zinc-900 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            GATEWAY :8080
          </span>
        </div>
      </div>

      {/* Success View */}
      {registeredApi ? (
        <Card className="border-0 bg-zinc-950 shadow-none overflow-hidden sm:rounded-xl">
          <CardContent className="p-8 sm:p-10 space-y-8">
            {/* Status Header */}
            <div className="flex items-start gap-4 pb-2">
              <div className="p-3 rounded-lg bg-emerald-950/40 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-zinc-100">API Route Successfully Protected</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <span className="font-medium text-zinc-200">{registeredApi.name}</span> is live on Spring Cloud Gateway. Traffic matching this route is intercepted and inspected in real time.
                </p>
              </div>
            </div>

            {/* Gateway Route */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">Gateway Reverse-Proxy Endpoint</label>
                <span className="text-[10px] font-mono text-emerald-400">ONLINE</span>
              </div>
              <div className="flex items-center gap-2 p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-900">
                <span className="font-mono text-xs text-sky-400 truncate flex-1 select-all">
                  http://localhost:8080/proxy/{registeredApi.id}
                  {registeredApi.allowedPathPrefix === '/' ? '' : registeredApi.allowedPathPrefix}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      `http://localhost:8080/proxy/${registeredApi.id}${
                        registeredApi.allowedPathPrefix === '/' ? '' : registeredApi.allowedPathPrefix
                      }`
                    )
                  }
                  className="h-8 text-xs border-zinc-800 bg-zinc-950 hover:bg-zinc-850 text-zinc-200 shadow-none cursor-pointer"
                >
                  {copiedRoute ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="ml-1.5">{copiedRoute ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            {/* API Key Generation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">HMAC-SHA256 Client Security Token</label>
                <span className="text-[10px] font-mono text-zinc-500">Header: X-Api-Key</span>
              </div>
              {generatedApiKey ? (
                <div className="flex items-center gap-2 p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-900">
                  <Key className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-mono text-xs text-zinc-100 truncate flex-1 select-all">
                    {generatedApiKey}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedApiKey, true)}
                    className="h-8 text-xs border-zinc-800 bg-zinc-950 hover:bg-zinc-850 text-zinc-200 shadow-none cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="ml-1.5">{copiedKey ? 'Copied' : 'Copy Key'}</span>
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-zinc-900 bg-zinc-900/30 flex items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <p className="text-xs text-zinc-300 font-medium">Issue an authentication credential</p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Sign requests with a SHA-256 HMAC token. Requests without this token will be intercepted with HTTP 401.
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateKey}
                    disabled={isGeneratingKey}
                    size="sm"
                    className="bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs h-8 px-3.5 flex items-center gap-1.5 shadow-none shrink-0 cursor-pointer"
                  >
                    {isGeneratingKey ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Key className="w-3.5 h-3.5" />
                    )}
                    <span>Generate Key</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="pt-6 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="border-zinc-850 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 shadow-none h-9 px-4 cursor-pointer"
              >
                + Onboard Another API
              </Button>
              <Button
                size="sm"
                onClick={() => onNavigate('apis')}
                className="bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium flex items-center gap-1.5 shadow-none h-9 px-5 cursor-pointer"
              >
                <span>View Inventory</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="space-y-8">
          {errorMsg && (
            <Alert variant="destructive" className="py-3.5 bg-rose-950/40 border-rose-800/60 text-rose-300">
              <AlertDescription className="text-xs leading-relaxed">{errorMsg}</AlertDescription>
            </Alert>
          )}

          <Card className="border-0 bg-zinc-950 sm:rounded-xl shadow-none">
            <CardContent className="p-7 sm:p-9 space-y-10">
              {/* Section 1: Tenant Workspace & Route Identity */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-zinc-400" />
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-200">1. Workspace & Route Identity</h2>
                    <p className="text-xs text-zinc-500">Define tenant isolation scope and assign an identifier to this route.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Project Workspace */}
                  <div className="space-y-2.5">
                    <Label className="text-sm font-medium text-zinc-200 leading-normal">
                      Target Project Workspace <span className="text-rose-400">*</span>
                    </Label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        const proj = projects.find((p) => p.id === e.target.value);
                        if (proj) onSelectProject?.(proj);
                      }}
                      className="w-full rounded-md border border-zinc-900 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors h-11"
                    >
                      {projects.map((proj) => (
                        <option key={proj.id} value={proj.id} className="bg-zinc-900 text-white">
                          {proj.name} ({proj.environment})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Route Name */}
                  <div className="space-y-2.5">
                    <Label className="text-sm font-medium text-zinc-200 leading-normal">
                      Route Identifier <span className="text-rose-400">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. ShopNex Checkout API"
                      className="bg-zinc-900/70 border-zinc-900 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 h-11 px-3.5"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Upstream Destination & Route Matching */}
              <div className="space-y-6 pt-2">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-zinc-400" />
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-200">2. Upstream Destination & Route Matching</h2>
                    <p className="text-xs text-zinc-500">Specify the internal target service address and the intercepted URI prefix.</p>
                  </div>
                </div>

                {/* Upstream Base URL */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-zinc-200 leading-normal">
                      Upstream Destination URL <span className="text-rose-400">*</span>
                    </Label>
                    <span className="text-xs font-mono text-zinc-500">Private VPC or container endpoint</span>
                  </div>
                  <Input
                    type="text"
                    value={upstreamBaseUrl}
                    onChange={(e) => setUpstreamBaseUrl(e.target.value)}
                    placeholder="e.g. http://host.docker.internal:8081 or http://localhost:5000"
                    className="font-mono text-sm h-11 px-3.5 bg-zinc-900/70 border-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600"
                  />
                  <p className="text-xs text-zinc-500 leading-relaxed pt-0.5">
                    All verified requests passing perimeter policies will be proxied to this internal endpoint.
                  </p>
                </div>

                {/* Allowed Path Prefix */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-zinc-200 leading-normal">
                      Allowed Path Prefix
                    </Label>
                    <span className="text-xs font-mono text-zinc-500">Route Subpath / Matcher</span>
                  </div>
                  <Input
                    type="text"
                    value={allowedPathPrefix}
                    onChange={(e) => setAllowedPathPrefix(e.target.value)}
                    placeholder="/"
                    className="font-mono text-sm h-11 px-3.5 bg-zinc-900/70 border-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600"
                  />
                  <p className="text-xs text-zinc-500 leading-relaxed pt-0.5">
                    Specifies which incoming URL paths are accepted and forwarded to the upstream service.
                  </p>
                </div>

                {/* Live Path Mapping Visualizer */}
                <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-900 space-y-2">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Path Forwarding Diagram</span>
                    <span className="text-zinc-500">Reverse Proxy</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 font-mono text-xs">
                    <div className="px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-900 text-sky-400 truncate">
                      /proxy/:routeId{allowedPathPrefix.startsWith('/') ? allowedPathPrefix : `/${allowedPathPrefix}`}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 hidden sm:block" />
                    <div className="px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-900 text-zinc-300 truncate">
                      {upstreamBaseUrl.trim() || 'http://upstream-host:8081'}
                      {allowedPathPrefix !== '/' ? (allowedPathPrefix.startsWith('/') ? allowedPathPrefix : `/${allowedPathPrefix}`) : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Security Policies & Traffic Controls */}
              <div className="space-y-6 pt-2">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-zinc-400" />
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-200">3. Security Policies & Traffic Controls</h2>
                    <p className="text-xs text-zinc-500">Configure method whitelisting and token-bucket throttling per client key.</p>
                  </div>
                </div>

                {/* Allowed HTTP Methods */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-zinc-200 leading-normal">
                      Allowed HTTP Methods
                    </Label>
                    <span className="text-xs text-zinc-500 font-mono">Unselected verbs return HTTP 405</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {allMethods.map((m) => {
                      const isSelected = allowedMethods.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleMethodToggle(m)}
                          className={`h-9 px-4 rounded-md text-xs font-mono transition-colors cursor-pointer flex items-center gap-2 ${
                            isSelected
                              ? 'bg-zinc-800 text-white font-medium border border-zinc-850 shadow-sm'
                              : 'border border-zinc-900 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-850'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-sky-400' : 'bg-zinc-600'}`} />
                          <span>{m}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rate Limit RPS */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-zinc-200 leading-normal">
                      Token-Bucket Limit (Req / sec)
                    </Label>
                    <span className="text-xs font-mono text-zinc-500">Redis-backed Token Bucket</span>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="5000"
                    value={rateLimitRps}
                    onChange={(e) => setRateLimitRps(e.target.value)}
                    className="font-mono text-sm h-11 px-3.5 bg-zinc-900/70 border-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600"
                  />
                  <p className="text-xs text-zinc-500 leading-relaxed pt-0.5">
                    Maximum allowable burst throughput per client API token before returning HTTP 429 Too Many Requests.
                  </p>
                </div>

                {/* Authentication Policy Notice */}
                <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-900 flex items-start gap-3">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-200">HMAC-SHA256 Token Authentication Enforced</p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Every request routed through this endpoint must present an authorized <code className="text-zinc-300 font-mono">X-Api-Key</code> token. Missing or invalid signatures are intercepted with HTTP 401.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Action Controls */}
          <div className="flex items-center justify-end gap-3.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onNavigate('apis')}
              className="text-xs border-zinc-850 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white h-10 px-5 shadow-none cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs flex items-center gap-2 shadow-none h-10 px-6 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Registering Route...' : 'Register Endpoint'}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}


