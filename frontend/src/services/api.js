const API_BASE = '/api';
const GATEWAY_BASE = '/proxy';

export async function fetchJson(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errObj = await res.json();
      if (errObj && errObj.message) {
        errorMsg = errObj.message;
      }
    } catch {
      // Ignore JSON parse failure on non-JSON response
    }
    throw new Error(errorMsg);
  }

  if (res.status === 204) {
    return {};
  }

  return res.json();
}

export const platformApi = {
  // Projects
  async getProjects() {
    return fetchJson(`${API_BASE}/projects`);
  },

  async createProject(data) {
    return fetchJson(`${API_BASE}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteProject(id) {
    return fetchJson(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
    });
  },

  async updateProject(id, data) {
    return fetchJson(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Security Events
  async getSecurityEvents(severity, limit = 50, projectId = null) {
    const params = new URLSearchParams();
    if (severity) params.set('severity', severity);
    if (limit) params.set('limit', limit);
    if (projectId) params.set('projectId', projectId);
    const queryString = params.toString();
    return fetchJson(`${API_BASE}/v1/security-events${queryString ? `?${queryString}` : ''}`);
  },

  // APIs
  async getApis(projectId) {
    return fetchJson(`${API_BASE}/projects/${projectId}/apis`);
  },

  async getAllApis() {
    return fetchJson(`${API_BASE}/apis`);
  },

  async getApiDetails(apiId) {
    return fetchJson(`${API_BASE}/apis/${apiId}`);
  },

  async registerApi(projectId, data) {
    return fetchJson(`${API_BASE}/projects/${projectId}/apis`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteApi(apiId) {
    return fetchJson(`${API_BASE}/apis/${apiId}`, {
      method: 'DELETE',
    });
  },

  async activateApi(apiId) {
    return fetchJson(`${API_BASE}/apis/${apiId}/activate`, {
      method: 'POST',
    });
  },

  async deactivateApi(apiId) {
    return fetchJson(`${API_BASE}/apis/${apiId}/deactivate`, {
      method: 'POST',
    });
  },

  async testConnectivity(apiId) {
    return fetchJson(`${API_BASE}/apis/${apiId}/test-connection`, {
      method: 'POST',
    });
  },

  // API Keys
  async getApiKeys(apiId) {
    return fetchJson(`${API_BASE}/apis/${apiId}/keys`);
  },

  async generateApiKey(apiId, keyName) {
    return fetchJson(`${API_BASE}/apis/${apiId}/keys`, {
      method: 'POST',
      body: JSON.stringify({ keyName: keyName || 'Standard Key' }),
    });
  },

  async revokeApiKey(apiId, keyId) {
    return fetchJson(`${API_BASE}/apis/${apiId}/keys/${keyId}`, {
      method: 'DELETE',
    });
  },

  async updateApi(apiId, data) {
    return fetchJson(`${API_BASE}/apis/${apiId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Health & Service Status
  async checkGatewayHealth() {
    return fetchJson('/actuator/health')
      .catch(() => fetchJson(`${GATEWAY_BASE}/actuator/health`))
      .catch(() => fetchJson('/api/gateway/health'));
  },

  async checkControlPlaneHealth() {
    return fetchJson(`${API_BASE}/control/health`);
  },

  // Traffic & Telemetry
  async getTrafficSummary(targetOrLimit = 100, maybeLimitOrProjectId = null) {
    if (typeof targetOrLimit === 'string' && !/^\d+$/.test(targetOrLimit)) {
      return this.getApiTrafficSummary(targetOrLimit, maybeLimitOrProjectId || 50);
    }
    const limit = typeof targetOrLimit === 'number' ? targetOrLimit : 100;
    const projectId = typeof maybeLimitOrProjectId === 'string' ? maybeLimitOrProjectId : null;
    return this.getOverallTrafficSummary(limit, projectId);
  },

  async getOverallTrafficSummary(limit = 200, projectId = null) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit);
    if (projectId) params.set('projectId', projectId);
    const queryString = params.toString();
    return fetchJson(`${API_BASE}/traffic/summary${queryString ? `?${queryString}` : ''}`);
  },

  async getApiTrafficSummary(apiId, limit = 50) {
    return fetchJson(`${API_BASE}/apis/${apiId}/traffic?limit=${limit}`);
  },

  async getTraffic(limit = 200, projectId = null) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit);
    if (projectId) params.set('projectId', projectId);
    const queryString = params.toString();
    return fetchJson(`${API_BASE}/traffic${queryString ? `?${queryString}` : ''}`);
  },

  async getProjectTraffic(projectId, limit = 200) {
    return fetchJson(`${API_BASE}/projects/${projectId}/traffic?limit=${limit}`);
  },

  async getProjectTrafficSummary(projectId, limit = 100) {
    return fetchJson(`${API_BASE}/projects/${projectId}/traffic/summary?limit=${limit}`);
  },

  // Direct Gateway Test
  async sendGatewayRequest(
    apiId,
    subpath,
    method = 'GET',
    apiKey,
    bodyPayload,
    customHeaders
  ) {
    const cleanSubpath = subpath.startsWith('/') ? subpath : '/' + subpath;
    const url = `${GATEWAY_BASE}/${apiId}${cleanSubpath}`;
    const startTime = performance.now();

    const headers = {
      ...customHeaders
    };
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    if (bodyPayload && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: (method !== 'GET' && method !== 'HEAD' && bodyPayload) ? bodyPayload : undefined,
      });
      const durationMs = Math.round(performance.now() - startTime);
      const resHeaders = {};
      res.headers.forEach((v, k) => {
        resHeaders[k] = v;
      });

      let body;
      try {
        body = await res.json();
      } catch {
        body = await res.text();
      }
      return {
        status: res.status,
        durationMs,
        headers: resHeaders,
        body,
      };
    } catch (e) {
      return {
        status: 0,
        durationMs: Math.round(performance.now() - startTime),
        headers: {},
        body: { error: 'NETWORK_ERROR', message: e.message || 'Failed to connect to gateway' },
      };
    }
  }
};
