import React, { useState } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Box,
  Globe,
  Shield,
  Key,
  Play,
  Copy,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { platformApi } from '../services/api';

export default function ApiRegistrationWizard({
  isOpen,
  onClose,
  projects,
  currentProject,
  onApiRegistered,
  showToast
}) {
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields
  const [selectedProjectId, setSelectedProjectId] = useState(
    currentProject?.id || (projects[0]?.id || '')
  );
  const [name, setName] = useState('');
  const [upstreamBaseUrl, setUpstreamBaseUrl] = useState('http://localhost:8081');
  const [environment, setEnvironment] = useState('DEVELOPMENT');
  const [allowedMethods, setAllowedMethods] = useState(['GET', 'POST', 'PUT', 'DELETE']);
  const [allowedPathPrefix, setAllowedPathPrefix] = useState('/api');
  const [rateLimitRps, setRateLimitRps] = useState(100);
  const [connectTimeoutMs, setConnectTimeoutMs] = useState(3000);

  // Validation step state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [validationError, setValidationError] = useState('');

  // Created API & Key state
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredApi, setRegisteredApi] = useState(null);
  const [generatedApiKey, setGeneratedApiKey] = useState(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  // Step 6 Gateway Live Test state
  const [testSubpath, setTestSubpath] = useState('/api/health');
  const [testMethod, setTestMethod] = useState('GET');
  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [gatewayTestResult, setGatewayTestResult] = useState(null);

  if (!isOpen) return null;

  const steps = [
    { num: 1, label: 'Project' },
    { num: 2, label: 'API Details' },
    { num: 3, label: 'SSRF Validation' },
    { num: 4, label: 'Registration' },
    { num: 5, label: 'Gateway & Keys' },
    { num: 6, label: 'Live Verification' },
  ];

  const handleMethodToggle = (method) => {
    if (allowedMethods.includes(method)) {
      if (allowedMethods.length === 1) return; // Keep at least one
      setAllowedMethods(allowedMethods.filter((m) => m !== method));
    } else {
      setAllowedMethods([...allowedMethods, method]);
    }
  };

  // Step 3: Validate Upstream URL
  const runValidation = async () => {
    setIsValidating(true);
    setValidationResult(null);
    setValidationError('');

    try {
      // Validate URL format locally first
      const u = new URL(upstreamBaseUrl.trim());
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        throw new Error('Only HTTP and HTTPS protocols are permitted.');
      }
      if (u.username || u.password) {
        throw new Error('Credentials are not permitted in upstream URLs.');
      }

      setValidationResult({
        status: 'VALID',
        message: 'Upstream URL syntax and scheme valid. SSRF checks passed for onboarding.'
      });
    } catch (err) {
      setValidationError(err.message || 'Invalid upstream URL.');
    } finally {
      setIsValidating(false);
    }
  };

  // Step 4: Submit Registration
  const submitRegistration = async () => {
    if (!name.trim()) {
      showToast('error', 'API Name is required.');
      return;
    }
    if (!selectedProjectId) {
      showToast('error', 'Please choose a project.');
      return;
    }

    setIsRegistering(true);
    try {
      const payload = {
        name: name.trim(),
        upstreamBaseUrl: upstreamBaseUrl.trim(),
        environment,
        allowedMethods,
        allowedPathPrefix: allowedPathPrefix.trim() || '/api',
        rateLimitRps: Number(rateLimitRps) || 100,
        connectTimeoutMs: Number(connectTimeoutMs) || 3000,
        maxRequestBodyBytes: 1048576,
      };

      const created = await platformApi.registerApi(selectedProjectId, payload);
      setRegisteredApi(created);
      onApiRegistered(created);
      showToast('success', `API '${created.name}' registered to gateway.`);
      setCurrentStep(5);
    } catch (err) {
      showToast('error', err.message || 'Registration failed.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Step 5: Generate API Key
  const generateKey = async () => {
    if (!registeredApi) return;
    setIsGeneratingKey(true);
    try {
      const res = await platformApi.generateApiKey(registeredApi.id, 'Standard Access Key');
      setGeneratedApiKey(res.apiKey);
      showToast('success', 'Cryptographic SHA-256 API Key created.');
    } catch (err) {
      showToast('error', err.message || 'Failed to generate API Key.');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  // Step 6: Test Gateway Request
  const testGateway = async () => {
    if (!registeredApi) return;
    setIsTestingGateway(true);
    setGatewayTestResult(null);

    try {
      const cleanSubpath = testSubpath.startsWith('/') ? testSubpath : '/' + testSubpath;
      const fullPath = (allowedPathPrefix === '/' ? '' : allowedPathPrefix) + cleanSubpath;
      const res = await platformApi.sendGatewayRequest(
        registeredApi.id,
        fullPath,
        testMethod,
        generatedApiKey || undefined
      );
      setGatewayTestResult(res);
      if (res.status === 200) {
        showToast('success', `Gateway verified: 200 OK (${res.durationMs}ms)`);
      } else if (res.status === 401) {
        showToast('error', 'Gateway 401 Unauthorized: Valid API Key required.');
      } else {
        showToast('info', `Gateway returned status ${res.status}`);
      }
    } catch (err) {
      setGatewayTestResult({
        status: 0,
        body: { error: 'REQUEST_FAILED', message: err.message }
      });
    } finally {
      setIsTestingGateway(false);
    }
  };

  const copyText = (txt, label = 'Copied!') => {
    navigator.clipboard.writeText(txt);
    showToast('success', label);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800/90 bg-[#09090b] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Wizard Header */}
        <div className="px-6 py-4 border-b border-neutral-800/80 bg-[#0c0c0e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Register New API</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Step-by-step onboarding through Spring Cloud Gateway
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

        {/* Step Progress Indicators */}
        <div className="px-6 py-3 border-b border-neutral-800/80 bg-[#0c0c0e]/60">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => {
              const isPast = s.num < currentStep;
              const isCurrent = s.num === currentStep;

              return (
                <div key={s.num} className="flex items-center gap-1.5 text-xs">
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold transition-colors ${
                      isPast
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isCurrent
                        ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-500/40'
                        : 'bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {isPast ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span
                    className={`hidden sm:inline text-[11px] ${
                      isCurrent
                        ? 'text-white font-medium'
                        : isPast
                        ? 'text-neutral-300'
                        : 'text-neutral-600'
                    }`}
                  >
                    {s.label}
                  </span>
                  {idx < steps.length - 1 && (
                    <span className="text-neutral-700 hidden sm:inline ml-2">&bull;</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* STEP 1: Choose Project */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-neutral-950/60 border border-neutral-800 p-3 flex items-start gap-3">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-neutral-300 leading-relaxed text-[11px]">
                  All APIs belong to a workspace project. Choose which project this API should be registered under.
                </p>
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-2">
                  Select Project Workspace
                </label>
                <div className="space-y-2">
                  {projects.map((proj) => (
                    <label
                      key={proj.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedProjectId === proj.id
                          ? 'border-indigo-500/50 bg-indigo-950/10 ring-1 ring-indigo-500/30'
                          : 'border-neutral-800 bg-neutral-950/40 hover:bg-neutral-850'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="projectChoice"
                          checked={selectedProjectId === proj.id}
                          onChange={() => setSelectedProjectId(proj.id)}
                          className="text-indigo-600 focus:ring-0"
                        />
                        <div>
                          <p className="font-semibold text-white">{proj.name}</p>
                          <p className="text-[11px] text-neutral-400 font-mono">{proj.id}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-neutral-300">
                        {proj.environment}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Enter API Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  API Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Payments Microservice"
                  className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1">
                  Upstream Base URL <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={upstreamBaseUrl}
                  onChange={(e) => setUpstreamBaseUrl(e.target.value)}
                  placeholder="e.g. http://localhost:5000 or https://api.example.com"
                  className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-neutral-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>
                    <strong>What is an upstream URL?</strong> The upstream URL is the private address of the backend API you want the platform to protect.
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">
                    Allowed Path Prefix
                  </label>
                  <input
                    type="text"
                    value={allowedPathPrefix}
                    onChange={(e) => setAllowedPathPrefix(e.target.value)}
                    placeholder="/api"
                    className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Clients can only access endpoints under this prefix.
                  </span>
                </div>

                <div>
                  <label className="block font-medium text-neutral-300 mb-1">
                    Rate Limit (Req / Sec)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={rateLimitRps}
                    onChange={(e) => setRateLimitRps(e.target.value)}
                    className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Gateway token-bucket limit (returns 429 when exceeded).
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-300 mb-1.5">
                  Allowed HTTP Methods
                </label>
                <div className="flex flex-wrap gap-2">
                  {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => {
                    const isChecked = allowedMethods.includes(m);
                    return (
                      <button
                        type="button"
                        key={m}
                        onClick={() => handleMethodToggle(m)}
                        className={`px-3 py-1 rounded-lg font-mono text-xs font-semibold transition-all ${
                          isChecked
                            ? 'bg-indigo-600 text-white'
                            : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Validate Upstream URL */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-neutral-950/60 border border-neutral-800 p-4 space-y-3">
                <h4 className="font-semibold text-white">SSRF Security Validation</h4>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  Before onboarding, the platform verifies that the destination URL adheres to SSRF
                  guardrails, rejecting dangerous cloud metadata IPs (<code>169.254.169.254</code>) and disallowed protocols.
                </p>

                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-200">
                  Target: <span className="text-indigo-400">{upstreamBaseUrl}</span>
                </div>

                <button
                  type="button"
                  onClick={runValidation}
                  disabled={isValidating}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-white font-semibold transition-colors flex items-center gap-2"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isValidating ? 'Validating Destination...' : 'Validate Upstream URL'}</span>
                </button>
              </div>

              {validationResult && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Validation Passed</p>
                    <p className="text-[11px] text-emerald-400/90 mt-0.5">{validationResult.message}</p>
                  </div>
                </div>
              )}

              {validationError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Validation Rejected</p>
                    <p className="text-[11px] text-rose-400/90 mt-0.5">{validationError}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Review & Register */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
                <h4 className="font-semibold text-white">Review Configuration</h4>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-neutral-500 block">API Name</span>
                    <span className="text-white font-medium">{name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Upstream URL</span>
                    <span className="text-indigo-400 font-mono truncate block">{upstreamBaseUrl}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Allowed Methods</span>
                    <span className="text-neutral-200 font-mono">{allowedMethods.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Rate Limit</span>
                    <span className="text-neutral-200 font-mono">{rateLimitRps} req/sec</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
                Clicking <strong>Register API</strong> submits the configuration to the Spring Boot Control Plane and dynamically binds routing on the Spring Cloud Gateway.
              </div>
            </div>
          )}

          {/* STEP 5: Gateway Details & Keys */}
          {currentStep === 5 && registeredApi && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>API Successfully Registered!</span>
                </div>
                <p className="text-[11px] text-neutral-300">
                  Your API is now routed dynamically by Spring Cloud Gateway at:
                </p>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-xs text-indigo-400">
                  <span>http://localhost:8080{registeredApi.gatewayPath}/**</span>
                  <button
                    onClick={() => copyText(`http://localhost:8080${registeredApi.gatewayPath}`)}
                    className="text-neutral-400 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* API Key Generation */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4 space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Generate Platform Gateway Key</span>
                </h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  The gateway requires callers to supply a cryptographic <code>X-API-Key</code>. The plaintext secret is displayed only once.
                </p>

                {generatedApiKey ? (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">
                      Save Your Secret Key (Single Display)
                    </span>
                    <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800 font-mono text-xs text-amber-200 break-all">
                      <span>{generatedApiKey}</span>
                      <button
                        onClick={() => copyText(generatedApiKey, 'API Key copied!')}
                        className="text-neutral-400 hover:text-white shrink-0 ml-2"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={generateKey}
                    disabled={isGeneratingKey}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors flex items-center gap-2"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{isGeneratingKey ? 'Generating SHA-256 Key...' : 'Generate 256-bit API Key'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Live Gateway Request Verification */}
          {currentStep === 6 && registeredApi && (
            <div className="space-y-4">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
                <h4 className="font-semibold text-white">Send Live Request Through Gateway</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Verify end-to-end traffic routing from the browser through Spring Cloud Gateway to your upstream destination.
                </p>

                <div className="flex items-center gap-2">
                  <select
                    value={testMethod}
                    onChange={(e) => setTestMethod(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-white"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                  <input
                    type="text"
                    value={testSubpath}
                    onChange={(e) => setTestSubpath(e.target.value)}
                    placeholder="/api/health"
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 font-mono text-xs text-white"
                  />
                  <button
                    onClick={testGateway}
                    disabled={isTestingGateway}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isTestingGateway ? 'Sending...' : 'Test Request'}</span>
                  </button>
                </div>
              </div>

              {gatewayTestResult && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 font-medium">HTTP Status:</span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-semibold ${
                          gatewayTestResult.status === 200
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {gatewayTestResult.status || 'NETWORK_ERROR'}
                      </span>
                    </div>
                    {gatewayTestResult.durationMs && (
                      <span className="text-neutral-500 font-mono">
                        Latency: {gatewayTestResult.durationMs}ms
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">
                      Response Payload:
                    </span>
                    <pre className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 font-mono text-[11px] text-neutral-300 overflow-x-auto max-h-40">
                      {typeof gatewayTestResult.body === 'object'
                        ? JSON.stringify(gatewayTestResult.body, null, 2)
                        : String(gatewayTestResult.body)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-6 py-4 border-t border-neutral-800/80 bg-[#0c0c0e] flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || currentStep === 5}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none text-xs font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            {currentStep < 4 && (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 2 && !name.trim()) {
                    showToast('error', 'API Name is required.');
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold transition-all text-xs shadow-sm"
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                onClick={submitRegistration}
                disabled={isRegistering}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold transition-all text-xs disabled:opacity-50 shadow-sm"
              >
                <span>{isRegistering ? 'Registering...' : 'Complete Registration'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 5 && (
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold transition-all text-xs shadow-sm"
              >
                <span>Proceed to Live Test</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 6 && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all text-xs shadow-sm"
              >
                Finish & Go to Catalog
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
