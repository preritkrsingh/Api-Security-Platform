import React, { useState } from 'react';
import {
  Box,
  Plus,
  Play,
  Key,
  Globe,
  Copy,
  Trash2,
  Edit3,
  Power,
  CheckCircle2,
  AlertCircle,
  Clock,
  LayoutGrid,
  List,
  Search,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import Pagination from './Pagination';

export default function ApisView({
  apis = [],
  currentProject,
  onRegisterApiClick,
  onOpenKeysModal,
  onOpenConsoleModal,
  onOpenDetailsModal,
  onOpenEditModal,
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

  // Paginated items
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
    <div className="space-y-4 animate-fade-in text-white">
      {/* Top Action & View Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">
              APIs & Protected Services
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-900 text-neutral-300 border border-neutral-800">
              {filteredApis.length} {filteredApis.length === 1 ? 'Route' : 'Routes'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Endpoints routed through Spring Cloud Gateway with token-bucket limits and HMAC authentication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#08080a] border border-neutral-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onRegisterApiClick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all btn-click"
          >
            <Plus className="w-3.5 h-3.5 text-black" />
            <span>Register API</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredApis.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-neutral-800 rounded-2xl bg-[#08080a] p-8 space-y-3">
          <Box className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">
            {searchQuery ? 'No Matching APIs Found' : 'No APIs Registered Yet'}
          </h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {searchQuery
              ? 'Try adjusting your search criteria.'
              : 'Register an upstream service to receive a dedicated gateway reverse-proxy path with token-bucket rate limits and SHA-256 keys.'}
          </p>
          {!searchQuery && (
            <button
              onClick={onRegisterApiClick}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors btn-click"
            >
              Start Registration Wizard
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* CLEAN MINIMAL TABLE VIEW */
        <div className="space-y-3">
          <div className="rounded-2xl border border-neutral-800/80 bg-[#08080a] overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#050507] border-b border-neutral-800/80 text-neutral-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-medium">API Name & ID</th>
                    <th className="py-3 px-4 font-medium">Gateway Proxy Route</th>
                    <th className="py-3 px-4 font-medium">Upstream Target</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Rate Limit</th>
                    <th className="py-3 px-4 font-medium">Probe</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                  {paginatedApis.map((api) => {
                    const isActive = api.status === 'ACTIVE';
                    const isConnected = api.connectivityStatus === 'CONNECTED';
                    const isUnreachable = api.connectivityStatus === 'UNREACHABLE';
                    const gatewayUrl = `http://localhost:8080${api.gatewayPath || `/proxy/${api.id}`}`;

                    return (
                      <tr key={api.id} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="py-3 px-4">
                          <div
                            className="font-semibold text-white hover:text-indigo-400 cursor-pointer text-xs font-sans"
                            onClick={() => onOpenDetailsModal(api)}
                          >
                            {api.name}
                          </div>
                          <div className="text-[10px] text-neutral-500 truncate max-w-[150px]">{api.id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-medium text-[11px]">
                              {api.gatewayPath || `/proxy/${api.id}`}
                            </span>
                            <button
                              onClick={() => copyText(gatewayUrl)}
                              className="text-neutral-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
                              title="Copy route URL"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-neutral-300 truncate max-w-[200px]" title={api.upstreamBaseUrl}>
                          {api.upstreamBaseUrl}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              isActive
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                            }`}
                          >
                            {api.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-400 text-[11px]">
                          {api.rateLimitRps ? `${api.rateLimitRps} RPS` : '100 RPS'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                              isConnected
                                ? 'text-emerald-400'
                                : isUnreachable
                                ? 'text-rose-400'
                                : 'text-neutral-500'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isConnected
                                  ? 'bg-emerald-400'
                                  : isUnreachable
                                  ? 'bg-rose-400'
                                  : 'bg-neutral-500'
                              }`}
                            />
                            {api.connectivityStatus || 'UNTESTED'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenConsoleModal(api)}
                              className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                              title="Interactive Request Console"
                            >
                              <Play className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                            <button
                              onClick={() => onOpenKeysModal(api)}
                              className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
                              title="Manage API Keys"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleTestProbe(api)}
                              disabled={testingId === api.id}
                              className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors disabled:opacity-50"
                              title="Probe Upstream Connectivity"
                            >
                              <Globe className={`w-3.5 h-3.5 ${testingId === api.id ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={() => onToggleStatus(api)}
                              className={`p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 transition-colors ${
                                isActive ? 'text-emerald-400 hover:text-rose-400' : 'text-neutral-500 hover:text-emerald-400'
                              }`}
                              title={isActive ? 'Deactivate Route' : 'Activate Route'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteApi(api.id, api.name)}
                              className="p-1.5 rounded-lg border border-neutral-800 hover:bg-rose-950/30 text-neutral-400 hover:text-rose-400 transition-colors"
                              title="Delete Route"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredApis.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      ) : (
        /* CLEAN MINIMAL GRID VIEW */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedApis.map((api) => {
              const isActive = api.status === 'ACTIVE';
              const isConnected = api.connectivityStatus === 'CONNECTED';
              const isUnreachable = api.connectivityStatus === 'UNREACHABLE';

              return (
                <div
                  key={api.id}
                  className="rounded-2xl border border-neutral-800/80 bg-[#08080a] hover:border-neutral-700/80 p-5 transition-all flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <h3
                          onClick={() => onOpenDetailsModal(api)}
                          className="text-sm font-semibold text-white hover:text-neutral-300 cursor-pointer truncate"
                        >
                          {api.name}
                        </h3>
                        <span className="text-[11px] font-mono text-neutral-500 block truncate">
                          {api.id}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        }`}
                      >
                        {api.status}
                      </span>
                    </div>

                    {/* Destination & Gateway Path */}
                    <div className="mt-4 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-neutral-400">
                        <span className="text-[10px] uppercase text-neutral-500">Upstream:</span>
                        <span className="text-neutral-200 truncate max-w-[160px]" title={api.upstreamBaseUrl}>
                          {api.upstreamBaseUrl}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-neutral-400">
                        <span className="text-[10px] uppercase text-neutral-500">Route:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-white text-[11px] font-medium">
                            {api.gatewayPath || `/proxy/${api.id}`}
                          </span>
                          <button
                            onClick={() => copyText(`http://localhost:8080${api.gatewayPath || `/proxy/${api.id}`}`)}
                            className="text-neutral-500 hover:text-white p-1 rounded hover:bg-neutral-800"
                            title="Copy Route"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-neutral-400">
                        <span className="text-[10px] uppercase text-neutral-500">Probe:</span>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                            isConnected
                              ? 'text-emerald-400'
                              : isUnreachable
                              ? 'text-rose-400'
                              : 'text-neutral-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isConnected
                                ? 'bg-emerald-400'
                                : isUnreachable
                                ? 'bg-rose-400'
                                : 'bg-neutral-500'
                            }`}
                          />
                          {api.connectivityStatus || 'UNTESTED'}
                        </span>
                      </div>
                    </div>

                    {/* Policy Chips */}
                    <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-[#0c0c0e] border border-neutral-800 text-neutral-400">
                        {api.rateLimitRps ? `${api.rateLimitRps} RPS` : '100 RPS'}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-[#0c0c0e] border border-neutral-800 text-neutral-400">
                        {api.allowedPathPrefix || '/api'}
                      </span>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => onOpenConsoleModal(api)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors btn-click"
                    >
                      <Play className="w-3 h-3 text-emerald-400" />
                      <span>Console</span>
                    </button>

                    <button
                      onClick={() => onOpenKeysModal(api)}
                      className="p-2 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                      title="Manage Keys"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleTestProbe(api)}
                      disabled={testingId === api.id}
                      className="p-2 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
                      title="Probe Upstream"
                    >
                      <Globe className={`w-3.5 h-3.5 ${testingId === api.id ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                      onClick={() => onToggleStatus(api)}
                      className={`p-2 rounded-xl border border-neutral-800 hover:bg-neutral-800 transition-colors ${
                        isActive ? 'text-emerald-400 hover:text-rose-400' : 'text-neutral-500 hover:text-emerald-400'
                      }`}
                      title={isActive ? 'Deactivate Route' : 'Activate Route'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteApi(api.id, api.name)}
                      className="p-2 rounded-xl border border-neutral-800 hover:bg-rose-950/30 text-neutral-400 hover:text-rose-400 transition-colors"
                      title="Delete Route"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
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
