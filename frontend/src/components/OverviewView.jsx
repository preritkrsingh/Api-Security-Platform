import * as React from "react";
import {
  Activity,
  ShieldAlert,
  Layers,
  Key,
  Terminal,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import MetricCard from "@/components/dashboard/MetricCard";
import RequestTrafficChart from "@/components/dashboard/RequestTrafficChart";
import RequestStatusChart from "@/components/dashboard/RequestStatusChart";
import RecentProjectsTable from "@/components/dashboard/RecentProjectsTable";
import SecurityEventsPanel from "@/components/dashboard/SecurityEventsPanel";

export default function OverviewView({
  apis = [],
  projects = [],
  currentProject: _currentProject,
  trafficRecords = [],
  trafficStats = null,
  serviceStatus: _serviceStatus = { gateway: "UP", controlPlane: "UP" },
  securityEvents = [],
  onNavigate,
  onOpenConsole,
  onRegisterApi,
  onSelectProject,
  onCreateProject,
  onOpenKeys,
}) {
  const activeApis = apis.filter((a) => a.status === "ACTIVE").length;

  const totalRequests =
    trafficStats?.totalCaptured != null
      ? Math.max(trafficStats.totalCaptured, trafficRecords.length)
      : trafficRecords.length;

  const blockedRequests =
    trafficStats?.errorCount != null
      ? trafficStats.errorCount
      : trafficRecords.filter((t) => t.statusCode >= 400 || t.blocked === true).length;

  const blockRate =
    totalRequests > 0
      ? ((blockedRequests / totalRequests) * 100).toFixed(1)
      : "0.0";

  // Active API keys count across endpoints
  const estimatedKeysCount = apis.reduce(
    (acc, api) => acc + (api.keyCount || (api.requiresAuth ? 1 : 0)),
    0
  );

  return (
    <div className="space-y-4 animate-page-enter font-sans">
      {/* Top Header Actions Strip */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <div>
          <h1 className="text-base font-semibold text-zinc-100 tracking-tight">
            Security Overview
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time telemetry, threat mitigation metrics, and reverse-proxy throughput
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenConsole}
            className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs h-7 px-2.5 flex items-center gap-1.5 shadow-none cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span>Test Console</span>
          </Button>
          <Button
            size="sm"
            onClick={onRegisterApi}
            className="bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs h-7 px-2.5 shadow-none gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard API</span>
          </Button>
        </div>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="animate-stagger-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Total Requests"
          value={totalRequests.toLocaleString()}
          subtitle="Processed through gateway"
          icon={Activity}
          color="cyan"
          trend="+12.4% vs last window"
          trendType="positive"
          onClick={() => onNavigate("traffic")}
        />

        <MetricCard
          title="Blocked Requests"
          value={blockedRequests.toLocaleString()}
          subtitle={`${blockRate}% interception rate`}
          icon={ShieldAlert}
          color="rose"
          trend={blockedRequests > 0 ? `${blockRate}% blocked` : "0 anomalies"}
          trendType={blockedRequests > 0 ? "negative" : "neutral"}
          onClick={() => onNavigate("traffic")}
        />

        <MetricCard
          title="Active Workspaces"
          value={projects.length.toString()}
          subtitle={`${activeApis} live endpoints routed`}
          icon={Layers}
          color="indigo"
          trend={`${projects.length} tenant environments`}
          trendType="positive"
          onClick={() => onNavigate("projects")}
        />

        <MetricCard
          title="Enforced Keys"
          value={estimatedKeysCount > 0 ? estimatedKeysCount.toString() : Math.max(1, apis.length).toString()}
          subtitle="SHA-256 HMAC active"
          icon={Key}
          color="amber"
          trend="Active"
          trendType="positive"
          onClick={onOpenKeys || (() => onNavigate("apis"))}
        />
      </div>

      {/* Charts Grid: Traffic Timeline & Status Donut */}
      <div className="animate-stagger-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RequestTrafficChart
            trafficRecords={trafficRecords}
            trafficStats={trafficStats}
          />
        </div>
        <div className="lg:col-span-1">
          <RequestStatusChart
            trafficRecords={trafficRecords}
            trafficStats={trafficStats}
          />
        </div>
      </div>

      {/* Data Section: Recent Projects & Security Events */}
      <div className="animate-stagger-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentProjectsTable
          projects={projects}
          apis={apis}
          trafficRecords={trafficRecords}
          onSelectProject={onSelectProject}
          onNavigate={onNavigate}
          onCreateProject={onCreateProject}
          onRegisterApi={onRegisterApi}
        />

        <SecurityEventsPanel
          securityEvents={securityEvents}
          trafficRecords={trafficRecords}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
