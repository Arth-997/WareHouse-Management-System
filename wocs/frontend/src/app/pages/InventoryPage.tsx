import { useEffect, useState } from "react";
import { Filter, Plus, Search, Snowflake } from "lucide-react";
import { api } from "../../lib/api";

type InventoryItem = {
  id: string;
  sku: string;
  description: string;
  client: string;
  warehouse: string;
  onHand: number;
  reserved: number;
  available: number;
  storageType: string;
  expiry: string;
};

export function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/inventory", { params: { q } });
      setInventory(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => {
      fetchInventory(query);
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl">Inventory Management</h1>
        <button className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d2fd4] text-white rounded-lg flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.3)]">
          <Plus className="w-4 h-4" />
          Receive Stock
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search by SKU, description, or client..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#111118] border border-[#1e1e2e] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]/50 focus:shadow-[0_0_10px_rgba(124,58,237,0.1)]"
          />
        </div>
        <button className="px-4 py-2 bg-[#111118] border border-[#1e1e2e] hover:border-[#7c3aed]/50 text-slate-400 hover:text-white rounded-lg flex items-center gap-2 transition-all">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Inventory Table */}
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
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">SKU</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Description</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Client</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Warehouse</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">On Hand</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Reserved</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Available</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Storage</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-[#1e1e2e] hover:bg-[#0a0a0f] transition-colors ${
                      index % 2 === 0 ? "bg-[#111118]" : "bg-[#0f0f16]"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-white font-mono">{item.sku}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300">{item.description}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-400 text-sm">{item.client}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-400 font-mono text-sm">{item.warehouse}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{item.onHand}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-amber-500">{item.reserved}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-500">{item.available}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.storageType === "cold" ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit">
                          <Snowflake className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-blue-400 text-xs">Cold</span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-500/10 border border-slate-500/20 rounded-full text-xs text-slate-400">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-400 text-sm">{item.expiry}</span>
                    </td>
                  </tr>
                ))}
                {inventory.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-slate-500">
                      No inventory matches your search.
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
