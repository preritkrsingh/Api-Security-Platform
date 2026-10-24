import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Key,
  Layers,
  Plus,
  RefreshCw,
  Server,
  Zap
} from 'lucide-react';
import { platformApi } from '../services/api';

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
  const [connectTimeoutMs, setConnectTimeoutMs] = useState(3000);
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
  }, [currentProject?.id]);

  const quickPresets = [
    {
      name: 'Local Service',
      defaultName: 'My Local Service',
      url: 'http://localhost:5000',
      prefix: '/'
    },
    {
      name: 'Cloud Microservice',
      defaultName: 'Production API',
      url: 'https://api.example.com',
      prefix: '/api/v1'
    }
  ];

  const applyPreset = (preset) => {
    setUpstreamBaseUrl(preset.url);
    setAllowedPathPrefix(preset.prefix);
    if (!name.trim()) {
      setName(preset.defaultName);
    }
    showToast?.('info', `Applied ${preset.name} preset`);
  };

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
        connectTimeoutMs: Number(connectTimeoutMs) || 3000,
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
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => onNavigate('apis')}
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to APIs</span>
          </button>
          <h1 className="text-xl font-bold text-white tracking-tight">Register New API</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Connect an upstream service to the API Gateway to enforce security policies and traffic telemetry.
          </p>
        </div>
      </div>

      {/* Success View */}
      {registeredApi ? (
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-7 space-y-6 shadow-sm animate-fade-in">
          {/* Status Header */}
          <div className="flex items-start gap-3.5 pb-5 border-b border-neutral-800/80">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">API Successfully Registered</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                <span className="font-medium text-white">{registeredApi.name}</span> is now protected and routed through the security gateway.
              </p>
            </div>
          </div>

          {/* Gateway Route */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300">Gateway Proxy Endpoint</label>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0c0c0e] border border-neutral-800">
              <span className="font-mono text-xs text-emerald-400 truncate flex-1">
                http://localhost:8080/proxy/{registeredApi.id}
                {registeredApi.allowedPathPrefix === '/' ? '' : registeredApi.allowedPathPrefix}
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `http://localhost:8080/proxy/${registeredApi.id}${
                      registeredApi.allowedPathPrefix === '/' ? '' : registeredApi.allowedPathPrefix
                    }`
                  )
                }
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white border border-neutral-700 transition-colors shrink-0"
              >
                {copiedRoute ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRoute ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
          </div>

          {/* API Key Generation */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300">API Key Authentication</label>
            {generatedApiKey ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0c0c0e] border border-neutral-800">
                <Key className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-mono text-xs text-white truncate flex-1 tracking-wider">
                  {generatedApiKey}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedApiKey, true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white border border-neutral-700 transition-colors shrink-0"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-neutral-800 bg-[#0c0c0e] flex items-center justify-between gap-4">
                <div className="text-xs text-neutral-400">
                  Generate a cryptographic SHA-256 key to access this endpoint through the gateway.
                </div>
                <button
                  type="button"
                  onClick={handleGenerateKey}
                  disabled={isGeneratingKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all btn-click shrink-0 disabled:opacity-50"
                >
                  {isGeneratingKey ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Key className="w-3.5 h-3.5" />
                  )}
                  <span>Generate Key</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl border border-neutral-800 bg-[#0c0c0e] hover:bg-neutral-900 text-xs text-neutral-300 hover:text-white transition-colors"
            >
              + Register Another API
            </button>
            <button
              type="button"
              onClick={() => onNavigate('apis')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all btn-click"
            >
              <span>View API Inventory</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Minimal Registration Form */
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-6 sm:p-7 space-y-6 shadow-sm"
        >
          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Presets:</span>
            {quickPresets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="px-2.5 py-1 rounded-lg text-xs border border-neutral-800 bg-[#0c0c0e] text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Workspace */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Project Workspace <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  const proj = projects.find((p) => p.id === e.target.value);
                  if (proj) onSelectProject?.(proj);
                }}
                className="w-full rounded-xl border border-neutral-800 bg-[#0c0c0e] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-neutral-600 transition-colors"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id} className="bg-neutral-900 text-white">
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* API Name */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                API Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Inventory Service"
                className="w-full rounded-xl border border-neutral-800 bg-[#0c0c0e] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </div>

          {/* Upstream Base URL */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Upstream Destination URL <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={upstreamBaseUrl}
              onChange={(e) => setUpstreamBaseUrl(e.target.value)}
              placeholder="e.g. http://localhost:5000 or https://api.example.com"
              className="w-full rounded-xl border border-neutral-800 bg-[#0c0c0e] px-3.5 py-2.5 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Internal network container name or HTTP host where traffic will be proxied.
            </p>
          </div>

          {/* Routing & Policy Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-neutral-800/80">
            {/* Path Prefix */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Allowed Path Prefix
              </label>
              <input
                type="text"
                value={allowedPathPrefix}
                onChange={(e) => setAllowedPathPrefix(e.target.value)}
                placeholder="/"
                className="w-full rounded-xl border border-neutral-800 bg-[#0c0c0e] px-3.5 py-2.5 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>

            {/* Rate Limit RPS */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Rate Limit (Req / sec)
              </label>
              <input
                type="number"
                min="1"
                max="5000"
                value={rateLimitRps}
                onChange={(e) => setRateLimitRps(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-[#0c0c0e] px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </div>

          {/* Allowed HTTP Methods */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-medium text-neutral-300">
              Allowed HTTP Methods
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {allMethods.map((m) => {
                const isSelected = allowedMethods.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMethodToggle(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                      isSelected
                        ? 'bg-white text-black font-semibold'
                        : 'border border-neutral-800 bg-[#0c0c0e] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('apis')}
              className="px-4 py-2.5 rounded-xl border border-neutral-800 bg-[#0c0c0e] hover:bg-neutral-900 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all btn-click disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{isSubmitting ? 'Registering...' : 'Register API'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
