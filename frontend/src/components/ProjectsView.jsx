import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Layers,
  Plus,
  Edit3,
  Trash2,
  Box,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  Check,
  Globe
} from 'lucide-react';
import Pagination from './Pagination';

export default function ProjectsView({
  projects = [],
  currentProject,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  apis = []
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Pagination state (5 projects per page so grid + new project card = 6 cards)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState('DEVELOPMENT');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setName('');
    setDescription('');
    setEnvironment('DEVELOPMENT');
    setErrorMsg('');
    setShowCreateModal(true);
  };

  const openEditModal = (proj) => {
    setEditingProject(proj);
    setName(proj.name);
    setDescription(proj.description || '');
    setEnvironment(proj.environment || 'DEVELOPMENT');
    setErrorMsg('');
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a project name.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onCreateProject({
        name: name.trim(),
        description: description.trim() || 'API Security Management Workspace',
        environment
      });
      setShowCreateModal(false);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a project name.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onUpdateProject(editingProject.id, {
        name: name.trim(),
        description: description.trim(),
        environment
      });
      setShowEditModal(false);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paginated projects
  const paginatedProjects = projects.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const envOptions = [
    { id: 'DEVELOPMENT', label: 'Dev', full: 'Development', dot: 'bg-emerald-400' },
    { id: 'TESTING', label: 'Staging', full: 'Testing / Staging', dot: 'bg-amber-400' },
    { id: 'PRODUCTION', label: 'Prod', full: 'Production', dot: 'bg-rose-400' }
  ];

  return (
    <div className="space-y-5 animate-fade-in text-white font-sans">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Projects
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-900 text-neutral-300 border border-neutral-800">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage environments and isolate API gateway configurations.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-black" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-neutral-800 rounded-2xl bg-[#08080a] p-8 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white">No Projects Yet</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Create your first workspace to onboard and protect API routes.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* New Project Card (Positioned first in grid for intuitive access) */}
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-2xl border border-dashed border-neutral-800 hover:border-neutral-600 bg-neutral-900/20 hover:bg-neutral-900/40 p-5 flex flex-col items-center justify-center text-center transition-all min-h-[220px] group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 group-hover:border-neutral-700 group-hover:bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-white transition-all mb-3 shadow-sm">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-white tracking-tight">New Project</span>
              <span className="text-xs text-neutral-500 mt-1">Create an isolated workspace</span>
            </button>

            {/* Existing Project Cards */}
            {paginatedProjects.map((proj) => {
              const isSelected = currentProject?.id === proj.id;
              const projectApis = apis.filter((a) => a.projectId === proj.id);

              return (
                <div
                  key={proj.id}
                  className={`rounded-2xl border p-5 transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-neutral-700 bg-[#0e0e12] shadow-lg ring-1 ring-neutral-700'
                      : 'border-neutral-800/80 bg-[#08080a] hover:border-neutral-700/80 hover:bg-[#0c0c0f]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white truncate max-w-[180px]">
                            {proj.name}
                          </h3>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-200 border border-neutral-700">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-neutral-500 block truncate">
                          {proj.id}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1.5 ${
                          proj.environment === 'PRODUCTION'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : proj.environment === 'TESTING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            proj.environment === 'PRODUCTION'
                              ? 'bg-rose-400'
                              : proj.environment === 'TESTING'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span>{proj.environment}</span>
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300 mt-3 line-clamp-2 min-h-[36px] leading-relaxed">
                      {proj.description || 'No description provided.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Box className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{projectApis.length} {projectApis.length === 1 ? 'API' : 'APIs'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectProject(proj)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-750'
                          : 'bg-white hover:bg-neutral-200 text-black'
                      }`}
                    >
                      {isSelected ? 'Current Workspace' : 'Select'}
                    </button>
                    <button
                      onClick={() => openEditModal(proj)}
                      className="p-2 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                      title="Edit Project"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteProject(proj.id, proj.name)}
                      className="p-2 rounded-xl border border-neutral-800 hover:bg-rose-950/30 hover:border-rose-900/40 text-neutral-400 hover:text-rose-400 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalItems={projects.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Modal: New Project (Rendered via React Portal for true viewport centering) */}
      {showCreateModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans overflow-y-auto">
            <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-[#09090b] p-6 shadow-2xl animate-scale-in my-auto">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-wide">
                      New Project
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Create an isolated workspace for your APIs.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                {/* Project Name */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Project Name <span className="text-neutral-500 font-normal">(required)</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Core Banking APIs"
                    className="w-full rounded-xl bg-[#0c0c0e] border border-neutral-800 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700 transition-all"
                  />
                </div>

                {/* Environment Segmented Selector */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Environment Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {envOptions.map((opt) => {
                      const isSelected = environment === opt.id;
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setEnvironment(opt.id)}
                          className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-neutral-800 border-neutral-700 text-white shadow-sm'
                              : 'bg-[#0c0c0e] border-neutral-850 text-neutral-400 hover:text-neutral-200 hover:border-neutral-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center justify-between">
                    <span>Description</span>
                    <span className="text-[11px] text-neutral-500 font-normal">Optional</span>
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Workspace scope or upstream targets..."
                    className="w-full rounded-xl bg-[#0c0c0e] border border-neutral-800 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700 transition-all leading-relaxed resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-2 rounded-xl text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal: Edit Project (Rendered via React Portal) */}
      {showEditModal && editingProject &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans overflow-y-auto">
            <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-[#09090b] p-6 shadow-2xl animate-scale-in my-auto">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-wide">
                      Edit Project
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Update workspace details.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl bg-[#0c0c0e] border border-neutral-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Environment Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {envOptions.map((opt) => {
                      const isSelected = environment === opt.id;
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setEnvironment(opt.id)}
                          className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-neutral-800 border-neutral-700 text-white shadow-sm'
                              : 'bg-[#0c0c0e] border-neutral-850 text-neutral-400 hover:text-neutral-200 hover:border-neutral-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center justify-between">
                    <span>Description</span>
                    <span className="text-[11px] text-neutral-500 font-normal">Optional</span>
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl bg-[#0c0c0e] border border-neutral-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700 transition-all resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-3.5 py-2 rounded-xl text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
