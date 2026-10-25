import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  Shield,
  Zap,
  Server,
  Database,
  Laptop,
  Smartphone,
  Terminal,
  Play,
  Pause,
  RotateCcw,
  Workflow,
  ArrowRight,
  Info,
  Sliders,
  Sparkles,
  ExternalLink,
  Layers,
  Lock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// --- Node Details Metadata Store ---
const NODES_METADATA = {
  client_web: {
    id: "client_web",
    title: "Web Browser Client",
    type: "Ingress Source",
    port: "Port 443 / HTTPS",
    tech: "React 19 / Vite SPA",
    detail:
      "Dispatches e-commerce product catalog queries through the gateway perimeter using the 'X-API-Key' authentication header.",
    icon: Laptop,
    accent: "text-blue-400",
    badgeBg: "bg-blue-950/60 border-blue-800/60 text-blue-300",
  },
  client_mobile: {
    id: "client_mobile",
    title: "Mobile App Client",
    type: "Ingress Source",
    port: "Port 443 / HTTPS",
    tech: "iOS & Android Native",
    detail:
      "Customer storefront mobile checkout and live inventory requests hitting the perimeter at `/proxy/{apiId}/**`.",
    icon: Smartphone,
    accent: "text-blue-400",
    badgeBg: "bg-blue-950/60 border-blue-800/60 text-blue-300",
  },
  client_b2b: {
    id: "client_b2b",
    title: "Automated Partner API / cURL",
    type: "Ingress Source",
    port: "Port 443 / HTTPS",
    tech: "B2B REST Client / Scrapers",
    detail:
      "High-volume external API consumers and test scripts sending automated requests to verify perimeter velocity controls.",
    icon: Terminal,
    accent: "text-blue-400",
    badgeBg: "bg-blue-950/60 border-blue-800/60 text-blue-300",
  },
  gateway: {
    id: "gateway",
    title: "API Security Gateway",
    type: "Data Plane Core",
    port: "Port 8080 (Ingress)",
    tech: "Spring Cloud Gateway (Netty & Reactor)",
    detail:
      "Non-blocking reactive reverse proxy. Performs dynamic route resolution, SHA-256 HMAC key verification, Redis velocity checks, header sanitization, and async telemetry dispatch.",
    icon: Shield,
    accent: "text-emerald-400",
    badgeBg: "bg-emerald-950/60 border-emerald-800/60 text-emerald-300",
  },
  backend_shopnex: {
    id: "backend_shopnex",
    title: "ShopNex E-Commerce API",
    type: "Target Upstream Microservice",
    port: "Port 8081",
    tech: "Java 21 / Spring Boot 3.4 / PostgreSQL 16",
    detail:
      "Core product catalog and orders business logic. Requires ZERO security code or SDKs; fully protected by the perimeter gateway.",
    icon: Server,
    accent: "text-cyan-400",
    badgeBg: "bg-cyan-950/60 border-cyan-800/60 text-cyan-300",
  },
  redis_limiter: {
    id: "redis_limiter",
    title: "Redis Rate Limiter",
    type: "Distributed Cache",
    port: "Port 6379",
    tech: "Redis 7 Alpine (In-Memory Token Bucket)",
    detail:
      "Maintains high-speed sliding-window and token-bucket velocity counters, providing sub-millisecond throttle verdicts.",
    icon: Zap,
    accent: "text-purple-400",
    badgeBg: "bg-purple-950/60 border-purple-800/60 text-purple-300",
  },
  control_plane: {
    id: "control_plane",
    title: "Control Plane & PostgreSQL",
    type: "Management Plane",
    port: "Port 8082 (API) & 5435 (DB)",
    tech: "Spring Boot 3.4 / PostgreSQL 16",
    detail:
      "Centralized configuration and telemetry repository. Stores SHA-256 key hashes, project definitions, and privacy-safe traffic logs.",
    icon: Database,
    accent: "text-amber-400",
    badgeBg: "bg-amber-950/60 border-amber-800/60 text-amber-300",
  },
};

// --- Custom React Flow Nodes ---

// 1. Client Node (Ingress Sources)
function ClientNode({ data, selected }) {
  const Icon = data.icon || Laptop;
  return (
    <div
      className={`group relative rounded-xl bg-zinc-950/95 border px-4 py-3 shadow-2xl transition-all duration-200 min-w-[210px] cursor-pointer ${
        selected
          ? "border-blue-500 shadow-blue-500/20 ring-1 ring-blue-500/50"
          : "border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900/60"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Icon className="h-5 w-5 text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-zinc-100 truncate">
              {data.label}
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border bg-zinc-900 text-zinc-400 border-zinc-800 shrink-0">
              {data.protocol || "HTTPS"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 block truncate mt-0.5">
            {data.sublabel}
          </span>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-zinc-900 flex items-center justify-between text-[9px] font-mono text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Ingress Port 443</span>
        </span>
        <span className="text-zinc-400">Client Source</span>
      </div>

      {/* Outbound connection handle to Gateway */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-blue-400 !border-2 !border-zinc-950 !-right-1.5"
      />
    </div>
  );
}

// 2. Gateway Node (Central Security Perimeter Hub)
function GatewayNode({ data, selected }) {
  const isBlocked = data.scenario === "UNAUTH_401";
  const isThrottled = data.scenario === "RATE_429";

  const borderColor = isBlocked
    ? "border-amber-500 shadow-amber-500/30"
    : isThrottled
    ? "border-purple-500 shadow-purple-500/30"
    : "border-emerald-500/80 shadow-emerald-500/20";

  const glowColor = isBlocked
    ? "bg-amber-500/20"
    : isThrottled
    ? "bg-purple-500/20"
    : "bg-emerald-500/20";

  return (
    <div className="relative group">
      {/* Outer ambient glow */}
      <div
        className={`absolute -inset-2 rounded-2xl opacity-40 blur-lg transition-all duration-500 ${glowColor}`}
      />

      {/* Target handle from clients */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-zinc-950 !-left-1.5 z-10"
      />

      <div
        className={`relative rounded-xl bg-zinc-950 border px-5 py-4 shadow-2xl transition-all duration-300 min-w-[270px] cursor-pointer ${borderColor} ${
          selected ? "ring-2 ring-emerald-400/60" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center shrink-0">
              <Shield
                className={`h-5 w-5 transition-colors ${
                  isBlocked
                    ? "text-amber-400"
                    : isThrottled
                    ? "text-purple-400"
                    : "text-emerald-400"
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-tight text-zinc-100">
                  API Security Gateway
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
                  :8080
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                Spring Cloud Gateway (Netty)
              </span>
            </div>
          </div>

          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>

        {/* Security Pipeline Stages */}
        <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[9px] font-mono text-center">
          <div className="text-zinc-300 font-medium">
            <span className="block text-[8px] text-zinc-400">AUTH</span>
            SHA-256
          </div>
          <div className="text-zinc-300 font-medium border-x border-zinc-800/80">
            <span className="block text-[8px] text-zinc-400">VELOCITY</span>
            Token Bucket
          </div>
          <div className="text-zinc-300 font-medium">
            <span className="block text-[8px] text-zinc-400">SAFETY</span>
            Sanitizer
          </div>
        </div>

        {/* Status Verdict Strip */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono">
          <span className="text-zinc-400">Verdict:</span>
          {isBlocked ? (
            <span className="text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
              401 UNAUTHORIZED
            </span>
          ) : isThrottled ? (
            <span className="text-purple-400 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
              429 RATE LIMITED
            </span>
          ) : (
            <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              200 PROXIED OK
            </span>
          )}
        </div>
      </div>

      {/* Outbound connection handle to targets/infrastructure */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-zinc-950 !-right-1.5 z-10"
      />
    </div>
  );
}

// 3. Service Node (Upstream Backends & Platform Infrastructure)
function ServiceNode({ data, selected }) {
  const Icon = data.icon || Server;
  const isCyan = data.themeColor === "cyan";
  const isPurple = data.themeColor === "purple";

  const accentColor = isCyan
    ? "text-cyan-400"
    : isPurple
    ? "text-purple-400"
    : "text-amber-400";
  const portBadgeBg = isCyan
    ? "bg-cyan-950/60 border-cyan-800/60 text-cyan-300"
    : isPurple
    ? "bg-purple-950/60 border-purple-800/60 text-purple-300"
    : "bg-amber-950/60 border-amber-800/60 text-amber-300";
  const hoverBorder = isCyan
    ? "hover:border-cyan-500/60"
    : isPurple
    ? "hover:border-purple-500/60"
    : "hover:border-amber-500/60";
  const dotColor = isCyan
    ? "bg-cyan-400"
    : isPurple
    ? "bg-purple-400"
    : "bg-amber-400";

  return (
    <div className="relative group">
      {/* Target handle from Gateway */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-zinc-400 !border-2 !border-zinc-950 !-left-1.5"
      />

      <div
        className={`rounded-xl bg-zinc-950/95 border px-4 py-3 shadow-2xl transition-all duration-200 min-w-[230px] cursor-pointer ${
          selected
            ? "border-zinc-400 ring-1 ring-zinc-400/50"
            : `border-zinc-800/90 ${hoverBorder} hover:bg-zinc-900/60`
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Icon className={`h-5 w-5 ${accentColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-zinc-100 truncate">
                {data.label}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${portBadgeBg}`}
              >
                {data.port}
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 block truncate mt-0.5">
              {data.sublabel}
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-zinc-900 flex items-center justify-between text-[9px] font-mono text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
            <span>{data.role}</span>
          </span>
          <span className="text-zinc-300 font-mono">{data.tag}</span>
        </div>
      </div>
    </div>
  );
}

// Register React Flow Node Types (memoized outside component)
const NODE_TYPES = {
  clientNode: ClientNode,
  gatewayNode: GatewayNode,
  serviceNode: ServiceNode,
};

// Initial Node Positions
const INITIAL_NODES = [
  // Column 1: Ingress Clients (X = 40)
  {
    id: "client_web",
    type: "clientNode",
    position: { x: 40, y: 30 },
    data: {
      label: "Web App Client",
      sublabel: "React 19 SPA / Browser",
      protocol: "HTTPS",
      icon: Laptop,
    },
  },
  {
    id: "client_mobile",
    type: "clientNode",
    position: { x: 40, y: 185 },
    data: {
      label: "Mobile App Client",
      sublabel: "iOS & Android Storefront",
      protocol: "MOBILE",
      icon: Smartphone,
    },
  },
  {
    id: "client_b2b",
    type: "clientNode",
    position: { x: 40, y: 340 },
    data: {
      label: "Partner API / cURL",
      sublabel: "Automated B2B / Test CLI",
      protocol: "cURL",
      icon: Terminal,
    },
  },

  // Column 2: Central Security Gateway (X = 400)
  {
    id: "gateway",
    type: "gatewayNode",
    position: { x: 390, y: 155 },
    data: {
      scenario: "ALL_ACTIVE",
    },
  },

  // Column 3: Upstream Targets & Platform Infrastructure (X = 810)
  {
    id: "backend_shopnex",
    type: "serviceNode",
    position: { x: 810, y: 30 },
    data: {
      label: "ShopNex API",
      sublabel: "Java 21 / Spring Boot 3.4",
      port: ":8081",
      role: "Protected Upstream",
      tag: "Zero-SDK",
      themeColor: "cyan",
      icon: Server,
    },
  },
  {
    id: "redis_limiter",
    type: "serviceNode",
    position: { x: 810, y: 185 },
    data: {
      label: "Redis Limiter",
      sublabel: "Redis 7 In-Memory Cache",
      port: ":6379",
      role: "Velocity Counters",
      tag: "Token Bucket",
      themeColor: "purple",
      icon: Zap,
    },
  },
  {
    id: "control_plane",
    type: "serviceNode",
    position: { x: 810, y: 340 },
    data: {
      label: "Control Plane & DB",
      sublabel: "Spring Boot / Postgres 16",
      port: ":8082/:5435",
      role: "Telemetry & Key Store",
      tag: "Audit Log",
      themeColor: "amber",
      icon: Database,
    },
  },
];

export default function ArchitectureView({ onNavigate }) {
  // Scenario state: "ALL_ACTIVE" | "VALID_200" | "UNAUTH_401" | "RATE_429"
  const [scenario, setScenario] = useState("ALL_ACTIVE");
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  // Initialize React Flow nodes & edges
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Generate dynamic scenario edges
  const generateScenarioEdges = useCallback(
    (currentScenario, active) => {
      const animated = active;

      switch (currentScenario) {
        case "VALID_200":
          return [
            {
              id: "e-web-gw",
              source: "client_web",
              target: "gateway",
              type: "smoothstep",
              animated,
              label: "X-API-Key (Valid)",
              style: { stroke: "#10b981", strokeWidth: 2.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
              labelStyle: { fill: "#34d399", fontSize: 10, fontFamily: "monospace" },
              labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, stroke: "#065f46" },
            },
            {
              id: "e-gw-shopnex",
              source: "gateway",
              target: "backend_shopnex",
              type: "smoothstep",
              animated,
              label: "200 OK Proxied",
              style: { stroke: "#10b981", strokeWidth: 2.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
              labelStyle: { fill: "#34d399", fontSize: 10, fontFamily: "monospace" },
              labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, stroke: "#065f46" },
            },
            {
              id: "e-gw-redis",
              source: "gateway",
              target: "redis_limiter",
              type: "smoothstep",
              animated,
              label: "Token Approved",
              style: { stroke: "#a855f7", strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7" },
              labelStyle: { fill: "#c084fc", fontSize: 10, fontFamily: "monospace" },
              labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, stroke: "#581c87" },
            },
            {
              id: "e-gw-ctrl",
              source: "gateway",
              target: "control_plane",
              type: "smoothstep",
              animated,
              label: "Access Logged",
              style: { stroke: "#f59e0b", strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
              labelStyle: { fill: "#fbbf24", fontSize: 10, fontFamily: "monospace" },
              labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, stroke: "#78350f" },
            },
          ];

        case "UNAUTH_401":
          return [
            {
              id: "e-web-gw",
              source: "client_web",
              target: "gateway",
              type: "smoothstep",
              animated,
              label: "Missing Key (Blocked)",
              style: { stroke: "#f59e0b", strokeWidth: 2.5, strokeDasharray: "5 5" },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
              labelStyle: { fill: "#fbbf24", fontSize: 10, fontFamily: "monospace" },
              labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, stroke: "#78350f" },
            },
            // Target microservice receives ZERO traffic - blocked at perimeter!
            {
              id: "e-gw-ctrl",
              source: "gateway",
              target: "control_plane",
              type: "smoothstep",
              animated,
              label: "401 Audit Recorded",
              style: { stroke: "#f59e0b", strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
              labelStyle: { fill: "#fbbf24", fontSize: 10, fontFamily: "monospace" },
              labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, stroke: "#78350f" },
            },
          ];

        case "RATE_429":
          return [
            {
              id: "e-b2b-gw",
              source: "client_b2b",
              target: "gateway",
              type: "smoothstep",
              animated,
              label: "Burst Velocity (100 req/s)",
              style: { stroke: "#a855f7", strokeWidth: 2.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7" },
              labelStyle: { fill: "#c084fc", fontSize: 10, fontFamily: "monospace" },
              labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, stroke: "#581c87" },
            },
            {
              id: "e-gw-redis",
              source: "gateway",
              target: "redis_limiter",
              type: "smoothstep",
              animated,
              label: "Bucket Exhausted (429)",
              style: { stroke: "#a855f7", strokeWidth: 2.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7" },
              labelStyle: { fill: "#c084fc", fontSize: 10, fontFamily: "monospace" },
              labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, stroke: "#581c87" },
            },
            // Target microservice receives ZERO traffic - protected from denial of service!
            {
              id: "e-gw-ctrl",
              source: "gateway",
              target: "control_plane",
              type: "smoothstep",
              animated,
              label: "429 Rate Incident",
              style: { stroke: "#f59e0b", strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
              labelStyle: { fill: "#fbbf24", fontSize: 10, fontFamily: "monospace" },
              labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, stroke: "#78350f" },
            },
          ];

        default: // "ALL_ACTIVE"
          return [
            {
              id: "e-web-gw",
              source: "client_web",
              target: "gateway",
              type: "smoothstep",
              animated,
              label: "HTTPS :443",
              style: { stroke: "#3b82f6", strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
              labelStyle: { fill: "#93c5fd", fontSize: 10, fontFamily: "monospace" },
              labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, stroke: "#1e3a8a" },
            },
            {
              id: "e-mob-gw",
              source: "client_mobile",
              target: "gateway",
              type: "smoothstep",
              animated,
              label: "Mobile /checkout",
              style: { stroke: "#3b82f6", strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
              labelStyle: { fill: "#93c5fd", fontSize: 10, fontFamily: "monospace" },
              labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, stroke: "#1e3a8a" },
            },
            {
              id: "e-b2b-gw",
              source: "client_b2b",
              target: "gateway",
              type: "smoothstep",
              animated,
              label: "Partner cURL",
              style: { stroke: "#3b82f6", strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
              labelStyle: { fill: "#93c5fd", fontSize: 10, fontFamily: "monospace" },
              labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, stroke: "#1e3a8a" },
            },
            {
              id: "e-gw-shopnex",
              source: "gateway",
              target: "backend_shopnex",
              type: "smoothstep",
              animated,
              label: "Clean Ingress :8081",
              style: { stroke: "#06b6d4", strokeWidth: 2.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
              labelStyle: { fill: "#67e8f9", fontSize: 10, fontFamily: "monospace" },
              labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, stroke: "#164e63" },
            },
            {
              id: "e-gw-redis",
              source: "gateway",
              target: "redis_limiter",
              type: "smoothstep",
              animated,
              label: "Token Check <1ms",
              style: { stroke: "#a855f7", strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7" },
              labelStyle: { fill: "#c084fc", fontSize: 10, fontFamily: "monospace" },
              labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, stroke: "#581c87" },
            },
            {
              id: "e-gw-ctrl",
              source: "gateway",
              target: "control_plane",
              type: "smoothstep",
              animated,
              label: "Async Telemetry",
              style: { stroke: "#f59e0b", strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
              labelStyle: { fill: "#fbbf24", fontSize: 10, fontFamily: "monospace" },
              labelBgStyle: { fill: "#09090b", fillOpacity: 0.9, stroke: "#78350f" },
            },
          ];
      }
    },
    []
  );

  // Synchronize edges and gateway node data when scenario or playback changes
  useEffect(() => {
    setEdges(generateScenarioEdges(scenario, isPlaying));

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === "gateway") {
          return {
            ...node,
            data: {
              ...node.data,
              scenario,
            },
          };
        }
        return node;
      })
    );
  }, [scenario, isPlaying, generateScenarioEdges, setEdges, setNodes]);

  // Reset node positions to initial layout
  const handleReset = () => {
    setScenario("ALL_ACTIVE");
    setSelectedNode(null);
    setIsPlaying(true);
    setNodes(INITIAL_NODES);
  };

  // Scenario theme colors & details
  const scenarioTheme = useMemo(() => {
    switch (scenario) {
      case "UNAUTH_401":
        return {
          badge: "401 UNAUTHORIZED",
          desc: "Missing API Key: Perimeter Gate blocks request immediately; target backends receive zero traffic.",
          textColor: "text-amber-400",
          borderColor: "border-amber-800/60",
          bgColor: "bg-amber-950/40",
        };
      case "RATE_429":
        return {
          badge: "429 RATE LIMITED",
          desc: "Velocity Overflow: Redis Token Bucket exhausts; Gateway throttles without impacting target microservice.",
          textColor: "text-purple-400",
          borderColor: "border-purple-800/60",
          bgColor: "bg-purple-950/40",
        };
      case "VALID_200":
        return {
          badge: "200 OK (ALLOWED)",
          desc: "Authenticated Ingress: SHA-256 verified, headers sanitized, request proxied to ShopNex backend.",
          textColor: "text-emerald-400",
          borderColor: "border-emerald-800/60",
          bgColor: "bg-emerald-950/40",
        };
      default:
        return {
          badge: "LIVE DATA PLANE",
          desc: "Continuous high-throughput reverse proxy routing with Redis rate limiting and asynchronous telemetry.",
          textColor: "text-emerald-400",
          borderColor: "border-emerald-800/60",
          bgColor: "bg-emerald-950/40",
        };
    }
  }, [scenario]);

  const activeInspector = selectedNode || NODES_METADATA.gateway;
  const ActiveIcon = activeInspector.icon || Shield;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center">
              <Workflow className="h-4 w-4 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              System Architecture & Request Flow Visualizer
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-emerald-800/60 bg-emerald-950/40 text-emerald-400"
            >
              REACT FLOW INTERACTIVE
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 max-w-3xl">
            Fully interactive node-based architecture canvas powered by React Flow. Drag nodes, inspect live network boundaries, and simulate perimeter edge defense scenarios in real time.
          </p>
        </div>

        {/* Live Ports Strip */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/60 border border-zinc-800 text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gateway :8080</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/60 border border-zinc-800 text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span>ShopNex :8081</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/60 border border-zinc-800 text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span>Redis :6379</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/60 border border-zinc-800 text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Control :8082</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Scenario Select & Playback */}
      <Card className="border-zinc-800/80 bg-zinc-950 text-white shadow-none">
        <CardContent className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Scenario Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-zinc-400 mr-1 flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-zinc-400" /> Scenario:
            </span>

            {[
              { id: "ALL_ACTIVE", label: "Live Data Plane", tag: "NORMAL" },
              { id: "VALID_200", label: "Valid API Key", tag: "200 OK" },
              { id: "UNAUTH_401", label: "Missing API Key", tag: "401 UNAUTH" },
              { id: "RATE_429", label: "Burst Velocity", tag: "429 THROTTLE" },
            ].map((sc) => {
              const active = scenario === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setScenario(sc.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-2 border ${
                    active
                      ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold shadow-md"
                      : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  <span>{sc.label}</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                      active
                        ? "bg-zinc-900 text-zinc-200 border-zinc-700"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800"
                    }`}
                  >
                    {sc.tag}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Animation Controls */}
          <div className="flex items-center gap-2 border-t md:border-t-0 border-zinc-800/80 pt-2.5 md:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-8 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 cursor-pointer text-xs flex items-center gap-1.5"
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5 text-zinc-400" />
              ) : (
                <Play className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span>{isPlaying ? "Pause Flow" : "Resume Flow"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer text-xs flex items-center gap-1.5"
              title="Reset Layout & Animation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main React Flow Canvas */}
      <Card className="border-zinc-800/80 bg-zinc-950 text-white shadow-none overflow-hidden relative">
        <CardHeader className="pb-3 border-b border-zinc-800/80 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono font-bold tracking-wider uppercase ${scenarioTheme.textColor}`}
            >
              {scenarioTheme.badge}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-zinc-300 font-medium">{scenarioTheme.desc}</span>
          </div>

          <div className="text-[11px] font-mono text-zinc-400 hidden sm:flex items-center gap-2">
            <span>Drag nodes to re-arrange</span>
            <span className="text-zinc-600">|</span>
            <span>
              Ingress Path: <code className="text-emerald-400">/proxy/&#123;apiId&#125;/**</code>
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0 relative">
          <div className="w-full h-[540px] bg-black relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={NODE_TYPES}
              onNodeClick={(_event, node) => {
                if (NODES_METADATA[node.id]) {
                  setSelectedNode(NODES_METADATA[node.id]);
                }
              }}
              onPaneClick={() => setSelectedNode(null)}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.5}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
              colorMode="dark"
            >
              <Background color="#27272a" gap={20} size={1} />
              <Controls
                showInteractive={false}
                className="!bg-zinc-900 !border-zinc-800 !text-zinc-300 !rounded-lg overflow-hidden [&>button]:!bg-zinc-900 [&>button]:!border-zinc-800 [&>button]:!text-zinc-300 hover:[&>button]:!bg-zinc-800"
              />
              <MiniMap
                nodeColor={(n) => {
                  if (n.id === "gateway") return "#10b981";
                  if (n.id.startsWith("client")) return "#3b82f6";
                  if (n.id === "backend_shopnex") return "#06b6d4";
                  if (n.id === "redis_limiter") return "#a855f7";
                  return "#f59e0b";
                }}
                maskColor="rgba(0, 0, 0, 0.75)"
                className="!bg-zinc-950 !border !border-zinc-800/80 !rounded-lg overflow-hidden"
              />

              {/* Dynamic Overlay Panel */}
              <Panel position="top-right" className="m-3">
                <div className="px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80 text-[10px] font-mono text-zinc-300 backdrop-blur-md flex items-center gap-2 shadow-lg">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Interactive Graph Active</span>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Node Details Drawer / Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Inspector Card */}
        <Card className="lg:col-span-2 border-zinc-800/80 bg-zinc-950 text-white shadow-none">
          <CardHeader className="pb-3 border-b border-zinc-800/80 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <ActiveIcon className={`h-4 w-4 ${activeInspector.accent}`} />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-100">
                  {activeInspector.title}
                </CardTitle>
                <CardDescription className="text-[11px] font-mono text-zinc-400">
                  {activeInspector.tech}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono border ${activeInspector.badgeBg}`}
            >
              {activeInspector.port}
            </Badge>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <p className="text-xs text-zinc-300 leading-relaxed">
              {activeInspector.detail}
            </p>

            {/* Invariants Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-lg border border-zinc-800/70 bg-zinc-900/40">
                <p className="text-[10px] font-mono text-zinc-400 uppercase">Architecture Plane</p>
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                  {activeInspector.type}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-zinc-800/70 bg-zinc-900/40">
                <p className="text-[10px] font-mono text-zinc-400 uppercase">Framework / Stack</p>
                <p className="text-xs text-zinc-200 font-medium mt-1 font-mono truncate">
                  {activeInspector.tech}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-zinc-800/70 bg-zinc-900/40">
                <p className="text-[10px] font-mono text-zinc-400 uppercase">Perimeter SLA</p>
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                  &lt; 2.5 ms Overhead
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Scenario Quick Action */}
        <Card className="border-zinc-800/80 bg-zinc-950 text-white shadow-none flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-zinc-800/80">
            <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Simulate Edge Defense</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Trigger instant perimeter scenarios in the React Flow graph.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <button
                onClick={() => setScenario("VALID_200")}
                className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                  scenario === "VALID_200"
                    ? "bg-emerald-950/40 border-emerald-500 text-emerald-300 font-semibold"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800/70"
                }`}
              >
                <span>🟢 Valid Key (Forward to ShopNex)</span>
                <span className="text-[10px] font-mono text-emerald-400">200 OK</span>
              </button>

              <button
                onClick={() => setScenario("UNAUTH_401")}
                className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                  scenario === "UNAUTH_401"
                    ? "bg-amber-950/40 border-amber-500 text-amber-300 font-semibold"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800/70"
                }`}
              >
                <span>🟡 Missing Key (Perimeter Block)</span>
                <span className="text-[10px] font-mono text-amber-400">401 Auth</span>
              </button>

              <button
                onClick={() => setScenario("RATE_429")}
                className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                  scenario === "RATE_429"
                    ? "bg-purple-950/40 border-purple-500 text-purple-300 font-semibold"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800/70"
                }`}
              >
                <span>🟣 Velocity Burst (Redis Limiter)</span>
                <span className="text-[10px] font-mono text-purple-400">429 Rate</span>
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-800/80">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate && onNavigate("traffic")}
                className="w-full h-8 text-xs font-mono border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Traffic Telemetry</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
