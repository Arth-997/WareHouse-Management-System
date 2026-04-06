import { useEffect, useState } from "react";
import { KPICard } from "../components/KPICard";
import { StatusBadge } from "../components/StatusBadge";
import { Package, ShoppingCart, AlertTriangle, Clock } from "lucide-react";
import { api } from "../../lib/api";

type WarehouseStat = {
  id: string;
  code: string;
  name: string;
  location: string;
  isActive: boolean;
  capacityPct: number;
};

type RecentOrder = {
  orderRef: string;
  client: string;
  warehouse: string;
  status: string;
  createdAt: string;
};

export function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<
    Array<{
      title: string;
      value: string | number;
      icon: any;
      trend?: { value: number; isPositive: boolean };
      iconColor?: string;
    }>
  >([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseStat[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const res = await api.get("/dashboard/stats");
        const data = res.data;

        if (cancelled) return;

        setKpis([
          { title: "Total SKUs", value: data.totalSkus, icon: Package },
          { title: "Active Orders", value: data.activeOrders, icon: ShoppingCart },
          { title: "SLA Breaches", value: data.slaBreaches, icon: AlertTriangle, iconColor: "text-red-500" },
          { title: "SLA Warnings", value: data.slaWarnings, icon: Clock, iconColor: "text-amber-500" },
        ]);
        setRecentOrders(data.recentOrders ?? []);
        setWarehouses(data.warehouses ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const getOrderStatus = (status: string) => {
    if (status === "delivered") return "completed";
    return "in-progress";
  };

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading && kpis.length === 0 ? (
          <div className="text-slate-400">Loading...</div>
        ) : (
          kpis.map((kpi: any) => <KPICard key={kpi.title} {...kpi} />)
        )}
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
                  <div className={`w-2 h-2 rounded-full ${warehouse.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="text-white text-sm font-mono">{warehouse.code}</p>
                    <p className="text-slate-500 text-xs">{warehouse.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">{warehouse.capacityPct}%</p>
                  <p className="text-slate-600 text-xs">capacity</p>
                </div>
              </div>
            ))}
            {warehouses.length === 0 && !loading && (
              <p className="text-slate-500 text-sm">No warehouses found.</p>
            )}
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
                  <th className="pb-3 text-slate-400 text-sm font-normal">Warehouse</th>
                  <th className="pb-3 text-slate-400 text-sm font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.orderRef}
                    className="border-b border-[#1e1e2e] hover:bg-[#0a0a0f] transition-colors"
                  >
                    <td className="py-4">
                      <span className="text-white font-mono text-sm">{order.orderRef}</span>
                    </td>
                    <td className="py-4 text-slate-300 text-sm">{order.client}</td>
                    <td className="py-4">
                      <span className="text-slate-400 font-mono text-sm">{order.warehouse}</span>
                    </td>
                    <td className="py-4">
                      <StatusBadge status={getOrderStatus(order.status) as any} />
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500">
                      No recent orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
