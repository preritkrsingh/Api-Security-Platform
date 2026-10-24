import React, { useState } from 'react';
import {
  HelpCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Shield,
  Layers,
  Box,
  Terminal,
  Activity,
  AlertTriangle,
  Server
} from 'lucide-react';

export default function HelpView({ showToast }) {
  const [openSection, setOpenSection] = useState('quickstart');

  const copyText = (txt, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(txt);
    showToast('success', label);
  };

  const toggle = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="space-y-5 max-w-4xl animate-fade-in pb-12 text-neutral-100 font-sans">
      {/* Top Header */}
      <div className="pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-semibold text-white tracking-wide">
            Integration & Verification Guide
          </h2>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-900 text-neutral-300 border border-neutral-800">
            Docs
          </span>
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          Instructions for onboarding upstream microservices, validating proxy routes, and enforcing gateway guardrails.
        </p>
      </div>

      {/* Accordion Guide Sections */}
      <div className="space-y-3 text-xs">
        {/* SECTION A: Architecture */}
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] overflow-hidden shadow-sm">
          <button
            onClick={() => toggle('what-is')}
            className="w-full p-4 flex items-center justify-between text-left font-semibold text-white hover:bg-neutral-900/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-sm">A. Architectural Overview: How API Security Platform Protects APIs</span>
            </div>
            {openSection === 'what-is' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>
          {openSection === 'what-is' && (
            <div className="p-4 pt-0 border-t border-neutral-800/80 text-neutral-300 space-y-2.5 leading-relaxed">
              <p>
                <strong>API Security Platform</strong> is an enterprise API perimeter defense and reverse-proxy platform.
              </p>
              <p>
                Instead of exposing internal microservices directly to the public network, client traffic is routed through the <strong>Spring Cloud Gateway (:8080)</strong>. The gateway enforces:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-neutral-400 pl-2">
                <li><strong className="text-neutral-200">Cryptographic Authentication:</strong> Validates SHA-256 HMAC tokens (<code className="text-neutral-300 font-mono">X-API-Key</code>) and sanitizes sensitive headers before proxying.</li>
                <li><strong className="text-neutral-200">Token-Bucket Rate Limiting:</strong> Enforces burst thresholds and per-second RPS limits per route, returning 429 Too Many Requests when exceeded.</li>
                <li><strong className="text-neutral-200">SSRF Guardrails:</strong> Rejects cloud instance metadata (169.254.169.254) and forbidden private network scopes.</li>
                <li><strong className="text-neutral-200">Operational Telemetry:</strong> Records latency, IP addresses, HTTP status codes, and security incidents in real time.</li>
              </ul>
            </div>
          )}
        </div>

        {/* SECTION B: Core Microservices */}
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] overflow-hidden shadow-sm">
          <button
            onClick={() => toggle('before-start')}
            className="w-full p-4 flex items-center justify-between text-left font-semibold text-white hover:bg-neutral-900/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-sky-400">
                <Server className="w-4 h-4" />
              </div>
              <span className="text-sm">B. Platform Runtime Infrastructure & Ports</span>
            </div>
            {openSection === 'before-start' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>
          {openSection === 'before-start' && (
            <div className="p-4 pt-0 border-t border-neutral-800/80 text-neutral-300 space-y-3 leading-relaxed">
              <p className="text-neutral-300">API Security Platform microservices running in Docker or host workstation:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#0c0c0e] border border-neutral-800">
                  <span className="text-sky-400 font-semibold font-mono">API Gateway</span>: port 8080
                  <p className="text-[11px] text-neutral-400 mt-1">Reverse proxy & policy filters</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0c0c0e] border border-neutral-800">
                  <span className="text-indigo-400 font-semibold font-mono">Control Plane</span>: port 8082
                  <p className="text-[11px] text-neutral-400 mt-1">Management REST API & DB</p>
                </div>
                <div className="p-3 rounded-xl bg-[#0c0c0e] border border-neutral-800">
                  <span className="text-emerald-400 font-semibold font-mono">PostgreSQL</span>: port 5435
                  <p className="text-[11px] text-neutral-400 mt-1">Relational state & key hashes</p>
                </div>
              </div>
              <p className="text-xs text-neutral-400">
                Start or verify the stack with: <code className="bg-black px-2 py-1 rounded-md text-neutral-200 border border-neutral-800 font-mono text-xs">docker compose up -d</code>
              </p>
            </div>
          )}
        </div>

        {/* SECTION C: Sending Requests via Gateway */}
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] overflow-hidden shadow-sm">
          <button
            onClick={() => toggle('use-gateway')}
            className="w-full p-4 flex items-center justify-between text-left font-semibold text-white hover:bg-neutral-900/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-emerald-400">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="text-sm">C. Dispatching Traffic & Testing Endpoints via cURL</span>
            </div>
            {openSection === 'use-gateway' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>
          {openSection === 'use-gateway' && (
            <div className="p-4 pt-0 border-t border-neutral-800/80 text-neutral-300 space-y-3 leading-relaxed">
              <p>
                Every protected API registered in API Security Platform is proxied through:
                <br />
                <code className="text-neutral-200 font-mono text-xs">http://localhost:8080/proxy/&#123;apiId&#125;/...</code>
              </p>
              <div className="relative p-3.5 rounded-xl bg-black border border-neutral-800 font-mono text-xs text-neutral-200">
                <button
                  onClick={() =>
                    copyText(
                      'curl -i http://localhost:8080/proxy/YOUR_API_ID/api/v1/health -H "X-API-Key: YOUR_API_KEY"'
                    )
                  }
                  className="absolute right-3 top-3 p-1 text-neutral-400 hover:text-white transition-colors"
                  title="Copy cURL command"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                curl -i http://localhost:8080/proxy/YOUR_API_ID/api/v1/health \<br />
                &nbsp;&nbsp;-H "X-API-Key: YOUR_API_KEY"
              </div>
              <p>
                <strong>Expected Output:</strong> You will receive <code className="text-emerald-400">HTTP 200 OK</code> with response headers from your upstream service, and the transaction will appear in the Telemetry tab.
              </p>
            </div>
          )}
        </div>

        {/* SECTION D: Security Policy Verification */}
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] overflow-hidden shadow-sm">
          <button
            onClick={() => toggle('testing-guide')}
            className="w-full p-4 flex items-center justify-between text-left font-semibold text-white hover:bg-neutral-900/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-sm">D. Security Guardrails Verification Suite</span>
            </div>
            {openSection === 'testing-guide' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>
          {openSection === 'testing-guide' && (
            <div className="p-4 pt-0 border-t border-neutral-800/80 text-neutral-300 space-y-3.5 leading-relaxed">
              <div>
                <p className="font-medium text-white">1. Test Missing / Invalid Key (Expects 401 Unauthorized):</p>
                <pre className="p-3 mt-1.5 rounded-xl bg-black border border-neutral-800 text-xs font-mono text-neutral-300 overflow-x-auto">
curl -i http://localhost:8080/proxy/YOUR_API_ID/api/v1/health
                </pre>
              </div>

              <div>
                <p className="font-medium text-white">2. Test Disallowed HTTP Verb (Expects 405 Method Not Allowed):</p>
                <pre className="p-3 mt-1.5 rounded-xl bg-black border border-neutral-800 text-xs font-mono text-neutral-300 overflow-x-auto">
curl -i -X DELETE http://localhost:8080/proxy/YOUR_API_ID/api/v1/health -H "X-API-Key: YOUR_KEY"
                </pre>
              </div>

              <div>
                <p className="font-medium text-white">3. Test Ingress Rate Limiting (Burst 30 rapid requests):</p>
                <pre className="p-3 mt-1.5 rounded-xl bg-black border border-neutral-800 text-xs font-mono text-neutral-300 overflow-x-auto">
for i in &#123;1..30&#125;; do curl -s -o /dev/null -w "%&#123;http_code&#125;\n" http://localhost:8080/proxy/YOUR_API_ID/api/v1/health -H "X-API-Key: YOUR_KEY"; done
                </pre>
                <p className="text-xs text-neutral-400 mt-1">
                  You will observe initial 200 OK responses transitioning into <code className="text-amber-400 font-mono">429 Too Many Requests</code> as the token bucket exhausts.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Verification Checklist */}
      <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-2.5 text-white font-semibold text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>PRODUCTION READINESS CHECKLIST</span>
        </div>
        <div className="space-y-2 text-xs text-neutral-300">
          <div className="flex items-center gap-2.5">
            <span className="text-emerald-400 font-bold">&check;</span>
            <span>Gateway (:8080) and Control Plane (:8082) are verified UP in Settings.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-emerald-400 font-bold">&check;</span>
            <span>Target microservice registered with correct upstream hostname & port.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-emerald-400 font-bold">&check;</span>
            <span>Cryptographic 256-bit API Key generated and bound to project environment.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-emerald-400 font-bold">&check;</span>
            <span>Dispatched request through interactive Test Console and inspected in Telemetry.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
