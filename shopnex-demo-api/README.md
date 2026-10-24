# ShopNex Demo API — Standalone E-Commerce Backend

A clean, realistic, standalone **Java 21 / Spring Boot 3.4** e-commerce backend built specifically to serve as a target API for integration testing and security validation behind **VEYRION (AI-Based API Security Threat Detection and Risk Assessment Platform)**.

---

## 1. Project Purpose & Architecture

### What is ShopNex Demo API?

ShopNex represents a realistic e-commerce microservice handling **Products**, **Customers**, and **Orders**. 

It is completely decoupled from any security gateways, meaning:
* **Zero VEYRION code or dependencies**: No custom SDKs, filters, or security logic are embedded in this service.
* **Pure business logic**: Handles stock validation, transactional order placement, and data persistence.
* **Dual Execution Modes**: Can run directly on `http://localhost:8081` for local development, or proxied behind the VEYRION API Gateway (`http://localhost:8080/proxy/{apiId}/**`).

```
[ Direct Standalone Testing ]
  Client / Postman ------------> [ ShopNex Demo API : 8081 ]
                                      |
                                      +---> [ PostgreSQL / H2 Database ]

[ VEYRION Protected Integration ]
  Client / Postman
         |
         | Request with X-API-Key to http://localhost:8080/proxy/{apiId}/...
         v
  [ VEYRION API Gateway : 8080 ]
         |
         | 1. SHA-256 Key Validation
         | 2. Rate Limiting (Token Bucket)
         | 3. Method & Path Enforcement
         | 4. SSRF & Payload Sanitization
         | 5. Strips 'X-API-Key'
         v (Forward clean request)
  [ ShopNex Demo API : 8081 ]
         |
         +---> [ PostgreSQL Database ]
```

---

## 2. Prerequisites

* **Java Development Kit (JDK)**: Version 21 or higher (`java -version`)
* **Apache Maven**: Version 3.9 or higher (`mvn -version`)
* **Docker & Docker Compose** (Optional, recommended for containerized PostgreSQL)
* **PostgreSQL**: Version 14+ (if running PostgreSQL directly on host)

---

## 3. Environment Configuration

Copy the provided [`.env.example`](file:///.env.example) to `.env`:

```bash
cp .env.example .env
```

### Configuration Variables

| Variable | Default Value | Description |
|---|---|---|
| `SERVER_PORT` | `8081` | HTTP port where ShopNex listens |
| `DB_HOST` | `localhost` | PostgreSQL host address |
| `DB_PORT` | `5432` | PostgreSQL port (or `5436` in Docker Compose) |
| `DB_NAME` | `shopnex_db` | PostgreSQL database name |
| `DB_USERNAME` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `FLYWAY_ENABLED` | `true` | Automatically apply Flyway schema and seed migrations |
| `MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE` | `health,info` | Actuator endpoints to expose |

---

## 4. Local Database Setup & Flyway Migration Behavior

### Flyway Migrations

The database schema and demo data are managed using versioned Flyway SQL migrations located in `src/main/resources/db/migration/`:

1. **`V1__init_schema.sql`**:
   - Creates `customers`, `products`, `orders`, and `order_items` tables.
   - Enforces relational foreign keys, cascade constraints, and decimal precision (`NUMERIC(10,2)` for prices and `NUMERIC(12,2)` for order totals).
   - Adds indexes on `category`, `customer_id`, and `order_id`.
2. **`V2__seed_demo_data.sql`**:
   - Seeds 3 fictional demonstration customers (Alice Vance, Bob Martin, Charlie Davis).
   - Seeds 8 realistic technology products across categories (*Electronics*, *Audio*, *Wearables*, *Accessories*).

### Setting up Local PostgreSQL

If you already have PostgreSQL installed on your machine:
```bash
# Connect to PostgreSQL CLI
psql -U postgres

# Create the dedicated database
CREATE DATABASE shopnex_db;
CREATE USER shopnex_user WITH ENCRYPTED PASSWORD 'shopnex_secure_password';
GRANT ALL PRIVILEGES ON DATABASE shopnex_db TO shopnex_user;
```

---

## 5. How to Run Using Maven

### Option A: With Local PostgreSQL

Ensure your PostgreSQL instance is running on port 5432 with database `shopnex_db`, then run:

```bash
mvn spring-boot:run
```

The application will start on **`http://localhost:8081`**.

### Option B: Zero-Dependency Local Mode (H2 in PostgreSQL Compatibility Mode)

If you don't have PostgreSQL installed and want to run immediately with zero setup, use the `local` profile:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

This starts ShopNex on port `8081` with an in-memory database that automatically executes all Flyway migrations and seed data.

---

## 6. How to Run Using Docker Compose

Docker Compose provisions both PostgreSQL (on port `5436` to avoid conflicts with local Postgres) and the ShopNex Spring Boot application (on port `8081`).

```bash
# Build and start services in detached mode
docker compose up --build -d

# Check service status
docker compose ps

# View application logs
docker compose logs -f shopnex-api

# Stop all services
docker compose down
```

```

---

## 7. Built-in Minimal Frontend Storefront

ShopNex comes with a minimal, dark-themed storefront embedded directly inside Spring Boot's static resources (`src/main/resources/static/`). It requires no Node.js or bundlers.

Once the service is running, navigate in your browser to:
**`http://localhost:8081`**

### Features Included:
* **Product Catalog**: Live grid with category filtering (*Electronics*, *Audio*, *Wearables*, *Accessories*), instant search debouncing, and sorting (price / title).
* **Cart Drawer**: Responsive slide-out cart with quantity controls, subtotal computation, and persistent local storage.
* **Customer Selection & Checkout**: Choose between demo customers (Alice, Bob, Charlie) and place live transactional orders against `/api/orders`.
* **Order History Drawer**: View real-time order history for each selected customer with itemized breakdown and status badges.
* **Add Product Modal**: Dynamically insert new products with real-time validation against `POST /api/products`.
* **API Health Pill**: Visual indicator reflecting `/api/health` status and latency in real time.

---

## 8. Complete REST API Reference & Examples

### 1. System Health

#### Application Health
```bash
curl -s http://localhost:8081/api/health
```
```json
{
  "status": "UP",
  "service": "shopnex-demo-api",
  "version": "1.0.0",
  "timestamp": "2026-10-22T10:12:06Z"
}
```

#### Spring Boot Actuator Health
```bash
curl -s http://localhost:8081/actuator/health
```
```json
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "diskSpace": { "status": "UP" },
    "ping": { "status": "UP" }
  }
}
```

---

### 2. Products API

#### List Products (Paginated)
```bash
curl -s "http://localhost:8081/api/products?page=0&size=5&sortBy=price&sortDir=asc"
```
```json
{
  "content": [
    {
      "id": 8,
      "name": "Aluminum Laptop Cooling Stand",
      "description": "Ergonomic elevation stand...",
      "price": 29.95,
      "stockQuantity": 80,
      "category": "Accessories",
      "createdAt": "2026-10-22T10:11:48Z",
      "updatedAt": "2026-10-22T10:11:48Z"
    }
  ],
  "pageNumber": 0,
  "pageSize": 5,
  "totalElements": 8,
  "totalPages": 2,
  "last": false
}
```

#### Filter Products by Category
```bash
curl -s "http://localhost:8081/api/products?category=Audio"
```

#### Get Product by ID
```bash
curl -s http://localhost:8081/api/products/1
```

#### Create a Product
```bash
curl -X POST http://localhost:8081/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Charging Pad",
    "description": "15W Fast Qi wireless pad with aluminum base",
    "price": 29.99,
    "stockQuantity": 60,
    "category": "Accessories"
  }'
```

#### Update a Product
```bash
curl -X PUT http://localhost:8081/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ergonomic Mechanical Keyboard v2",
    "description": "Upgraded switches with sound-dampening foam",
    "price": 139.99,
    "stockQuantity": 45,
    "category": "Electronics"
  }'
```

#### Delete a Product
```bash
curl -X DELETE -i http://localhost:8081/api/products/8
# Returns HTTP 204 No Content
```

---

### 3. Customers API

#### Get Customer by ID
```bash
curl -s http://localhost:8081/api/customers/1
```
```json
{
  "id": 1,
  "name": "Alice Vance",
  "email": "alice.vance@example.com",
  "phone": "+1-555-0101",
  "address": "124 Market Street, Suite 400, Austin, TX 78701",
  "createdAt": "2026-10-22T10:11:48Z"
}
```

#### Create Customer
```bash
curl -X POST http://localhost:8081/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Diana Prince",
    "email": "diana.prince@example.com",
    "phone": "+1-555-0199",
    "address": "400 Themyscira Blvd, Gateway City"
  }'
```

---

### 4. Orders API

#### Create an Order (Valid Order)
```bash
curl -X POST http://localhost:8081/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "items": [
      {
        "productId": 1,
        "quantity": 2
      },
      {
        "productId": 2,
        "quantity": 1
      }
    ]
  }'
```
Response:
```json
{
  "id": 1,
  "customerId": 1,
  "customerName": "Alice Vance",
  "totalAmount": 459.48,
  "status": "CONFIRMED",
  "createdAt": "2026-10-22T10:12:39Z",
  "updatedAt": "2026-10-22T10:12:39Z",
  "items": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Ergonomic Mechanical Keyboard",
      "unitPrice": 129.99,
      "quantity": 2,
      "subtotal": 259.98
    },
    {
      "id": 2,
      "productId": 2,
      "productName": "Wireless Noise-Cancelling Headphones",
      "unitPrice": 199.50,
      "quantity": 1,
      "subtotal": 199.50
    }
  ]
}
```

#### Create Order with Insufficient Stock (Negative Test)
```bash
curl -i -X POST http://localhost:8081/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "items": [
      {
        "productId": 1,
        "quantity": 9999
      }
    ]
  }'
```
Response (`400 Bad Request`):
```json
{
  "timestamp": "2026-10-22T10:12:55Z",
  "status": 400,
  "error": "INSUFFICIENT_STOCK",
  "message": "Insufficient stock for product 'Ergonomic Mechanical Keyboard'. Requested: 9999, Available: 48",
  "path": "/api/orders"
}
```

#### List Orders
```bash
curl -s http://localhost:8081/api/orders
```

#### Get Orders for a Customer
```bash
curl -s http://localhost:8081/api/orders/customer/1
```

---

## 9. Testing with Postman

An importable Postman collection is included in the project:
[`postman_collection.json`](file:///home/raizo410/Projects/AI-Based-API-Security-Threat-Detection-and-Risk-Assessment-Platform/shopnex-demo-api/postman_collection.json)

1. Open Postman -> Click **Import** -> Select `shopnex-demo-api/postman_collection.json`.
2. The collection includes preconfigured requests for:
   - System Health
   - Products CRUD
   - Customers
   - Orders (Valid & Stock Boundary Tests)
   - VEYRION Gateway Proxied Calls (with `X-API-Key`)

---

## 10. How to Connect ShopNex Manually Through VEYRION

Follow these exact steps to register and shield ShopNex behind the VEYRION API Security Gateway:

### Step 1: Start ShopNex
Verify ShopNex is running and responding on port 8081:
```bash
curl -s http://localhost:8081/api/health
```

### Step 2: Start VEYRION Platform Services
In the root platform directory, start the VEYRION services:
```bash
# Control plane (8082) & Gateway (8080)
mvn spring-boot:run -pl control-plane &
mvn spring-boot:run -pl gateway &
```

### Step 3: Register ShopNex in VEYRION

You can register via the Web UI (`http://localhost:3000`) or via the Control Plane REST API (`http://localhost:8082`):

#### Via REST API:
```bash
# 1. Create a Project Workspace
curl -X POST http://localhost:8082/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ShopNex E-Commerce",
    "description": "Storefront microservice backend",
    "environment": "DEVELOPMENT"
  }'
# Note the returned "id" (e.g. proj_a1b2c3d4e5f6)

# 2. Register the ShopNex Upstream Target
curl -X POST http://localhost:8082/api/v1/apis \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_a1b2c3d4e5f6",
    "name": "ShopNex Backend API",
    "upstreamBaseUrl": "http://localhost:8081",
    "allowedPathPrefix": "/api",
    "rateLimitRps": 50,
    "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "maxPayloadSizeBytes": 10485760
  }'
# Note the returned "id" (e.g. api_shopnex_demo_123)
```

> **Docker Network Note**:  
> If the VEYRION Gateway is running inside a Docker container while ShopNex is running on your host machine, set `"upstreamBaseUrl": "http://host.docker.internal:8081"`.  
> If both run inside Docker on the same network, use `"upstreamBaseUrl": "http://shopnex-demo-api:8081"`.

### Step 4: Mint an API Key in VEYRION
```bash
curl -X POST http://localhost:8082/api/v1/apis/api_shopnex_demo_123/keys \
  -H "Content-Type: application/json" \
  -d '{ "name": "Test Client Key", "expiresAt": null }'
```
Copy the returned `rawKey` (e.g., `asp_live_5e258cb05d8bb61c778fb3bebd11cb3e...`).

### Step 5: Test Traffic Through the Gateway

#### Test Without Key (Blocked by Gateway):
```bash
curl -i http://localhost:8080/proxy/api_shopnex_demo_123/api/products
# Returns: HTTP/1.1 401 Unauthorized
```

#### Test With Valid Key (Shielded & Proxied):
```bash
curl -i http://localhost:8080/proxy/api_shopnex_demo_123/api/products \
  -H "X-API-Key: asp_live_5e258cb05d8bb61c778fb3bebd11cb3e..."
# Returns: HTTP/1.1 200 OK (Proxied directly from ShopNex on port 8081!)
```

---

## 11. Automated Tests

Run the complete test suite (21 unit and integration tests):

```bash
mvn clean test
```

Test coverage includes:
* Application and Actuator health endpoints
* Product CRUD operations, validation rules, and pagination
* Missing resource responses (404 Not Found)
* Customer creation and unique email constraints
* Transactional order creation and stock decrement logic
* Insufficient stock rejection
* Sanitized error payloads without stack trace leakage

---

## 12. Troubleshooting

### Port 8081 in Use
If port 8081 is already bound by another process:
```bash
# Check what process is using port 8081
lsof -i :8081

# Change the port via environment variable
SERVER_PORT=8091 mvn spring-boot:run
```

### PostgreSQL Connection Refused
```
Connection to localhost:5432 refused.
```
* If running without PostgreSQL, use the local H2 profile:
  ```bash
  mvn spring-boot:run -Dspring-boot.run.profiles=local
  ```
* If running with Docker Compose, ensure the container is healthy:
  ```bash
  docker compose ps
  ```

### Flyway Migration Checksum Mismatch
If you edited an existing migration file after running it, delete the local H2 database or reset PostgreSQL:
```bash
docker compose down -v && docker compose up -d
```
