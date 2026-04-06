import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { OverviewPage } from "./pages/OverviewPage";
import { SLAMonitorPage } from "./pages/SLAMonitorPage";
import { InventoryPage } from "./pages/InventoryPage";
import { OrdersPage } from "./pages/OrdersPage";
import { BillingPage } from "./pages/BillingPage";
import { ReportsPage } from "./pages/ReportsPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { InventoryRequestsPage } from "./pages/InventoryRequestsPage";
import { useAuth, type UserRole } from "./components/AuthContext";

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

/**
 * Role-based route guard.
 * If the user's role is not in the allowed list, redirect to /.
 */
function RoleRoute({ allowed }: { allowed: UserRole[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

const WAREHOUSE_ROLES: UserRole[] = [
  "IT_ADMINISTRATOR",
  "WAREHOUSE_OPERATOR",
  "WAREHOUSE_MANAGER",
  "REGIONAL_OPS_HEAD",
];

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        Component: DashboardLayout,
        children: [
          { index: true, Component: OverviewPage },
          { path: "inventory", Component: InventoryPage },
          { path: "orders", Component: OrdersPage },
          { path: "inventory-requests", Component: InventoryRequestsPage },
          {
            element: <RoleRoute allowed={["IT_ADMINISTRATOR", "FINANCE"]} />,
            children: [{ path: "billing", Component: BillingPage }],
          },
          {
            element: <RoleRoute allowed={WAREHOUSE_ROLES} />,
            children: [{ path: "sla-monitor", Component: SLAMonitorPage }],
          },
          {
            element: <RoleRoute allowed={[...WAREHOUSE_ROLES, "FINANCE"]} />,
            children: [{ path: "reports", Component: ReportsPage }],
          },
          {
            element: <RoleRoute allowed={["IT_ADMINISTRATOR"]} />,
            children: [
              { path: "user-management", Component: UserManagementPage },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "/login",
    Component: LoginPage,
  },
]);