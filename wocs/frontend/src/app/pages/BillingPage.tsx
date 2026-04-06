import { useEffect, useState } from "react";
import { Search, CreditCard } from "lucide-react";
import { api } from "../../lib/api";

type ClientBilling = {
  id: string;
  code: string;
  name: string;
  contactEmail: string;
  billingCycleDay: number;
  totalOrders: number;
  deliveredOrders: number;
  activeOrders: number;
  categories: Record<string, number>;
};

export function BillingPage() {
  const [clients, setClients] = useState<ClientBilling[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/billing", { params: { q: query } });
        setClients(res.data ?? []);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Failed to load billing data");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const formatCategory = (cat: string) =>
    cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl">Billing</h1>
        <div className="text-slate-400 text-sm">Client billing overview</div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search by client name or code..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#111118] border border-[#1e1e2e] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]/50"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6 hover:border-[#7c3aed]/30 transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white text-lg">{client.name}</h3>
                  <p className="text-slate-500 text-sm font-mono">{client.code}</p>
                </div>
                <div className="w-10 h-10 bg-[#7c3aed]/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#7c3aed]" />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-[#0a0a0f] rounded-lg p-3 text-center">
                  <p className="text-white text-xl">{client.totalOrders}</p>
                  <p className="text-slate-500 text-xs">Total</p>
                </div>
                <div className="bg-[#0a0a0f] rounded-lg p-3 text-center">
                  <p className="text-emerald-500 text-xl">{client.deliveredOrders}</p>
                  <p className="text-slate-500 text-xs">Delivered</p>
                </div>
                <div className="bg-[#0a0a0f] rounded-lg p-3 text-center">
                  <p className="text-amber-500 text-xl">{client.activeOrders}</p>
                  <p className="text-slate-500 text-xs">Active</p>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <p className="text-slate-400 text-xs uppercase tracking-wider">Billing Categories</p>
                {Object.entries(client.categories).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{formatCategory(cat)}</span>
                    <span className="text-slate-400 font-mono">{count}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-[#1e1e2e] flex items-center justify-between text-xs">
                <span className="text-slate-500">{client.contactEmail}</span>
                <span className="text-slate-500">Cycle day {client.billingCycleDay}</span>
              </div>
            </div>
          ))}
          {clients.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No billing data found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
