import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit3,
  Trash2,
  Box,
  Calendar,
  AlertCircle,
  Check
} from 'lucide-react';
import Pagination from './Pagination';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    { id: 'DEVELOPMENT', label: 'Development', dot: 'bg-emerald-400' },
    { id: 'TESTING', label: 'Staging', dot: 'bg-amber-400' },
    { id: 'PRODUCTION', label: 'Production', dot: 'bg-rose-400' }
  ];

  return (
    <div className="space-y-4 animate-page-enter text-white font-sans">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Projects & Workspaces
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono border-zinc-800 bg-zinc-900 text-zinc-400 py-0 px-1.5">
              {projects.length} WORKSPACES
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Isolated tenant boundaries with discrete reverse-proxy configurations and rate limits
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          size="sm"
          className="bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs h-7 px-3 flex items-center gap-1.5 shadow-none transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="border border-zinc-800/80 bg-zinc-950 shadow-none">
          <CardContent className="py-16 text-center p-8 space-y-3">
            <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">No Projects Configured</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Create your first project workspace to register endpoints and enforce perimeter security.
            </p>
            <Button
              onClick={openCreateModal}
              size="sm"
              className="bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium h-7 px-3 shadow-none cursor-pointer"
            >
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* New Project Card */}
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-lg border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900/40 p-5 flex flex-col items-center justify-center text-center transition-colors min-h-[200px] cursor-pointer"
            >
              <Plus className="w-6 h-6 text-zinc-500 mb-2" />
              <span className="text-xs font-medium text-zinc-200">New Project</span>
              <span className="text-[11px] text-zinc-500 mt-0.5">Create an isolated workspace</span>
            </button>

            {/* Existing Project Cards */}
            {paginatedProjects.map((proj) => {
              const isSelected = currentProject?.id === proj.id;
              const projectApis = apis.filter((a) => a.projectId === proj.id);

              return (
                <Card
                  key={proj.id}
                  className={`transition-colors relative flex flex-col justify-between shadow-none border ${
                    isSelected
                      ? 'border-zinc-700 bg-zinc-950'
                      : 'border-zinc-800/80 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xs font-semibold text-zinc-100 truncate max-w-[180px]">
                            {proj.name}
                          </CardTitle>
                          {isSelected && (
                            <Badge variant="outline" className="text-[10px] bg-zinc-900 text-zinc-200 border-zinc-800 font-mono py-0 px-1.5">
                              Active
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 block truncate">
                          {proj.id}
                        </span>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-mono px-1.5 py-0 ${
                          proj.environment === 'PRODUCTION'
                            ? 'border-rose-800/50 bg-rose-950/40 text-rose-400'
                            : proj.environment === 'TESTING'
                            ? 'border-amber-800/50 bg-amber-950/40 text-amber-400'
                            : 'border-emerald-800/50 bg-emerald-950/40 text-emerald-400'
                        }`}
                      >
                        {proj.environment}
                      </Badge>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 mt-2 leading-relaxed font-normal">
                      {proj.description || 'API Security Management Workspace'}
                    </p>
                  </CardHeader>

                  <CardContent className="px-4 py-2">
                    <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-y border-zinc-900">
                      <div className="space-y-0.5">
                        <span className="text-zinc-500 text-[10px] uppercase font-mono">Endpoints</span>
                        <div className="flex items-center gap-1.5 text-zinc-200 font-mono text-xs">
                          <Box className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{projectApis.length} {projectApis.length === 1 ? 'Route' : 'Routes'}</span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-zinc-500 text-[10px] uppercase font-mono">Created</span>
                        <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-xs">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>
                            {proj.createdAt
                              ? new Date(proj.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                              : 'Recent'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-3 pt-1 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(proj)}
                        className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-white shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-sm font-semibold">Delete Project "{proj.name}"?</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs text-zinc-400">
                              This action permanently removes this workspace and revokes associated gateway routes.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="h-7 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteProject(proj.id)}
                              className="h-7 text-xs bg-rose-600 hover:bg-rose-500 text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <Button
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onSelectProject(proj)}
                      className={`h-6 px-2.5 text-xs font-medium cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-800 text-white border border-zinc-700'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3 h-3 mr-1 text-emerald-400" />
                          <span>Active</span>
                        </>
                      ) : (
                        <span>Select Scope</span>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={projects.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Dialog: Create Project */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl p-0 overflow-hidden sm:rounded-xl">
          {/* Header */}
          <div className="p-7 pb-3 bg-zinc-950">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Workspace Provisioning</span>
            </div>
            <DialogTitle className="text-lg font-semibold tracking-tight text-zinc-100">
              Create Project Workspace
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 mt-2 leading-relaxed">
              Provision an isolated tenant environment with dedicated rate limits, HMAC auth policies, and real-time telemetry.
            </DialogDescription>
          </div>

          {errorMsg && (
            <div className="px-7 pt-2">
              <Alert variant="destructive" className="py-3 bg-rose-950/40 border-rose-800/60 text-rose-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs ml-2 leading-relaxed">{errorMsg}</AlertDescription>
              </Alert>
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="p-7 pt-3 space-y-6 text-sm">
            {/* Project Name */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-zinc-200">
                  Project Name <span className="text-rose-400">*</span>
                </Label>
                <span className="text-xs text-zinc-500 font-mono">Unique identifier</span>
              </div>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ShopNex Core Platform"
                className="bg-zinc-900/90 border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 h-10 px-3.5 transition-colors"
              />
            </div>

            {/* Environment Tier Selectors */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-zinc-200">
                  Target Environment Tier <span className="text-rose-400">*</span>
                </Label>
                <span className="text-xs text-zinc-500 font-mono">Governs rate limits</span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {[
                  { id: 'DEVELOPMENT', label: 'Development', dot: 'bg-emerald-400' },
                  { id: 'TESTING', label: 'Staging / QA', dot: 'bg-amber-400' },
                  { id: 'PRODUCTION', label: 'Production', dot: 'bg-rose-400' }
                ].map((tier) => {
                  const isSelected = environment === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setEnvironment(tier.id)}
                      className={`h-9 px-4 rounded-md text-xs font-mono transition-colors cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-zinc-850 text-white font-semibold border border-zinc-700 shadow-sm'
                          : 'border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-750'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isSelected ? tier.dot : 'bg-zinc-600'}`} />
                      <span>{tier.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-zinc-200">Description</Label>
                <span className="text-xs text-zinc-500 font-mono">Optional</span>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of upstream services, team ownership, or gateway routing scope..."
                className="w-full rounded-md bg-zinc-900/90 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors leading-relaxed resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="text-xs border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white h-9 px-4 shadow-none cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs h-9 px-5 shadow-none cursor-pointer transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Workspace'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Project */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 text-white shadow-2xl">
          <DialogHeader className="pb-3 border-b border-zinc-800/80">
            <DialogTitle className="text-sm font-medium tracking-tight text-zinc-100">
              Edit Project Workspace
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 mt-0.5">
              Update workspace configuration and tier
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <Alert variant="destructive" className="py-2 bg-rose-950/40 border-rose-800/60 text-rose-300">
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs ml-2">{errorMsg}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-300">
                Project Name <span className="text-rose-400">*</span>
              </Label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 focus:border-zinc-600 h-8"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-300">
                Environment Tier
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {envOptions.map((opt) => {
                  const isSelected = environment === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setEnvironment(opt.id)}
                      className={`py-1.5 px-2.5 rounded-md border text-xs font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-800 border-zinc-600 text-white font-semibold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-300">Description</Label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors leading-relaxed resize-none"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-zinc-800/80 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(false)}
                className="text-xs border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white h-7 px-3 shadow-none cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs h-7 px-3.5 shadow-none cursor-pointer transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
