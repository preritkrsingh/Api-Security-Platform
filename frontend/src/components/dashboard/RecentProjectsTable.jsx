import * as React from "react";
import {
  FolderGit2,
  ExternalLink,
  MoreVertical,
  Plus,
  Network,
  CheckCircle2,
  Settings,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function RecentProjectsTable({
  projects = [],
  apis = [],
  trafficRecords = [],
  onSelectProject,
  onNavigate,
  onCreateProject,
}) {
  const getProjectApisCount = (projectId) => {
    return apis.filter((a) => a.projectId === projectId).length;
  };

  const getProjectTrafficCount = (projectId) => {
    return trafficRecords.filter((t) => t.projectId === projectId).length;
  };

  return (
    <Card className="border-zinc-800/80 bg-zinc-950 text-white shadow-none">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium tracking-tight text-zinc-100">
              Workspaces & Projects
            </CardTitle>
            <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-400 bg-zinc-900/60 font-mono px-1.5 py-0">
              {projects.length} ACTIVE
            </Badge>
          </div>
          <CardDescription className="text-xs text-zinc-400 mt-0.5">
            Isolated tenant boundaries with discrete security rules and endpoints
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {onCreateProject && (
            <Button
              size="sm"
              onClick={onCreateProject}
              className="bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs h-7 px-2.5 gap-1 shadow-none transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>New Project</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("projects")}
            className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs h-7 px-2.5 shadow-none"
          >
            All Workspaces &rarr;
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-zinc-900/40">
            <TableRow className="border-b border-zinc-800/80 hover:bg-transparent">
              <TableHead className="text-zinc-400 text-xs font-medium h-9">Project Name</TableHead>
              <TableHead className="text-zinc-400 text-xs font-medium h-9">Endpoints</TableHead>
              <TableHead className="text-zinc-400 text-xs font-medium h-9">Traffic</TableHead>
              <TableHead className="text-zinc-400 text-xs font-medium h-9">Status</TableHead>
              <TableHead className="text-zinc-400 text-xs font-medium h-9">Created</TableHead>
              <TableHead className="text-right text-zinc-400 text-xs font-medium h-9">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow className="border-b border-zinc-800/40 hover:bg-transparent">
                <TableCell colSpan={6} className="h-24 text-center text-xs text-zinc-400 font-mono">
                  No projects configured yet.
                </TableCell>
              </TableRow>
            ) : (
              projects.slice(0, 6).map((proj) => {
                const apiCount = getProjectApisCount(proj.id);
                const trafficCount = getProjectTrafficCount(proj.id);

                return (
                  <TableRow
                    key={proj.id}
                    className="border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors"
                  >
                    <TableCell className="font-medium text-xs py-2.5">
                      <div className="flex items-center gap-2.5">
                        <FolderGit2 className="h-4 w-4 text-zinc-400 shrink-0" />
                        <div>
                          <span
                            onClick={() => onSelectProject && onSelectProject(proj)}
                            className="font-medium text-zinc-100 hover:text-white cursor-pointer"
                          >
                            {proj.name}
                          </span>
                          {proj.description && (
                            <p className="text-[11px] text-zinc-400 truncate max-w-xs font-normal">
                              {proj.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs font-mono text-zinc-300 py-2.5">
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <Network className="h-3 w-3 text-zinc-400" />
                        {apiCount}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs font-mono text-zinc-300 py-2.5">
                      <span className="text-zinc-200 font-medium">{trafficCount}</span> reqs
                    </TableCell>

                    <TableCell className="py-2.5">
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-950/40 border-emerald-800/50 text-emerald-400 font-mono gap-1 py-0 px-1.5"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        ACTIVE
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-zinc-400 font-mono py-2.5">
                      {proj.createdAt
                        ? new Date(proj.createdAt).toLocaleDateString()
                        : "2026-10-24"}
                    </TableCell>

                    <TableCell className="text-right py-2.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800/60 cursor-pointer"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-zinc-800 bg-zinc-950 text-zinc-200">
                          <DropdownMenuItem
                            onClick={() => {
                              if (onSelectProject) onSelectProject(proj);
                            }}
                            className="text-xs cursor-pointer focus:bg-zinc-900 focus:text-white"
                          >
                            <ExternalLink className="mr-2 h-3.5 w-3.5 text-zinc-400" />
                            <span>Switch Scope</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (onSelectProject) onSelectProject(proj);
                              if (onNavigate) onNavigate("register-api");
                            }}
                            className="text-xs cursor-pointer focus:bg-zinc-900 focus:text-white"
                          >
                            <Plus className="mr-2 h-3.5 w-3.5 text-zinc-400" />
                            <span>Register Route</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (onNavigate) onNavigate("projects");
                            }}
                            className="text-xs cursor-pointer focus:bg-zinc-900 focus:text-white"
                          >
                            <Settings className="mr-2 h-3.5 w-3.5 text-zinc-400" />
                            <span>Workspace Settings</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
