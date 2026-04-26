# WOCS (Warehouse Operations & Coordination System) - UI/UX Structure Document

## Project Overview
**What it does:**
WOCS is a B2B SaaS platform for Third-Party Logistics (3PL) warehouse management. It acts as the central coordination hub where multiple stakeholders—warehouse operators, finance teams, system admins, and external clients (brands whose stock is stored)—can log in to track inventory, fulfill orders, monitor SLAs (Service Level Agreements), manage billing, and request stock replenishments.

The app is built around **Role-Based Access Control (RBAC)**, meaning the UI heavily adapts based on who is logged in. 

**Target Vibe/Aesthetic:**
Modern, data-dense, dark mode by default (slate/navy/purple neon accents), sleek, and highly functional. It should feel like a professional command center.

---

## Core Layout Structure
The application uses a standard full-width dashboard layout.

**1. Left Sidebar (Fixed, 250px-300px wide)**
- **Top:** Application Logo ("WOCS") and an environment badge (e.g., "Phase 1 Core").
- **Middle (Navigation Links):** Overview, Inventory, Orders, Stock Requests, Billing, SLA Monitor, Reports, User Management. *(Note: Links are hidden depending on user role).*
- **Bottom:** Logged-in User Profile. Shows a rounded avatar, User Name, User Role, and quick action buttons (Settings, Log Out).

**2. Top Header (Sticky)**
- **Left:** Welcome message ("Welcome back, [Name]") and the current date.
- **Right:** Notification Bell icon (with a red unread dot).

**3. Main Content Area**
- Occupies the rest of the screen. Holds the page title, action buttons, and main data blocks (tables, cards, forms).

---

## Page-by-Page UI Components

### 1. Authentication (Login Page)
- **Components:** Centered floating card on a dark, subtly animated background.
- **Form:** Email input, Password input, "Sign In" primary button.
- **Styling:** Glassmorphism card, bold branding.

### 2. Overview Page (Dashboard)
This page changes based on the user's role.
- **Top Section (All Roles):** A row of 3 or 4 KPI Summary Cards. Each card has an Icon, Title (e.g., "Total Orders", "Active Inventory"), and a large number.
- **Admin/Warehouse View Components:**
  - *Warehouse Status Grid:* Small cards showing a colored dot (Active/Inactive), Warehouse Name, Location, and a percentage representing Capacity Used.
  - *Recent Orders Table:* A quick list of the latest 5 orders across all warehouses.
- **Finance View Components:**
  - *Billing by Client List:* A clean vertical list where each row shows a Client Name, and their order breakdown (Total, Delivered, Active).
- **Client View Components:**
  - Shows only *their* recent orders and *their* pending stock requests natively.

### 3. Inventory Page
- **Header:** "Global Inventory Status" / "My Inventory" + A Search Input field.
- **Main Component:** A large, sortable Data Table.
  - *Columns:* SKU Code, Item Description, Client, Warehouse, On Hand Qty, Reserved Qty, Available Qty, Storage Type.
  - *UI Elements:* Small colored pill badges for Storage Type (e.g., "Ambient" in gray, "Cold" in blue, "Hazardous" in red/orange).

### 4. Orders Page
- **Header:** "Orders Management" + Search Input field.
- **Main Component:** A large Data Table.
  - *Columns:* Order Ref ID, internal Ref, Warehouse, Client, Status, Priority, SLA Deadline.
  - *UI Elements:* Pill badges for Status (Pending, Picking, Dispatched, Delivered) and Priority (High, Normal, Low).

### 5. Stock Requests Page (Inventory Requests Workflow)
This is a collaborative page between the Warehouse and the Client.
- **Header Actions:** "New Request" button (visible to Warehouse only).
- **Create Form (Collapsible/Modal style):** 
  - Dropdowns for: Warehouse, Client, SKU.
  - Number input for Quantity.
  - Textarea for Notes.
  - Primary "Submit" button.
- **Pending Requests Section:** A grid of cards holding actionable requests.
  - Shows SKU, Warehouse, Client, Qty requested, and Notes.
  - *Client Actions:* "Approve" (green button) and "Reject" (red button).
- **History Table:** A standard table logging all past stock requests, their settled status (Approved, Rejected, Received), and an action to "Confirm Receipt" once the physical stock arrives.

### 6. SLA Monitor Page
- **Purpose:** To visualize orders that are close to missing their delivery deadlines.
- **Components:** 
  - Visual lists or Kanban-style columns: "Breached" (Red highlight), "At Risk" (Yellow highlight), "On Track" (Green/Neutral).
  - Countdown timers next to order IDs.

### 7. Billing Page (Finance Only)
- **Main Component:** Complex Data Table or Card Grid.
  - Shows Client details, their chosen Billing Cycle, and a breakdown of the *types* of fulfillment they owe money for (e.g., Standard Fulfillment vs Rush Fulfillment).

### 8. User Management Page (Admin Only)
- **Header Actions:** "Add New User" button.
- **Main Component:** User directory table showing Avatar, Name, Email, Role, and timestamp of creation.
- **Action Menu:** Edit, Reset Password, Delete user.

---

## Global UI Elements for Figma Component Library
If you are building the Figma design system, focus on these reusable components:
- **Badge / Pill:** For Statuses (Success/Warning/Error/Neutral) and Priorities.
- **KPI Card:** Standardized rectangular card containing a top-left/right icon, top-left label, and massive bottom-left number.
- **Data Table row:** Clean padding, subtle hover states, monospaced fonts for IDs/SKUs.
- **Inputs:** Dark-themed text inputs, dropdown selects, and textareas with a vibrant focus ring (e.g., bright purple `#7c3aed`).
- **Buttons:** Primary (vibrant gradient or solid brand color), Secondary (subtle outline or ghost), Danger (red footprint), Success (emerald footprint).

---

## Interactive Flow Structure (User Journeys)

### Flow 1: Authentication & Routing
1. **[Start]** User visits `/login`.
2. Encounters the centralized **Login Card** (Email + Password).
3. Clicks **[Sign In]**.
4. System checks role and routes to `/` (Overview Page).
5. The **Sidebar Navigation** dynamically re-renders to hide unauthorized links (e.g., hiding Billing from Clients).

### Flow 2: Creating a Stock Request (Warehouse Operator)
1. **[Start]** Warehouse user clicks **[Stock Requests]** in Sidebar.
2. Clicks the **[+ New Request]** button in the header.
3. A form area expands. User selects Target Client & SKU using dropdowns, enters quantity.
4. Clicks **[Submit Request]**.
5. The request immediately populates in the "History Table" with a yellow **[Pending]** status pill.

### Flow 3: Approving a Stock Request (Client User)
1. **[Start]** Client user logs in and lands on their tailored **Overview Page**.
2. Client sees the **"Pending Requests" KPI Card** showing a high number.
3. Client clicks **[Stock Requests]** in Sidebar.
4. Lands on the page and sees a highlighted **Pending Requests Section**.
5. Client clicks the green **[Approve]** button on a specific request card.
6. The card vanishes from "Pending" and moves to the History Table below with a green **[Approved]** status pill.

### Flow 4: Confirming Stock Delivery (Warehouse Operator)
1. **[Start]** Truck arrives at the warehouse with the approved stock.
2. Warehouse Operator clicks **[Stock Requests]** in Sidebar.
3. Looks at the "History Table" and finds the request with the **[Approved]** status.
4. Operator clicks the blue **[Confirm Receipt]** inline table action button.
5. The request status changes to blue **[Received]**.
6. (Behind the scenes) The physical inventory count increments and logs an inventory movement.

### Flow 5: SLA Monitoring & Mitigation (Warehouse Manager)
1. **[Start]** Manager clicks **[SLA Monitor]** in Sidebar.
2. Scans the columns, noticing an order in the red **[Breached]** column.
3. Manager clicks the specific Order ID.
4. Explores the details (Client, SKU, Priority).
5. Manager coordinates via external chat to prioritize shipping.

### Flow 6: Billing Review (Finance)
1. **[Start]** Finance user clicks **[Billing]** in Sidebar.
2. Reviews the top-level **KPI Cards** (Total Orders processed).
3. Scrolls through the **Billing Grid**, expanding standard vs. rush fulfillment counts.
4. Synthesizes data to generate end-of-month invoices out-of-band.
