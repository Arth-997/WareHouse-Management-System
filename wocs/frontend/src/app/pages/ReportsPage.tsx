import { useEffect, useState } from "react";
import { KPICard } from "../components/KPICard";
import { Package, ShoppingCart, CheckCircle2, Warehouse, Clock, AlertTriangle } from "lucide-react";
import { api } from "../../lib/api";

type AnalyticsData = {
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  ordersByClient: Record<string, number>;
  ordersByCustomer: Record<string, number>;
  fulfillmentRate: number;
  avgFulfillmentTimeHours: number;
  slaBreachRate: number;
  inventorySummary: {
    code: string;
    name: string;
    totalOnHand: number;
    totalReserved: number;
    totalAvailable: number;
    skuCount: number;
  }[];
  topMovingSkus: {
    skuCode: string;
    description: string;
    client: string;
    totalOrdered: number;
  }[];
};

const STATUS_LABELS: Record<string, string> = {
  received: "Received",
  allocated: "Allocated",
  picked: "Picked",
  packed: "Packed",
  dispatched: "Dispatched",
  delivered: "Delivered",
};

const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  allocated: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  picked: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  packed: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  dispatched: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const res = await api.get("/reports/analytics");
        if (cancelled) return;
        setData(res.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-white text-2xl">Reports & Analytics</h1>
        <div className="text-slate-400">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-white text-2xl">Reports & Analytics</h1>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard title="Total Orders" value={data.totalOrders} icon={ShoppingCart} />
        <KPICard title="Fulfillment Rate" value={`${data.fulfillmentRate}%`} icon={CheckCircle2} iconColor="text-emerald-500" />
        <KPICard title="Avg Fulfillment Time" value={`${data.avgFulfillmentTimeHours}h`} icon={Clock} iconColor="text-blue-500" />
        <KPICard title="SLA Breach Rate" value={`${data.slaBreachRate}%`} icon={AlertTriangle} iconColor={data.slaBreachRate > 10 ? "text-red-500" : "text-amber-500"} />
        <KPICard title="Warehouses" value={data.inventorySummary.length} icon={Warehouse} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Fulfillment by Status */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
          <h3 className="text-white text-lg mb-4">Order Fulfillment by Status</h3>
          <div className="space-y-3">
            {Object.entries(data.ordersByStatus).map(([status, count]) => {
              const pct = data.totalOrders > 0 ? Math.round((count / data.totalOrders) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs border ${STATUS_COLORS[status] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                      {STATUS_LABELS[status] ?? status}
                    </span>
                    <span className="text-slate-400 text-sm font-mono">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#0a0a0f] rounded-full h-2">
                    <div
                      className="bg-[#7c3aed] h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(data.ordersByStatus).length === 0 && (
              <p className="text-slate-500 text-sm italic">No orders data available.</p>
            )}
          </div>
        </div>

        {/* Orders by Category (Clients & Customers) */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
          <h3 className="text-white text-lg mb-4">Volume by Key Partners</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-slate-400 text-sm mb-2 font-medium">Top Clients (Brands)</h4>
              <div className="space-y-2">
                {Object.entries(data.ordersByClient).map(([client, count]) => (
                  <div key={client} className="flex justify-between items-center text-sm border-b border-[#1e1e2e] pb-1">
                    <span className="text-slate-300">{client}</span>
                    <span className="text-white font-mono">{count} orders</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-slate-400 text-sm mb-2 font-medium">Top Customers (Buyers)</h4>
              <div className="space-y-2">
                {Object.entries(data.ordersByCustomer).map(([customer, count]) => (
                  <div key={customer} className="flex justify-between items-center text-sm border-b border-[#1e1e2e] pb-1">
                    <span className="text-slate-300">{customer}</span>
                    <span className="text-white font-mono">{count} orders</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Moving SKUs */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6 lg:col-span-2">
          <h3 className="text-white text-lg mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#7c3aed]" />
            Top Moving SKUs
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  <th className="pb-3 text-left text-slate-400 text-sm font-normal">SKU Code</th>
                  <th className="pb-3 text-left text-slate-400 text-sm font-normal">Description</th>
                  <th className="pb-3 text-left text-slate-400 text-sm font-normal">Client</th>
                  <th className="pb-3 text-right text-slate-400 text-sm font-normal">Total Ordered Units</th>
                </tr>
              </thead>
              <tbody>
                {data.topMovingSkus.map((sku) => (
                  <tr key={sku.skuCode} className="border-b border-[#1e1e2e] hover:bg-[#0a0a0f] transition-colors">
                    <td className="py-3 text-white font-mono text-sm">{sku.skuCode}</td>
                    <td className="py-3 text-slate-300 text-sm">{sku.description}</td>
                    <td className="py-3 text-slate-400 text-sm">{sku.client}</td>
                    <td className="py-3 text-[#7c3aed] text-right font-mono font-medium">{sku.totalOrdered.toLocaleString()}</td>
                  </tr>
                ))}
                {data.topMovingSkus.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500 italic">No line items ordered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Warehouse Inventory Summary */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6 lg:col-span-2">
          <h3 className="text-white text-lg mb-4 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-[#7c3aed]" />
            Warehouse Inventory & Reservations
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  <th className="pb-3 text-left text-slate-400 text-sm font-normal">Warehouse</th>
                  <th className="pb-3 text-left text-slate-400 text-sm font-normal">SKUs Stored</th>
                  <th className="pb-3 text-right text-slate-400 text-sm font-normal">Total On Hand</th>
                  <th className="pb-3 text-right text-slate-400 text-sm font-normal">Reserved (Pending fulfillment)</th>
                  <th className="pb-3 text-right text-slate-400 text-sm font-normal">Available</th>
                </tr>
              </thead>
              <tbody>
                {data.inventorySummary.map((wh) => (
                  <tr key={wh.code} className="border-b border-[#1e1e2e] hover:bg-[#0a0a0f] transition-colors">
                    <td className="py-3">
                      <div>
                        <span className="text-white font-mono text-sm">{wh.code}</span>
                        <p className="text-slate-500 text-xs">{wh.name}</p>
                      </div>
                    </td>
                    <td className="py-3 text-slate-300 text-sm">{wh.skuCount}</td>
                    <td className="py-3 text-white text-sm text-right">{wh.totalOnHand.toLocaleString()}</td>
                    <td className="py-3 text-amber-500 text-sm text-right">{wh.totalReserved.toLocaleString()}</td>
                    <td className="py-3 text-emerald-500 text-sm text-right font-medium">{wh.totalAvailable.toLocaleString()}</td>
                  </tr>
                ))}
                {data.inventorySummary.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 italic">No inventory recorded.</td>
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
