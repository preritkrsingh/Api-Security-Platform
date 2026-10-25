import React from 'react';
import {
  Layers,
  ChevronDown,
  Plus,
  RefreshCw,
  Search,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

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
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3.5 border-b border-[#202026] bg-black/90 backdrop-blur-md">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col min-w-0 pr-4">
        <h1 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
          {currentMeta.title}
        </h1>
        <p className="text-xs text-zinc-400 truncate mt-0.5">
          {currentMeta.desc}
        </p>
      </div>

      {/* Controls & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Search Filter (APIs, Traffic) */}
        {(activeTab === 'apis' || activeTab === 'traffic') && (
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, path, IP..."
              className="w-56 pl-8 h-8 text-xs font-mono border-[#27272f] bg-[#09090b]"
            />
          </div>
        )}

        {/* Project Selector DropdownMenu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 px-3 py-1.5 h-8 text-xs font-medium text-white border-[#27272f] bg-[#09090b] hover:bg-[#17171c]"
            >
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span className="max-w-[160px] truncate font-medium">
                {currentProject ? currentProject.name : 'Select Project'}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 border-[#27272f] bg-[#09090b]">
            <DropdownMenuLabel className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Workspace Projects
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-56 overflow-y-auto py-0.5">
              {projects.length === 0 ? (
                <div className="px-3 py-3 text-xs text-zinc-500 text-center font-mono">
                  No projects found
                </div>
              ) : (
                projects.map((proj) => {
                  const isSelected = currentProject?.id === proj.id;
                  return (
                    <DropdownMenuItem
                      key={proj.id}
                      onClick={() => onSelectProject(proj)}
                      className={`flex items-center justify-between text-xs cursor-pointer ${
                        isSelected ? 'bg-secondary font-semibold text-white' : 'text-zinc-300'
                      }`}
                    >
                      <span className="truncate font-medium">{proj.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-2" />}
                    </DropdownMenuItem>
                  );
                })
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onCreateProjectClick}
              className="flex items-center gap-2 text-xs font-medium text-white cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Create Project</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Refresh Telemetry Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="h-8 w-8 p-0 flex items-center justify-center border-[#27272f] bg-[#09090b] hover:bg-[#17171c]"
          title="Refresh Telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white' : 'text-zinc-400'}`} />
        </Button>

        {/* Register API Action */}
        <Button
          onClick={onRegisterApiClick}
          size="sm"
          className="h-8 flex items-center gap-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Register API</span>
        </Button>
      </div>
    </header>
  );
}
