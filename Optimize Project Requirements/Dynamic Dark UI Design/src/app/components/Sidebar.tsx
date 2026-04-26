import { LayoutDashboard, Package, ShoppingCart, FileText, CreditCard, AlertTriangle, BarChart3, Users, LogOut } from 'lucide-react';
import { cn } from './ui/utils';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole: 'operations' | 'client' | 'finance';
  userName: string;
  onLogout: () => void;
}

export function Sidebar({ currentPage, onNavigate, userRole, userName, onLogout }: SidebarProps) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['operations', 'client', 'finance'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['operations', 'client'] },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, roles: ['operations', 'client'] },
    { id: 'stock-requests', label: 'Stock Requests', icon: FileText, roles: ['operations', 'client'] },
    { id: 'billing', label: 'Billing', icon: CreditCard, roles: ['operations', 'finance'] },
    { id: 'sla-monitor', label: 'SLA Monitor', icon: AlertTriangle, roles: ['operations'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['operations', 'finance'] },
    { id: 'users', label: 'User Management', icon: Users, roles: ['operations'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-slate-950/40 backdrop-blur-xl border-r border-slate-800/50 flex flex-col z-20">
      <div className="p-6 border-b border-slate-800/50">
        <h1 className="text-2xl font-bold text-white tracking-tight">WOCS</h1>
        <div className="mt-2 px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded text-xs text-purple-300 inline-block">
          {userRole.toUpperCase()}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive
                  ? "bg-purple-600/30 text-white border border-purple-500/50"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center text-white font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-white">{userName}</div>
            <div className="text-xs text-slate-400 capitalize">{userRole}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
