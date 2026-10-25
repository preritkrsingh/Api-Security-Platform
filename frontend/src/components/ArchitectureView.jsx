import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Workflow,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Database,
  Laptop,
  KeyRound,
  Zap,
  Activity,
  Layers,
  Clock,
  ArrowRight,
  Info,
  Check,
  ChevronRight,
  Terminal,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ArchitectureView({ serviceStatus = {}, onNavigate }) {
  // Scenario selector: "200_OK" | "401_AUTH" | "429_RATE" | "403_FORBIDDEN"
  const [scenario, setScenario] = useState("200_OK");
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1); // 0.5, 1, 2
  const [selectedNode, setSelectedNode] = useState(null);

  // Scenarios Definition
  const scenarios = {
    "200_OK": {
      title: "Standard Valid Ingress",
      badge: "200 OK",
      badgeColor: "border-emerald-800/60 bg-emerald-950/40 text-emerald-400",
      description: "Authenticated request with valid 'asp_live_...' API key forwarded to target backend.",
      steps: [
        {
          id: "client_send",
          source: "client",
          target: "gateway",
          title: "1. Client Sends Ingress Request",
          detail: "Client dispatches GET /proxy/api_ccbc4fa24254/api/products with 'X-API-Key: asp_live_0285...'",
          packetStatus: "CLIENT INGRESS",
          headers: {
            "Host": "api.security.platform:8080",
            "X-API-Key": "asp_live_028579c2... (Plaintext)",
            "User-Agent": "ShopNex-Mobile/2.4.0",
          },
          action: "Request enters perimeter via reactive Netty event loop on port 8080.",
          securityCheck: "Perimeter TLS & URI syntax inspection",
          latencyMs: 1.2,
        },
        {
          id: "gateway_rate",
          source: "gateway",
          target: "redis",
          title: "2. Distributed Velocity Check (Redis)",
          detail: "Gateway queries Redis token bucket on port 6379 to verify client request rate.",
          packetStatus: "TOKEN BUCKET CHECK",
          headers: {
            "Rate-Limit-Key": "rate:api_ccbc4fa24254:192.168.1.105",
            "Requested-Tokens": "1",
            "Capacity": "100 rps",
          },
          action: "Atomic Redis script decrements token bucket. Remaining tokens: 99.",
          securityCheck: "DDoS & volumetric burst protection passed",
          latencyMs: 0.8,
        },
        {
          id: "gateway_verify",
          source: "gateway",
          target: "gateway",
          title: "3. Cryptographic Key Verification",
          detail: "Gateway computes SHA-256 hash of incoming key and matches against active registrations.",
          packetStatus: "SHA-256 KEY VERIFIED",
          headers: {
            "Key-Prefix": "asp_live_0285...",
            "Computed-Hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "Status": "ACTIVE",
          },
          action: "Key hash matches registered API 'api_ccbc4fa24254'. Route resolved to target http://shopnex-demo-api:8081.",
          securityCheck: "Zero plaintext key exposure; constant-time hash comparison",
          latencyMs: 1.1,
        },
        {
          id: "gateway_forward",
          source: "gateway",
          target: "backend",
          title: "4. Header Sanitization & Forwarding",
          detail: "Gateway strips sensitive 'X-API-Key' header, injects 'X-Request-ID', and proxies clean request.",
          packetStatus: "FORWARDING TO TARGET",
          headers: {
            "X-Request-ID": "req_a0c86a991ad54831",
            "X-Forwarded-For": "192.168.1.105",
            "X-API-Key": "[STRIPPED BY GATEWAY]",
          },
          action: "Clean request hits ShopNex Catalog API on port 8081. Target requires zero security code or SDK.",
          securityCheck: "Zero secret leakage to downstream microservices",
          latencyMs: 18.4,
        },
        {
          id: "backend_respond",
          source: "backend",
          target: "gateway",
          title: "5. Upstream Returns Product Data",
          detail: "ShopNex catalog fetches product records and returns HTTP 200 OK JSON payload.",
          packetStatus: "200 OK RESPONSE",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": "1840 bytes",
            "Status": "200 OK",
          },
          action: "Gateway receives 200 response and appends standard rate limit headers.",
          securityCheck: "Fault isolation & payload response size validation",
          latencyMs: 3.2,
        },
        {
          id: "async_telemetry",
          source: "gateway",
          target: "control_plane",
          title: "6. Client Response & Async Telemetry",
          detail: "Gateway returns 200 OK to client and asynchronously pipes non-blocking telemetry to Control Plane.",
          packetStatus: "ASYNC TELEMETRY PIPED",
          headers: {
            "X-Request-ID": "req_a0c86a991ad54831",
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": "99",
            "Telemetry-Status": "SUCCESS (Postgres 16)",
          },
          action: "Client receives 200 OK. Control Plane saves safe metadata (status 200, duration 24ms, no body).",
          securityCheck: "Privacy-preserving telemetry logging; zero impact on client latency",
          latencyMs: 0.9,
        },
      ],
    },
    "401_AUTH": {
      title: "Missing API Key (Perimeter Defense)",
      badge: "401 UNAUTHORIZED",
      badgeColor: "border-amber-800/60 bg-amber-950/40 text-amber-400",
      description: "Unauthorized request without 'X-API-Key' is blocked immediately at the gateway perimeter.",
      steps: [
        {
          id: "client_send_unauth",
          source: "client",
          target: "gateway",
          title: "1. Client Sends Ingress Without Key",
          detail: "Client calls GET /proxy/api_ccbc4fa24254/api/products without the required 'X-API-Key' header.",
          packetStatus: "CLIENT INGRESS (UNAUTHORIZED)",
          headers: {
            "Host": "api.security.platform:8080",
            "X-API-Key": "[MISSING]",
            "User-Agent": "Unknown-Scanner/1.0",
          },
          action: "Request arrives at Spring Cloud Gateway perimeter filter.",
          securityCheck: "Perimeter authentication gate",
          latencyMs: 0.9,
        },
        {
          id: "gateway_block_401",
          source: "gateway",
          target: "client",
          title: "2. Immediate Perimeter Rejection",
          detail: "Gateway detects missing credential and short-circuits with standardized 401 Unauthorized.",
          packetStatus: "BLOCKED: 401 UNAUTHORIZED",
          headers: {
            "Status": "401 Unauthorized",
            "Content-Type": "application/json",
            "Error-Code": "MISSING_API_KEY",
          },
          action: "Gateway drops connection to upstream. ShopNex backend is completely shielded from unauthorized traffic.",
          securityCheck: "Zero backend resource consumption by unauthorized requests",
          latencyMs: 1.4,
        },
        {
          id: "telemetry_401",
          source: "gateway",
          target: "control_plane",
          title: "3. Async Security Telemetry Logged",
          detail: "Gateway asynchronously records security event: Potential Credential Stuffing / Perimeter Probe.",
          packetStatus: "SECURITY EVENT RECORDED",
          headers: {
            "Threat-Type": "CREDENTIAL_STUFFING",
            "Severity": "HIGH (0.80)",
            "Client-IP": "192.168.1.105",
          },
          action: "Control Plane logs security event to PostgreSQL. Incident counter increments in SOC dashboard.",
          securityCheck: "Real-time threat telemetry tracking without client latency",
          latencyMs: 0.8,
        },
      ],
    },
    "429_RATE": {
      title: "Velocity Overflow (Rate Throttling)",
      badge: "429 TOO MANY REQUESTS",
      badgeColor: "border-purple-800/60 bg-purple-950/40 text-purple-400",
      description: "Aggressive burst traffic exhausts Redis token bucket; gateway throttles with 429 response.",
      steps: [
        {
          id: "burst_ingress",
          source: "client",
          target: "gateway",
          title: "1. High-Velocity Request Burst",
          detail: "Automated script floods gateway with 150 requests/second from client IP 185.220.101.5.",
          packetStatus: "BURST INGRESS",
          headers: {
            "X-API-Key": "asp_live_028579c2...",
            "Request-Velocity": "150 req/sec",
            "Client-IP": "185.220.101.5",
          },
          action: "Ingress hits Gateway Netty reactive worker pool.",
          securityCheck: "Ingress connection metering",
          latencyMs: 0.7,
        },
        {
          id: "redis_exhausted",
          source: "gateway",
          target: "redis",
          title: "2. Redis Token Bucket Exhaustion",
          detail: "Gateway queries Redis token bucket on port 6379. Token bucket balance is 0.",
          packetStatus: "TOKEN BUCKET EMPTY (0/100)",
          headers: {
            "Rate-Limit-Key": "rate:api_ccbc4fa24254:185.220.101.5",
            "Available-Tokens": "0",
            "Reset-TTL": "1000ms",
          },
          action: "Redis returns zero tokens. Rate limiter flags velocity violation.",
          securityCheck: "Algorithmic token-bucket rate limiting enforcement",
          latencyMs: 0.6,
        },
        {
          id: "gateway_throttle",
          source: "gateway",
          target: "client",
          title: "3. Gateway Returns HTTP 429",
          detail: "Gateway immediately returns 429 Too Many Requests with retry-after metadata.",
          packetStatus: "HTTP 429 THROTTLED",
          headers: {
            "Status": "429 Too Many Requests",
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": "1",
          },
          action: "Upstream ShopNex backend is completely insulated from volumetric flood.",
          securityCheck: "Target microservice denial-of-service shield",
          latencyMs: 1.1,
        },
        {
          id: "telemetry_429",
          source: "gateway",
          target: "control_plane",
          title: "4. Telemetry Records Rate Violation",
          detail: "Gateway records 429 event in Control Plane and triggers RATE_LIMIT_EXCEEDED security incident.",
          packetStatus: "RATE INCIDENT RECORDED",
          headers: {
            "Threat-Type": "RATE_LIMIT_EXCEEDED",
            "Severity": "HIGH (0.85)",
            "Client-IP": "185.220.101.5",
          },
          action: "Incident streams into SOC dashboard. Status Distribution donut updates Purple 429 metric.",
          securityCheck: "Threat scoring & incident attribution",
          latencyMs: 0.9,
        },
      ],
    },
    "403_FORBIDDEN": {
      title: "Inactive API / SSRF Guardrail",
      badge: "403 FORBIDDEN",
      badgeColor: "border-rose-800/60 bg-rose-950/40 text-rose-400",
      description: "Gateway blocks requests to deactivated APIs or attempts to pivot into private/loopback subnets.",
      steps: [
        {
          id: "ssrf_ingress",
          source: "client",
          target: "gateway",
          title: "1. Client Sends Ingress to Inactive API",
          detail: "Request targets deactivated API registration or forbidden path prefix.",
          packetStatus: "INGRESS TO INACTIVE TARGET",
          headers: {
            "Path": "/proxy/api_inactive_demo/internal/config",
            "X-API-Key": "asp_live_inactive...",
          },
          action: "Gateway checks in-memory route cache for API active status.",
          securityCheck: "Routing table policy lookup",
          latencyMs: 0.8,
        },
        {
          id: "gateway_block_403",
          source: "gateway",
          target: "client",
          title: "2. Gateway Rejects with HTTP 403",
          detail: "Gateway perimeter blocks request with 403 Forbidden ('API_INACTIVE' or 'PATH_FORBIDDEN').",
          packetStatus: "HTTP 403 FORBIDDEN",
          headers: {
            "Status": "403 Forbidden",
            "Error": "API_INACTIVE",
            "Message": "Target API has been deactivated by administrator",
          },
          action: "Request rejected at edge; no outbound socket opened to target.",
          securityCheck: "Edge policy enforcement",
          latencyMs: 1.2,
        },
        {
          id: "telemetry_403",
          source: "gateway",
          target: "control_plane",
          title: "3. Incident Stream Ingestion",
          detail: "Control Plane logs UNAUTHORIZED_ACCESS event to PostgreSQL table.",
          packetStatus: "SECURITY INCIDENT LOGGED",
          headers: {
            "Threat-Type": "UNAUTHORIZED_ACCESS",
            "Severity": "MEDIUM (0.60)",
          },
          action: "Telemetry record logged with status 403; dashboard increments security alerts.",
          securityCheck: "Comprehensive perimeter audit trail",
          latencyMs: 0.7,
        },
      ],
    },
  };

  const activeScenario = scenarios[scenario];
  const maxSteps = activeScenario.steps.length;
  const currentStepData = activeScenario.steps[currentStep] || activeScenario.steps[0];

  // Auto-advance animation timer
  useEffect(() => {
    let timer;
    if (isPlaying) {
      const stepDuration = Math.round(2800 / speed);
      timer = setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) % maxSteps);
      }, stepDuration);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, speed, maxSteps]);

  // Reset step when scenario changes
  const handleScenarioChange = (newScenario) => {
    setScenario(newScenario);
    setCurrentStep(0);
  };

  // Node definitions with coordinates for visual connection
  const nodes = {
    client: {
      id: "client",
      name: "API Consumer",
      subtext: "Web App / Mobile / Curl",
      port: "Port 443 / 80",
      tech: "HTTP/1.1 Client",
      color: "blue",
      icon: Laptop,
      description: "External clients dispatching REST requests with 'X-API-Key' header.",
    },
    gateway: {
      id: "gateway",
      name: "API Security Gateway",
      subtext: "Reactive Reverse Proxy",
      port: "Port 8080",
      tech: "Spring Cloud Gateway (Netty)",
      color: "emerald",
      icon: Shield,
      description: "High-throughput non-blocking perimeter gateway executing key checks, rate limiting, and header sanitization.",
    },
    redis: {
      id: "redis",
      name: "Redis Rate Limiter",
      subtext: "Token Bucket Cache",
      port: "Port 6379",
      tech: "Redis 7 Alpine",
      color: "purple",
      icon: Zap,
      description: "In-memory token bucket velocity limiter delivering sub-millisecond throttle decisions.",
    },
    backend: {
      id: "backend",
      name: "Target Backend (ShopNex)",
      subtext: "Catalog Microservice",
      port: "Port 8081",
      tech: "Spring Boot 3.4 / Postgres",
      color: "cyan",
      icon: Server,
      description: "Protected upstream business microservice requiring ZERO custom security code or SDKs.",
    },
    control_plane: {
      id: "control_plane",
      name: "Control Plane & DB",
      subtext: "Management & Telemetry",
      port: "Port 8082 & 5435",
      tech: "Spring Boot / PostgreSQL 16",
      color: "amber",
      icon: Database,
      description: "Centralized management plane storing SHA-256 key hashes, project configs, and privacy-safe traffic telemetry.",
    },
  };

  const isNodeActive = (nodeId) => {
    return currentStepData.source === nodeId || currentStepData.target === nodeId;
  };

  const isNodeSource = (nodeId) => currentStepData.source === nodeId;
  const isNodeTarget = (nodeId) => currentStepData.target === nodeId;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center">
              <Workflow className="h-4 w-4 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              System Architecture & Request Lifecycle
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-emerald-800/60 bg-emerald-950/40 text-emerald-400"
            >
              DUAL-PLANE ARCHITECTURE
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 max-w-3xl">
            Interactive visual simulation of ingress request routing, cryptographic SHA-256 verification, distributed Redis token-bucket rate limiting, and asynchronous non-blocking telemetry.
          </p>
        </div>

        {/* Live Service Health Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/60 border border-zinc-800 text-[11px] font-mono text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gateway :8080</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/60 border border-zinc-800 text-[11px] font-mono text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Control Plane :8082</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/60 border border-zinc-800 text-[11px] font-mono text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Target Backend :8081</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Scenario Select & Playback */}
      <Card className="border-zinc-800/80 bg-zinc-950 text-white shadow-none">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Scenario Selector Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-zinc-400 mr-1 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-zinc-400" /> Scenario:
            </span>
            {Object.entries(scenarios).map(([key, s]) => {
              const isActive = scenario === key;
              return (
                <button
                  key={key}
                  onClick={() => handleScenarioChange(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900 border-zinc-100 shadow-md"
                      : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/80"
                  }`}
                >
                  <span>{s.title}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                      isActive
                        ? "bg-zinc-200/90 text-zinc-900 border-zinc-300"
                        : s.badgeColor
                    }`}
                  >
                    {s.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Animation Playback Controls */}
          <div className="flex items-center gap-2 border-t md:border-t-0 border-zinc-800/80 pt-3 md:pt-0">
            {/* Play/Pause */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-8 border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800 text-zinc-200 cursor-pointer text-xs flex items-center gap-1.5"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 text-emerald-400" />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </Button>

            {/* Next Step */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep((prev) => (prev + 1) % maxSteps);
              }}
              className="h-8 border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800 text-zinc-200 cursor-pointer text-xs flex items-center gap-1.5"
            >
              <SkipForward className="h-3.5 w-3.5" />
              <span>Step</span>
            </Button>

            {/* Reset */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentStep(0);
                setIsPlaying(true);
              }}
              className="h-8 border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer text-xs"
              title="Reset Animation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-md border border-zinc-800 text-xs font-mono ml-2">
              {[0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    speed === s ? "bg-zinc-800 text-zinc-100 font-bold" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Interactive Diagram Canvas */}
      <Card className="border-zinc-800/80 bg-zinc-950 text-white shadow-none overflow-hidden relative">
        <CardHeader className="pb-2 border-b border-zinc-800/80 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                ACTIVE STEP {currentStep + 1} OF {maxSteps}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs font-medium text-zinc-200">{currentStepData.title}</span>
            </div>
            <CardDescription className="text-xs text-zinc-400 mt-0.5">
              {currentStepData.detail}
            </CardDescription>
          </div>

          <Badge className={`text-xs font-mono px-2.5 py-0.5 border ${activeScenario.badgeColor}`}>
            {currentStepData.packetStatus}
          </Badge>
        </CardHeader>

        <CardContent className="p-6">
          {/* Dual-Plane Architecture Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Plane 1: Client Ingress */}
            <div className="flex flex-col items-center justify-center p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/30 space-y-3 relative group hover:border-zinc-700 transition-colors">
              <div className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-400 border-b border-zinc-800/60 pb-2">
                <span>INGRESS SOURCE</span>
                <span className="text-blue-400 font-semibold">CLIENT APP</span>
              </div>

              <div
                onClick={() => setSelectedNode(nodes.client)}
                className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isNodeActive("client")
                    ? "bg-blue-950/80 border-2 border-blue-500 shadow-lg shadow-blue-500/20 scale-105"
                    : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <Laptop className={`h-8 w-8 ${isNodeActive("client") ? "text-blue-400" : "text-zinc-400"}`} />
                <span className="text-[10px] font-mono text-zinc-300 mt-1">Client App</span>
              </div>

              <div className="text-center">
                <p className="text-xs font-semibold text-zinc-200">Public Consumer</p>
                <p className="text-[10px] font-mono text-zinc-500">Port 443 / HTTPS</p>
              </div>

              {/* Animated Floating Packet Indicator */}
              {isNodeSource("client") && (
                <div className="absolute -top-3 px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold shadow-lg animate-bounce">
                  Sending X-API-Key ➔
                </div>
              )}
            </div>

            {/* Plane 2: Core Perimeter Security Gateway & Redis (Center Stage) */}
            <div className="flex flex-col items-center justify-center p-5 rounded-xl border border-emerald-900/50 bg-emerald-950/10 space-y-4 relative group hover:border-emerald-700/60 transition-colors">
              <div className="w-full flex items-center justify-between text-[11px] font-mono text-emerald-400 border-b border-emerald-900/40 pb-2">
                <span className="flex items-center gap-1.5 font-bold">
                  <Shield className="h-3.5 w-3.5" /> DATA PLANE
                </span>
                <span>SUB-MS INGRESS</span>
              </div>

              {/* Gateway Core Node */}
              <div
                onClick={() => setSelectedNode(nodes.gateway)}
                className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                  isNodeActive("gateway")
                    ? "bg-emerald-950/80 border-2 border-emerald-400 shadow-xl shadow-emerald-500/25 scale-105"
                    : "bg-zinc-900 border border-emerald-900/60 hover:border-emerald-700"
                }`}
              >
                <Shield className={`h-10 w-10 ${isNodeActive("gateway") ? "text-emerald-400" : "text-zinc-400"}`} />
                <span className="text-[10px] font-mono font-bold text-zinc-100 mt-1">API GATEWAY</span>
                <span className="text-[9px] font-mono text-emerald-400">:8080</span>

                {isNodeActive("gateway") && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              {/* Redis Rate Limiter Node (Attached to Gateway) */}
              <div
                onClick={() => setSelectedNode(nodes.redis)}
                className={`w-full p-2.5 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                  isNodeActive("redis")
                    ? "bg-purple-950/60 border-purple-500 shadow-md shadow-purple-500/20"
                    : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${isNodeActive("redis") ? "text-purple-400" : "text-zinc-400"}`} />
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-200">Redis 7 Token Bucket</p>
                    <p className="text-[9px] font-mono text-zinc-500">Port 6379 • Atomic Rate Limiting</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[9px] font-mono py-0 ${
                    isNodeActive("redis") ? "border-purple-600 text-purple-300" : "border-zinc-800 text-zinc-500"
                  }`}
                >
                  {scenario === "429_RATE" ? "0/100 RPS" : "99/100 RPS"}
                </Badge>
              </div>

              <div className="text-center text-[10px] font-mono text-zinc-400">
                Spring Cloud Gateway • Project Reactor (Netty)
              </div>
            </div>

            {/* Plane 3: Upstream Target Microservice & Control Plane */}
            <div className="flex flex-col justify-between gap-4">
              {/* Upstream Backend Node */}
              <div
                onClick={() => setSelectedNode(nodes.backend)}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                  isNodeActive("backend")
                    ? "bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-500/20"
                    : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                    PROTECTED TARGET
                  </span>
                  <Badge variant="outline" className="text-[9px] font-mono border-cyan-800/60 text-cyan-400">
                    ZERO SDK
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Server className={`h-5 w-5 ${isNodeActive("backend") ? "text-cyan-400" : "text-zinc-400"}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100">ShopNex E-Commerce API</h4>
                    <p className="text-[10px] font-mono text-zinc-500">Port 8081 • Products & Orders</p>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 mt-2 border-t border-zinc-800/60 pt-2">
                  Receives clean forwarded HTTP requests with stripped credentials and validated request identity.
                </p>
              </div>

              {/* Control Plane & Telemetry Node */}
              <div
                onClick={() => setSelectedNode(nodes.control_plane)}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                  isNodeActive("control_plane")
                    ? "bg-amber-950/60 border-amber-400 shadow-lg shadow-amber-500/20"
                    : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                    CONTROL PLANE
                  </span>
                  <Badge variant="outline" className="text-[9px] font-mono border-amber-800/60 text-amber-400">
                    POSTGRESQL 16
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Database className={`h-5 w-5 ${isNodeActive("control_plane") ? "text-amber-400" : "text-zinc-400"}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100">Control Plane & Storage</h4>
                    <p className="text-[10px] font-mono text-zinc-500">Port 8082 & 5435 • Telemetry</p>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 mt-2 border-t border-zinc-800/60 pt-2">
                  Asynchronously ingests safe metadata and security events without slowing down the active data plane.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Progress Stepper */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-zinc-400 font-semibold uppercase">
                Step-by-Step Pipeline Verification
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Step {currentStep + 1} of {maxSteps}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {activeScenario.steps.map((st, idx) => {
                const isPast = idx < currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStep(idx);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isCurrent
                        ? "border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500/50"
                        : isPast
                        ? "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800/60"
                        : "border-zinc-900 bg-zinc-950 text-zinc-500 hover:text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold">0{idx + 1}</span>
                      {isPast ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : isCurrent ? (
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      ) : null}
                    </div>
                    <p className="text-[11px] font-medium leading-tight truncate">{st.title.split(". ")[1] || st.title}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Packet Inspector & Security Invariants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Packet Inspector (Headers & Payload State) */}
        <Card className="lg:col-span-2 border-zinc-800/80 bg-zinc-950 text-white shadow-none">
          <CardHeader className="pb-3 border-b border-zinc-800/80 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-sm font-semibold text-zinc-100">
                Live Packet Inspector & Headers
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-zinc-800 text-zinc-400">
              Stage: {currentStepData.source.toUpperCase()} ➔ {currentStepData.target.toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="rounded-lg bg-zinc-900/80 border border-zinc-800/80 p-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2 text-zinc-400 text-[11px]">
                <span>HTTP HEADER FIELD</span>
                <span>VALUE AT INSPECTION STAGE</span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(currentStepData.headers).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">{key}:</span>
                    <span
                      className={`font-semibold ${
                        val.includes("STRIPPED")
                          ? "text-rose-400 line-through"
                          : val.includes("Plaintext")
                          ? "text-blue-400"
                          : val.includes("200 OK") || val.includes("ACTIVE")
                          ? "text-emerald-400"
                          : val.includes("401") || val.includes("429")
                          ? "text-purple-400"
                          : "text-zinc-200"
                      }`}
                    >
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-zinc-800/70 bg-zinc-900/40">
                <p className="text-[10px] font-mono text-zinc-500 uppercase">Edge Action Executed</p>
                <p className="text-xs text-zinc-200 font-medium mt-1">{currentStepData.action}</p>
              </div>
              <div className="p-3 rounded-lg border border-zinc-800/70 bg-zinc-900/40">
                <p className="text-[10px] font-mono text-zinc-500 uppercase">Security Invariant</p>
                <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{currentStepData.securityCheck}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Component Quick-Specs */}
        <Card className="border-zinc-800/80 bg-zinc-950 text-white shadow-none flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-zinc-800/80">
            <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Info className="h-4 w-4 text-zinc-400" />
              <span>Architectural Specifications</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Click any node in the diagram above to inspect details.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4">
            {selectedNode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <selectedNode.icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100">{selectedNode.name}</h4>
                    <p className="text-[10px] font-mono text-zinc-400">{selectedNode.tech}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{selectedNode.description}</p>
                <div className="pt-2 border-t border-zinc-800/70 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Listening Port:</span>
                    <span className="text-zinc-200 font-bold">{selectedNode.port}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Runtime Layer:</span>
                    <span className="text-zinc-200">{selectedNode.subtext}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100">API Gateway Perimeter</h4>
                    <p className="text-[10px] font-mono text-zinc-400">Spring Cloud Gateway / Netty</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  The API Security Gateway acts as a high-performance reverse proxy on port 8080. It terminates perimeter traffic, executes constant-time SHA-256 key hashing, queries Redis for velocity limits, strips credentials, and forwards clean requests to target backends.
                </p>
                <div className="pt-2 border-t border-zinc-800/70 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Ingress Path:</span>
                    <span className="text-emerald-400 font-bold">/proxy/&#123;apiId&#125;/**</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Forwarding Overhead:</span>
                    <span className="text-zinc-200">&lt; 3.0 ms avg</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-zinc-800/80">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate && onNavigate("traffic")}
                className="w-full h-8 text-xs font-mono border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Live Ingress Telemetry</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Architectural Principles (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Card className="border-zinc-800/80 bg-zinc-950 text-white shadow-none">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 font-mono uppercase">
              <Layers className="h-4 w-4" />
              <span>1. Dual-Plane Separation</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              The <strong>Data Plane</strong> handles client ingress in sub-milliseconds on Netty. The <strong>Control Plane</strong> handles key provisioning and analytics asynchronously on PostgreSQL without contending with client traffic.
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950 text-white shadow-none">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 font-mono uppercase">
              <Server className="h-4 w-4" />
              <span>2. Zero-SDK Integration</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Target upstream microservices (like ShopNex) require <strong>zero code modifications</strong> or proprietary SDKs. The gateway acts as an external perimeter shield, handling all authentication and throttling.
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950 text-white shadow-none">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 font-mono uppercase">
              <KeyRound className="h-4 w-4" />
              <span>3. Cryptographic Storage</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              API keys are generated using 256-bit <code>SecureRandom</code> PRNG. Secret tokens are displayed strictly once; the platform stores only one-way <strong>SHA-256 hashes</strong>, ensuring zero plaintext exposure.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
