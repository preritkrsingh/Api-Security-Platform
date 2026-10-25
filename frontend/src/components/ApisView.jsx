import React, { useState } from 'react';
import {
  Box,
  Plus,
  Play,
  Key,
  Globe,
  Copy,
  Trash2,
  Power,
  LayoutGrid,
  List
} from 'lucide-react';
import Pagination from './Pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from '@/components/ui/alert-dialog';

export default function ApisView({
  apis = [],
  onRegisterApiClick,
  onOpenKeysModal,
  onOpenConsoleModal,
  onOpenDetailsModal,
  onTestConnectivity,
  onToggleStatus,
  onDeleteApi,
  searchQuery = '',
  showToast
}) {
  const [viewMode, setViewMode] = useState('table');
  const [testingId, setTestingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredApis = apis.filter((api) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      api.name.toLowerCase().includes(q) ||
      api.id.toLowerCase().includes(q) ||
      (api.upstreamBaseUrl && api.upstreamBaseUrl.toLowerCase().includes(q))
    );
  });

  const paginatedApis = filteredApis.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleTestProbe = async (api) => {
    setTestingId(api.id);
    try {
      await onTestConnectivity(api);
    } finally {
      setTestingId(null);
    }
  };

  const copyText = (txt, label = 'Route copied to clipboard') => {
    navigator.clipboard.writeText(txt);
    showToast('success', label);
  };

  return (
    <div className="space-y-4 animate-fade-in text-white font-sans">
      {/* Top Action & View Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#202026]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">
              APIs & Protected Services
            </h2>
            <Badge variant="outline" className="text-[11px] font-mono">
              {filteredApis.length} {filteredApis.length === 1 ? 'Route' : 'Routes'}
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Endpoints routed through Spring Cloud Gateway with token-bucket limits and HMAC authentication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#09090b] border border-[#27272f] rounded-lg p-0.5">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('table')}
              className="h-7 w-7"
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-7 w-7"
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Button
            onClick={onRegisterApiClick}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register API</span>
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filteredApis.length === 0 ? (
        <Card className="border-dashed border-[#202026] bg-[#09090b]">
          <CardContent className="py-20 text-center p-8 space-y-3">
            <Box className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">
              {searchQuery ? 'No Matching APIs Found' : 'No APIs Registered Yet'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search criteria.'
                : 'Register an upstream service to receive a dedicated gateway reverse-proxy path with token-bucket rate limits and SHA-256 keys.'}
            </p>
            {!searchQuery && (
              <Button
                onClick={onRegisterApiClick}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
              >
                Start Registration Wizard
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="space-y-3">
          <Card className="border-[#202026] bg-[#09090b] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[#202026] bg-[#0c0c0e]">
                  <TableHead className="py-3 px-4 font-medium text-zinc-400 text-[11px] uppercase tracking-wider">API Name & ID</TableHead>
                  <TableHead className="py-3 px-4 font-medium text-zinc-400 text-[11px] uppercase tracking-wider">Gateway Proxy Route</TableHead>
                  <TableHead className="py-3 px-4 font-medium text-zinc-400 text-[11px] uppercase tracking-wider">Upstream Target</TableHead>
                  <TableHead className="py-3 px-4 font-medium text-zinc-400 text-[11px] uppercase tracking-wider">Status</TableHead>
                  <TableHead className="py-3 px-4 font-medium text-zinc-400 text-[11px] uppercase tracking-wider">Rate Limit</TableHead>
                  <TableHead className="py-3 px-4 font-medium text-zinc-400 text-[11px] uppercase tracking-wider">Probe</TableHead>
                  <TableHead className="py-3 px-4 font-medium text-zinc-400 text-[11px] uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedApis.map((api) => {
                  const isActive = api.status === 'ACTIVE';
                  const isConnected = api.connectivityStatus === 'CONNECTED';
                  const isUnreachable = api.connectivityStatus === 'UNREACHABLE';
                  const gatewayUrl = `http://localhost:8080${api.gatewayPath || `/proxy/${api.id}`}`;

                  return (
                    <TableRow key={api.id} className="border-[#202026] hover:bg-[#111114]">
                      <TableCell className="py-3 px-4">
                        <div
                          className="font-semibold text-white hover:text-indigo-400 cursor-pointer text-xs"
                          onClick={() => onOpenDetailsModal(api)}
                        >
                          {api.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[150px]">{api.id}</div>
                      </TableCell>
                      <TableCell className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-medium text-[11px]">
                            {api.gatewayPath || `/proxy/${api.id}`}
                          </span>
                          <button
                            onClick={() => copyText(gatewayUrl)}
                            className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#18181b] cursor-pointer"
                            title="Copy route URL"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-zinc-300 font-mono text-xs truncate max-w-[200px]" title={api.upstreamBaseUrl}>
                        {api.upstreamBaseUrl}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge
                          variant={isActive ? 'success' : 'secondary'}
                          className="text-[10px] uppercase font-mono px-2 py-0.5"
                        >
                          {api.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-zinc-400 text-[11px] font-mono">
                        {api.rateLimitRps ? `${api.rateLimitRps} RPS` : '100 RPS'}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-medium ${
                            isConnected
                              ? 'text-emerald-400'
                              : isUnreachable
                              ? 'text-rose-400'
                              : 'text-zinc-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isConnected
                                ? 'bg-emerald-400'
                                : isUnreachable
                                ? 'bg-rose-400'
                                : 'bg-zinc-500'
                            }`}
                          />
                          {api.connectivityStatus || 'UNTESTED'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenConsoleModal(api)}
                            className="h-7 w-7 text-zinc-300 hover:text-white hover:bg-[#18181b]"
                            title="Interactive Request Console"
                          >
                            <Play className="w-3.5 h-3.5 text-emerald-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenKeysModal(api)}
                            className="h-7 w-7 text-zinc-300 hover:text-amber-400 hover:bg-[#18181b]"
                            title="Manage API Keys"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTestProbe(api)}
                            disabled={testingId === api.id}
                            className="h-7 w-7 text-zinc-300 hover:text-white hover:bg-[#18181b]"
                            title="Probe Upstream Connectivity"
                          >
                            <Globe className={`w-3.5 h-3.5 ${testingId === api.id ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onToggleStatus(api)}
                            className={`h-7 w-7 hover:bg-[#18181b] ${
                              isActive ? 'text-emerald-400 hover:text-rose-400' : 'text-zinc-500 hover:text-emerald-400'
                            }`}
                            title={isActive ? 'Deactivate Route' : 'Activate Route'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30"
                                title="Delete Route"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-border bg-card">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Route "{api.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove proxy route /proxy/{api.id} from the API Gateway. Traffic to this endpoint will return 404 Not Found.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteApi(api.id, api.name)}>
                                  Delete Route
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredApis.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      ) : (
        /* GRID VIEW */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedApis.map((api) => {
              const isActive = api.status === 'ACTIVE';
              const isConnected = api.connectivityStatus === 'CONNECTED';
              const isUnreachable = api.connectivityStatus === 'UNREACHABLE';

              return (
                <Card
                  key={api.id}
                  className="border-[#202026] bg-[#09090b] hover:border-[#27272f] p-5 transition-all flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <CardTitle
                          onClick={() => onOpenDetailsModal(api)}
                          className="text-sm font-semibold text-white hover:text-indigo-400 cursor-pointer truncate"
                        >
                          {api.name}
                        </CardTitle>
                        <span className="text-[11px] font-mono text-zinc-500 block truncate">
                          {api.id}
                        </span>
                      </div>

                      <Badge
                        variant={isActive ? 'success' : 'secondary'}
                        className="text-[10px] uppercase font-mono px-2 py-0.5 shrink-0"
                      >
                        {api.status}
                      </Badge>
                    </div>

                    {/* Destination & Gateway Path */}
                    <div className="mt-4 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-[10px] uppercase text-zinc-500">Upstream:</span>
                        <span className="text-zinc-200 truncate max-w-[160px]" title={api.upstreamBaseUrl}>
                          {api.upstreamBaseUrl}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-[10px] uppercase text-zinc-500">Route:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-white text-[11px] font-medium">
                            {api.gatewayPath || `/proxy/${api.id}`}
                          </span>
                          <button
                            onClick={() => copyText(`http://localhost:8080${api.gatewayPath || `/proxy/${api.id}`}`)}
                            className="text-zinc-500 hover:text-white p-1 rounded hover:bg-[#18181b] cursor-pointer"
                            title="Copy Route"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-[10px] uppercase text-zinc-500">Probe:</span>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                            isConnected
                              ? 'text-emerald-400'
                              : isUnreachable
                              ? 'text-rose-400'
                              : 'text-zinc-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isConnected
                                ? 'bg-emerald-400'
                                : isUnreachable
                                ? 'bg-rose-400'
                                : 'bg-zinc-500'
                            }`}
                          />
                          {api.connectivityStatus || 'UNTESTED'}
                        </span>
                      </div>
                    </div>

                    {/* Policy Chips */}
                    <div className="mt-4 pt-3 border-t border-[#202026] flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {api.rateLimitRps ? `${api.rateLimitRps} RPS` : '100 RPS'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {api.allowedPathPrefix || '/api'}
                      </Badge>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-[#202026] flex items-center justify-between gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => onOpenConsoleModal(api)}
                      className="flex-1 h-8 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3 h-3 text-white" />
                      <span>Console</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onOpenKeysModal(api)}
                      className="h-8 w-8 border-[#27272f] hover:bg-[#18181b] text-zinc-400 hover:text-white"
                      title="Manage Keys"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleTestProbe(api)}
                      disabled={testingId === api.id}
                      className="h-8 w-8 border-[#27272f] hover:bg-[#18181b] text-zinc-400 hover:text-white"
                      title="Probe Upstream"
                    >
                      <Globe className={`w-3.5 h-3.5 ${testingId === api.id ? 'animate-spin' : ''}`} />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onToggleStatus(api)}
                      className={`h-8 w-8 border-[#27272f] hover:bg-[#18181b] ${
                        isActive ? 'text-emerald-400 hover:text-rose-400' : 'text-zinc-500 hover:text-emerald-400'
                      }`}
                      title={isActive ? 'Deactivate Route' : 'Activate Route'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-[#27272f] hover:bg-rose-950/30 text-zinc-400 hover:text-rose-400"
                          title="Delete Route"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-border bg-card">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Route "{api.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove proxy route /proxy/{api.id} from the API Gateway. Traffic to this endpoint will return 404 Not Found.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteApi(api.id, api.name)}>
                            Delete Route
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredApis.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
}
