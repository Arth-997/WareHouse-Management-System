# WOCS — Unit Test Report

> **Date:** 2026-04-26  
> **Runner:** Jest + ts-jest  
> **Config:** `jest.config.js` (isolatedModules: true)  
> **Total Execution Time:** ~2.5 seconds

---

## Test Results Summary

| Metric | Result |
|--------|--------|
| **Test Suites** | 7 passed, 7 total |
| **Tests** | 107 passed, 107 total |
| **Snapshots** | 0 |
| **Status** | ✅ All Passing |

---

## Coverage Report

### Overall

| Metric | Coverage |
|--------|----------|
| **Statements** | 85.94% |
| **Branches** | 77.50% |
| **Functions** | 73.75% |
| **Lines** | 88.31% |

### Per-Service Breakdown

| Service File | Statements | Branches | Functions | Lines | Notes |
|-------------|-----------|----------|-----------|-------|-------|
| `orders.service.ts` | **97.10%** | 76.47% | **100%** | **96.77%** | Core order lifecycle engine |
| `inventory.service.ts` | **100%** | 90% | **100%** | **100%** | Stock management |
| `auth.service.ts` | **91.37%** | 87.75% | 80% | **95.55%** | Authentication & user CRUD |
| `inventory-requests.service.ts` | **95.23%** | 92.50% | **100%** | **100%** | Restock request lifecycle |
| `dashboard.service.ts` | **96.77%** | 75% | **100%** | **100%** | Admin KPI aggregation |
| `billing.service.ts` | **100%** | 90% | **100%** | **100%** | Client billing aggregation |
| `reports.service.ts` | **100%** | 86.66% | **100%** | **100%** | Analytics engine |

### Not Covered (No Tests Written)

| Service File | Reason |
|-------------|--------|
| `app.service.ts` | Boilerplate NestJS root service |
| `clients.service.ts` | Simple CRUD proxy (thin wrapper over Prisma) |
| `customers.service.ts` | Simple CRUD proxy (thin wrapper over Prisma) |
| `warehouses.service.ts` | Simple CRUD proxy (thin wrapper over Prisma) |
| `prisma.service.ts` | Infrastructure concern (database connection) |

---

## Test Suite Details

### 1. `orders.service.spec.ts` — Order Lifecycle Engine (~30 tests)

**Covers:** The most critical business logic in the application.

| Test Group | # Tests | What is Verified |
|-----------|---------|-----------------|
| `create()` | 7 | Direct order creation, stock validation, reservation, multi-line items, edge cases (missing fields, insufficient stock, zero quantity) |
| `updateStatus()` (FSM) | 8 | Full state machine transitions (received → allocated → picked → packed → dispatched → delivered), invalid transitions (skipping states, backwards moves), inventory deduction on dispatch, SLA breach detection, deliveredAt timestamp |
| `cancel()` | 4 | Cancellation releases reserved stock, unreserve audit log, rejects cancellation of dispatched/delivered orders |
| `createRequest()` | 3 | Customer requests created with status `requested`, NO inventory check performed, validation of required fields |
| `approveRequest()` | 4 | Admin approval validates inventory, reserves stock, sets SLA timers, rejects approval when stock insufficient or wrong status |
| `rejectRequest()` | 3 | Rejection sets status to `rejected`, no inventory released, edge cases |
| `findAll()` / `findOne()` | 5 | Query filtering by clientId, customerId, status, search text |

### 2. `inventory.service.spec.ts` — Stock Management (~15 tests)

| Test Group | # Tests | What is Verified |
|-----------|---------|-----------------|
| `findAll()` | 4 | Calculated `available` field (OnHand - Reserved), clientId scoping, search filters |
| `findOne()` | 2 | Single position lookup, null handling |
| `findSkus()` | 2 | SKU listing, clientId filtering |
| `receiveStock()` | 5 | Incrementing existing positions, creating new positions, audit movement logging, required field validation, zero quantity rejection |

### 3. `auth.service.spec.ts` — Authentication & User Management (~16 tests)

| Test Group | # Tests | What is Verified |
|-----------|---------|-----------------|
| `register()` | 5 | Password hashing with bcrypt, email uniqueness (ConflictException), missing field validation, default role assignment |
| `login()` | 6 | JWT token generation, JWT payload includes `clientId` for CLIENT_USER, `customerId` for CUSTOMER, wrong password rejection, user not found handling |
| `listUsers()` | 2 | User listing, search query filtering |
| `updateUser()` | 2 | User update, NotFoundException for invalid ID |
| `deleteUser()` | 2 | Deletion, empty ID validation |

### 4. `inventory-requests.service.spec.ts` — Restock Workflow (~14 tests)

| Test Group | # Tests | What is Verified |
|-----------|---------|-----------------|
| `create()` | 3 | Pending request creation, required field validation |
| `findAll()` | 3 | Role-based scoping (warehouse staff sees all, CLIENT_USER filtered by clientId) |
| `approve()` | 4 | Status transition, ForbiddenException for cross-client access, pending-only guard |
| `reject()` | 2 | Rejection, cross-client ForbiddenException |
| `confirmReceived()` | 4 | Inventory increment (existing position), new position creation, audit movement, status guards |

### 5. `dashboard.service.spec.ts` — Admin KPIs (~8 tests)

| What is Verified |
|-----------------|
| Unique SKU count (deduplicated), active order count (non-delivered), SLA breach detection (past deadline OR flagged), SLA warning detection (within warning window), recent orders limit (top 5), warehouse capacity calculations, empty data handling |

### 6. `billing.service.spec.ts` — Client Billing (~6 tests)

| What is Verified |
|-----------------|
| Order count aggregation per client, billing category breakdown (storage/express/cold), zero-count handling for clients with no orders, search query filtering, detailed single-client billing lookup |

### 7. `reports.service.spec.ts` — Analytics Engine (~11 tests)

| What is Verified |
|-----------------|
| Total order counts, orders grouped by status/client/warehouse/customer, fulfillment rate calculation, average fulfillment time (hours), SLA breach rate among active orders, inventory aggregation by warehouse (OnHand/Reserved/Available), top-moving SKU ranking by ordered quantity, empty data graceful handling |

---

## How to Run

```bash
# Run all tests
cd backend
npx jest --config jest.config.js --forceExit

# Run with coverage report
npx jest --config jest.config.js --forceExit --coverage

# Run a single test file
npx jest --config jest.config.js test/orders.service.spec.ts --forceExit

# Coverage HTML report is generated at: backend/coverage/lcov-report/index.html
```
