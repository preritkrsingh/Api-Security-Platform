import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  ChevronDown,
  Plus,
  RefreshCw,
  Search,
  Check
} from 'lucide-react';

export default function Header({
  activeTab,
  projects,
  currentProject,
  onSelectProject,
  onCreateProjectClick,
  onRegisterApiClick,
  onRefreshData,
  isRefreshing,
  searchQuery,
  setSearchQuery
}) {
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProjectDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const titles = {
    overview: { title: 'Platform Security Posture', desc: 'Real-time telemetry, active APIs, and perimeter defense status' },
    projects: { title: 'Projects Workspace', desc: 'Manage project environments and isolated API collections' },
    apis: { title: 'API Inventory & Routing', desc: 'Configure reverse-proxy endpoints, policies, and cryptographic credentials' },
    'register-api': { title: 'Register New API', desc: 'Onboard and protect upstream microservices behind the security perimeter' },
    traffic: { title: 'Traffic Telemetry Stream', desc: 'Live operational request telemetry captured via Spring Cloud Gateway' },
    policies: { title: 'Security Policies Matrix', desc: 'Gateway runtime protections: SSRF, Rate Limiting, RBAC, and payload bounds' },
    settings: { title: 'Settings & System Diagnostics', desc: 'Service health verification, environment parameters, and connectivity' },
    help: { title: 'Integration Guide & Verification', desc: 'Technical specifications, cURL testing vectors, and architecture' }
  };

  const currentMeta = titles[activeTab] || titles.overview;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3.5 border-b border-neutral-900 bg-black/90 backdrop-blur-md">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col min-w-0 pr-4">
        <h1 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
          {currentMeta.title}
        </h1>
        <p className="text-xs text-neutral-400 truncate mt-0.5">
          {currentMeta.desc}
        </p>
      </div>

      {/* Controls & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Search Filter (APIs, Traffic) */}
        {(activeTab === 'apis' || activeTab === 'traffic') && (
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, path, IP..."
              className="w-56 rounded-xl bg-[#09090b] border border-neutral-800 py-1.5 pl-8 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
            />
          </div>
        )}

        {/* Project Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-800 bg-[#09090b] hover:bg-neutral-900 text-xs font-medium text-white transition-colors btn-click"
          >
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            <span className="max-w-[160px] truncate font-medium">
              {currentProject ? currentProject.name : 'Select Project'}
            </span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {showProjectDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-neutral-800 bg-[#0c0c0e] shadow-2xl p-2 z-40 animate-slide-down">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800/80">
                Workspace Projects
              </div>
              <div className="max-h-56 overflow-y-auto py-1 space-y-0.5">
                {projects.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-neutral-500 text-center font-mono">
                    No projects found
                  </div>
                ) : (
                  projects.map((proj) => {
                    const isSelected = currentProject?.id === proj.id;
                    return (
                      <button
                        key={proj.id}
                        onClick={() => {
                          onSelectProject(proj);
                          setShowProjectDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                          isSelected
                            ? 'bg-neutral-800 text-white font-semibold'
                            : 'text-neutral-300 hover:bg-neutral-900'
                        }`}
                      >
                        <span className="truncate font-medium text-left mr-2">{proj.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="pt-1.5 mt-1 border-t border-neutral-800/80">
                <button
                  onClick={() => {
                    setShowProjectDropdown(false);
                    onCreateProjectClick();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white hover:bg-neutral-900 rounded-xl transition-colors font-medium"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <span>Create Project</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Refresh Telemetry Button */}
        <button
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="flex items-center justify-center p-2 rounded-xl border border-neutral-800 bg-[#09090b] hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors btn-click disabled:opacity-50"
          title="Refresh Telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
        </button>

        {/* Register API Action */}
        <button
          onClick={onRegisterApiClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all btn-click"
        >
          <Plus className="w-3.5 h-3.5 text-black" />
          <span className="hidden sm:inline">Register API</span>
        </button>
      </div>
    </header>
  );
}
