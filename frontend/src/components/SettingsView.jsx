import React, { useState } from 'react';
import {
  Settings,
  RefreshCw,
  Server,
  Database,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  Activity,
  Key
} from 'lucide-react';
import { platformApi } from '../services/api';

export default function SettingsView({
  serviceStatus = { gateway: 'UP', controlPlane: 'UP' },
  onRunDiagnostics,
  isRunningDiagnostics,
  showToast
}) {
  return (
    <div className="space-y-4 animate-fade-in text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">
              System Diagnostics & Health
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-900 text-neutral-300 border border-neutral-800">
              Core Fleet
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time socket health probes, actuator diagnostics, and service ports across the platform.
          </p>
        </div>

        <button
          onClick={onRunDiagnostics}
          disabled={isRunningDiagnostics}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all btn-click disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiagnostics ? 'animate-spin text-black' : ''}`} />
          <span>{isRunningDiagnostics ? 'Probing Fleet...' : 'Run Diagnostics'}</span>
        </button>
      </div>

      {/* Services Grid (Clean rounded-2xl cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spring Cloud Gateway */}
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-white">
                Spring Cloud Gateway :8080
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 ${
                serviceStatus.gateway === 'UP'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  serviceStatus.gateway === 'UP' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              {serviceStatus.gateway}
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Perimeter reverse proxy listening on port 8080. Enforces token-bucket rate limiting, SHA-256 HMAC authentication, and dispatches proxy routes via <code className="text-neutral-200">/proxy/&#123;apiId&#125;/**</code>.
          </p>
          <div className="pt-3 border-t border-neutral-800/80 font-mono text-[11px] text-neutral-500 flex items-center justify-between">
            <span>Health Endpoint: <code className="text-neutral-300">/actuator/health</code></span>
            <span className="text-neutral-400">Netty Reactive</span>
          </div>
        </div>

        {/* Spring Boot Control Plane */}
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-white" />
              <h3 className="text-sm font-semibold text-white">
                Control Plane API :8082
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 ${
                serviceStatus.controlPlane === 'UP'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  serviceStatus.controlPlane === 'UP' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              {serviceStatus.controlPlane}
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Platform governance service on port 8082. Manages project isolation workspaces, API reverse-proxy catalogues, cryptographic credentials, and telemetry streams.
          </p>
          <div className="pt-3 border-t border-neutral-800/80 font-mono text-[11px] text-neutral-500 flex items-center justify-between">
            <span>Health Endpoint: <code className="text-neutral-300">/api/control/health</code></span>
            <span className="text-neutral-400">Tomcat / REST</span>
          </div>
        </div>

        {/* PostgreSQL Database */}
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                PostgreSQL 16 :5435
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              OPERATIONAL
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Persistent storage layer maintaining projects, API proxy route configurations, SHA-256 key hashes, and telemetry logs.
          </p>
          <div className="pt-3 border-t border-neutral-800/80 font-mono text-[11px] text-neutral-500 flex items-center justify-between">
            <span>Database: <code className="text-neutral-300">api_security_platform</code></span>
            <span className="text-neutral-400">PostgreSQL (or H2 Fallback)</span>
          </div>
        </div>

        {/* Upstream Microservice Fleet */}
        <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">
                Upstream Microservice Fleet
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              PROTECTED
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Internal microservice targets safely proxied behind the gateway: ecommerce-backend (:8085) and custom Java services.
          </p>
          <div className="pt-3 border-t border-neutral-800/80 font-mono text-[11px] text-neutral-500 flex items-center justify-between">
            <span>Protected Ports: <code className="text-neutral-300">:8085, :8086</code></span>
            <span className="text-neutral-400">Docker Network</span>
          </div>
        </div>
      </div>
    </div>
  );
}
