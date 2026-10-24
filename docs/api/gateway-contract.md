# Dynamic API Gateway Runtime Contract
## AI-Based API Security Threat Detection and Risk Assessment Platform

The API Gateway listens on port `8080` (configurable via `GATEWAY_PORT`). It acts as an intelligent, high-throughput reverse proxy that intercepts, authenticates, enforces policies, and securely routes client requests to registered upstream services.

---

### 1. Dynamic Routing Contract

#### 1.1 Proxy Path Structure
All proxied requests must use the standardized routing path:
```http
METHOD /proxy/{apiId}/{subpath}[?query_params]
```

- `{apiId}`: The persistent unique identifier of the registered API (e.g. `api_123` or a UUID).
- `{subpath}`: The destination subpath forwarded to the upstream service.
- Query parameters and request body are faithfully preserved and forwarded.

#### 1.2 Routing Transformation Example
* **Registered API Configuration**:
  * API ID: `api_sample_orders`
  * Upstream Base URL: `http://localhost:8081`
* **Client Request**:
  ```http
  GET /proxy/api_sample_orders/api/demo/resource?category=electronics HTTP/1.1
  Host: localhost:8080
  X-API-Key: asp_live_7a8b9c0d1e2f3...
  ```
* **Transformed Upstream Request**:
  ```http
  GET /api/demo/resource?category=electronics HTTP/1.1
  Host: localhost:8081
  ```
  *(Notice: `X-API-Key` is validated at the gateway and stripped before reaching the upstream)*

---

### 2. Gateway Security & Policy Enforcement

When a request arrives at `/proxy/{apiId}/**`, the gateway sequentially executes the following checks:

| Step | Check | Failure Code | Error Identifier |
|---|---|:---:|---|
| 1 | **API Resolution** | `404 Not Found` | `API_NOT_FOUND` |
| 2 | **Status Check** | `403 Forbidden` | `API_INACTIVE` |
| 3 | **Authentication** | `401 Unauthorized` | `MISSING_API_KEY` / `INVALID_API_KEY` |
| 4 | **HTTP Method** | `405 Method Not Allowed` | `METHOD_NOT_ALLOWED` |
| 5 | **Path Prefix** | `403 Forbidden` | `PATH_PREFIX_FORBIDDEN` |
| 6 | **Payload Size** | `413 Payload Too Large` | `PAYLOAD_TOO_LARGE` |
| 7 | **Rate Limiting** | `429 Too Many Requests` | `RATE_LIMIT_EXCEEDED` |
| 8 | **Upstream Network**| `503 Service Unavailable` / `504 Timeout` | `UPSTREAM_UNAVAILABLE` / `GATEWAY_TIMEOUT` |

---

### 3. Standardized Error Response Payloads

All error responses return clean, non-leaking JSON payloads:

#### 3.1 Unknown API ID (404 Not Found)
```json
{
  "error": "API_NOT_FOUND",
  "message": "Registered API 'api_unknown' was not found or is no longer configured.",
  "path": "/proxy/api_unknown/test",
  "timestamp": "2026-10-19T06:20:00Z"
}
```

#### 3.2 Inactive API (403 Forbidden)
```json
{
  "error": "API_INACTIVE",
  "message": "This registered API is currently disabled/inactive.",
  "path": "/proxy/api_123/resource",
  "timestamp": "2026-10-19T06:20:00Z"
}
```

#### 3.3 Missing or Invalid API Key (401 Unauthorized)
```json
{
  "error": "INVALID_API_KEY",
  "message": "A valid 'X-API-Key' header is required to access this protected API.",
  "path": "/proxy/api_123/resource",
  "timestamp": "2026-10-19T06:20:00Z"
}
```

#### 3.4 Disallowed Method (405 Method Not Allowed)
```json
{
  "error": "METHOD_NOT_ALLOWED",
  "message": "HTTP method 'DELETE' is not allowed for this registered API. Allowed: [GET, POST]",
  "path": "/proxy/api_123/resource",
  "timestamp": "2026-10-19T06:20:00Z"
}
```

#### 3.5 Disallowed Path Prefix (403 Forbidden)
```json
{
  "error": "PATH_PREFIX_FORBIDDEN",
  "message": "Request path '/admin/config' does not match allowed prefix '/api'.",
  "path": "/proxy/api_123/admin/config",
  "timestamp": "2026-10-19T06:20:00Z"
}
```

#### 3.6 Rate Limit Exceeded (429 Too Many Requests)
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded for this API. Configured limit: 50 req/sec.",
  "path": "/proxy/api_123/resource",
  "timestamp": "2026-10-19T06:20:00Z"
}
```

#### 3.7 Payload Too Large (413 Payload Too Large)
```json
{
  "error": "PAYLOAD_TOO_LARGE",
  "message": "Request content length exceeds maximum permitted size of 1048576 bytes.",
  "path": "/proxy/api_123/upload",
  "timestamp": "2026-10-19T06:20:00Z"
}
```

---

### 4. Safe Metadata Telemetry Recording

For every request processed by the gateway, a safe telemetry record is compiled and transmitted asynchronously to the telemetry store:

```json
{
  "apiId": "api_123",
  "httpMethod": "GET",
  "path": "/api/demo/resource",
  "clientIp": "192.168.1.100",
  "statusCode": 200,
  "durationMs": 18,
  "requestSize": 0,
  "responseSize": 86,
  "status": "SUCCESS",
  "timestamp": "2026-10-19T06:20:00Z"
}
```

**Privacy Guarantee**: Under no circumstances are passwords, query secrets, API keys, session tokens, or request/response bodies included in telemetry records.
