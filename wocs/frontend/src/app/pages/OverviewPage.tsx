import { useEffect, useState } from "react";
import { KPICard } from "../components/KPICard";
import { StatusBadge } from "../components/StatusBadge";
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  Clock,
  CreditCard,
  ArrowLeftRight,
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../components/AuthContext";

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

// ── Admin / Manager / Operator Overview ─────────────────────────────
function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any[]>([]);
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
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? <div className="text-slate-400">Loading...</div> : kpis.map((kpi: any) => <KPICard key={kpi.title} {...kpi} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
          <h3 className="text-white text-lg mb-4">Warehouse Status</h3>
          <div className="space-y-3">
            {warehouses.map((wh) => (
              <div key={wh.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] hover:border-[#7c3aed]/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${wh.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                  <div>
                    <p className="text-white text-sm font-mono">{wh.code}</p>
                    <p className="text-slate-500 text-xs">{wh.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">{wh.capacityPct}%</p>
                  <p className="text-slate-600 text-xs">capacity</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
          <h3 className="text-white text-lg mb-4">Recent Orders</h3>
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
              {recentOrders.map((o) => (
                <tr key={o.orderRef} className="border-b border-[#1e1e2e] hover:bg-[#0a0a0f] transition-colors">
                  <td className="py-4"><span className="text-white font-mono text-sm">{o.orderRef}</span></td>
                  <td className="py-4 text-slate-300 text-sm">{o.client}</td>
                  <td className="py-4"><span className="text-slate-400 font-mono text-sm">{o.warehouse}</span></td>
                  <td className="py-4"><StatusBadge status={o.status === "delivered" ? "completed" : "in-progress"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Finance Overview ────────────────────────────────────────────────
function FinanceOverview() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    api.get("/billing").then((res) => {
      setClients(res.data ?? []);
      setLoading(false);
    });
  }, []);

  const totalOrders = clients.reduce((s, c) => s + c.totalOrders, 0);
  const delivered = clients.reduce((s, c) => s + c.deliveredOrders, 0);
  const active = clients.reduce((s, c) => s + c.activeOrders, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title="Total Orders" value={totalOrders} icon={ShoppingCart} />
        <KPICard title="Delivered" value={delivered} icon={Package} iconColor="text-emerald-500" />
        <KPICard title="Active" value={active} icon={Clock} iconColor="text-amber-500" />
      </div>
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
        <h3 className="text-white text-lg mb-4">Billing by Client</h3>
        {loading ? <div className="text-slate-400">Loading...</div> : (
          <div className="space-y-4">
            {clients.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-4 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e]">
                <div>
                  <p className="text-white">{c.name}</p>
                  <p className="text-slate-500 text-xs font-mono">{c.code}</p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-white">{c.totalOrders}</p>
                    <p className="text-slate-500 text-xs">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-emerald-500">{c.deliveredOrders}</p>
                    <p className="text-slate-500 text-xs">Delivered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-amber-500">{c.activeOrders}</p>
                    <p className="text-slate-500 text-xs">Active</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Client Overview ─────────────────────────────────────────────────
function ClientOverview() {
  const [loading, setLoading] = useState(true);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const [invRes, ordRes, reqRes] = await Promise.all([
          api.get("/inventory"),
          api.get("/orders"),
          api.get("/inventory-requests"),
        ]);
        if (cancelled) return;
        setInventoryCount((invRes.data ?? []).length);
        const orders = ordRes.data ?? [];
        setOrderCount(orders.length);
        setRecentOrders(orders.slice(0, 5));
        const requests = reqRes.data ?? [];
        setPendingRequests(requests.filter((r: any) => r.status === "pending").length);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title="My Inventory Items" value={inventoryCount} icon={Package} />
        <KPICard title="My Orders" value={orderCount} icon={ShoppingCart} />
        <KPICard title="Pending Requests" value={pendingRequests} icon={ArrowLeftRight} iconColor="text-amber-500" />
      </div>
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
        <h3 className="text-white text-lg mb-4">My Recent Orders</h3>
        {loading ? <div className="text-slate-400">Loading...</div> : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-[#1e1e2e]">
                <th className="pb-3 text-slate-400 text-sm font-normal">Order ID</th>
                <th className="pb-3 text-slate-400 text-sm font-normal">Warehouse</th>
                <th className="pb-3 text-slate-400 text-sm font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o: any) => (
                <tr key={o.orderRef} className="border-b border-[#1e1e2e] hover:bg-[#0a0a0f] transition-colors">
                  <td className="py-4"><span className="text-white font-mono text-sm">{o.orderRef}</span></td>
                  <td className="py-4"><span className="text-slate-400 font-mono text-sm">{o.warehouse}</span></td>
                  <td className="py-4"><StatusBadge status={o.status === "delivered" ? "completed" : "in-progress"} /></td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={3} className="py-10 text-center text-slate-500">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Customer Overview ───────────────────────────────────────────────
function CustomerOverview() {
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [inTransitCount, setInTransitCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await api.get("/orders");
        if (cancelled) return;
        const orders = res.data ?? [];
        setOrderCount(orders.length);
        setInTransitCount(orders.filter((o: any) => ["dispatched", "picked", "packed"].includes(o.status)).length);
        setDeliveredCount(orders.filter((o: any) => o.status === "delivered").length);
        setRecentOrders(orders.slice(0, 5));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title="Total Orders" value={orderCount} icon={ShoppingCart} />
        <KPICard title="In Transit" value={inTransitCount} icon={Package} iconColor="text-blue-500" />
        <KPICard title="Delivered" value={deliveredCount} icon={ShoppingCart} iconColor="text-emerald-500" />
      </div>
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
        <h3 className="text-white text-lg mb-4">My Recent Orders</h3>
        {loading ? <div className="text-slate-400">Loading...</div> : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-[#1e1e2e]">
                <th className="pb-3 text-slate-400 text-sm font-normal">Order ID</th>
                <th className="pb-3 text-slate-400 text-sm font-normal">Warehouse</th>
                <th className="pb-3 text-slate-400 text-sm font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o: any) => (
                <tr key={o.orderRef} className="border-b border-[#1e1e2e] hover:bg-[#0a0a0f] transition-colors">
                  <td className="py-4"><span className="text-white font-mono text-sm">{o.orderRef}</span></td>
                  <td className="py-4"><span className="text-slate-400 font-mono text-sm">{o.warehouse}</span></td>
                  <td className="py-4"><StatusBadge status={o.status === "delivered" ? "completed" : o.status === "dispatched" ? "dispatched" : "in-progress"} /></td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={3} className="py-10 text-center text-slate-500">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────────────
export function OverviewPage() {
  const { user } = useAuth();

  if (user?.role === "FINANCE") return <FinanceOverview />;
  if (user?.role === "CLIENT_USER") return <ClientOverview />;
  if (user?.role === "CUSTOMER") return <CustomerOverview />;
  return <AdminOverview />;
}
