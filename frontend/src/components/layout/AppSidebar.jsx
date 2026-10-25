import * as React from "react";
import {
  Shield,
  LayoutDashboard,
  Layers,
  Network,
  Activity,
  ShieldAlert,
  Sliders,
  Settings,
  PlusCircle,
  HelpCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AppSidebar({
  activeTab,
  setActiveTab,
  serviceStatus = {},
  onOpenKeys,
}) {
  const { open } = useSidebar();

  const mainNav = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "apis", label: "Endpoints", icon: Network },
    { id: "traffic", label: "Telemetry", icon: Activity },
    { id: "incidents", label: "Incidents", icon: ShieldAlert },
    { id: "policies", label: "Rate Limits", icon: Sliders },
  ];

  const secondaryNav = [
    { id: "projects", label: "Projects", icon: Layers },
    { id: "register-api", label: "Onboard API", icon: PlusCircle },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help", label: "Docs", icon: HelpCircle },
  ];

  const handleNavClick = (item) => {
    if (item.isModal) {
      if (onOpenKeys) onOpenKeys();
      else setActiveTab("apis");
      return;
    }
    setActiveTab(item.id);
  };

  const gatewayUp = serviceStatus.gateway === "UP";
  const controlPlaneUp = serviceStatus.controlPlane === "UP";
  const allHealthy = gatewayUp && controlPlaneUp;

  return (
    <TooltipProvider delayDuration={150}>
      <Sidebar className="border-[#18181b] bg-black">
        {/* Brand Header */}
        <SidebarHeader className="border-b border-[#18181b] px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-zinc-900 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-zinc-100" />
            </div>
            {open && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold tracking-tight text-zinc-100">
                  API Security Platform
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Enterprise Gateway
                </span>
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* Navigation Content */}
        <SidebarContent className="px-2 py-3 space-y-4">
          <div>
            {open && (
              <div className="px-3 pb-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                Platform
              </div>
            )}
            <SidebarMenu>
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                const button = (
                  <SidebarMenuButton
                    key={item.id}
                    isActive={isActive}
                    onClick={() => handleNavClick(item)}
                    className={!open ? "justify-center px-0" : ""}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? "text-white" : "text-zinc-400"
                      }`}
                    />
                    {open && <span className="truncate">{item.label}</span>}
                  </SidebarMenuButton>
                );

                if (!open) {
                  return (
                    <SidebarMenuItem key={item.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right" className="border-zinc-800 bg-zinc-950 text-xs text-zinc-200">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                }

                return <SidebarMenuItem key={item.id}>{button}</SidebarMenuItem>;
              })}
            </SidebarMenu>
          </div>

          <div>
            {open && (
              <div className="px-3 pb-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                Manage
              </div>
            )}
            <SidebarMenu>
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                const button = (
                  <SidebarMenuButton
                    key={item.id}
                    isActive={isActive}
                    onClick={() => setActiveTab(item.id)}
                    className={!open ? "justify-center px-0" : ""}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? "text-white" : "text-zinc-400"
                      }`}
                    />
                    {open && <span className="truncate">{item.label}</span>}
                  </SidebarMenuButton>
                );

                if (!open) {
                  return (
                    <SidebarMenuItem key={item.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right" className="border-zinc-800 bg-zinc-950 text-xs text-zinc-200">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                }

                return <SidebarMenuItem key={item.id}>{button}</SidebarMenuItem>;
              })}
            </SidebarMenu>
          </div>
        </SidebarContent>

        {/* Clean System Status Footer */}
        <SidebarFooter className="border-t border-[#18181b] bg-black p-3">
          {open ? (
            <div className="flex flex-col gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950 p-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-zinc-300 font-medium text-[11px]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      allHealthy ? "bg-emerald-400" : "bg-rose-400"
                    }`}
                  />
                  {allHealthy ? "Perimeter Active" : "Degraded"}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  :8080 / :8082
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1 border-t border-zinc-900">
                <span>Postgres & Redis</span>
                <span className="text-zinc-400">UP</span>
              </div>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 mx-auto cursor-pointer">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      allHealthy ? "bg-emerald-400" : "bg-rose-400"
                    }`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="border-zinc-800 bg-zinc-950 text-xs text-zinc-300">
                Gateway & Control Plane Active
              </TooltipContent>
            </Tooltip>
          )}
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
