# Environment Variables Specification

This document details all environment variables used across the **AI-Based API Security Threat Detection and Risk Assessment Platform**.

## Security Guidelines

1. **Never commit real credentials**: The `.env` file is excluded from source control via `.gitignore`.
2. **Template only**: Always use `.env.example` as a template for local development or CI/CD pipelines.
3. **No hard-coded secrets**: Secret keys, tokens, and database passwords must be injected via environment variables or secret managers.
4. **Least Privilege**: Services should only be supplied with the environment variables they strictly require.

---

## Variable Reference

### Service Ports

| Variable Name | Default Value | Applicable Service | Description |
|---|---|---|---|
| `GATEWAY_PORT` | `8080` | API Gateway | Public HTTP listening port for Spring Cloud Gateway. |
| `SAMPLE_BACKEND_PORT` | `8081` | Protected Sample Backend | HTTP listening port for the protected sample backend service. |
| `CONTROL_PLANE_PORT` | `8082` | Control Plane | HTTP listening port for security event and platform management. |
| `THREAT_DETECTION_PORT` | `8000` | Threat Detection (Phase 3) | HTTP listening port for the Python FastAPI anomaly detection service. |
| `FRONTEND_PORT` | `3000` | Frontend (Phase 5) | HTTP listening port for the React/Vite administration dashboard. |

### Service-to-Service Communication URLs

| Variable Name | Local Default | Docker Compose Default | Description |
|---|---|---|---|
| `BACKEND_URL` | `http://localhost:8081` | `http://sample-backend:8081` | Target upstream URL that the API Gateway forwards protected `/api/**` traffic to. |
| `THREAT_DETECTION_URL` | `http://localhost:8000` | `http://threat-detection:8000` | URL used by the Gateway to submit request metadata to the AI anomaly engine. |
| `CONTROL_PLANE_URL` | `http://localhost:8082` | `http://control-plane:8082` | Control plane endpoint used for reporting security telemetry and audit events. |

### API Gateway Resilience & Performance

| Variable Name | Default Value | Description |
|---|---|---|
| `GATEWAY_CONNECT_TIMEOUT_MS` | `3000` | Maximum time in milliseconds to establish a connection to downstream services. |
| `GATEWAY_RESPONSE_TIMEOUT_MS` | `5000` | Maximum time in milliseconds to wait for a downstream response before timing out. |
| `GATEWAY_LOG_LEVEL` | `INFO` | Gateway logging level (`DEBUG`, `INFO`, `WARN`, `ERROR`). Sensitive payloads are never logged. |

### PostgreSQL Database (Phase 4)

| Variable Name | Default Value | Description |
|---|---|---|
| `POSTGRES_HOST` | `localhost` | Hostname for PostgreSQL service (`postgres` in Docker Compose). |
| `POSTGRES_PORT` | `5432` | Port for PostgreSQL instance. |
| `POSTGRES_DB` | `api_security_platform` | Primary platform database name. |
| `POSTGRES_USER` | `postgres_user_placeholder` | Database user with access to platform schema. |
| `POSTGRES_PASSWORD` | `postgres_password_placeholder` | Database password (must be provided via secure environment injection). |

### Redis Cache & Rate Limiting (Phase 4)

| Variable Name | Default Value | Description |
|---|---|---|
| `REDIS_HOST` | `localhost` | Hostname for Redis service (`redis` in Docker Compose). |
| `REDIS_PORT` | `6379` | Port for Redis instance. |
| `REDIS_PASSWORD` | `redis_password_placeholder` | Password for Redis authentication. |

### AI Threat Detection Service (Phase 3)

| Variable Name | Default Value | Description |
|---|---|---|
| `THREAT_MODEL_PATH` | `models/isolation_forest.joblib` | Filesystem path to serialized ML model artifact. |
| `THREAT_DETECTION_LOG_LEVEL` | `info` | Python logging level (`debug`, `info`, `warning`, `error`). |
| `RISK_THRESHOLD_MEDIUM` | `0.50` | Normalized score boundary above which requests trigger warning/review. |
| `RISK_THRESHOLD_HIGH` | `0.80` | Normalized score boundary above which requests trigger high-severity alerts/rate limits. |
