# WOCS — Architectural Document
## Warehouse Operations & Coordination System

> **Purpose:** This document describes the complete technical architecture of WOCS, including system topology, design patterns, database schema, API surface, frontend architecture, and security model. It is intended to be used as a prompt for generating architectural diagrams (system architecture, ER diagrams, sequence diagrams, component diagrams, etc.)

---

## 1. High-Level System Architecture (3-Tier)

WOCS follows a classic **three-tier architecture**:

```
┌──────────────────────────────┐
│     PRESENTATION TIER        │
│  React SPA (Vite + Tailwind) │
│  Port: 5173                  │
└──────────┬───────────────────┘
           │ HTTP/REST (Axios)
           │ JWT Bearer Token
           ▼
┌──────────────────────────────┐
│     APPLICATION TIER         │
│  NestJS REST API (TypeScript)│
│  Port: 3000                  │
│  Base: /api/v1               │
└──────────┬───────────────────┘
           │ Prisma ORM (TCP)
           ▼
┌──────────────────────────────┐
│     DATA TIER                │
│  PostgreSQL 15 (Docker)      │
│  Port: 5433                  │
│  Redis 7 (Docker, Port 6379) │
└──────────────────────────────┘
```

**Deployment Runtime:** All infrastructure services (PostgreSQL, Redis) run as Docker containers via `docker-compose.yml`. The backend (NestJS) and frontend (Vite) run natively on the host via Node.js during development.

---

## 2. Backend Architecture — NestJS

### 2.1 Design Pattern: Modular Monolith

The backend uses the **NestJS Module System**, which is a modular monolith pattern. Each domain concern is encapsulated into its own NestJS Module containing:
- **Controller** (handles HTTP routing, request validation, response serialization)
- **Service** (contains all business logic, database interaction via Prisma)
- **Module** (wires the Controller and Service together and is imported into the root `AppModule`)

### 2.2 Module Breakdown

| Module               | Controller Prefix       | Responsibility                                               |
| -------------------- | ----------------------- | ------------------------------------------------------------ |
| `AuthModule`         | `/api/v1/auth`          | User registration, JWT login, user CRUD, session validation  |
| `OrdersModule`       | `/api/v1/orders`        | Order lifecycle (FSM), customer request workflow              |
| `InventoryModule`    | `/api/v1/inventory`     | Stock positions, SKU registry, stock receiving                |
| `InventoryRequestsModule` | `/api/v1/inventory-requests` | Restock request lifecycle between operators and clients |
| `BillingModule`      | `/api/v1/billing`       | Client billing aggregation by order category                  |
| `ReportsModule`      | `/api/v1/reports`       | Analytics engine (fulfillment rates, SLA metrics, top SKUs)   |
| `DashboardModule`    | `/api/v1/dashboard`     | Admin dashboard KPI aggregation                               |
| `WarehousesModule`   | `/api/v1/warehouses`    | Warehouse registry and configuration                          |
| `ClientsModule`      | `/api/v1/clients`       | Client (supplier/brand) registry                              |
| `CustomersModule`    | `/api/v1/customers`     | Customer (buyer) registry                                     |
| `PrismaModule`       | N/A (injectable)        | Global singleton Prisma client, shared across all modules     |

### 2.3 Key Design Patterns Used

1. **Dependency Injection (DI):** NestJS's built-in IoC container wires services. `PrismaService` is injected into every domain service.
2. **Repository Pattern (via Prisma):** Prisma ORM acts as the data access layer. No raw SQL is used. All queries go through Prisma's type-safe query builder.
3. **Finite State Machine (FSM):** Order status transitions follow a strict FSM: `requested → received → allocated → picked → packed → dispatched → delivered`. Invalid transitions are rejected by the service layer.
4. **Guard Pattern:** `JwtAuthGuard` protects every API endpoint. The frontend route layer has `RoleRoute` guards that restrict navigation by user role.
5. **Strategy Pattern (Passport.js):** Authentication uses the `JwtStrategy` (from `@nestjs/passport`) to validate and extract JWT payloads on every request.

---

## 3. Complete REST API Surface

### 3.1 Authentication (`/api/v1/auth`)
| Method | Endpoint             | Purpose                                          |
| ------ | -------------------- | ------------------------------------------------ |
| POST   | `/auth/register`     | Register a new user                              |
| POST   | `/auth/login`        | Authenticate, returns JWT access token           |
| GET    | `/auth/me`           | Get current user profile from JWT                |
| GET    | `/auth/users`        | List all users (Admin only)                      |
| POST   | `/auth/users`        | Create user (Admin only)                         |
| PATCH  | `/auth/users/:id`    | Update user role/details (Admin only)            |
| DELETE | `/auth/users/:id`    | Remove user (Admin only)                         |

### 3.2 Orders (`/api/v1/orders`)
| Method | Endpoint               | Purpose                                         |
| ------ | ---------------------- | ----------------------------------------------- |
| GET    | `/orders`              | List orders (scoped by JWT role/client/customer) |
| GET    | `/orders/:id`          | Get single order with lines                     |
| POST   | `/orders`              | Create order directly (Admin/Operator) — validates and reserves inventory |
| POST   | `/orders/request`      | Customer submits an order request (NO inventory reservation) |
| PATCH  | `/orders/:id/approve`  | Admin approves a request → validates + reserves inventory    |
| PATCH  | `/orders/:id/reject`   | Admin rejects a customer request                |
| PATCH  | `/orders/:id/status`   | Advance order FSM status (e.g., picked → packed) |
| DELETE | `/orders/:id`          | Cancel order — releases reserved inventory      |

### 3.3 Inventory (`/api/v1/inventory`)
| Method | Endpoint              | Purpose                                         |
| ------ | --------------------- | ----------------------------------------------- |
| GET    | `/inventory`          | List all inventory positions (scoped by client) |
| GET    | `/inventory/skus`     | List all SKUs (for order form dropdowns)        |
| GET    | `/inventory/:id`      | Get a single inventory position                 |
| POST   | `/inventory/receive`  | Receive physical stock into a warehouse         |

### 3.4 Inventory Requests (`/api/v1/inventory-requests`)
| Method | Endpoint                          | Purpose                                  |
| ------ | --------------------------------- | ---------------------------------------- |
| POST   | `/inventory-requests`             | Operator creates a restock request       |
| GET    | `/inventory-requests`             | List all requests (scoped by role)       |
| PATCH  | `/inventory-requests/:id/approve` | Client approves a restock request        |
| PATCH  | `/inventory-requests/:id/reject`  | Client rejects a restock request         |
| PATCH  | `/inventory-requests/:id/received`| Operator confirms physical receipt       |

### 3.5 Other Endpoints
| Method | Endpoint                 | Purpose                                    |
| ------ | ------------------------ | ------------------------------------------ |
| GET    | `/dashboard/stats`       | Admin dashboard KPIs (SKUs, orders, SLA)   |
| GET    | `/billing`               | Client billing summary (by category)       |
| GET    | `/billing/:id`           | Detailed billing for a specific client     |
| GET    | `/reports/analytics`     | Full analytics payload (charts, metrics)   |
| GET    | `/warehouses`            | List all warehouses                        |
| GET    | `/warehouses/:id`        | Get single warehouse config                |
| GET    | `/clients`               | List all clients (suppliers)               |
| GET    | `/customers`             | List all customers (buyers)                |
| GET    | `/customers/:id`         | Get single customer details                |

---

## 4. Database Schema — PostgreSQL via Prisma ORM

### 4.1 Entity-Relationship Summary

The database has **10 models** connected through foreign key relationships:

```
User ──────────────── Client (optional FK: clientId)
  │                     │
  │                     ├── SKU (1:N)
  │                     ├── InventoryPosition (1:N)
  │                     ├── Order (1:N)
  │                     └── InventoryRequest (1:N)
  │
  ├──────────────── Customer (optional FK: customerId)
  │                     │
  │                     └── Order (1:N)
  │
  ├── InventoryMovement (1:N, performedById)
  └── InventoryRequest (creator / responder)

Warehouse ─── InventoryPosition (1:N)
    │          Order (1:N)
    └── InventoryRequest (1:N)

Order ──── OrderLine (1:N, cascading delete)
              │
              └── SKU (N:1)

InventoryPosition ── unique constraint on [warehouseId, clientId, skuId, locationId, batchNumber]
```

### 4.2 Model Details

**User:** Supports 6 roles (`IT_ADMINISTRATOR`, `WAREHOUSE_MANAGER`, `WAREHOUSE_OPERATOR`, `FINANCE`, `CLIENT_USER`, `CUSTOMER`). Has optional foreign keys to `Client` (for suppliers) and `Customer` (for buyers). Supports Google OAuth via `googleId`.

**Warehouse:** Contains operational configuration fields such as `slaWarningLeadHours`, `lowInventoryThresholdPct`, `mandatoryLocationAssignment`, and `notificationFrequency`. Type field supports `storage_only`, `fulfillment`, and `temperature_sensitive`.

**Client:** Represents a supplier/brand whose goods are stored. Has `billingCycleDay` for invoicing logic.

**Customer:** Represents a B2B buyer/end-consumer who receives orders. Stores contact info and a JSON `address` field.

**SKU:** Tied to a specific `Client`. Tracks `storageType` (normal/cold), and has boolean toggles for `trackBatch`, `trackExpiry`, and `trackSerial`.

**InventoryPosition:** The core inventory record. Tracks `quantityOnHand` (physical stock) and `quantityReserved` (allocated to active orders). The difference (`OnHand - Reserved`) equals `Available`. Has a composite unique constraint `[warehouseId, clientId, skuId, locationId, batchNumber]` ensuring one position per warehouse+client+SKU+location+batch combination.

**Order:** Links a `Client`, `Customer`, and `Warehouse`. Tracks the FSM `status` field, SLA timers (`slaStartAt`, `slaDeadlineAt`, `slaBreached`), shipping metadata (`priority`, `shippingMethod`, `billingCategory`), and lifecycle timestamps (`dispatchedAt`, `deliveredAt`).

**OrderLine:** A line item on an order, linking a `SKU` and `quantity`. Cascading delete ensures lines are removed when an order is cancelled.

**InventoryMovement:** An immutable audit log of all stock changes. Records `movementType` (`receive`, `pick`, `adjust`, `transfer`, `reserve`, `unreserve`), before/after quantities, and the `performedById` user.

**InventoryRequest:** A restock request from a warehouse operator to a client. Tracks `status` (`pending`, `approved`, `rejected`, `received`), the requesting user, and the responding user.

---

## 5. Frontend Architecture — React SPA

### 5.1 Technology Choices

| Technology        | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| React 19          | Component framework (functional components + hooks)        |
| Vite 7            | Build tool and dev server (ESM-based, fast HMR)            |
| React Router v7   | Client-side routing with nested layouts                    |
| Tailwind CSS v4   | Utility-first CSS framework for all styling                |
| Recharts          | Charting library (PieChart, BarChart) for Finance dashboard|
| Lucide React      | Icon library (consistent SVG icon set)                     |
| Axios             | HTTP client with request interceptors for JWT injection    |

### 5.2 Component Architecture

```
App.tsx (RouterProvider)
  └── routes.tsx (createBrowserRouter)
        ├── /login → LoginPage
        └── / (ProtectedRoute guard)
              └── DashboardLayout (sidebar + topbar shell)
                    ├── / (index) → OverviewPage
                    │     ├── AdminOverview (role: ADMIN/MANAGER/OPERATOR)
                    │     ├── FinanceOverview (role: FINANCE) — Recharts
                    │     ├── ClientOverview (role: CLIENT_USER)
                    │     └── CustomerOverview (role: CUSTOMER)
                    ├── /inventory → InventoryPage (RoleRoute guard)
                    ├── /inventory-requests → InventoryRequestsPage
                    ├── /orders → OrdersPage
                    │     ├── Tab: All Orders / My Orders
                    │     ├── Tab: Place Order (Customer only)
                    │     └── Tab: View Requests (Admin/Operator only)
                    ├── /billing → BillingPage (RoleRoute: ADMIN, FINANCE)
                    ├── /sla-monitor → SLAMonitorPage (RoleRoute: Warehouse roles)
                    ├── /reports → ReportsPage (RoleRoute: Warehouse + FINANCE)
                    └── /user-management → UserManagementPage (RoleRoute: ADMIN only)
```

### 5.3 State Management

- **No global state library** (no Redux/Zustand). The app uses React Context (`AuthContext`) for authentication state and local `useState`/`useEffect` for page-level data fetching.
- **Session Persistence:** JWT is stored in `localStorage`. On app load, `AuthContext` reads the token, decodes user info (role, clientId, customerId), and hydrates the React tree. Sessions persist across page reloads until explicit logout.

### 5.4 API Communication Pattern

- A single Axios instance (`lib/api.ts`) is configured with `baseURL: http://localhost:3000/api/v1`.
- A **request interceptor** automatically attaches the `Authorization: Bearer <token>` header to every outgoing request.
- Each page component owns its own data lifecycle (fetch on mount, loading/error states, refresh triggers).

### 5.5 Role-Based Route Guards

Two levels of route guards exist:
1. **`ProtectedRoute`:** Wraps the entire dashboard. If `isAuthenticated` is false, redirects to `/login`.
2. **`RoleRoute`:** Wraps specific sections. Accepts an `allowed: UserRole[]` array. If the user's role is not in the list, they are redirected to `/` (the dashboard home).

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
[Browser] --POST /auth/login {email, password}--> [NestJS AuthService]
                                                        │
                                                  bcrypt.compare(password, hash)
                                                        │
                                               JWT signed with HS256
                                               Payload: { sub, email, role, clientId?, customerId? }
                                                        │
[Browser] <-- { access_token } ─────────────────────────┘
        │
        └── Stores in localStorage
        └── Axios interceptor injects into all subsequent requests
```

### 6.2 Authorization Model

- **Backend:** The `JwtAuthGuard` (a NestJS Guard using Passport `jwt` strategy) protects all endpoints. The JWT payload is extracted and attached to `request.user`. Services use `request.user.clientId` and `request.user.customerId` to scope database queries — ensuring **data isolation** between tenants.
- **Frontend:** `RoleRoute` guards at the routing level prevent unauthorized navigation. The sidebar in `DashboardLayout` dynamically filters nav items based on the user's role from `AuthContext`.

### 6.3 Data Scoping (Multi-Tenancy)

This is a **single-database, shared-schema multi-tenancy** approach:
- `CLIENT_USER` users have a `clientId` baked into their JWT. All inventory and order queries are filtered by this `clientId`, so they can only see their own brand's data.
- `CUSTOMER` users have a `customerId` baked into their JWT. They can only see orders where `order.customerId` matches their own.
- `IT_ADMINISTRATOR` and `FINANCE` roles have no scoping filter — they see all data globally.

---

## 7. Key Business Logic Patterns

### 7.1 Inventory Reservation (Optimistic Locking)
When an order is created or a customer request is approved, the system performs:
1. Query `InventoryPosition` for the SKU at the specified warehouse.
2. Calculate `available = quantityOnHand - quantityReserved`.
3. If `requestedQty > available`, reject with an error.
4. If sufficient, atomically increment `quantityReserved` by the requested quantity.
5. Log an `InventoryMovement` with type `reserve`.

### 7.2 Inventory Deduction (on Dispatch)
When an order transitions to `dispatched`:
1. Decrement `quantityOnHand` by the reserved quantity.
2. Decrement `quantityReserved` by the same amount.
3. Log an `InventoryMovement` with type `pick`.

### 7.3 SLA Monitoring
- Upon order creation/approval, `slaStartAt` is set to `now()` and `slaDeadlineAt` is calculated as `now + 48 hours` (configurable per warehouse via `slaWarningLeadHours`).
- The frontend SLA Monitor page polls `/orders` every 30 seconds and recalculates time-left client-side.
- Orders where `now > slaDeadlineAt` are flagged as `slaBreached = true`.

### 7.4 CSV Export (Client-Side Generation)
The Finance dashboard generates CSV files entirely in the browser using `Blob` + `URL.createObjectURL`. No server-side file generation is needed. Three export types: Billing Summary, Orders by Status, and Inventory by Warehouse.

---

## 8. Diagram Prompts for Gemini

Use the following prompts to generate architectural diagrams from this document:

### System Architecture Diagram
> "Generate a professional system architecture diagram for a 3-tier web application called WOCS. The Presentation Tier is a React SPA (Vite, Tailwind CSS, Recharts) running on port 5173. It communicates via REST/HTTP with JWT Bearer tokens to the Application Tier, which is a NestJS API server on port 3000. The Application Tier uses Prisma ORM to connect to a PostgreSQL 15 database running in Docker on port 5433, and also connects to Redis 7 on port 6379. Show the Docker Compose boundary around PostgreSQL and Redis. Show the Axios interceptor injecting JWT tokens between the SPA and the API."

### Database ER Diagram
> "Generate a detailed Entity-Relationship diagram for a PostgreSQL database with these entities: User (id, role, name, email, password, googleId, clientId FK, customerId FK), Warehouse (id, code, name, type, slaWarningLeadHours, lowInventoryThresholdPct), Client (id, code, name, contactEmail, billingCycleDay), Customer (id, code, name, contactEmail, address JSON), SKU (id, clientId FK, skuCode, description, storageType, trackBatch, trackExpiry, trackSerial), InventoryPosition (id, warehouseId FK, clientId FK, skuId FK, locationId, batchNumber, quantityOnHand, quantityReserved — unique constraint on [warehouseId, clientId, skuId, locationId, batchNumber]), Order (id, orderRef, warehouseId FK, clientId FK, customerId FK, status, priority, shippingMethod, billingCategory, slaStartAt, slaDeadlineAt, slaBreached), OrderLine (id, orderId FK cascade, skuId FK, quantity), InventoryMovement (id, movementType, referenceType, referenceId, quantityBefore, quantityChange, quantityAfter, performedById FK), InventoryRequest (id, warehouseId FK, clientId FK, skuId FK, requestedQty, status, requestedById FK, respondedById FK). Show all 1:N and N:1 relationships with cardinality."

### Order FSM (State Machine) Diagram
> "Generate a Finite State Machine diagram for an order lifecycle in a warehouse management system. The states are: requested, received, allocated, picked, packed, dispatched, delivered, rejected. Transitions: requested → received (on admin approval, triggers inventory reservation), requested → rejected (on admin rejection), received → allocated → picked → packed → dispatched (linear progression, dispatch triggers inventory deduction from OnHand), dispatched → delivered. Any state before dispatched can transition to cancelled (triggers inventory unreservation). Use distinct colors for each state."

### Frontend Component Tree Diagram
> "Generate a React component tree diagram. The root is App.tsx which renders a RouterProvider. The router has two top-level branches: /login renders LoginPage, and / is wrapped in a ProtectedRoute guard that renders DashboardLayout (a sidebar + topbar shell). Inside DashboardLayout, the index route renders OverviewPage which conditionally renders one of: AdminOverview, FinanceOverview (with Recharts PieChart and BarChart), ClientOverview, or CustomerOverview based on user role. Nested routes include: /inventory → InventoryPage (guard: warehouse + client roles), /orders → OrdersPage (with tabs: All Orders, Place Order for customers, View Requests for admins), /billing → BillingPage (guard: admin + finance), /sla-monitor → SLAMonitorPage (guard: warehouse roles), /reports → ReportsPage (guard: warehouse + finance), /user-management → UserManagementPage (guard: admin only). Show the RoleRoute guards wrapping protected sections."

### Sequence Diagram — Customer Order Request Flow
> "Generate a UML sequence diagram showing a Customer Order Request flow. Participants: Customer Browser, React Frontend, NestJS API, Prisma ORM, PostgreSQL. Flow: (1) Customer fills order form and clicks Submit. (2) Frontend POSTs to /api/v1/orders/request with {warehouseId, clientId, customerId, lines: [{skuId, qty}]}. (3) API creates Order with status='requested' — NO inventory check. (4) Admin logs in and sees the request in View Requests tab. (5) Admin clicks Approve. (6) Frontend PATCHes /api/v1/orders/:id/approve. (7) API queries InventoryPosition for each SKU at the specified warehouse. (8) API calculates available = quantityOnHand - quantityReserved. (9) If available >= requested: API increments quantityReserved, creates InventoryMovement(type: reserve), sets slaStartAt and slaDeadlineAt, updates order status to 'received'. (10) Response returned to frontend. Show error path if inventory insufficient."

### Security & Multi-Tenancy Diagram
> "Generate a diagram showing the multi-tenancy and security architecture. Show a single PostgreSQL database with a shared schema. Show three user types logging in: Admin (sees all data), Client/Supplier (JWT contains clientId — all queries filtered by clientId), Customer/Buyer (JWT contains customerId — only sees own orders). Show the JWT payload structure: {sub, email, role, clientId?, customerId?}. Show the NestJS JwtAuthGuard extracting the payload and the Service layer filtering queries. On the frontend side, show AuthContext providing user role to RoleRoute guards that filter navigation items."
