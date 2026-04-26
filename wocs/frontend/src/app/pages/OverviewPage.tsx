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
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";

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
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [billingRes, analyticsRes] = await Promise.all([
          api.get("/billing"),
          api.get("/reports/analytics"),
        ]);
        if (cancelled) return;
        setClients(billingRes.data ?? []);
        setAnalytics(analyticsRes.data ?? null);
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalOrders = clients.reduce((s, c) => s + c.totalOrders, 0);
  const delivered = clients.reduce((s, c) => s + c.deliveredOrders, 0);
  const active = clients.reduce((s, c) => s + c.activeOrders, 0);
  const fulfillmentRate = analytics?.fulfillmentRate ?? 0;
  const avgTime = analytics?.avgFulfillmentTimeHours ?? 0;
  const slaBreachRate = analytics?.slaBreachRate ?? 0;

  // Chart data
  const statusData = analytics?.ordersByStatus
    ? Object.entries(analytics.ordersByStatus).map(([key, val]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value: val as number }))
    : [];

  const clientBarData = clients.map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    total: c.totalOrders,
    delivered: c.deliveredOrders,
    active: c.activeOrders,
  }));

  const STATUS_COLORS = ["#7c3aed", "#3b82f6", "#22c55e", "#f59e0b", "#06b6d4", "#ef4444", "#8b5cf6", "#ec4899"];

  // CSV export
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportBillingCSV = () => {
    const headers = ["Client", "Code", "Email", "Billing Day", "Total Orders", "Delivered", "Active", "Storage", "Express", "Cold Storage"];
    const rows = clients.map((c) => [
      `"${c.name}"`, c.code, c.contactEmail, String(c.billingCycleDay ?? ""),
      String(c.totalOrders), String(c.deliveredOrders), String(c.activeOrders),
      String(c.categories?.storage_handling ?? 0), String(c.categories?.express_fulfillment ?? 0), String(c.categories?.cold_storage ?? 0),
    ]);
    downloadCSV("billing_report.csv", headers, rows);
  };

  const exportInventoryCSV = () => {
    if (!analytics?.inventorySummary) return;
    const headers = ["Warehouse", "On Hand", "Reserved", "Available", "SKU Count"];
    const rows = analytics.inventorySummary.map((w: any) => [
      w.code, String(w.totalOnHand), String(w.totalReserved), String(w.totalAvailable), String(w.skuCount),
    ]);
    downloadCSV("inventory_summary.csv", headers, rows);
  };

  const exportOrdersCSV = () => {
    const headers = ["Status", "Count"];
    const rows = statusData.map((s) => [s.name, String(s.value)]);
    downloadCSV("orders_by_status.csv", headers, rows);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading finance dashboard...</div>;


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-semibold">Finance Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time billing, order analytics & inventory valuation</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportBillingCSV}
            className="px-3 py-2 bg-[#111118] border border-[#1e1e2e] hover:border-emerald-500/50 text-slate-300 hover:text-emerald-400 rounded-lg text-sm flex items-center gap-2 transition-all">
            <DownloadIcon className="w-4 h-4" /> Billing CSV
          </button>
          <button onClick={exportOrdersCSV}
            className="px-3 py-2 bg-[#111118] border border-[#1e1e2e] hover:border-blue-500/50 text-slate-300 hover:text-blue-400 rounded-lg text-sm flex items-center gap-2 transition-all">
            <DownloadIcon className="w-4 h-4" /> Orders CSV
          </button>
          <button onClick={exportInventoryCSV}
            className="px-3 py-2 bg-[#111118] border border-[#1e1e2e] hover:border-purple-500/50 text-slate-300 hover:text-purple-400 rounded-lg text-sm flex items-center gap-2 transition-all">
            <DownloadIcon className="w-4 h-4" /> Inventory CSV
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <FinanceKPI label="Total Orders" value={totalOrders} color="text-white" />
        <FinanceKPI label="Delivered" value={delivered} color="text-emerald-400" />
        <FinanceKPI label="Active" value={active} color="text-amber-400" />
        <FinanceKPI label="Fulfillment %" value={`${fulfillmentRate}%`} color="text-blue-400" />
        <FinanceKPI label="Avg Time (hrs)" value={avgTime} color="text-cyan-400" />
        <FinanceKPI label="SLA Breach %" value={`${slaBreachRate}%`} color={slaBreachRate > 20 ? "text-red-400" : "text-emerald-400"} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
          <h3 className="text-white text-lg mb-4">Order Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={100}
                  paddingAngle={3} dataKey="value" nameKey="name" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusData.map((_: any, i: number) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500">No data</p>}
        </div>

        {/* Orders by Client */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
          <h3 className="text-white text-lg mb-4">Orders by Client</h3>
          {clientBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={clientBarData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#1e1e2e" }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#1e1e2e" }} />
                <Tooltip contentStyle={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px", color: "#fff" }} />
                <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                <Bar dataKey="delivered" name="Delivered" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="active" name="Active" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500">No data</p>}
        </div>
      </div>

      {/* Billing by Client — Detailed Table */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg">Client Billing Summary</h3>
          <button onClick={exportBillingCSV}
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors">
            <DownloadIcon className="w-3.5 h-3.5" /> Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e2e] bg-[#0a0a0f]">
                <th className="px-4 py-3 text-left text-slate-400 text-xs font-medium uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-slate-400 text-xs font-medium uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-center text-slate-400 text-xs font-medium uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-center text-slate-400 text-xs font-medium uppercase tracking-wider">Delivered</th>
                <th className="px-4 py-3 text-center text-slate-400 text-xs font-medium uppercase tracking-wider">Active</th>
                <th className="px-4 py-3 text-center text-slate-400 text-xs font-medium uppercase tracking-wider">Storage</th>
                <th className="px-4 py-3 text-center text-slate-400 text-xs font-medium uppercase tracking-wider">Express</th>
                <th className="px-4 py-3 text-center text-slate-400 text-xs font-medium uppercase tracking-wider">Cold</th>
                <th className="px-4 py-3 text-center text-slate-400 text-xs font-medium uppercase tracking-wider">Billing Day</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-[#1e1e2e] hover:bg-[#0a0a0f] transition-colors">
                  <td className="px-4 py-3 text-white text-sm font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm font-mono">{c.code}</td>
                  <td className="px-4 py-3 text-center text-white font-semibold">{c.totalOrders}</td>
                  <td className="px-4 py-3 text-center text-emerald-400">{c.deliveredOrders}</td>
                  <td className="px-4 py-3 text-center text-amber-400">{c.activeOrders}</td>
                  <td className="px-4 py-3 text-center text-slate-300">{c.categories?.storage_handling ?? 0}</td>
                  <td className="px-4 py-3 text-center text-slate-300">{c.categories?.express_fulfillment ?? 0}</td>
                  <td className="px-4 py-3 text-center text-slate-300">{c.categories?.cold_storage ?? 0}</td>
                  <td className="px-4 py-3 text-center text-slate-400">{c.billingCycleDay ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Summary + Top SKUs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouse Inventory Value */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg">Inventory by Warehouse</h3>
            <button onClick={exportInventoryCSV}
              className="text-xs text-slate-400 hover:text-purple-400 flex items-center gap-1 transition-colors">
              <DownloadIcon className="w-3.5 h-3.5" /> Export
            </button>
          </div>
          <div className="space-y-3">
            {(analytics?.inventorySummary ?? []).map((wh: any) => {
              const pct = wh.totalOnHand > 0 ? Math.round((wh.totalAvailable / wh.totalOnHand) * 100) : 0;
              return (
                <div key={wh.code} className="p-3 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-mono">{wh.code}</span>
                    <span className="text-slate-400 text-xs">{wh.skuCount} SKUs</span>
                  </div>
                  <div className="flex gap-4 text-xs mb-2">
                    <span className="text-slate-300">On Hand: <strong className="text-white">{wh.totalOnHand}</strong></span>
                    <span className="text-slate-300">Reserved: <strong className="text-amber-400">{wh.totalReserved}</strong></span>
                    <span className="text-slate-300">Avail: <strong className="text-emerald-400">{wh.totalAvailable}</strong></span>
                  </div>
                  <div className="w-full bg-[#1e1e2e] rounded-full h-2">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Moving SKUs */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
          <h3 className="text-white text-lg mb-4">Top Moving SKUs</h3>
          <div className="space-y-2">
            {(analytics?.topMovingSkus ?? []).slice(0, 6).map((sku: any, idx: number) => (
              <div key={sku.skuCode} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] hover:border-[#7c3aed]/30 transition-all">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx < 3 ? "bg-[#7c3aed]/20 text-[#7c3aed]" : "bg-[#1e1e2e] text-slate-400"}`}>{idx + 1}</span>
                  <div>
                    <p className="text-white text-sm font-mono">{sku.skuCode}</p>
                    <p className="text-slate-500 text-xs truncate max-w-[200px]">{sku.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{sku.totalOrdered}</p>
                  <p className="text-slate-500 text-xs">ordered</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FinanceKPI({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 hover:border-[#7c3aed]/30 transition-all">
      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
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
