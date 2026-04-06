import { createBrowserRouter } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { OverviewPage } from "./pages/OverviewPage";
import { SLAMonitorPage } from "./pages/SLAMonitorPage";
import { InventoryPage } from "./pages/InventoryPage";
import { OrdersPage } from "./pages/OrdersPage";
import { BillingPage } from "./pages/BillingPage";
import { ReportsPage } from "./pages/ReportsPage";
import { UserManagementPage } from "./pages/UserManagementPage";

export const router = createBrowserRouter([
  {
    path: "/",
    loader: () => {
      // Redirect to login if not authenticated
      const role = localStorage.getItem('userRole');
      if (!role) {
        window.location.href = '/login';
        return null;
      }
      return null;
    },
    Component: DashboardLayout,
    children: [
      { index: true, Component: OverviewPage },
      { path: "inventory", Component: InventoryPage },
      { path: "orders", Component: OrdersPage },
      { path: "billing", Component: BillingPage },
      { path: "sla-monitor", Component: SLAMonitorPage },
      { path: "reports", Component: ReportsPage },
      { path: "user-management", Component: UserManagementPage },
    ],
  },
  {
    path: "/login",
    Component: LoginPage,
  },
]);