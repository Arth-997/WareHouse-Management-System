import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Search, Filter, Plus, X, ChevronRight, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../../lib/api";
import { useAuth } from "../components/AuthContext";

type UiOrderLine = {
  id: string;
  skuId: string;
  skuCode: string;
  description: string;
  quantity: number;
};

type UiOrder = {
  id: string;
  orderRef: string;
  client: string;
  clientId: string;
  customer?: string | null;
  customerId?: string | null;
  warehouse: string;
  warehouseId: string;
  status: string;
  priority: string;
  shippingMethod: string;
  billingCategory: string;
  created: string;
  deadline: string;
  lines: UiOrderLine[];
};

type DropdownItem = { id: string; code?: string; name: string };
type InventoryItem = {
  id: string;
  skuId: string;
  sku: string;
  description: string;
  clientId: string;
  client: string;
  warehouseId: string;
  warehouse: string;
  onHand: number;
  reserved: number;
  available: number;
};

const STATUS_ORDER = ["received", "allocated", "picked", "packed", "dispatched", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  received: "Received", allocated: "Allocated", picked: "Picked",
  packed: "Packed", dispatched: "Dispatched", delivered: "Delivered",
};

function nextStatus(current: string): string | null {
  const idx = STATUS_ORDER.indexOf(current);
  return idx >= 0 && idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
}

export function OrdersPage() {
  const { user } = useAuth();
  const isCustomer = user?.role === "CUSTOMER";

  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<DropdownItem[]>([]);
  const [warehouses, setWarehouses] = useState<DropdownItem[]>([]);
  const [customers, setCustomers] = useState<DropdownItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [formClientId, setFormClientId] = useState("");
  const [formWarehouseId, setFormWarehouseId] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formPriority, setFormPriority] = useState("normal");
  const [formShipping, setFormShipping] = useState("standard");
  const [formBilling, setFormBilling] = useState("storage_handling");

  const [formLines, setFormLines] = useState<{ skuId: string; quantity: number }[]>([]);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchOrders = async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/orders", { params: { q } });
      const mapped: UiOrder[] = (res.data ?? []).map((o: any) => ({
        id: o.id,
        orderRef: o.orderRef,
        client: o.client,
        clientId: o.clientId,
        customer: o.customer,
        customerId: o.customerId,
        warehouse: o.warehouse,
        warehouseId: o.warehouseId,
        status: o.status,
        priority: o.priority,
        shippingMethod: o.shippingMethod,
        billingCategory: o.billingCategory,
        created: o.createdAt ? String(o.createdAt).replace("T", " ").slice(0, 16) : "",
        deadline: o.slaDeadlineAt ? String(o.slaDeadlineAt).replace("T", " ").slice(0, 16) : "N/A",
        lines: o.lines ?? [],
      }));
      setOrders(mapped);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => fetchOrders(query), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  // Load form dropdown data when expanding the form
  const openForm = async () => {
    setShowForm(true);
    setCreateError(null);
    setFormLines([]);
    try {
      const [cRes, wRes, custRes] = await Promise.all([
        api.get("/clients"),
        api.get("/warehouses"),
        api.get("/customers")
      ]);
      setClients(cRes.data ?? []);
      setWarehouses(wRes.data ?? []);
      setCustomers(custRes.data ?? []);

      const defaultClient = cRes.data?.[0]?.id || "";
      const defaultWh = wRes.data?.[0]?.id || "";

      setFormClientId(defaultClient);
      setFormWarehouseId(defaultWh);
      if (custRes.data?.length) setFormCustomerId(custRes.data[0].id);

      // Fetch inventory for the default selection
      if (defaultClient && defaultWh) {
        fetchInventoryForForm(defaultClient, defaultWh);
      }
    } catch { /* ok */ }
  };

  const fetchInventoryForForm = async (clientId: string, warehouseId: string) => {
    try {
      const res = await api.get("/inventory");
      // Filter the inventory manually if backend doesn't filter perfectly by both
      const filtered = (res.data ?? []).filter((pos: any) =>
        pos.clientId === clientId && pos.warehouseId === warehouseId
      );
      setInventory(filtered);
    } catch {
      setInventory([]);
    }
  };

  // Re-fetch inventory when client or warehouse changes
  useEffect(() => {
    if (showForm && formClientId && formWarehouseId) {
      fetchInventoryForForm(formClientId, formWarehouseId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formClientId, formWarehouseId, showForm]);

  const addFormLine = () => {
    if (inventory.length === 0) {
      setCreateError("No inventory available for this client and warehouse.");
      return;
    }
    setFormLines([...formLines, { skuId: inventory[0].skuId, quantity: 1 }]);
  };

  const removeFormLine = (index: number) => {
    const newLines = [...formLines];
    newLines.splice(index, 1);
    setFormLines(newLines);
  };

  const updateFormLine = (index: number, field: string, value: any) => {
    const newLines = [...formLines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormLines(newLines);
  };

  const onCreateOrder = async (e?: FormEvent) => {
    e?.preventDefault();
    setCreateError(null);
    setCreating(true);

    if (formLines.length === 0) {
      setCreateError("You must add at least one line item.");
      setCreating(false);
      return;
    }

    try {
      await api.post("/orders", {
        clientId: formClientId,
        warehouseId: formWarehouseId,
        customerId: formCustomerId,
        priority: formPriority,
        shippingMethod: formShipping,
        billingCategory: formBilling,
        lines: formLines,
      });
      setShowForm(false);
      await fetchOrders(query);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message ?? err?.response?.data?.error ?? "Failed to create order");
    } finally {
      setCreating(false);
    }
  };

  const onAdvanceStatus = async (orderId: string, status: string) => {
    setActioningId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      await fetchOrders(query);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Status update failed");
    } finally {
      setActioningId(null);
    }
  };

  const onCancelOrder = async (orderId: string) => {
    if (!window.confirm("Cancel this order? Reserved inventory will be released.")) return;
    setActioningId(orderId);
    try {
      await api.delete(`/orders/${orderId}`);
      await fetchOrders(query);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Cancel failed");
    } finally {
      setActioningId(null);
    }
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedOrders);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedOrders(newSet);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl">Orders</h1>
        {!isCustomer && (
          <button
            onClick={openForm}
            className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d2fd4] text-white rounded-lg flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)]"
          >
            <Plus className="w-4 h-4" />
            New Order
          </button>
        )}
      </div>

      {/* Create Order Form */}
      {showForm && !isCustomer && (
        <div className="bg-[#111118] border border-[#7c3aed]/30 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-lg">Create New Order</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={onCreateOrder} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-b border-[#1e1e2e] pb-6">
              <div className="space-y-1">
                <label className="block text-sm text-slate-300">Client (Brand)</label>
                <select value={formClientId} onChange={(e) => setFormClientId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50">
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
                <label className="block text-sm text-slate-300">Customer (Buyer)</label>
                <select value={formCustomerId} onChange={(e) => setFormCustomerId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50">
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-slate-300">Priority</label>
                <select value={formPriority} onChange={(e) => setFormPriority(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm text-slate-300">Shipping Method</label>
                <select value={formShipping} onChange={(e) => setFormShipping(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50">
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="cold_chain">Cold Chain</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm text-slate-300">Billing Category</label>
                <select value={formBilling} onChange={(e) => setFormBilling(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50">
                  <option value="storage_handling">Storage & Handling</option>
                  <option value="express_fulfillment">Express Fulfillment</option>
                  <option value="cold_storage">Cold Storage</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white text-md">Line Items</h4>
                <button type="button" onClick={addFormLine}
                  className="px-3 py-1.5 bg-[#1e1e2e] hover:bg-[#2a2a3c] text-white rounded-lg text-sm flex items-center gap-1 transition-all">
                  <Plus className="w-3 h-3" /> Add SKU
                </button>
              </div>

              {formLines.length === 0 ? (
                <p className="text-slate-500 text-sm italic">No items added. Click "Add SKU" to add line items.</p>
              ) : (
                <div className="space-y-3">
                  {formLines.map((line, idx) => {
                    const selectedInv = inventory.find(i => i.skuId === line.skuId);
                    const maxAvail = selectedInv ? selectedInv.available : 0;

                    return (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="flex-1 space-y-1">
                          <label className="block text-xs text-slate-400">SKU</label>
                          <select value={line.skuId} onChange={(e) => updateFormLine(idx, "skuId", e.target.value)}
                            className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50">
                            {inventory.map((inv) => (
                              <option key={inv.skuId} value={inv.skuId}>
                                {inv.sku} - {inv.description} (Avail: {inv.available})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32 space-y-1">
                          <label className="block text-xs text-slate-400">Quantity</label>
                          <input type="number" min="1" max={maxAvail} value={line.quantity} onChange={(e) => updateFormLine(idx, "quantity", parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50" />
                          <div className="text-[10px] text-emerald-500/70">Max items: {maxAvail}</div>
                        </div>
                        <div className="pt-6">
                          <button type="button" onClick={() => removeFormLine(idx)}
                            className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-[#1e1e2e]">
              <button type="submit" disabled={creating}
                className="px-6 py-2.5 bg-[#7c3aed] hover:bg-[#6d2fd4] text-white rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                {creating ? "Creating..." : "Create Order"}
              </button>
            </div>
            {createError && <p className="text-red-400 text-sm text-right mt-2">{createError}</p>}
          </form>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} type="text"
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#111118] border border-[#1e1e2e] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]/50" />
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
                  <th className="px-4 py-4 w-10"></th>
                  <th className="px-4 py-4 text-left text-slate-400 text-sm font-normal">Order ID</th>
                  {!isCustomer && <th className="px-4 py-4 text-left text-slate-400 text-sm font-normal">Customer</th>}
                  {!isCustomer && <th className="px-4 py-4 text-left text-slate-400 text-sm font-normal">Client</th>}
                  <th className="px-4 py-4 text-left text-slate-400 text-sm font-normal">Warehouse</th>
                  <th className="px-4 py-4 text-left text-slate-400 text-sm font-normal">Status</th>
                  <th className="px-4 py-4 text-left text-slate-400 text-sm font-normal">Priority</th>
                  <th className="px-4 py-4 text-left text-slate-400 text-sm font-normal">Created</th>
                  {!isCustomer && <th className="px-4 py-4 text-left text-slate-400 text-sm font-normal">Deadline</th>}
                  {!isCustomer && <th className="px-4 py-4 text-left text-slate-400 text-sm font-normal pl-8">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const next = nextStatus(order.status);
                  const canCancel = !["dispatched", "delivered"].includes(order.status);
                  const isExpanded = expandedOrders.has(order.id);

                  return (
                    <tr key={order.id} className={`border-b border-[#1e1e2e] transition-colors hover:bg-white/5 ${isExpanded ? 'bg-white/5' : ''}`}>
                      <td colSpan={10} className="p-0">
                        <div className="flex items-center w-full">
                          <div className="px-4 py-4 w-10 shrink-0">
                            <button onClick={() => toggleExpand(order.id)} className="text-slate-400 hover:text-white transition-colors">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>

                          <div className="flex-1 grid grid-cols-12 items-center px-4 py-4 gap-4">
                            <div className="col-span-2">
                              <span className="text-white font-mono">{order.orderRef}</span>
                            </div>

                            {!isCustomer && (
                              <div className="col-span-2 text-slate-300 truncate">
                                {order.customer || "Unassigned"}
                              </div>
                            )}

                            {!isCustomer && (
                              <div className="col-span-1 text-slate-300 truncate">
                                {order.client}
                              </div>
                            )}

                            <div className={`col-span-1 text-slate-400 font-mono text-sm truncate ${isCustomer ? 'col-span-2' : ''}`}>
                              {order.warehouse}
                            </div>

                            <div className="col-span-2">
                              <StatusBadge status={order.status === "delivered" ? "completed" : order.status === "dispatched" ? "dispatched" : "in-progress"} />
                              <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{order.status}</div>
                            </div>

                            <div className={`col-span-1 ${isCustomer ? 'col-span-2' : ''}`}>
                              <span className={`px-2 py-0.5 rounded-full text-xs border ${order.priority === "high" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                                {order.priority}
                              </span>
                            </div>

                            <div className={`col-span-1 text-slate-400 text-sm ${isCustomer ? 'col-span-3' : ''}`}>{order.created}</div>
                            {!isCustomer && <div className="col-span-1 text-slate-400 text-sm">{order.deadline}</div>}

                            {!isCustomer && (
                              <div className="col-span-1 flex items-center gap-2 pl-4">
                                {next && (
                                  <button
                                    onClick={() => onAdvanceStatus(order.id, next)}
                                    disabled={actioningId === order.id}
                                    title={`Advance to ${STATUS_LABELS[next]}`}
                                    className="px-2.5 py-1.5 bg-[#7c3aed]/10 border border-[#7c3aed]/30 hover:bg-[#7c3aed]/20 text-[#7c3aed] rounded-lg text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                )}
                                {canCancel && (
                                  <button
                                    onClick={() => onCancelOrder(order.id)}
                                    disabled={actioningId === order.id}
                                    title="Cancel order"
                                    className="px-2 py-1.5 bg-red-500/10 border border-red-500/20 hover:border-red-500/30 text-red-400 rounded-lg transition-all disabled:opacity-50"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expanded Area: Line Items */}
                        {isExpanded && (
                          <div className="px-14 py-4 pb-6 bg-[#0a0a0f] border-t border-[#1e1e2e]/50">
                            <h5 className="text-slate-300 text-sm font-medium mb-3">Order Line Items</h5>
                            {order.lines.length === 0 ? (
                              <p className="text-sm text-slate-500">No line items attached.</p>
                            ) : (
                              <div className="border border-[#1e1e2e] rounded-lg overflow-hidden max-w-3xl">
                                <table className="w-full">
                                  <thead className="bg-[#111118]">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-normal text-slate-400 border-b border-[#1e1e2e]">SKU</th>
                                      <th className="px-4 py-2 text-left text-xs font-normal text-slate-400 border-b border-[#1e1e2e]">Description</th>
                                      <th className="px-4 py-2 text-right text-xs font-normal text-slate-400 border-b border-[#1e1e2e]">Quantity</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.lines.map((line) => (
                                      <tr key={line.id} className="border-b border-[#1e1e2e] last:border-0 hover:bg-[#111118] transition-colors">
                                        <td className="px-4 py-2 font-mono text-sm text-white">{line.skuCode}</td>
                                        <td className="px-4 py-2 text-sm text-slate-400">{line.description}</td>
                                        <td className="px-4 py-2 text-sm text-white text-right">{line.quantity}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={10} className="px-6 py-10 text-center text-slate-500">
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
