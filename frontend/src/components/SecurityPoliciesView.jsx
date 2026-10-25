import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import { Sliders, Gauge, Shield, Server, Lock, Layers } from 'lucide-react';

export default function SecurityPoliciesView() {
  const [filterCategory, setFilterCategory] = useState('ALL');

  const policies = [
    {
      id: 'ratelimit',
      name: 'Distributed Redis Token-Bucket Limiting',
      category: 'RATE_LIMIT',
      status: 'ENFORCED',
      description:
        'Configurable allowed requests per second (RPS) per API route backed by Redis with atomic sliding counter and in-memory fail-safe fallback. Returns X-RateLimit headers and 429 when depleted.',
      enforcement: 'Gateway RateLimiterService (Redis-backed)',
      layer: 'Gateway :8080 + Redis :6379',
      action: '429 Too Many Requests',
      highlight: true,
    },
    {
      id: 'ssrf',
      name: 'SSRF Perimeter Guardrails',
      category: 'NETWORK',
      status: 'ENFORCED',
      description:
        'Validates all upstream URLs prior to proxy onboarding. Blocks cloud instance metadata (169.254.169.254), link-local addresses, and private RFC-1918 subnets unless local dev bypass is explicitly allowed.',
      enforcement: 'Control Plane Registration & Probe Filter',
      layer: 'Control Plane :8082',
      action: '400 Bad Request / Blocked',
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
      action: '401 Unauthorized',
    },
    {
      id: 'jwt-auth',
      name: 'HMAC-SHA256 JWT Authentication',
      category: 'IDENTITY',
      status: 'ENFORCED',
      description:
        'Verifies bearer tokens with constant-time HMAC-SHA256 signature comparison, expiration timestamps (exp), and subject claims before granting access to protected routes.',
      enforcement: 'Spring Cloud Gateway JwtService & JwtAuthInterceptor',
      layer: 'Dual Layer (Gateway + CP)',
      action: '401 Unauthorized',
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
      action: 'Credential Sanitized',
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
      action: '405 Method Not Allowed / 403 Forbidden',
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
      action: '413 Payload Too Large',
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
      action: '503 Service Unavailable / 504 Timeout',
    }
  ];

  const filtered = policies.filter((p) => {
    if (filterCategory === 'ALL') return true;
    return p.category === filterCategory;
  });

  return (
    <div className="space-y-4 animate-page-enter text-white font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Rate Limits & Security Policies
            </h2>
            <Badge variant="outline" className="text-[10px] border-zinc-800 bg-zinc-900 text-zinc-400 font-mono py-0 px-1.5">
              {policies.length} ACTIVE RULES
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Distributed Redis token-bucket rate limits, HMAC validation, and reverse-proxy guardrails
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-md text-xs">
          {[
            { id: 'ALL', label: 'All Rules' },
            { id: 'RATE_LIMIT', label: 'Rate Limits' },
            { id: 'IDENTITY', label: 'Auth & Keys' },
            { id: 'NETWORK', label: 'Network & SSRF' },
            { id: 'RESOURCE', label: 'Resource Limits' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`h-6 px-2.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterCategory === cat.id
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Rate Limit Spec Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] uppercase font-mono tracking-wider">Algorithm</span>
              <Gauge className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-sm font-semibold text-zinc-100">Token-Bucket (Redis)</div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Atomic sliding-window counters in Redis (:6379) per API endpoint with in-memory failover.
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] uppercase font-mono tracking-wider">Enforcement</span>
              <Server className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-sm font-semibold text-zinc-100">Spring Cloud Gateway</div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Returns HTTP 429 Too Many Requests with <code className="text-zinc-300">X-RateLimit-Remaining</code> headers.
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] uppercase font-mono tracking-wider">Default Threshold</span>
              <Sliders className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm font-semibold text-zinc-100">100 RPS / Per Route</div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Configurable per endpoint in registration form. Burst capacity equals 2x standard RPS.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Policy Matrix Table */}
      <Card className="border-zinc-800/80 bg-zinc-950 shadow-none overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-900/40">
            <TableRow className="border-b border-zinc-800/80 hover:bg-transparent">
              <TableHead className="py-2.5 px-3.5 font-medium text-zinc-400 text-xs h-9">Policy Name & Guardrail</TableHead>
              <TableHead className="py-2.5 px-3.5 font-medium text-zinc-400 text-xs h-9">Category</TableHead>
              <TableHead className="py-2.5 px-3.5 font-medium text-zinc-400 text-xs h-9">Enforcement Layer</TableHead>
              <TableHead className="py-2.5 px-3.5 font-medium text-zinc-400 text-xs h-9">Status</TableHead>
              <TableHead className="py-2.5 px-3.5 font-medium text-zinc-400 text-xs h-9">Enforcement Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow
                key={p.id}
                className="border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors"
              >
                <TableCell className="py-3 px-3.5 max-w-[280px]">
                  <div className="font-medium text-zinc-100 text-xs">{p.name}</div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed font-normal">
                    {p.description}
                  </p>
                </TableCell>
                <TableCell className="py-3 px-3.5">
                  <Badge variant="outline" className="font-mono text-[10px] border-zinc-800 bg-zinc-900 text-zinc-300 py-0 px-1.5">
                    {p.category}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 px-3.5 text-zinc-300 text-xs font-mono">
                  <div>{p.enforcement}</div>
                  <span className="text-[10px] text-zinc-500">{p.layer}</span>
                </TableCell>
                <TableCell className="py-3 px-3.5">
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] border-emerald-800/50 bg-emerald-950/40 text-emerald-400 py-0 px-1.5"
                  >
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 px-3.5 font-mono text-zinc-200 text-xs">
                  {p.action}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
