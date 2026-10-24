# Security Architecture and Protection Model
## AI-Based API Security Threat Detection and Risk Assessment Platform

### 1. Overview and Core Tenets
Security is an intrinsic requirement built into every layer of the platform from the first milestone:
1. **Zero Secret Exposure**: Plaintext credentials, tokens, passwords, authorization headers, and sensitive body payloads are never stored in plaintext, never logged to standard output, and never exposed in API responses.
2. **Server-Side Validation**: Never trust client-supplied project IDs, upstream target URLs, rate limits, or risk scores. All data must be validated against schema constraints, server-side policies, and project tenancy.
3. **Decoupled Security Boundaries**: Management/Control Plane access credentials are fully decoupled from Gateway client runtime credentials.
4. **Resilient Failure Modes**: Downstream failures or network timeouts in upstream APIs or telemetry sinks fail gracefully with standardized, non-leaking JSON error envelopes.
5. **Defense in Depth**: Layered protections combine SSRF prevention, dynamic authorization, cryptographic key hashing, HTTP method/path white-listing, and request-size bounds.

---

### 2. Server-Side Request Forgery (SSRF) Defense

Because developers can register custom upstream URLs for their APIs, the platform implements comprehensive SSRF protection to prevent attackers from utilizing the Gateway or Control Plane as an internal network probe.

#### 2.1 URL Syntax and Scheme Validation
- **Permitted Schemes**: Only `http` and `https` schemes are accepted. All other protocols (`file://`, `gopher://`, `ftp://`, `ldap://`) are rejected with `400 Bad Request`.
- **Port Ranges**: Ports must fall within valid TCP ranges (1 - 65535).
- **Malformed Hostnames**: Hostnames with userinfo (e.g. `http://user:pass@host/`) or invalid characters are strictly rejected.

#### 2.2 Prohibited Destination Ranges
By default, the platform rejects all attempts to register or probe destinations resolving to:
- **Loopback Addresses**: `127.0.0.0/8`, `::1`
- **Private RFC 1918 Ranges**: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
- **Link-Local Addresses**: `169.254.0.0/16`
- **Cloud Metadata Endpoints**: `169.254.169.254`, `metadata.google.internal`
- **Multicast & Reserved**: `224.0.0.0/4`, `240.0.0.0/4`, `0.0.0.0/8`

#### 2.3 Controlled Local Development Policy
In local development environments (where `platform.security.allow-local-development=true`), local loopback and container hostnames (`localhost`, `127.0.0.1`, `sample-backend`) are permitted specifically for testing local APIs. In production mode (`allow-local-development=false`), these internal addresses are unconditionally blocked.

#### 2.4 DNS Rebinding Mitigations
- Hostnames are resolved to IP addresses and validated against the restricted subnet rules prior to saving registrations and at upstream connectivity test time.
- Redirect following is restricted or disabled to prevent open redirects from bypassing initial destination checks.

---

### 3. API Credential Architecture

The platform uses a cryptographically secure API key authentication mechanism:

#### 3.1 Key Generation
- Keys are generated using `java.security.SecureRandom` producing 32 cryptographically random bytes (256 bits of entropy).
- Keys are formatted with a recognizable prefix: `asp_live_<random_hex>`.

#### 3.2 Key Storage & Hashing
- Plaintext API keys are **never stored** in the database.
- A cryptographic hash (SHA-256) is computed upon creation and stored in the persistent database (`key_hash`).
- An identifiable public prefix (e.g., `asp_live_a1b2c3d4...`) is retained to allow users to identify and manage keys in the UI without exposing the secret.

#### 3.3 Single-Display Creation
- The full plaintext API key is returned **strictly once** in the creation response (`POST /api/apis/{apiId}/keys`).
- All subsequent list or detail queries return only metadata: Key ID, prefix, status, creation timestamp, and last used timestamp.

#### 3.4 Key Rotation & Revocation
- Keys can be instantly revoked (`DELETE /api/apis/{apiId}/keys/{keyId}`).
- Revocation status is checked at the Gateway on each proxied request, immediately rejecting requests authenticated with revoked keys.

---

### 4. Gateway Runtime Protection & Data Privacy

#### 4.1 Header Sanitization
- Incoming client credentials sent via `X-API-Key` or `Authorization: Bearer <key>` are verified at the Gateway.
- The platform credential header (`X-API-Key`) is stripped prior to forwarding the request upstream, ensuring that platform keys are never leaked to external or third-party upstreams.

#### 4.2 Logging Privacy
- Log messages use structured formats that log: HTTP method, normalized path, status code, latency (ms), client IP, and byte counts.
- Loggers explicitly suppress:
  - `Authorization` and `Proxy-Authorization`
  - `X-API-Key`
  - `Cookie` and `Set-Cookie`
  - Raw request and response body payloads

#### 4.3 Request Size & Volumetric Limits
- Requests with `Content-Length` exceeding the configured `maxRequestBodyBytes` (default 1 MB) are rejected with `413 Payload Too Large`.
- In-memory token bucket rate limiters reject excessive requests per API registration with `429 Too Many Requests`.

---

### 5. Tenancy & Isolation
- Each registered API belongs to an explicit `projectId`.
- Cross-project access is strictly prevented. Management APIs enforce that an API registration can only be retrieved, modified, or deleted within the context of its parent project.
