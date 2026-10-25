import React, { useState, useEffect } from 'react';
import { platformApi } from './services/api';

import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from './components/layout/AppSidebar';
import AppHeader from './components/layout/AppHeader';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/components/ui/use-toast';

import OverviewView from './components/OverviewView';
import ArchitectureView from './components/ArchitectureView';
import ProjectsView from './components/ProjectsView';
import ApisView from './components/ApisView';
import TrafficMonitoringView from './components/TrafficMonitoringView';
import SecurityPoliciesView from './components/SecurityPoliciesView';
import IncidentsView from './components/IncidentsView';
import SettingsView from './components/SettingsView';
import HelpView from './components/HelpView';
import RegisterApiView from './components/RegisterApiView';
import ApiDetailsModal from './components/ApiDetailsModal';
import KeyManagementModal from './components/KeyManagementModal';
import ConsoleModal from './components/ConsoleModal';

export default function App() {
  // Navigation & Layout
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Core Data
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [apis, setApis] = useState([]);
  const [allApis, setAllApis] = useState([]);
  const [trafficRecords, setTrafficRecords] = useState([]);
  const [trafficStats, setTrafficStats] = useState({
    totalCaptured: 0,
    successCount: 0,
    errorCount: 0,
    avgDurationMs: 0
  });
  const [securityEvents, setSecurityEvents] = useState([]);
  const [trafficScope, setTrafficScope] = useState('project'); // 'project' | 'global'

  // Live Status & Diagnostics
  const [serviceStatus, setServiceStatus] = useState({
    gateway: 'UP',
    controlPlane: 'UP'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshTraffic, setAutoRefreshTraffic] = useState(true);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  // Modals State
  const [detailsApi, setDetailsApi] = useState(null);
  const [keysApi, setKeysApi] = useState(null);
  const [consoleApi, setConsoleApi] = useState(null);

  // Stacked Toast Notifications using shadcn/ui toast system
  const showToast = (type, message, title) => {
    if (type === 'success') {
      toast.success(message, { title });
    } else if (type === 'error') {
      toast.error(message, { title });
    } else if (type === 'warning') {
      toast.warning(message, { title });
    } else if (type === 'info') {
      toast.info(message, { title });
    } else if (type === 'loading') {
      return toast.loading(message, { title });
    } else {
      toast({
        type: type === 'delete' ? 'warning' : type,
        title: title || (type === 'delete' ? 'Deleted' : 'Notice'),
        description: message,
      });
    }
  };

  const loadTrafficData = async (scope = trafficScope, projId = currentProject?.id) => {
    const targetProjId = scope === 'project' ? projId : null;
    if (scope === 'project' && !projId) {
      setTrafficRecords([]);
      setTrafficStats({ totalCaptured: 0, successCount: 0, errorCount: 0, avgDurationMs: 0 });
      return;
    }
    try {
      const summary = await platformApi.getOverallTrafficSummary(200, targetProjId);
      if (summary) {
        if (Array.isArray(summary.recentRequests)) {
          setTrafficRecords(summary.recentRequests);
        }
        setTrafficStats({
          totalCaptured: Number(summary.totalRequests) || (summary.recentRequests ? summary.recentRequests.length : 0),
          successCount: Number(summary.successCount) || 0,
          errorCount: Number(summary.errorCount) || 0,
          avgDurationMs: summary.avgDurationMs || 0
        });
        return;
      }
    } catch {
      // Fallback to getTraffic endpoint if summary endpoint fails
      try {
        const traffic = await platformApi.getTraffic(200, targetProjId);
        if (Array.isArray(traffic)) {
          setTrafficRecords(traffic);
          setTrafficStats((prev) => ({
            ...prev,
            totalCaptured: Math.max(prev?.totalCaptured || 0, traffic.length)
          }));
        }
      } catch (err) {
        console.debug('Traffic telemetry fetch error:', err.message);
      }
    }
  };

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  // Auto-refresh traffic records when streaming is enabled (scoped to selected project or global)
  useEffect(() => {
    if (!autoRefreshTraffic) return;
    if (activeTab === 'traffic' || activeTab === 'overview') {
      const interval = setInterval(async () => {
        try {
          const projId = trafficScope === 'project' ? currentProject?.id : null;
          await loadTrafficData(trafficScope, projId);
        } catch {
          // ignore transient poll errors
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefreshTraffic, activeTab, currentProject?.id, trafficScope]);

  // When switching between Project Scope and Global Scope, reload traffic immediately
  useEffect(() => {
    loadTrafficData(trafficScope, currentProject?.id);
  }, [trafficScope]);

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Projects & All APIs catalogue
      let projectList = [];
      let activeProj = currentProject;
      try {
        projectList = await platformApi.getProjects();
        setProjects(projectList || []);

        // Load all APIs for workspace counts
        try {
          const all = await platformApi.getAllApis();
          setAllApis(Array.isArray(all) ? all : []);
        } catch {
          setAllApis([]);
        }

        if (projectList && projectList.length > 0) {
          if (!activeProj || !projectList.find((p) => p.id === activeProj.id)) {
            activeProj = projectList[0];
            setCurrentProject(activeProj);
          }
          if (activeProj) {
            loadApis(activeProj.id);
          }
        } else {
          setCurrentProject(null);
          setApis([]);
          activeProj = null;
        }
      } catch (err) {
        showToast('error', `Failed to load projects: ${err.message}`);
      }

      // 2. Traffic Telemetry (scoped to active project or global)
      try {
        const projId = trafficScope === 'project' ? activeProj?.id : null;
        await loadTrafficData(trafficScope, projId);
      } catch (err) {
        console.debug('Traffic telemetry poll:', err.message);
      }

      // 3. Security Events (scoped to active project)
      try {
        const projId = activeProj?.id || null;
        const events = await platformApi.getSecurityEvents(undefined, 50, projId);
        setSecurityEvents(Array.isArray(events) ? events : []);
      } catch (err) {
        console.debug('Security events poll:', err.message);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadApis = async (projectId) => {
    if (!projectId) {
      setApis([]);
      return;
    }
    try {
      const apiList = await platformApi.getApis(projectId);
      setApis(Array.isArray(apiList) ? apiList : []);
    } catch (err) {
      showToast('error', `Failed to load APIs: ${err.message}`);
      setApis([]);
    }
  };

  const loadProjectTraffic = async (projectId) => {
    await loadTrafficData('project', projectId);
  };

  const loadProjectSecurityEvents = async (projectId) => {
    if (!projectId) {
      setSecurityEvents([]);
      return;
    }
    try {
      const events = await platformApi.getSecurityEvents(undefined, 50, projectId);
      setSecurityEvents(Array.isArray(events) ? events : []);
    } catch (err) {
      console.debug('Security events fetch error:', err.message);
    }
  };

  const handleSelectProject = (proj) => {
    setCurrentProject(proj);
    loadApis(proj.id);
    if (trafficScope === 'project') {
      loadProjectTraffic(proj.id);
    }
    loadProjectSecurityEvents(proj.id);
    showToast('success', `Switched to project workspace: ${proj.name}`);
  };

  const handleCreateProject = async (data) => {
    const created = await platformApi.createProject(data);
    setProjects((prev) => [created, ...prev]);
    setCurrentProject(created);
    setApis([]);
    setTrafficRecords([]);
    setTrafficStats({ totalCaptured: 0, successCount: 0, errorCount: 0, avgDurationMs: 0 });
    setSecurityEvents([]);
    showToast('success', `Project '${created.name}' created successfully.`);
  };

  const handleUpdateProject = async (id, data) => {
    const updated = await platformApi.updateProject(id, data);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    if (currentProject?.id === id) {
      setCurrentProject(updated);
    }
    showToast('success', `Project '${updated.name}' updated.`);
  };

  const handleDeleteProject = async (id, name) => {
    if (!confirm(`Are you sure you want to delete project '${name}'? All associated APIs and keys will be permanently removed.`)) {
      return;
    }
    try {
      await platformApi.deleteProject(id);
      const remaining = projects.filter((p) => p.id !== id);
      setProjects(remaining);
      if (currentProject?.id === id) {
        const nextProj = remaining[0] || null;
        setCurrentProject(nextProj);
        if (nextProj) {
          loadApis(nextProj.id);
          loadProjectTraffic(nextProj.id);
          loadProjectSecurityEvents(nextProj.id);
        } else {
          setApis([]);
          setTrafficRecords([]);
          setTrafficStats({ totalCaptured: 0, successCount: 0, errorCount: 0, avgDurationMs: 0 });
          setSecurityEvents([]);
        }
      }
      showToast('delete', `Project '${name}' was deleted.`, 'Project Deleted');
    } catch (err) {
      showToast('error', err.message || 'Failed to delete project.');
    }
  };

  const handleManualRefresh = async () => {
    await loadAllData();
    showToast('success', 'Workspace data refreshed.');
  };

  const handleApiRegistered = (newApi) => {
    setApis((prev) => [newApi, ...prev]);
    setAllApis((prev) => [newApi, ...prev]);
    loadAllData();
  };

  const handleToggleApiStatus = async (api) => {
    const isActivating = api.status !== 'ACTIVE';
    try {
      if (isActivating) {
        await platformApi.activateApi(api.id);
      } else {
        await platformApi.deactivateApi(api.id);
      }
      setApis((prev) =>
        prev.map((a) => (a.id === api.id ? { ...a, status: isActivating ? 'ACTIVE' : 'INACTIVE' } : a))
      );
      showToast('success', `API '${api.name}' is now ${isActivating ? 'ACTIVE' : 'INACTIVE'}.`);
    } catch (err) {
      showToast('error', err.message || 'Failed to toggle status.');
    }
  };

  const handleDeleteApi = async (id, name) => {
    if (!confirm(`Are you sure you want to delete '${name}'? Gateway proxy routes and keys will be permanently removed.`)) {
      return;
    }
    try {
      await platformApi.deleteApi(id);
      setApis((prev) => prev.filter((a) => a.id !== id));
      showToast('delete', `API '${name}' permanently removed from gateway.`, 'API Deleted');
    } catch (err) {
      showToast('error', err.message || 'Failed to delete API.');
    }
  };

  const handleTestConnectivity = async (api) => {
    try {
      const res = await platformApi.testConnectivity(api.id);
      setApis((prev) =>
        prev.map((a) =>
          a.id === api.id
            ? { ...a, connectivityStatus: res.connectivityStatus, lastConnectivityCheck: res.checkedAt }
            : a
        )
      );
      if (res.connectivityStatus === 'CONNECTED') {
        showToast('success', `Upstream '${api.name}' connected (${res.latencyMs || 0}ms).`);
      } else {
        showToast('error', res.message || 'Upstream destination is unreachable.');
      }
    } catch (err) {
      showToast('error', err.message || 'Connectivity probe failed.');
    }
  };

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const [gw, cp] = await Promise.allSettled([
        platformApi.checkGatewayHealth(),
        platformApi.checkControlPlaneHealth()
      ]);

      const gwUp = gw.status === 'fulfilled';
      const cpUp = cp.status === 'fulfilled';

      setServiceStatus({
        gateway: gwUp ? 'UP' : 'DOWN',
        controlPlane: cpUp ? 'UP' : 'DOWN'
      });

      showToast('success', 'System diagnostics completed. Microservices health updated.');
    } catch (err) {
      showToast('error', 'Diagnostics encountered an error.');
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-screen overflow-hidden bg-black text-neutral-100 font-sans antialiased">
        {/* Sidebar Navigation using real shadcn Sidebar components */}
        <AppSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          serviceStatus={serviceStatus}
          onOpenKeys={() => {
            if (apis.length > 0) setKeysApi(apis[0]);
            else setActiveTab('apis');
          }}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
          {/* Top Header */}
          <AppHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            projects={projects}
            currentProject={currentProject}
            onSelectProject={handleSelectProject}
            onCreateProjectClick={() => setActiveTab('projects')}
            onRegisterApiClick={() => setActiveTab('register-api')}
            onRefreshData={handleManualRefresh}
            isRefreshing={isRefreshing}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            trafficScope={trafficScope}
            setTrafficScope={setTrafficScope}
            securityEvents={securityEvents}
          />

          {/* Dynamic Views */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-black">
            {activeTab === 'overview' && (
              <OverviewView
                apis={apis}
                projects={projects}
                currentProject={currentProject}
                trafficRecords={trafficRecords}
                trafficStats={trafficStats}
                serviceStatus={serviceStatus}
                securityEvents={securityEvents}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenConsole={() => {
                  if (apis.length > 0) setConsoleApi(apis[0]);
                  else setActiveTab('register-api');
                }}
                onRegisterApi={() => setActiveTab('register-api')}
                onSelectProject={handleSelectProject}
                onCreateProject={() => setActiveTab('projects')}
                onOpenKeys={() => {
                  if (apis.length > 0) setKeysApi(apis[0]);
                  else setActiveTab('apis');
                }}
              />
            )}

            {activeTab === 'architecture' && (
              <ArchitectureView
                serviceStatus={serviceStatus}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'projects' && (
              <ProjectsView
                projects={projects}
                currentProject={currentProject}
                onSelectProject={handleSelectProject}
                onCreateProject={handleCreateProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                apis={allApis.length > 0 ? allApis : apis}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'apis' && (
              <ApisView
                apis={apis}
                currentProject={currentProject}
                onRegisterApiClick={() => setActiveTab('register-api')}
                onOpenKeysModal={(api) => setKeysApi(api)}
                onOpenConsoleModal={(api) => setConsoleApi(api)}
                onOpenDetailsModal={(api) => setDetailsApi(api)}
                onOpenEditModal={(api) => setDetailsApi(api)}
                onTestConnectivity={handleTestConnectivity}
                onToggleStatus={handleToggleApiStatus}
                onDeleteApi={handleDeleteApi}
                searchQuery={searchQuery}
                showToast={showToast}
              />
            )}

            {activeTab === 'register-api' && (
              <RegisterApiView
                projects={projects}
                currentProject={currentProject}
                onSelectProject={handleSelectProject}
                onApiRegistered={handleApiRegistered}
                onNavigate={(tab) => setActiveTab(tab)}
                showToast={showToast}
              />
            )}

            {activeTab === 'traffic' && (
              <TrafficMonitoringView
                trafficRecords={trafficRecords}
                trafficStats={trafficStats}
                apis={apis}
                currentProject={currentProject}
                trafficScope={trafficScope}
                setTrafficScope={setTrafficScope}
                onRefresh={loadAllData}
                isRefreshing={isRefreshing}
                autoRefresh={autoRefreshTraffic}
                setAutoRefresh={setAutoRefreshTraffic}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            )}

            {activeTab === 'incidents' && (
              <IncidentsView
                securityEvents={securityEvents}
                currentProject={currentProject}
                onRefresh={loadAllData}
                isRefreshing={isRefreshing}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'policies' && (
              <SecurityPoliciesView
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                serviceStatus={serviceStatus}
                onRunDiagnostics={handleRunDiagnostics}
                isRunningDiagnostics={isRunningDiagnostics}
                showToast={showToast}
              />
            )}

            {activeTab === 'help' && (
              <HelpView showToast={showToast} />
            )}
          </main>
        </div>

        {/* API Details Modal */}
        <ApiDetailsModal
          api={detailsApi}
          isOpen={Boolean(detailsApi)}
          onClose={() => setDetailsApi(null)}
          onOpenKeysModal={(api) => setKeysApi(api)}
          onOpenConsoleModal={(api) => setConsoleApi(api)}
          onToggleStatus={handleToggleApiStatus}
          onDeleteApi={handleDeleteApi}
          showToast={showToast}
        />

        {/* Key Management Modal */}
        <KeyManagementModal
          api={keysApi}
          isOpen={Boolean(keysApi)}
          onClose={() => setKeysApi(null)}
          showToast={showToast}
        />

        {/* Interactive Gateway Console Modal */}
        <ConsoleModal
          api={consoleApi}
          isOpen={Boolean(consoleApi)}
          onClose={() => setConsoleApi(null)}
          onTrafficGenerated={loadAllData}
          showToast={showToast}
        />

        {/* shadcn Toast Notification Stack */}
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
