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
  PlusCircle
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  serviceStatus
}) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'projects', label: 'Projects', icon: Layers },
    { id: 'apis', label: 'APIs & Services', icon: Box },
    { id: 'register-api', label: 'Register API', icon: PlusCircle },
    { id: 'traffic', label: 'Traffic Telemetry', icon: Activity },
    { id: 'policies', label: 'Security Policies', icon: Sliders },
    { id: 'settings', label: 'Settings & Health', icon: Settings },
    { id: 'help', label: 'Guide & Verification', icon: HelpCircle },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-neutral-800/80 bg-black transition-all duration-200 z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header: Logo (white, no border) and Name (white) */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-900 bg-black">
        {/* Project logo without border */}
        <Shield className="w-6 h-6 text-white shrink-0" />

        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold tracking-tight text-white truncate">
              API Security Platform
            </span>
            <span className="text-[10px] text-neutral-400 truncate">
              Enterprise Defense Gateway
            </span>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors btn-click ${
                isActive
                  ? 'bg-neutral-900 text-white font-semibold shadow-sm border border-neutral-800/70'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 font-medium'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-neutral-400'
                }`}
              />
              {!collapsed && (
                <div className="flex items-center justify-between w-full min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Live Service Status Footer */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-neutral-900 bg-black">
          <div className="rounded-xl border border-neutral-900 bg-[#070709] p-2.5 text-[11px] space-y-1.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Gateway :8080</span>
              <span
                className={`inline-flex items-center gap-1.5 font-medium ${
                  serviceStatus.gateway === 'UP' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    serviceStatus.gateway === 'UP' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                {serviceStatus.gateway}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Control Plane :8082</span>
              <span
                className={`inline-flex items-center gap-1.5 font-medium ${
                  serviceStatus.controlPlane === 'UP' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    serviceStatus.controlPlane === 'UP' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                {serviceStatus.controlPlane}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Collapse/Expand Rail Toggle */}
      <div className="p-2 border-t border-neutral-900 flex items-center justify-between bg-black">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors btn-click"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <span className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
              <PanelLeftClose className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
