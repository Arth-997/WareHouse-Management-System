import { KPICard } from "../components/KPICard";
import { StatusBadge } from "../components/StatusBadge";
import { Package, ShoppingCart, AlertTriangle, Clock } from "lucide-react";

export function OverviewPage() {
  const kpis = [
    { title: 'Total SKUs', value: '12,458', icon: Package, trend: { value: 12, isPositive: true } },
    { title: 'Active Orders', value: '342', icon: ShoppingCart, trend: { value: 8, isPositive: true } },
    { title: 'SLA Breaches', value: '7', icon: AlertTriangle, trend: { value: 15, isPositive: false } },
    { title: 'SLA Warnings', value: '23', icon: Clock, trend: { value: 5, isPositive: false } },
  ];

  const warehouses = [
    { id: 'WH-Mumbai-01', status: 'online', location: 'Mumbai', capacity: '85%' },
    { id: 'WH-Delhi-01', status: 'online', location: 'Delhi', capacity: '72%' },
    { id: 'WH-Bangalore-01', status: 'online', location: 'Bangalore', capacity: '91%' },
    { id: 'WH-Chennai-01', status: 'offline', location: 'Chennai', capacity: '0%' },
    { id: 'WH-Kolkata-01', status: 'online', location: 'Kolkata', capacity: '68%' },
  ];

  const recentOrders = [
    { id: 'ORD-2024-3421', client: 'TechCorp India', sku: 'SKU-8721', qty: 150, status: 'in-progress', sla: 'on-track' },
    { id: 'ORD-2024-3420', client: 'Global Retail Ltd', sku: 'SKU-5692', qty: 280, status: 'completed', sla: 'completed' },
    { id: 'ORD-2024-3419', client: 'FastMart Solutions', sku: 'SKU-3412', qty: 95, status: 'in-progress', sla: 'warning' },
    { id: 'ORD-2024-3418', client: 'Metro Supplies', sku: 'SKU-9876', qty: 450, status: 'pending', sla: 'on-track' },
    { id: 'ORD-2024-3417', client: 'Quick Commerce', sku: 'SKU-2341', qty: 120, status: 'in-progress', sla: 'breach' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouse Status */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
          <h3 className="text-white text-lg mb-4">Warehouse Status</h3>
          <div className="space-y-3">
            {warehouses.map((warehouse) => (
              <div
                key={warehouse.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] hover:border-[#7c3aed]/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${warehouse.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="text-white text-sm font-mono">{warehouse.id}</p>
                    <p className="text-slate-500 text-xs">{warehouse.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">{warehouse.capacity}</p>
                  <p className="text-slate-600 text-xs">capacity</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
          <h3 className="text-white text-lg mb-4">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-[#1e1e2e]">
                  <th className="pb-3 text-slate-400 text-sm font-normal">Order ID</th>
                  <th className="pb-3 text-slate-400 text-sm font-normal">Client</th>
                  <th className="pb-3 text-slate-400 text-sm font-normal">SKU</th>
                  <th className="pb-3 text-slate-400 text-sm font-normal">Qty</th>
                  <th className="pb-3 text-slate-400 text-sm font-normal">Status</th>
                  <th className="pb-3 text-slate-400 text-sm font-normal">SLA</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#1e1e2e] hover:bg-[#0a0a0f] transition-colors"
                  >
                    <td className="py-4">
                      <span className="text-white font-mono text-sm">{order.id}</span>
                    </td>
                    <td className="py-4 text-slate-300 text-sm">{order.client}</td>
                    <td className="py-4">
                      <span className="text-slate-400 font-mono text-sm">{order.sku}</span>
                    </td>
                    <td className="py-4 text-slate-300 text-sm">{order.qty}</td>
                    <td className="py-4">
                      <StatusBadge status={order.status as any} />
                    </td>
                    <td className="py-4">
                      {order.sla === 'on-track' && <StatusBadge status="success" label="ON TRACK" />}
                      {order.sla === 'warning' && <StatusBadge status="warning" label="< 2H" />}
                      {order.sla === 'breach' && <StatusBadge status="danger" label="BREACH" />}
                      {order.sla === 'completed' && <StatusBadge status="neutral" label="DONE" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
