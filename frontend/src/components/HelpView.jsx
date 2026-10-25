import React, { useState } from 'react';
import {
  HelpCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Shield,
  Layers,
  Terminal,
  Activity,
  AlertTriangle,
  Server,
  Key,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HelpView({ showToast }) {
  const [openSection, setOpenSection] = useState('quickstart');

  const copyText = (txt, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(txt);
    showToast?.('success', label);
  };

  const toggle = (id) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="space-y-4 max-w-4xl animate-page-enter pb-12 text-zinc-100 font-sans">
      {/* Top Header */}
      <div className="pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
            Developer Documentation & Verification Suite
          </h2>
          <Badge variant="outline" className="text-[10px] uppercase font-mono border-zinc-800 bg-zinc-900 text-zinc-400 py-0 px-1.5">
            REFERENCE
          </Badge>
        </div>
        <p className="text-xs text-zinc-400 mt-0.5">
          Step-by-step guidance for onboarding services, dispatching traffic, and testing rate limiting
        </p>
      </div>

      {/* Accordion Guide Sections */}
      <div className="space-y-2.5 text-xs">
        {/* SECTION A: Architecture */}
        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none overflow-hidden">
          <button
            onClick={() => toggle('what-is')}
            className="w-full p-3.5 flex items-center justify-between text-left font-medium text-zinc-100 hover:bg-zinc-900/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-zinc-200">1. Architectural Foundation & Reverse-Proxy Protection</span>
            </div>
            {openSection === 'what-is' ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
          </button>
          {openSection === 'what-is' && (
            <CardContent className="p-4 pt-2 border-t border-zinc-800/80 text-zinc-300 space-y-2 leading-relaxed text-xs">
              <p>
                <strong>VEYRION</strong> is an autonomous API perimeter defense and reverse-proxy control plane.
              </p>
              <p>
                Rather than exposing internal microservices directly to untrusted networks, all ingress traffic is routed through <strong>Spring Cloud Gateway (:8080)</strong>. The gateway deterministically enforces:
              </p>
              <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
                <li><strong className="text-zinc-200">Cryptographic Authentication:</strong> Verifies SHA-256 HMAC access tokens (<code className="text-zinc-300 font-mono">X-API-Key</code>) and strips sensitive headers before proxying.</li>
                <li><strong className="text-zinc-200">Redis Token-Bucket Limiting:</strong> Enforces burst thresholds and per-second RPS limits per route, returning 429 Too Many Requests when drained.</li>
                <li><strong className="text-zinc-200">SSRF Guardrails:</strong> Intercepts attempts to access private subnets and metadata IPs (169.254.169.254).</li>
                <li><strong className="text-zinc-200">Live Telemetry:</strong> Records latency, IP addresses, HTTP status codes, and security events in real time.</li>
              </ul>
            </CardContent>
          )}
        </Card>

        {/* SECTION B: Core Infrastructure & Ports */}
        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none overflow-hidden">
          <button
            onClick={() => toggle('before-start')}
            className="w-full p-3.5 flex items-center justify-between text-left font-medium text-zinc-100 hover:bg-zinc-900/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sky-400">
                <Server className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-zinc-200">2. Runtime Fleet Ports & Topology</span>
            </div>
            {openSection === 'before-start' ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
          </button>
          {openSection === 'before-start' && (
            <CardContent className="p-4 pt-2 border-t border-zinc-800/80 text-zinc-300 space-y-3 leading-relaxed text-xs">
              <p className="text-zinc-400">Microservice infrastructure running in Docker containers on host:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-[11px]">
                  <span className="text-sky-400 font-semibold">API Gateway</span>: :8080
                  <p className="text-[10px] text-zinc-400 mt-0.5">Reverse-proxy & rate limiter</p>
                </div>
                <div className="p-2.5 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-[11px]">
                  <span className="text-indigo-400 font-semibold">Control Plane</span>: :8082
                  <p className="text-[10px] text-zinc-400 mt-0.5">Governance API & keys</p>
                </div>
                <div className="p-2.5 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-[11px]">
                  <span className="text-emerald-400 font-semibold">PostgreSQL</span>: :5435
                  <p className="text-[10px] text-zinc-400 mt-0.5">Relational catalog & hashes</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400">
                Verify running containers at any time with: <code className="bg-zinc-900 px-2 py-0.5 rounded text-zinc-200 border border-zinc-800 font-mono text-[11px]">docker compose ps</code>
              </p>
            </CardContent>
          )}
        </Card>

        {/* SECTION C: Sending Requests via Gateway */}
        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none overflow-hidden">
          <button
            onClick={() => toggle('use-gateway')}
            className="w-full p-3.5 flex items-center justify-between text-left font-medium text-zinc-100 hover:bg-zinc-900/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-zinc-200">3. Sending Requests via Gateway (cURL Examples)</span>
            </div>
            {openSection === 'use-gateway' ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
          </button>
          {openSection === 'use-gateway' && (
            <CardContent className="p-4 pt-2 border-t border-zinc-800/80 text-zinc-300 space-y-3 leading-relaxed text-xs">
              <p>
                Every protected route onboarded into VEYRION is dispatched through:
                <br />
                <code className="text-sky-400 font-mono text-xs">http://localhost:8080/proxy/&#123;apiId&#125;/...</code>
              </p>
              <div className="relative p-3 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-200">
                <button
                  onClick={() =>
                    copyText(
                      'curl -i http://localhost:8080/proxy/YOUR_API_ID/api/v1/health -H "X-API-Key: YOUR_API_KEY"'
                    )
                  }
                  className="absolute right-2.5 top-2.5 p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy command"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                curl -i http://localhost:8080/proxy/YOUR_API_ID/api/v1/health \<br />
                &nbsp;&nbsp;-H "X-API-Key: YOUR_API_KEY"
              </div>
              <p className="text-zinc-400">
                <strong>Expected Result:</strong> <code className="text-emerald-400 font-mono">HTTP 200 OK</code> returned with proxied response body. Telemetry updates in real time.
              </p>
            </CardContent>
          )}
        </Card>

        {/* SECTION D: Rate Limiting & Auth Test Suite */}
        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none overflow-hidden">
          <button
            onClick={() => toggle('testing-guide')}
            className="w-full p-3.5 flex items-center justify-between text-left font-medium text-zinc-100 hover:bg-zinc-900/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-zinc-200">4. Verification Commands for Rate Limiting & Auth</span>
            </div>
            {openSection === 'testing-guide' ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
          </button>
          {openSection === 'testing-guide' && (
            <CardContent className="p-4 pt-2 border-t border-zinc-800/80 text-zinc-300 space-y-3 leading-relaxed text-xs">
              <div>
                <p className="font-medium text-zinc-200">1. Verify Rate Limiting Exhaustion (Expects 429 Too Many Requests):</p>
                <div className="relative p-2.5 mt-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
                  <button
                    onClick={() =>
                      copyText(
                        'for i in {1..30}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/proxy/YOUR_API_ID/api/v1/health -H "X-API-Key: YOUR_KEY"; done'
                      )
                    }
                    className="absolute right-2.5 top-2.5 p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy command"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  for i in &#123;1..30&#125;; do curl -s -o /dev/null -w "%&#123;http_code&#125;\n" http://localhost:8080/proxy/YOUR_API_ID/api/v1/health -H "X-API-Key: YOUR_KEY"; done
                </div>
              </div>

              <div>
                <p className="font-medium text-zinc-200">2. Verify Missing Key Rejection (Expects 401 Unauthorized):</p>
                <div className="relative p-2.5 mt-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
                  <button
                    onClick={() =>
                      copyText(
                        'curl -i http://localhost:8080/proxy/YOUR_API_ID/api/v1/health'
                      )
                    }
                    className="absolute right-2.5 top-2.5 p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy command"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  curl -i http://localhost:8080/proxy/YOUR_API_ID/api/v1/health
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Production Readiness Checklist */}
      <Card className="border-zinc-800/80 bg-zinc-950 p-4 space-y-2.5 shadow-none">
        <div className="flex items-center gap-2 text-zinc-100 font-semibold text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>PRODUCTION READINESS CHECKLIST</span>
        </div>
        <div className="space-y-1.5 text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">&check;</span>
            <span>Gateway (:8080) and Control Plane (:8082) sockets verified UP in Settings.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">&check;</span>
            <span>Upstream microservice registered with valid target URL and allowed verbs.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">&check;</span>
            <span>Cryptographic SHA-256 HMAC access token generated and tested in Test Console.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">&check;</span>
            <span>Rate-limiting token bucket verified returning 429 when burst threshold is exceeded.</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
