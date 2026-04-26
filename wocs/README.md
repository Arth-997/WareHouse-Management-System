# WOCS: Warehouse Operations & Coordination System

WOCS is a comprehensive, enterprise-grade full-stack application designed to manage complex warehouse operations, inventory tracking, order fulfillment, and multi-tenant client logistics. It features a robust role-based architecture, real-time analytics, and transactional inventory safety.

---

## 🌟 Key Features & Architecture

WOCS is built on a transactional architecture ensuring that physical inventory is never double-spent. The system strictly distinguishes between physical stock (**On Hand**), stock allocated to active orders (**Reserved**), and stock actually available to be used for new orders (**Available**). 

The entire system is guarded by a dynamic, JWT-driven Role-Based Access Control (RBAC) system that scopes data queries so users only see data relevant to their organization.

---

## 👥 Stakeholders & Features

WOCS serves 6 distinct roles, each with a tailored dashboard and permission set:

### 1. IT Administrator (`IT_ADMINISTRATOR`)
**Role:** Global system supervisor.
**Features:**
- Access to the overarching system dashboard showing total Skus, Active Orders, SLA Breaches, and SLA Warnings.
- Full access to view all orders across all clients and warehouses.
- Ability to create orders manually, circumventing customer requests.
- Can advance order states through the FSM (Finite State Machine).
- Can approve/reject customer Order Requests.

### 2. Warehouse Manager (`WAREHOUSE_MANAGER`) & Operator (`WAREHOUSE_OPERATOR`)
**Role:** Floor-level staff executing physical logistics.
**Features:**
- Dashboard access focused on picking, packing, and dispatch times.
- **Inventory Receiving:** Ability to physically receive stock (calling `POST /inventory/receive`), directly increasing the `quantityOnHand`.
- **Inventory Requests:** Can raise restock requests pointing to specific Clients when warehouse levels run low.
- Complete control over advancing order limits (Reserved stock is deducted from On Hand upon `dispatch`).

### 3. Client / Supplier (`CLIENT_USER`)
**Role:** A brand or supplier whose inventory is stored in WOCS warehouses.
**Features:**
- **Scoped Dashboard:** Sees only their own inventory, their own orders, and pending restock requests.
- They cannot see inventory or orders belonging to other Clients.
- **Request Approval:** Ability to approve or reject inventory restock requests sent by Warehouse Operators.

### 4. Customer / Buyer (`CUSTOMER`)
**Role:** The end-user or B2B buyer purchasing stock from the Clients.
**Features:**
- **Customer Portal:** A dedicated, isolated dashboard.
- **Order Requests:** Can build "Order Requests" via a wizard. *Crucial logic: Customer requests do NOT check or reserve inventory immediately.* This prevents customers from tying up stock indefinitely. 
- Can track their own historical orders.

### 5. Finance / Billing (`FINANCE`)
**Role:** Auditing and invoicing.
**Features:**
- High-level, data-rich **Finance Dashboard** featuring Recharts visualizations (Donut charts for Status distributions, Bar charts comparing Active vs Delivered orders per client).
- Comprehensive tables breaking down orders logically by Billing Category (`Storage & Handling`, `Express Fulfillment`, `Cold Storage`).
- Live CSV/Excel export buttons for Billing, Orders, and Inventory snapshots.

---

## 🔄 Core Workflows

### 1. Order Fulfillment & Inventory Reservation Lifecycle (The FSM)
The soul of WOCS is its inventory safety.
*   **Creation:** When an order is created by an Admin/Operator, the system does an atomic validation against `Available` stock (`OnHand` - `Reserved`). If sufficient, it creates the order lines and explicitly increments the `quantityReserved`. It logs an `inventoryMovement` of type `reserve`.
*   **Approval:** When an Admin approves a Customer Request, the same atomic inventory validation and reservation occurs, moving the order from `requested` to `received` status and starting the SLA timers.
*   **Dispatching:** Orders step through `allocated`, `picked`, `packed`, until `dispatched`. Upon dispatch, the goods physically leave the warehouse. The backend permanently deducts the `OnHand` quantity, releases the `Reserved` quantity, and logs a `pick` movement.
*   **Cancellation:** Cancelling an active order automatically releases the `Reserved` stock back to the `Available` pool without altering the `OnHand` physical count.

### 2. Inventory Request Lifecycle
*   Warehouse Operators see stock is low. They use the Inventory Page to create an `InventoryRequest`.
*   The request shows up on the `CLIENT_USER` dashboard as "Pending".
*   The Client approves the request. Eventually, physical stock arrives at the warehouse, the Operator clicks "Receive Stock", and the loop closes.

---

## 📂 Core Architecture & Deep Dive into Main Files

WOCS keeps business logic strictly in the backend services and uses the frontend primarily for presentation and state handling.

### Backend (`/backend/src`)

*   **`/orders/orders.service.ts`** *(Core Logistics Engine)*
    *   `create()`: Handles the transactional creation of orders. Iterates over line items, strictly verifies available stock against the `inventoryPosition` table, and reserves stock. Creates audit trail movements.
    *   `createRequest()`: Used exclusively by Customers. Creates an order with status `requested` but deliberately **skips** inventory checking and reservation.
    *   `approveRequest()`: Admin action. Validates actual inventory for a customer's requested SKUs. If valid, reserves the stock and sets the SLA deadline.
    *   `updateStatus()`: Enforces the logic that moving to `dispatched` means physical stock has left the building, triggering the `quantityOnHand` deduction.
*   **`/inventory/inventory.service.ts`** *(Stock Management)*
    *   `receiveStock()`: The only entry point for physical stock increases. Requires linking a `clientId`, `skuId`, and `warehouseId`.
    *   `findAll()`: Maps database records to the frontend, calculating live variables like `Available` = `quantityOnHand` - `quantityReserved`.
*   **`/reports/reports.service.ts`** *(Analytics Engine)*
    *   `getAnalytics()`: Executes complex Prisma aggregations for the Finance Dashboard. Calculates SLA breach rates (orders past `slaDeadlineAt`), average fulfillment times (creation vs delivery time), warehouse utilization, and top-moving SKUs by aggregating `OrderLine` quantities.
*   **`/auth/jwt.strategy.ts` & `auth.service.ts`** *(Security)*
    *   The `AuthService` signs JWTs. Crucially, if a user is a Client or Customer, their unique `clientId` or `customerId` is baked directly into the JWT payload. The `jwt.strategy` extracts this, allowing backend controllers to strictly filter queries without trusting the frontend.

### Frontend (`/frontend/src/app`)

*   **`pages/OrdersPage.tsx`** *(Fulfillment UI)*
    *   A massive, smart component managing order creation forms.
    *   When an Admin creates an order, the `SKU` dropdown dynamically limits the `max` quantity input to the exact `Available` stock fetched from the backend. 
    *   Render logic splits cleanly based on User Role: Customers see a "Place Request" view, while Admins see an "All Orders" tracking view and an actionable "Review Requests" queue.
*   **`pages/OverviewPage.tsx`** *(The Dashboards)*
    *   Acts as a router container rendering completely different components (`AdminOverview`, `FinanceOverview`, `ClientOverview`, `CustomerOverview`) based on the JWT role.
    *   `FinanceOverview` specifically integrates `recharts` for visual analytics, executing parallel API calls to `/billing` and `/reports/analytics` to fuse financial billing data with physical warehouse logistics.
*   **`pages/InventoryPage.tsx`** *(Stock UI)*
    *   Handles the UI for receiving physical stock.
    *   Provides the table structure for Clients to approve stock restock requests.
*   **`layouts/DashboardLayout.tsx`** *(The Shell)*
    *   Uses a dynamic side-navigation configuration. It maps routing paths to specific roles, ensuring Customers cannot navigate to physical inventory pages, and Clients cannot view global system metrics.
*   **`components/AuthContext.tsx`** *(Session State)*
    *   Manages React Context for login. Captures the JWT upon successful `/auth/login`, saves it to `localStorage`, and keeps the application globally aware of whether the active user is an Admin, Client, or Customer.

---

## 📸 Screenshots

Here are some visual glimpses of the application's core capabilities from our various role-based dashboards:

![Finance Dashboard](file:///home/arth/SOFTWARE%20STUFF/images/Screenshot%20from%202026-04-26%2018-26-29.png)
![Dashboard Overview 1](file:///home/arth/SOFTWARE%20STUFF/images/Screenshot%20from%202026-04-26%2020-43-21.png)
![Dashboard Overview 2](file:///home/arth/SOFTWARE%20STUFF/images/Screenshot%20from%202026-04-26%2020-43-34.png)
![Form / Data View 1](file:///home/arth/SOFTWARE%20STUFF/images/Screenshot%20from%202026-04-26%2020-43-47.png)
![Form / Data View 2](file:///home/arth/SOFTWARE%20STUFF/images/Screenshot%20from%202026-04-26%2020-43-51.png)
![Finance / Analytics 1](file:///home/arth/SOFTWARE%20STUFF/images/Screenshot%20from%202026-04-26%2020-43-58.png)
![Finance / Analytics 2](file:///home/arth/SOFTWARE%20STUFF/images/Screenshot%20from%202026-04-26%2020-44-03.png)
![Orders View](file:///home/arth/SOFTWARE%20STUFF/images/Screenshot%20from%202026-04-26%2020-44-14.png)
![WOCS App](file:///home/arth/SOFTWARE%20STUFF/images/image.png)

---

## 🚀 Getting Started (Run Locally)

### Prerequisites
*   Node.js (v18+)
*   Docker & Docker Compose

### 1. Start Infrastructure
The project relies on Docker to host the isolated PostgreSQL database and Redis cache. You do not need to install Postgres locally.
```bash
cd "/home/arth/SOFTWARE STUFF/wocs"
docker compose up -d
```

### 2. Setup Backend server (NestJS)
```bash
cd backend
npm install
# Push the Prisma schema structure to the new Docker DB
npx prisma db push
# Seed the database with fake clients, warehouses, and users
npx prisma db seed
# Start the API server
npm run start:dev
```

### 3. Setup Frontend server (Vite/React)
Open a new terminal window:
```bash
cd frontend
npm install
# Start the web app
npm run dev
```

### 4. Application Logins
The application is available at `http://localhost:5173`. Based on the default database seeder, try these test accounts to see the different role dashboards:
*   **Admin:** `admin@wocs.com` / `admin123`
*   **Finance:** `finance@wocs.com` / `finance123`
*   **Client (Supplier):** `client1@techbrand.com` / `client123`
*   **Customer (Buyer):** `customer@ravielec.in` / `customer123`
