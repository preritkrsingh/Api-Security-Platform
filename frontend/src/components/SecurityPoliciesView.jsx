import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Sliders,
  Filter,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Layers,
  ArrowRight,
  Shield,
  Zap,
  Server
} from 'lucide-react';

export default function SecurityPoliciesView({ onNavigate }) {
  const [filterCategory, setFilterCategory] = useState('ALL');

  const policies = [
    {
      id: 'ssrf',
      name: 'SSRF Perimeter Guardrails',
      category: 'NETWORK',
      status: 'ENFORCED',
      description:
        'Validates all upstream URLs prior to proxy onboarding. Blocks cloud instance metadata (169.254.169.254), link-local addresses, and private RFC-1918 subnets unless local dev bypass is explicitly allowed.',
      enforcement: 'Control Plane Registration & Probe Filter',
      layer: 'Control Plane :8082',
      action: '400 Bad Request / Blocked'
    },
    {
      id: 'credentials',
      name: 'SHA-256 HMAC Key Cryptography',
      category: 'IDENTITY',
      status: 'ENFORCED',
      description:
        'Generates cryptographically random keys prefixed with asp_live_. Plaintext keys are presented once upon creation; only irreversible SHA-256 hashes are persisted in PostgreSQL.',
      enforcement: 'Control Plane Key Service & DynamicProxyFilter',
      layer: 'Dual Layer (CP + Gateway)',
      action: '401 Unauthorized'
    },
    {
      id: 'sanitization',
      name: 'Zero-Trust Header Stripping',
      category: 'IDENTITY',
      status: 'ENFORCED',
      description:
        'Client-supplied authentication tokens (X-API-Key) are verified at the gateway perimeter and cleanly stripped from request headers before traffic is forwarded upstream.',
      enforcement: 'Spring Cloud Gateway DynamicProxyFilter',
      layer: 'Gateway :8080',
      action: 'Credential Sanitized'
    },
    {
      id: 'ratelimit',
      name: 'Token-Bucket Ingress Limiting',
      category: 'RATE_LIMIT',
      status: 'ENFORCED',
      description:
        'Configurable allowed requests per second (RPS) per API route. The gateway enforces an in-memory token bucket that refills continuously to protect backends from denial of service.',
      enforcement: 'Gateway RateLimiterService',
      layer: 'Gateway :8080',
      action: '429 Too Many Requests'
    },
    {
      id: 'rbac',
      name: 'HTTP Verb & Path Whitelisting',
      category: 'NETWORK',
      status: 'ENFORCED',
      description:
        'Restricts client requests to an explicit whitelist of allowed HTTP verbs (GET, POST, PUT, DELETE) and allowed URI path prefixes (/api). Prevents exploratory route fuzzing.',
      enforcement: 'Gateway DynamicProxyFilter Policy Check',
      layer: 'Gateway :8080',
      action: '405 Method Not Allowed / 403 Forbidden'
    },
    {
      id: 'payload',
      name: 'Request Body Boundary Verification',
      category: 'RESOURCE',
      status: 'ENFORCED',
      description:
        'Enforces an upper ceiling on incoming payload sizes (default: 10MB) to prevent heap exhaustion and slowloris-style buffer attacks on backend microservices.',
      enforcement: 'Gateway Content-Length Inspection',
      layer: 'Gateway :8080',
      action: '413 Payload Too Large'
    },
    {
      id: 'fault',
      name: 'Downstream Fault Isolation & Error Sanitization',
      category: 'RESOURCE',
      status: 'ENFORCED',
      description:
        'When an upstream service times out or becomes unreachable, the gateway intercepts the socket fault and returns standardized JSON without leaking internal stack traces or IP addresses.',
      enforcement: 'Gateway Error WebExceptionHandler',
      layer: 'Gateway :8080',
      action: '503 Service Unavailable / 504 Timeout'
    }
  ];

  const filtered = policies.filter((p) => {
    if (filterCategory === 'ALL') return true;
    return p.category === filterCategory;
  });

  return (
    <div className="space-y-4 animate-fade-in text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Perimeter Security Policies
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-900 text-neutral-300 border border-neutral-800">
              {policies.length} Active Rules
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Deterministic security guardrails enforced at the Spring Cloud Gateway perimeter and Control Plane API.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 bg-[#08080a] border border-neutral-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterCategory === 'ALL'
                ? 'bg-neutral-800 text-white font-medium shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All ({policies.length})
          </button>
          <button
            onClick={() => setFilterCategory('NETWORK')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterCategory === 'NETWORK'
                ? 'bg-neutral-800 text-white font-medium shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Network
          </button>
          <button
            onClick={() => setFilterCategory('IDENTITY')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterCategory === 'IDENTITY'
                ? 'bg-neutral-800 text-white font-medium shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Identity & Keys
          </button>
          <button
            onClick={() => setFilterCategory('RATE_LIMIT')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filterCategory === 'RATE_LIMIT'
                ? 'bg-neutral-800 text-white font-medium shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Rate Limiting
          </button>
        </div>
      </div>

      {/* Policy Matrix Table with rounded-2xl corners */}
      <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#050507] border-b border-neutral-800/80 text-neutral-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-medium">Policy Name & Rule</th>
                <th className="py-3 px-4 font-medium">Category</th>
                <th className="py-3 px-4 font-medium">Enforcement Layer</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Outcome Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="py-3.5 px-4 max-w-[280px]">
                    <div className="font-semibold text-white text-xs font-sans">{p.name}</div>
                    <p className="text-[11px] text-neutral-400 font-sans mt-0.5 leading-relaxed">
                      {p.description}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#0c0c0e] text-neutral-300 border border-neutral-800">
                      {p.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-neutral-400 text-[11px]">
                    <div>{p.enforcement}</div>
                    <span className="text-[10px] text-neutral-500 font-semibold">{p.layer}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-white text-[11px] font-medium">
                    {p.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
