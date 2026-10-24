# Control Plane REST API Contract
## AI-Based API Security Threat Detection and Risk Assessment Platform

The Control Plane exposes management APIs on port `8082` (configurable via `CONTROL_PLANE_PORT`). All JSON request and response payloads use UTF-8 and ISO-8601 timestamps.

---

### 1. Project Management APIs

#### 1.1 Create Project
- **Method & Path**: `POST /api/projects`
- **Request Body**:
```json
{
  "name": "E-Commerce Core",
  "description": "Core storefront and order services",
  "environment": "DEVELOPMENT"
}
```
- **Validation**:
  - `name`: String, required, 2-100 characters, unique per tenant.
  - `description`: String, optional, max 500 characters.
  - `environment`: Enum (`DEVELOPMENT`, `TESTING`, `PRODUCTION`), required.
- **Response (201 Created)**:
```json
{
  "id": "proj_a1b2c3d4e5f6",
  "name": "E-Commerce Core",
  "description": "Core storefront and order services",
  "environment": "DEVELOPMENT",
  "createdAt": "2026-10-19T06:00:00Z",
  "updatedAt": "2026-10-19T06:00:00Z"
}
```

#### 1.2 List Projects
- **Method & Path**: `GET /api/projects`
- **Response (200 OK)**:
```json
[
  {
    "id": "proj_a1b2c3d4e5f6",
    "name": "E-Commerce Core",
    "description": "Core storefront and order services",
    "environment": "DEVELOPMENT",
    "apiCount": 2,
    "createdAt": "2026-10-19T06:00:00Z",
    "updatedAt": "2026-10-19T06:00:00Z"
  }
]
```

#### 1.3 Get Project Details
- **Method & Path**: `GET /api/projects/{projectId}`
- **Response (200 OK)**:
```json
{
  "id": "proj_a1b2c3d4e5f6",
  "name": "E-Commerce Core",
  "description": "Core storefront and order services",
  "environment": "DEVELOPMENT",
  "createdAt": "2026-10-19T06:00:00Z",
  "updatedAt": "2026-10-19T06:00:00Z"
}
```

#### 1.4 Update Project
- **Method & Path**: `PUT /api/projects/{projectId}`
- **Request Body**:
```json
{
  "name": "E-Commerce Platform V2",
  "description": "Updated description",
  "environment": "PRODUCTION"
}
```
- **Response (200 OK)**: Updated project payload.

#### 1.5 Delete Project
- **Method & Path**: `DELETE /api/projects/{projectId}`
- **Response**: `204 No Content` (cascades deletion of child API registrations and credentials).

---

### 2. API Registration Management APIs

#### 2.1 Register New API
- **Method & Path**: `POST /api/projects/{projectId}/apis`
- **Request Body**:
```json
{
  "name": "Orders Service",
  "upstreamBaseUrl": "http://localhost:8081",
  "environment": "DEVELOPMENT",
  "allowedMethods": ["GET", "POST", "PUT"],
  "allowedPathPrefix": "/api",
  "connectTimeoutMs": 3000,
  "rateLimitRps": 50,
  "maxRequestBodyBytes": 1048576
}
```
- **Validation**:
  - `name`: 2-100 characters.
  - `upstreamBaseUrl`: Must be a valid HTTP/HTTPS URL, evaluated against SSRF policy.
  - `allowedMethods`: Non-empty set of HTTP methods.
  - `allowedPathPrefix`: Must start with `/`.
  - `connectTimeoutMs`: 500 - 60000 ms.
  - `rateLimitRps`: 1 - 10000 req/sec.
  - `maxRequestBodyBytes`: 1024 - 104857600 bytes.
- **Response (201 Created)**:
```json
{
  "id": "api_789abc",
  "projectId": "proj_a1b2c3d4e5f6",
  "name": "Orders Service",
  "upstreamBaseUrl": "http://localhost:8081",
  "environment": "DEVELOPMENT",
  "allowedMethods": ["GET", "POST", "PUT"],
  "allowedPathPrefix": "/api",
  "connectTimeoutMs": 3000,
  "rateLimitRps": 50,
  "maxRequestBodyBytes": 1048576,
  "status": "ACTIVE",
  "connectivityStatus": "UNTESTED",
  "lastConnectivityCheck": null,
  "gatewayPath": "/proxy/api_789abc",
  "createdAt": "2026-10-19T06:05:00Z",
  "updatedAt": "2026-10-19T06:05:00Z"
}
```

#### 2.2 List APIs for Project
- **Method & Path**: `GET /api/projects/{projectId}/apis`
- **Response (200 OK)**: Array of API registration objects.

#### 2.3 Get API Details
- **Method & Path**: `GET /api/apis/{apiId}`
- **Response (200 OK)**: Single API registration object.

#### 2.4 Update API Registration
- **Method & Path**: `PUT /api/apis/{apiId}`
- **Request Body**: Partial or full API configuration updates.
- **Response (200 OK)**: Updated API registration object.

#### 2.5 Delete API Registration
- **Method & Path**: `DELETE /api/apis/{apiId}`
- **Response**: `204 No Content`.

#### 2.6 Activate / Deactivate API
- **Activate**: `POST /api/apis/{apiId}/activate` -> `200 OK` (`status`: `"ACTIVE"`)
- **Deactivate**: `POST /api/apis/{apiId}/deactivate` -> `200 OK` (`status`: `"INACTIVE"`)

#### 2.7 Test Upstream Connectivity
- **Method & Path**: `POST /api/apis/{apiId}/test-connection`
- **Description**: Probes the upstream base URL with safe timeout and SSRF guardrails.
- **Response (200 OK)**:
```json
{
  "apiId": "api_789abc",
  "connectivityStatus": "CONNECTED",
  "latencyMs": 14,
  "checkedAt": "2026-10-19T06:10:00Z",
  "message": "Upstream service responded successfully."
}
```

---

### 3. API Credential Management APIs

#### 3.1 Generate API Key
- **Method & Path**: `POST /api/apis/{apiId}/keys`
- **Request Body**:
```json
{
  "keyName": "Primary Production Key"
}
```
- **Response (201 Created)**:
```json
{
  "id": "key_uuid_12345",
  "apiId": "api_789abc",
  "keyName": "Primary Production Key",
  "keyPrefix": "asp_live_a1b2c3d4...",
  "apiKey": "asp_live_a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
  "status": "ACTIVE",
  "createdAt": "2026-10-19T06:12:00Z",
  "warning": "Copy this key now. It will NEVER be shown again in plaintext."
}
```

#### 3.2 List API Keys
- **Method & Path**: `GET /api/apis/{apiId}/keys`
- **Response (200 OK)**:
```json
[
  {
    "id": "key_uuid_12345",
    "apiId": "api_789abc",
    "keyName": "Primary Production Key",
    "keyPrefix": "asp_live_a1b2c3d4...",
    "status": "ACTIVE",
    "createdAt": "2026-10-19T06:12:00Z"
  }
]
```
*(Notice: Plaintext `apiKey` and `keyHash` are strictly omitted)*

#### 3.3 Revoke API Key
- **Method & Path**: `DELETE /api/apis/{apiId}/keys/{keyId}`
- **Response**: `204 No Content`.

---

### 4. Safe Traffic Telemetry APIs

#### 4.1 Ingest Gateway Traffic Metadata (Internal)
- **Method & Path**: `POST /api/traffic`
- **Request Body**: Safe request metadata without credentials or body.

#### 4.2 Query Traffic Telemetry for API
- **Method & Path**: `GET /api/apis/{apiId}/traffic`
- **Query Parameters**: `limit` (default 50)
- **Response (200 OK)**:
```json
{
  "apiId": "api_789abc",
  "totalRequests": 142,
  "successCount": 138,
  "errorCount": 4,
  "avgDurationMs": 28.5,
  "recentRequests": [
    {
      "id": "trf_999",
      "timestamp": "2026-10-19T06:15:22Z",
      "httpMethod": "GET",
      "path": "/api/demo/resource",
      "statusCode": 200,
      "durationMs": 24,
      "requestSize": 0,
      "responseSize": 86,
      "clientIp": "127.0.0.1",
      "status": "SUCCESS"
    }
  ]
}
```
