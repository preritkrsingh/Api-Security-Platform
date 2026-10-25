import * as React from "react";
import {
  Search,
  Bell,
  Layers,
  ChevronDown,
  RefreshCw,
  Plus,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Check,
  Sliders,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function AppHeader({
  activeTab: _activeTab,
  setActiveTab,
  projects = [],
  currentProject,
  onSelectProject,
  onCreateProjectClick,
  onRegisterApiClick: _onRegisterApiClick,
  onRefreshData,
  isRefreshing,
  searchQuery,
  setSearchQuery,
  trafficScope,
  setTrafficScope,
  securityEvents = [],
}) {
  const searchInputRef = React.useRef(null);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const unreadAlerts = securityEvents.slice(0, 5);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#18181b] bg-black/95 px-4 md:px-6 backdrop-blur-md">
      {/* Left: Sidebar Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <SidebarTrigger className="text-zinc-400 hover:text-white" />

        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <Input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources..."
            className="h-8 w-full bg-zinc-950 border-zinc-800 pl-8 pr-12 text-xs text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-600 rounded-md font-sans"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            <kbd className="pointer-events-none hidden h-4.5 select-none items-center gap-0.5 rounded border border-zinc-800 bg-zinc-900 px-1 font-mono text-[10px] text-zinc-400 sm:flex">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Scope Selector: Project vs Global */}
        {setTrafficScope && (
          <div className="hidden lg:flex items-center rounded-md border border-zinc-800 bg-zinc-950 p-0.5 text-xs">
            <button
              onClick={() => setTrafficScope("project")}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                trafficScope === "project"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Project
            </button>
            <button
              onClick={() => setTrafficScope("global")}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                trafficScope === "global"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Global
            </button>
          </div>
        )}

        {/* Project Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 border-zinc-800 bg-zinc-950 text-xs font-medium text-zinc-200 hover:bg-zinc-900 hover:text-white max-w-[170px]"
            >
              <Layers className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">
                {currentProject ? currentProject.name : "All Projects"}
              </span>
              <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-zinc-800 bg-zinc-950 text-zinc-200">
            <DropdownMenuLabel className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Workspaces
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <div className="max-h-56 overflow-y-auto py-1">
              {projects.length === 0 ? (
                <div className="px-3 py-2 text-xs text-zinc-500 text-center font-mono">
                  No projects
                </div>
              ) : (
                projects.map((proj) => (
                  <DropdownMenuItem
                    key={proj.id}
                    onClick={() => onSelectProject(proj)}
                    className="flex items-center justify-between text-xs cursor-pointer focus:bg-zinc-900"
                  >
                    <span className="truncate">{proj.name}</span>
                    {currentProject?.id === proj.id && (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={onCreateProjectClick}
              className="text-xs text-zinc-300 cursor-pointer focus:bg-zinc-900 gap-2"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Project</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Refresh Button */}
        {onRefreshData && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-zinc-200" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        )}

        {/* Security Notifications Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
              )}
              <span className="sr-only">Alerts</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 border-zinc-800 bg-zinc-950 p-0 shadow-2xl">
            <div className="flex items-center justify-between p-3 border-b border-zinc-800">
              <span className="text-xs font-semibold text-zinc-200">Security Events</span>
              <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-400">
                {unreadAlerts.length}
              </Badge>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-zinc-900">
              {unreadAlerts.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500">
                  <ShieldCheck className="h-5 w-5 text-zinc-500 mx-auto mb-1 opacity-70" />
                  No security incidents in current window.
                </div>
              ) : (
                unreadAlerts.map((evt, idx) => (
                  <div key={evt.id || idx} className="p-3 hover:bg-zinc-900/60 transition-colors text-xs">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-zinc-200">
                        {evt.eventType || "RATE_LIMIT_TRIPPED"}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : ""}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">
                      {evt.details || evt.path || "Rate limit threshold reached"}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="p-2 border-t border-zinc-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("incidents")}
                className="w-full text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 h-7"
              >
                View All Incidents &rarr;
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 cursor-pointer">
              <Avatar className="h-7 w-7 border border-zinc-800 bg-zinc-900">
                <AvatarFallback className="bg-zinc-900 text-zinc-200 text-[11px] font-semibold">
                  VY
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 border-zinc-800 bg-zinc-950 text-zinc-200">
            <DropdownMenuLabel className="font-normal p-2.5">
              <div className="flex flex-col space-y-0.5">
                <p className="text-xs font-medium text-zinc-100">SecOps Lead</p>
                <p className="text-[11px] text-zinc-500 font-mono">admin@veyrion.local</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => setActiveTab("settings")}
                className="text-xs cursor-pointer focus:bg-zinc-900"
              >
                <Settings className="mr-2 h-3.5 w-3.5 text-zinc-400" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab("policies")}
                className="text-xs cursor-pointer focus:bg-zinc-900"
              >
                <Sliders className="mr-2 h-3.5 w-3.5 text-zinc-400" />
                <span>Policies</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab("help")}
                className="text-xs cursor-pointer focus:bg-zinc-900"
              >
                <ExternalLink className="mr-2 h-3.5 w-3.5 text-zinc-400" />
                <span>API Specs</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
