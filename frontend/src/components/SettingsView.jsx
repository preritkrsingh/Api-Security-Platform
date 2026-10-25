import React from 'react';
import {
  RefreshCw,
  Server,
  Database,
  Shield,
  Activity,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToastDemo } from './ToastDemo';

export default function SettingsView({
  serviceStatus = { gateway: 'UP', controlPlane: 'UP' },
  onRunDiagnostics,
  isRunningDiagnostics
}) {
  return (
    <div className="space-y-4 animate-page-enter text-white font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Platform Diagnostics & Fleet Settings
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono border-zinc-800 bg-zinc-900 text-zinc-400 py-0 px-1.5">
              RUNTIME STATUS
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Socket health probes, reverse-proxy actuator status, and system topology
          </p>
        </div>

        <Button
          onClick={onRunDiagnostics}
          disabled={isRunningDiagnostics}
          size="sm"
          className="bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs h-7 px-3 flex items-center gap-1.5 shadow-none cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
          <span>{isRunningDiagnostics ? 'Probing Fleet...' : 'Run Diagnostics'}</span>
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Spring Cloud Gateway */}
        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-sky-400" />
                <CardTitle className="text-xs font-semibold text-zinc-100">
                  Spring Cloud Gateway :8080
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className={`font-mono text-[10px] py-0 px-1.5 ${
                  serviceStatus.gateway === 'UP'
                    ? 'border-emerald-800/50 bg-emerald-950/40 text-emerald-400'
                    : 'border-rose-800/50 bg-rose-950/40 text-rose-400'
                }`}
              >
                {serviceStatus.gateway}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Perimeter reverse-proxy listening on port 8080. Enforces token-bucket rate limits, HMAC SHA-256 validation, and SSRF filtering.
            </p>
            <div className="pt-2 border-t border-zinc-800/80 font-mono text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Health: <code className="text-zinc-300">/actuator/health</code></span>
              <span className="text-zinc-400">Netty Reactive</span>
            </div>
          </CardContent>
        </Card>

        {/* Spring Boot Control Plane */}
        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <CardTitle className="text-xs font-semibold text-zinc-100">
                  Control Plane API :8082
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className={`font-mono text-[10px] py-0 px-1.5 ${
                  serviceStatus.controlPlane === 'UP'
                    ? 'border-emerald-800/50 bg-emerald-950/40 text-emerald-400'
                    : 'border-rose-800/50 bg-rose-950/40 text-rose-400'
                }`}
              >
                {serviceStatus.controlPlane}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Governance plane managing tenant workspaces, route registrations, cryptographic key credentials, and telemetry persistence.
            </p>
            <div className="pt-2 border-t border-zinc-800/80 font-mono text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Health: <code className="text-zinc-300">/api/control/health</code></span>
              <span className="text-zinc-400">Tomcat REST</span>
            </div>
          </CardContent>
        </Card>

        {/* Redis Cache */}
        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <CardTitle className="text-xs font-semibold text-zinc-100">
                  Redis Rate Limiter :6379
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-[10px] border-emerald-800/50 bg-emerald-950/40 text-emerald-400 py-0 px-1.5"
              >
                UP
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Redis memory engine backing distributed token-bucket sliding counters with automatic TTL expiry and in-memory failover.
            </p>
            <div className="pt-2 border-t border-zinc-800/80 font-mono text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Protocol: <code className="text-zinc-300">RESP / Reactive</code></span>
              <span className="text-zinc-400">Port 6379</span>
            </div>
          </CardContent>
        </Card>

        {/* PostgreSQL Database */}
        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <CardTitle className="text-xs font-semibold text-zinc-100">
                  PostgreSQL 16 :5435
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-[10px] border-emerald-800/50 bg-emerald-950/40 text-emerald-400 py-0 px-1.5"
              >
                UP
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Relational storage maintaining project models, proxy catalogues, SHA-256 HMAC credential hashes, and security logs.
            </p>
            <div className="pt-2 border-t border-zinc-800/80 font-mono text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Database: <code className="text-zinc-300">api_security_platform</code></span>
              <span className="text-zinc-400">Port 5435</span>
            </div>
          </CardContent>
        </Card>

        {/* Upstream Microservice Fleet */}
        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none md:col-span-2">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <CardTitle className="text-xs font-semibold text-zinc-100">
                  Upstream Demo Service :8081
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-[10px] border-emerald-800/50 bg-emerald-950/40 text-emerald-400 py-0 px-1.5"
              >
                CONNECTED
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              ShopNex Enterprise Storefront backend routed behind the gateway perimeter via <code className="text-zinc-300">http://host.docker.internal:8081</code>.
            </p>
            <div className="pt-2 border-t border-zinc-800/80 font-mono text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Upstream: <code className="text-zinc-300">http://localhost:8081</code></span>
              <span className="text-zinc-400">ShopNex API</span>
            </div>
          </CardContent>
        </Card>

        {/* Base UI Toast Interactive Playground */}
        <Card className="border-zinc-800/80 bg-zinc-950 shadow-none md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2 border-b border-zinc-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <CardTitle className="text-xs font-semibold text-zinc-100">
                  Interactive Toast Notification Pipeline
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-zinc-800 bg-zinc-900 text-zinc-400 py-0 px-1.5">
                BASE UI STANDARD
              </Badge>
            </div>
            <p className="text-xs text-zinc-400">
              Bottom-right stacked toast deck with upward expansion on hover and action dismissal
            </p>
          </CardHeader>
          <CardContent className="pt-3">
            <ToastDemo />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
