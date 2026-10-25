import React from 'react';
import {
  Shield,
  Layers,
  Box,
  BarChart2,
  Sliders,
  Settings,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
  PlusCircle,
  Workflow
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  serviceStatus
}) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'architecture', label: 'Architecture', icon: Workflow },
    { id: 'projects', label: 'Projects', icon: Layers },
    { id: 'apis', label: 'APIs & Services', icon: Box },
    { id: 'register-api', label: 'Register API', icon: PlusCircle },
    { id: 'traffic', label: 'Traffic Telemetry', icon: Activity },
    { id: 'policies', label: 'Security Policies', icon: Sliders },
    { id: 'settings', label: 'Settings & Health', icon: Settings },
    { id: 'help', label: 'Guide & Verification', icon: HelpCircle },
  ];

  return (
    <TooltipProvider>
      <aside
        className={`relative flex flex-col border-r border-[#202026] bg-black transition-all duration-200 z-30 select-none ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#202026] bg-black">
          <Shield className="w-6 h-6 text-indigo-400 shrink-0" />

          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold tracking-tight text-white truncate">
                VEYRION
              </span>
              <span className="text-[10px] text-zinc-400 truncate">
                API Security Platform
              </span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            const buttonEl = (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#18181b] text-white font-semibold shadow-sm border border-[#27272f]'
                    : 'text-zinc-400 hover:text-white hover:bg-[#111114] font-medium'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-zinc-400'
                  }`}
                />
                {!collapsed && (
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className="truncate">{item.label}</span>
                  </div>
                )}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.id} delayDuration={150}>
                  <TooltipTrigger asChild>{buttonEl}</TooltipTrigger>
                  <TooltipContent side="right">
                    <span>{item.label}</span>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return buttonEl;
          })}
        </div>

        {/* Live Service Status Footer */}
        {!collapsed && (
          <div className="px-3 py-3 border-t border-[#202026] bg-black">
            <div className="rounded-xl border border-[#202026] bg-[#09090b] p-2.5 text-[11px] space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Gateway :8080</span>
                <Badge
                  variant={serviceStatus.gateway === 'UP' ? 'success' : 'destructive'}
                  className="px-1.5 py-0 text-[10px] font-mono"
                >
                  {serviceStatus.gateway}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Control Plane :8082</span>
                <Badge
                  variant={serviceStatus.controlPlane === 'UP' ? 'success' : 'destructive'}
                  className="px-1.5 py-0 text-[10px] font-mono"
                >
                  {serviceStatus.controlPlane}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Collapse/Expand Rail Toggle */}
        <div className="p-2 border-t border-[#202026] flex items-center justify-between bg-black">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#111114] transition-colors cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <span className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                <PanelLeftClose className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </span>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
