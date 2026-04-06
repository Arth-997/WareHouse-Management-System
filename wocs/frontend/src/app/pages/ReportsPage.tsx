import { useEffect, useState } from "react";
import { KPICard } from "../components/KPICard";
import { Package, ShoppingCart, CheckCircle2, Warehouse } from "lucide-react";
import { api } from "../../lib/api";

type OrdersByStatus = Record<string, number>;
type WarehouseInventory = { code: string; name: string; totalOnHand: number; totalAvailable: number; skuCount: number };

export function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus>({});
  const [warehouseInventory, setWarehouseInventory] = useState<WarehouseInventory[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSkus, setTotalSkus] = useState(0);
  const [deliveryRate, setDeliveryRate] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const [ordersRes, whRes, invRes] = await Promise.all([
          api.get("/orders"),
          api.get("/warehouses"),
          api.get("/inventory"),
        ]);

        if (cancelled) return;

        const orders = ordersRes.data ?? [];
        const warehouses = whRes.data ?? [];
        const inventory = invRes.data ?? [];

        // Orders by status
        const statusCounts: OrdersByStatus = {};
        for (const o of orders) {
          statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        }
        setOrdersByStatus(statusCounts);
        setTotalOrders(orders.length);

        // Delivery rate
        const delivered = orders.filter((o: any) => o.status === "delivered").length;
        setDeliveryRate(orders.length > 0 ? Math.round((delivered / orders.length) * 100) : 0);

        // Unique SKUs
        setTotalSkus(new Set(inventory.map((i: any) => i.sku)).size);

        // Warehouse inventory
        setWarehouseInventory(
          warehouses.map((wh: any) => ({
            code: wh.code,
            name: wh.name,
            totalOnHand: wh.totalOnHand,
            totalAvailable: wh.totalAvailable,
            skuCount: wh.skuCount,
          }))
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-white text-2xl">Reports</h1>
        <div className="text-slate-400">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-white text-2xl">Reports</h1>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Orders" value={totalOrders} icon={ShoppingCart} />
        <KPICard title="Unique SKUs" value={totalSkus} icon={Package} />
        <KPICard title="Delivery Rate" value={`${deliveryRate}%`} icon={CheckCircle2} iconColor="text-emerald-500" />
        <KPICard title="Warehouses" value={warehouseInventory.length} icon={Warehouse} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Fulfillment */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
          <h3 className="text-white text-lg mb-4">Order Fulfillment by Status</h3>
          <div className="space-y-3">
            {Object.entries(ordersByStatus).map(([status, count]) => {
              const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
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
          </div>
        </div>

        {/* Warehouse Inventory Summary */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
          <h3 className="text-white text-lg mb-4">Warehouse Inventory Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  <th className="pb-3 text-left text-slate-400 text-sm font-normal">Warehouse</th>
                  <th className="pb-3 text-left text-slate-400 text-sm font-normal">SKUs</th>
                  <th className="pb-3 text-left text-slate-400 text-sm font-normal">On Hand</th>
                  <th className="pb-3 text-left text-slate-400 text-sm font-normal">Available</th>
                </tr>
              </thead>
              <tbody>
                {warehouseInventory.map((wh) => (
                  <tr key={wh.code} className="border-b border-[#1e1e2e] hover:bg-[#0a0a0f] transition-colors">
                    <td className="py-3">
                      <div>
                        <span className="text-white font-mono text-sm">{wh.code}</span>
                        <p className="text-slate-500 text-xs">{wh.name}</p>
                      </div>
                    </td>
                    <td className="py-3 text-slate-300 text-sm">{wh.skuCount}</td>
                    <td className="py-3 text-white text-sm">{wh.totalOnHand.toLocaleString()}</td>
                    <td className="py-3 text-emerald-500 text-sm">{wh.totalAvailable.toLocaleString()}</td>
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
