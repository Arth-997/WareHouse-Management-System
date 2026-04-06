import { useEffect, useState } from "react";
import { Search, Filter, Plus } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../../lib/api";

type UiOrder = {
  id: string;
  client: string;
  sku: string;
  qty: number;
  warehouse: string;
  status: string;
  created: string;
  deadline: string;
};

export function OrdersPage() {
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/orders", { params: { q: query } });
        const mapped: UiOrder[] = (res.data ?? []).map((o: any) => ({
          id: o.orderRef,
          client: o.client,
          sku: "N/A",
          qty: 0,
          warehouse: o.warehouse,
          status: o.status === "delivered" ? "completed" : "in-progress",
          created: o.createdAt ? String(o.createdAt).replace("T", " ").slice(0, 16) : "",
          deadline: o.slaDeadlineAt
            ? String(o.slaDeadlineAt).replace("T", " ").slice(0, 16)
            : "N/A",
        }));
        setOrders(mapped);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Failed to load orders");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(t);
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl">Orders</h1>
        <button className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d2fd4] text-white rounded-lg flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)]">
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#111118] border border-[#1e1e2e] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]/50"
          />
        </div>
        <button className="px-4 py-2 bg-[#111118] border border-[#1e1e2e] hover:border-[#7c3aed]/50 text-slate-400 hover:text-white rounded-lg flex items-center gap-2 transition-all">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-slate-400">Loading...</div>
        ) : error ? (
          <div className="p-6 text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e] bg-[#0a0a0f]">
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Order ID</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Client</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">SKU</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Quantity</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Warehouse</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Status</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Created</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-[#1e1e2e] hover:bg-[#0a0a0f] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white font-mono">{order.id}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{order.client}</td>
                    <td className="px-6 py-4">
                      <span className="text-slate-400 font-mono text-sm">{order.sku}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{order.qty}</td>
                    <td className="px-6 py-4">
                      <span className="text-slate-400 font-mono text-sm">{order.warehouse}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status as any} />
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{order.created}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{order.deadline}</td>
                  </tr>
                ))}
                {orders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
