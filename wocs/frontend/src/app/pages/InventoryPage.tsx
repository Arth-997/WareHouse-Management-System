import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Filter, Plus, Search, Snowflake, X } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../components/AuthContext";

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

type DropdownItem = { id: string; code?: string; name: string };
type SkuItem = { id: string; skuCode: string; description: string; client: string };

export function InventoryPage() {
  const { user } = useAuth();
  const canReceive = ["IT_ADMINISTRATOR", "WAREHOUSE_MANAGER", "WAREHOUSE_OPERATOR"].includes(user?.role ?? "");

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Receive stock form
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<DropdownItem[]>([]);
  const [warehouses, setWarehouses] = useState<DropdownItem[]>([]);
  const [skus, setSkus] = useState<SkuItem[]>([]);
  const [formClientId, setFormClientId] = useState("");
  const [formWarehouseId, setFormWarehouseId] = useState("");
  const [formSkuId, setFormSkuId] = useState("");
  const [formQty, setFormQty] = useState(1);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  const openForm = async () => {
    setShowForm(true);
    setCreateError(null);
    try {
      const [cRes, wRes, sRes] = await Promise.all([
        api.get("/clients"),
        api.get("/warehouses"),
        api.get("/inventory/skus"),
      ]);
      setClients(cRes.data ?? []);
      setWarehouses(wRes.data ?? []);
      setSkus(sRes.data ?? []);
      if (cRes.data?.length) setFormClientId(cRes.data[0].id);
      if (wRes.data?.length) setFormWarehouseId(wRes.data[0].id);
      if (sRes.data?.length) setFormSkuId(sRes.data[0].id);
    } catch { /* ok */ }
  };

  const onReceiveStock = async (e?: FormEvent) => {
    e?.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      await api.post("/inventory/receive", {
        clientId: formClientId,
        warehouseId: formWarehouseId,
        skuId: formSkuId,
        quantity: formQty,
      });
      setShowForm(false);
      await fetchInventory(query);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message ?? "Failed to receive stock");
    } finally {
      setCreating(false);
    }
  };

  // Filter SKUs by selected client
  const filteredSkus = formClientId
    ? skus.filter((s) => {
      const client = clients.find((c) => c.id === formClientId);
      return client ? s.client === client.name : true;
    })
    : skus;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl">Inventory Management</h1>
        {canReceive && (
          <button
            onClick={openForm}
            className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d2fd4] text-white rounded-lg flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Receive Stock
          </button>
        )}
      </div>

      {/* Receive Stock Form */}
      {showForm && (
        <div className="bg-[#111118] border border-[#7c3aed]/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-lg">Receive Stock</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={onReceiveStock} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="block text-sm text-slate-300">Client</label>
              <select
                value={formClientId}
                onChange={(e) => {
                  setFormClientId(e.target.value);
                  // Reset SKU when client changes
                  const nextSkus = skus.filter((s) => {
                    const cl = clients.find((c) => c.id === e.target.value);
                    return cl ? s.client === cl.name : true;
                  });
                  if (nextSkus.length) setFormSkuId(nextSkus[0].id);
                }}
                className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50"
              >
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm text-slate-300">Warehouse</label>
              <select value={formWarehouseId} onChange={(e) => setFormWarehouseId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50">
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm text-slate-300">SKU</label>
              <select value={formSkuId} onChange={(e) => setFormSkuId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50">
                {filteredSkus.map((s) => <option key={s.id} value={s.id}>{s.skuCode} — {s.description}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm text-slate-300">Quantity</label>
              <input type="number" min={1} value={formQty} onChange={(e) => setFormQty(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={creating}
                className="w-full px-4 py-2.5 bg-[#7c3aed] hover:bg-[#6d2fd4] text-white rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                <Plus className="w-4 h-4" />
                {creating ? "Receiving..." : "Receive"}
              </button>
            </div>
          </form>
          {createError && <p className="text-red-400 text-sm">{createError}</p>}
        </div>
      )}

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
                    className={`border-b border-[#1e1e2e] hover:bg-[#0a0a0f] transition-colors ${index % 2 === 0 ? "bg-[#111118]" : "bg-[#0f0f16]"
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
