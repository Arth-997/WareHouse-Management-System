import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  Clock,
  FileText,
  Users,
  Bell,
  Settings,
  LogOut,
  Shield,
  ArrowLeftRight,
  Menu,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth, type UserRole } from "../components/AuthContext";

type NavItem = {
  path: string;
  icon: any;
  label: string;
  roles: UserRole[];
};

const ALL_ROLES: UserRole[] = [
  "IT_ADMINISTRATOR",
  "WAREHOUSE_OPERATOR",
  "WAREHOUSE_MANAGER",
  "REGIONAL_OPS_HEAD",
  "FINANCE",
  "SALES",
  "CLIENT_USER",
  "CUSTOMER",
];

const WAREHOUSE_ROLES: UserRole[] = [
  "IT_ADMINISTRATOR",
  "WAREHOUSE_OPERATOR",
  "WAREHOUSE_MANAGER",
  "REGIONAL_OPS_HEAD",
];

const NAV_ITEMS: NavItem[] = [
  { path: "/", icon: LayoutDashboard, label: "Overview", roles: ALL_ROLES },
  {
    path: "/inventory",
    icon: Package,
    label: "Inventory",
    roles: [...WAREHOUSE_ROLES, "CLIENT_USER"],
  },
  {
    path: "/orders",
    icon: ShoppingCart,
    label: "Orders",
    roles: [...WAREHOUSE_ROLES, "CLIENT_USER", "CUSTOMER"],
  },
  {
    path: "/inventory-requests",
    icon: ArrowLeftRight,
    label: "Stock Requests",
    roles: [...WAREHOUSE_ROLES, "CLIENT_USER"],
  },
  {
    path: "/billing",
    icon: CreditCard,
    label: "Billing",
    roles: ["IT_ADMINISTRATOR", "FINANCE"],
  },
  {
    path: "/sla-monitor",
    icon: Clock,
    label: "SLA Monitor",
    roles: WAREHOUSE_ROLES,
  },
  {
    path: "/reports",
    icon: FileText,
    label: "Reports",
    roles: [...WAREHOUSE_ROLES, "FINANCE"],
  },
  {
    path: "/user-management",
    icon: Users,
    label: "User Management",
    roles: ["IT_ADMINISTRATOR"],
  },
];

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userName = user?.name || "User";
  const userRole = user?.role || ("" as UserRole);

  const currentDate = useMemo(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Filter nav items by user role
  const navItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => item.roles.includes(userRole as UserRole));
  }, [userRole]);

  const formatRole = (role: string) =>
    role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex overflow-hidden">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-[#111118] border-r border-[#1e1e2e] flex flex-col fixed h-full z-30 transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        {/* Logo & Branding */}
        <div className="p-6 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#7c3aed]/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#7c3aed]" />
            </div>
            <div>
              <h1 className="text-white text-xl">WOCS</h1>
            </div>
          </div>
          <div className="px-2 py-1 bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded text-xs text-[#7c3aed] inline-block">
            Phase 1 Core
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group ${active
                    ? "bg-[#7c3aed]/10 text-[#7c3aed]"
                    : "text-slate-400 hover:text-white hover:bg-[#1e1e2e]"
                    }`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#7c3aed] rounded-r shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
                  )}
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[#1e1e2e]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">{userName.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{userName}</p>
              <p className="text-slate-500 text-xs truncate">
                {formatRole(userRole)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 p-2 rounded-lg bg-[#1e1e2e] hover:bg-[#2a2a3a] text-slate-400 hover:text-white transition-colors">
              <Settings className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 p-2 rounded-lg bg-[#1e1e2e] hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 w-full md:w-auto h-screen overflow-y-auto">
        {/* Header */}
        <header className="bg-[#111118]/80 backdrop-blur-lg border-b border-[#1e1e2e] sticky top-0 z-10 transition-colors">
          <div className="px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -ml-2 rounded-lg bg-[#1e1e2e] hover:bg-[#2a2a3a] text-slate-400 hover:text-white transition-colors mr-2 md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-white text-lg">
                  Welcome back, {userName.split(" ")[0]}
                </h2>
                <p className="text-slate-400 text-xs md:text-sm hidden sm:block">{currentDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button className="relative p-2 rounded-lg bg-[#1e1e2e] hover:bg-[#2a2a3a] text-slate-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}