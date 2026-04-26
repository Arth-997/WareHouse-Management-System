import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Search, Filter, Plus, X, ChevronRight, Trash2, ChevronDown, ChevronUp, Check, XCircle } from "lucide-react";
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
type SkuItem = { id: string; skuCode: string; description: string; client: string };

const STATUS_ORDER = ["received", "allocated", "picked", "packed", "dispatched", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  requested: "Requested", rejected: "Rejected",
  received: "Received", allocated: "Allocated", picked: "Picked",
  packed: "Packed", dispatched: "Dispatched", delivered: "Delivered",
};

function nextStatus(current: string): string | null {
  const idx = STATUS_ORDER.indexOf(current);
  return idx >= 0 && idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
}

function mapOrder(o: any): UiOrder {
  return {
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
  };
}

function statusBadgeVariant(status: string): "completed" | "in-progress" | "pending" | "danger" | "dispatched" {
  if (status === "delivered") return "completed";
  if (status === "dispatched") return "dispatched";
  if (status === "requested") return "pending";
  if (status === "rejected") return "danger";
  return "in-progress";
}

// ─────────────────────────────────────────────────────────────────────
// Order Form — Shared between Admin "New Order" and Customer "Place Request"
// ─────────────────────────────────────────────────────────────────────

function OrderForm({ isRequest, onDone }: { isRequest: boolean; onDone: () => void }) {
  const { user } = useAuth();
  const isCustomer = user?.role === "CUSTOMER";

  const [clients, setClients] = useState<DropdownItem[]>([]);
  const [warehouses, setWarehouses] = useState<DropdownItem[]>([]);
  const [customers, setCustomers] = useState<DropdownItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [allSkus, setAllSkus] = useState<SkuItem[]>([]);

  const [formClientId, setFormClientId] = useState("");
  const [formWarehouseId, setFormWarehouseId] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formPriority, setFormPriority] = useState("normal");
  const [formShipping, setFormShipping] = useState("standard");
  const [formBilling, setFormBilling] = useState("storage_handling");

  const [formLines, setFormLines] = useState<{ skuId: string; quantity: number }[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const promises: Promise<any>[] = [api.get("/clients"), api.get("/warehouses")];
        if (!isCustomer) promises.push(api.get("/customers"));
        if (isRequest) promises.push(api.get("/inventory/skus"));

        const results = await Promise.all(promises);
        setClients(results[0].data ?? []);
        setWarehouses(results[1].data ?? []);

        const defaultClient = results[0].data?.[0]?.id || "";
        const defaultWh = results[1].data?.[0]?.id || "";
        setFormClientId(defaultClient);
        setFormWarehouseId(defaultWh);

        if (!isCustomer && results[2]) {
          setCustomers(results[2].data ?? []);
          if (results[2].data?.length) setFormCustomerId(results[2].data[0].id);
        }

        if (isRequest && results.length > (isCustomer ? 2 : 3)) {
          setAllSkus(results[isCustomer ? 2 : 3].data ?? []);
        }

        if (!isRequest && defaultClient && defaultWh) {
          fetchInventory(defaultClient, defaultWh);
        }
      } catch { /* ok */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInventory = async (clientId: string, warehouseId: string) => {
    try {
      const res = await api.get("/inventory");
      setInventory((res.data ?? []).filter((p: any) => p.clientId === clientId && p.warehouseId === warehouseId));
    } catch { setInventory([]); }
  };

  // For non-request orders, re-fetch inventory when selections change
  useEffect(() => {
    if (!isRequest && formClientId && formWarehouseId) {
      fetchInventory(formClientId, formWarehouseId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formClientId, formWarehouseId]);

  // For requests (customer), filter SKUs by selected client
  const filteredSkus = formClientId
    ? allSkus.filter((s) => {
      const client = clients.find((c) => c.id === formClientId);
      return client ? s.client === client.name : true;
    })
    : allSkus;

  const addLine = () => {
    if (isRequest) {
      if (filteredSkus.length === 0) { setCreateError("No SKUs available for this client."); return; }
      setFormLines([...formLines, { skuId: filteredSkus[0].id, quantity: 1 }]);
    } else {
      if (inventory.length === 0) { setCreateError("No inventory available for this client and warehouse."); return; }
      setFormLines([...formLines, { skuId: inventory[0].skuId, quantity: 1 }]);
    }
  };

  const removeLine = (i: number) => { const l = [...formLines]; l.splice(i, 1); setFormLines(l); };
  const updateLine = (i: number, f: string, v: any) => { const l = [...formLines]; l[i] = { ...l[i], [f]: v }; setFormLines(l); };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setCreateError(null);
    setCreating(true);
    if (formLines.length === 0) { setCreateError("Add at least one line item."); setCreating(false); return; }

    try {
      const payload: any = {
        clientId: formClientId,
        warehouseId: formWarehouseId,
        priority: formPriority,
        shippingMethod: formShipping,
        billingCategory: formBilling,
        lines: formLines,
      };

      if (isRequest) {
        if (isCustomer) {
          payload.customerId = user?.customerId;
        } else {
          payload.customerId = formCustomerId;
        }
        await api.post("/orders/request", payload);
      } else {
        payload.customerId = formCustomerId;
        await api.post("/orders", payload);
      }

      onDone();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message ?? "Failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-[#111118] border border-[#7c3aed]/30 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white text-lg">{isRequest ? "Place Order Request" : "Create New Order"}</h3>
        <button onClick={onDone} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
      </div>

      <form onSubmit={submit} className="space-y-6">
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
          {!isCustomer && (
            <div className="space-y-1">
              <label className="block text-sm text-slate-300">Customer (Buyer)</label>
              <select value={formCustomerId} onChange={(e) => setFormCustomerId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50">
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
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

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white text-md">Line Items</h4>
            <button type="button" onClick={addLine}
              className="px-3 py-1.5 bg-[#1e1e2e] hover:bg-[#2a2a3c] text-white rounded-lg text-sm flex items-center gap-1 transition-all">
              <Plus className="w-3 h-3" /> Add SKU
            </button>
          </div>

          {formLines.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No items added. Click "Add SKU" to add line items.</p>
          ) : (
            <div className="space-y-3">
              {formLines.map((line, idx) => {
                let maxAvail = 999999;
                if (!isRequest) {
                  const sel = inventory.find(i => i.skuId === line.skuId);
                  maxAvail = sel ? sel.available : 0;
                }

                return (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="flex-1 space-y-1">
                      <label className="block text-xs text-slate-400">SKU</label>
                      <select value={line.skuId} onChange={(e) => updateLine(idx, "skuId", e.target.value)}
                        className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50">
                        {isRequest
                          ? filteredSkus.map((s) => (
                            <option key={s.id} value={s.id}>{s.skuCode} - {s.description}</option>
                          ))
                          : inventory.map((inv) => (
                            <option key={inv.skuId} value={inv.skuId}>
                              {inv.sku} - {inv.description} (Avail: {inv.available})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="w-32 space-y-1">
                      <label className="block text-xs text-slate-400">Quantity</label>
                      <input type="number" min="1" max={isRequest ? undefined : maxAvail} value={line.quantity}
                        onChange={(e) => updateLine(idx, "quantity", parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50" />
                      {!isRequest && <div className="text-[10px] text-emerald-500/70">Max: {maxAvail}</div>}
                    </div>
                    <div className="pt-6">
                      <button type="button" onClick={() => removeLine(idx)}
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
            {creating ? "Submitting..." : isRequest ? "Submit Request" : "Create Order"}
          </button>
        </div>
        {createError && <p className="text-red-400 text-sm text-right mt-2">{createError}</p>}
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Order Table — Reusable for both "All Orders" and "View Requests"
// ─────────────────────────────────────────────────────────────────────

function OrderTable({
  orders, loading, error, isCustomer, showRequestActions, onAdvance, onCancel, onApprove, onReject, actioningId,
}: {
  orders: UiOrder[];
  loading: boolean;
  error: string | null;
  isCustomer: boolean;
  showRequestActions: boolean;
  onAdvance: (id: string, status: string) => void;
  onCancel: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  actioningId: string | null;
}) {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => {
    const s = new Set(expandedOrders);
    if (s.has(id)) s.delete(id); else s.add(id);
    setExpandedOrders(s);
  };

  if (loading) return <div className="p-6 text-slate-400">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;

  return (
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
            {!isCustomer && !showRequestActions && <th className="px-4 py-4 text-left text-slate-400 text-sm font-normal">Deadline</th>}
            <th className="px-4 py-4 text-left text-slate-400 text-sm font-normal pl-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const next = nextStatus(order.status);
            const canCancel = !["dispatched", "delivered", "requested", "rejected"].includes(order.status);
            const isExpanded = expandedOrders.has(order.id);

            return (
              <tr key={order.id} className={`border-b border-[#1e1e2e] transition-colors hover:bg-white/5 ${isExpanded ? 'bg-white/5' : ''}`}>
                <td colSpan={20} className="p-0">
                  <div className="flex items-center w-full">
                    <div className="px-4 py-4 w-10 shrink-0">
                      <button onClick={() => toggleExpand(order.id)} className="text-slate-400 hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex-1 grid grid-cols-12 items-center px-4 py-4 gap-4">
                      <div className="col-span-2"><span className="text-white font-mono">{order.orderRef}</span></div>

                      {!isCustomer && <div className="col-span-2 text-slate-300 truncate">{order.customer || "—"}</div>}
                      {!isCustomer && <div className="col-span-1 text-slate-300 truncate">{order.client}</div>}

                      <div className={`col-span-1 text-slate-400 font-mono text-sm truncate ${isCustomer ? 'col-span-2' : ''}`}>{order.warehouse}</div>

                      <div className="col-span-2">
                        <StatusBadge status={statusBadgeVariant(order.status)} />
                        <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{STATUS_LABELS[order.status] ?? order.status}</div>
                      </div>

                      <div className={`col-span-1 ${isCustomer ? 'col-span-2' : ''}`}>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${order.priority === "high" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                          {order.priority}
                        </span>
                      </div>

                      <div className={`col-span-1 text-slate-400 text-sm ${isCustomer ? 'col-span-2' : ''}`}>{order.created}</div>
                      {!isCustomer && !showRequestActions && <div className="col-span-1 text-slate-400 text-sm">{order.deadline}</div>}

                      {/* Actions column */}
                      <div className="col-span-1 flex items-center gap-2 pl-2">
                        {showRequestActions && onApprove && onReject && (
                          <>
                            <button onClick={() => onApprove(order.id)} disabled={actioningId === order.id}
                              title="Approve request"
                              className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-1 transition-all disabled:opacity-50">
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button onClick={() => onReject(order.id)} disabled={actioningId === order.id}
                              title="Reject request"
                              className="px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 hover:border-red-500/30 text-red-400 rounded-lg text-xs flex items-center gap-1 transition-all disabled:opacity-50">
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                        {!showRequestActions && !isCustomer && (
                          <>
                            {next && (
                              <button onClick={() => onAdvance(order.id, next)} disabled={actioningId === order.id}
                                title={`Advance to ${STATUS_LABELS[next]}`}
                                className="px-2.5 py-1.5 bg-[#7c3aed]/10 border border-[#7c3aed]/30 hover:bg-[#7c3aed]/20 text-[#7c3aed] rounded-lg text-xs flex items-center gap-1 transition-all disabled:opacity-50">
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                            {canCancel && (
                              <button onClick={() => onCancel(order.id)} disabled={actioningId === order.id}
                                title="Cancel order"
                                className="px-2 py-1.5 bg-red-500/10 border border-red-500/20 hover:border-red-500/30 text-red-400 rounded-lg transition-all disabled:opacity-50">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded: Line Items */}
                  {isExpanded && (
                    <div className="px-14 py-4 pb-6 bg-[#0a0a0f] border-t border-[#1e1e2e]/50">
                      <h5 className="text-slate-300 text-sm font-medium mb-3">Order Line Items</h5>
                      {order.lines.length === 0 ? (
                        <p className="text-sm text-slate-500">No line items.</p>
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
          {orders.length === 0 && (
            <tr>
              <td colSpan={20} className="px-6 py-10 text-center text-slate-500">No orders found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────

export function OrdersPage() {
  const { user } = useAuth();
  const isCustomer = user?.role === "CUSTOMER";
  const isAdminOrOp = ["IT_ADMINISTRATOR", "WAREHOUSE_MANAGER", "WAREHOUSE_OPERATOR", "REGIONAL_OPS_HEAD"].includes(user?.role ?? "");

  // Tabs: Customer gets "My Orders" | "Place Order"
  //       Admin/Op gets "All Orders" | "View Requests"
  type Tab = "orders" | "requests" | "form";
  const [tab, setTab] = useState<Tab>("orders");

  // Orders state
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [requests, setRequests] = useState<UiOrder[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [reqLoading, setReqLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reqError, setReqError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchOrders = async (q?: string) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get("/orders", { params: { q } });
      // For non-request tabs, filter out requested/rejected from main list
      const mapped = (res.data ?? []).map(mapOrder);
      setOrders(isAdminOrOp ? mapped.filter((o: UiOrder) => !["requested", "rejected"].includes(o.status)) : mapped);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load orders");
    } finally { setLoading(false); }
  };

  const fetchRequests = async () => {
    setReqLoading(true); setReqError(null);
    try {
      const res = await api.get("/orders", { params: { status: "requested" } });
      setRequests((res.data ?? []).map(mapOrder));
    } catch (err: any) {
      setReqError(err?.response?.data?.message ?? "Failed to load requests");
    } finally { setReqLoading(false); }
  };

  useEffect(() => {
    const t = window.setTimeout(() => fetchOrders(query), 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (tab === "requests" && isAdminOrOp) fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onAdvance = async (id: string, status: string) => {
    setActioningId(id);
    try { await api.patch(`/orders/${id}/status`, { status }); await fetchOrders(query); }
    catch (err: any) { alert(err?.response?.data?.message ?? "Status update failed"); }
    finally { setActioningId(null); }
  };

  const onCancel = async (id: string) => {
    if (!window.confirm("Cancel this order? Reserved inventory will be released.")) return;
    setActioningId(id);
    try { await api.delete(`/orders/${id}`); await fetchOrders(query); }
    catch (err: any) { alert(err?.response?.data?.message ?? "Cancel failed"); }
    finally { setActioningId(null); }
  };

  const onApprove = async (id: string) => {
    setActioningId(id);
    try {
      await api.patch(`/orders/${id}/approve`);
      await fetchRequests();
      await fetchOrders(query);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Approval failed — check inventory availability");
    } finally { setActioningId(null); }
  };

  const onReject = async (id: string) => {
    if (!window.confirm("Reject this order request?")) return;
    setActioningId(id);
    try {
      await api.patch(`/orders/${id}/reject`);
      await fetchRequests();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Rejection failed");
    } finally { setActioningId(null); }
  };

  const onFormDone = async () => {
    setShowForm(false);
    setTab("orders");
    await fetchOrders(query);
    if (isAdminOrOp) await fetchRequests();
  };

  // Tab bar definitions
  const tabs = isCustomer
    ? [
      { key: "orders" as Tab, label: "My Orders" },
      { key: "form" as Tab, label: "Place Order" },
    ]
    : isAdminOrOp
      ? [
        { key: "orders" as Tab, label: "All Orders" },
        { key: "requests" as Tab, label: "View Requests" },
      ]
      : [{ key: "orders" as Tab, label: "All Orders" }];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl">Orders</h1>
        {!isCustomer && isAdminOrOp && tab === "orders" && (
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d2fd4] text-white rounded-lg flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)]">
            <Plus className="w-4 h-4" /> New Order
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111118] p-1 rounded-lg w-fit border border-[#1e1e2e]">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.key
              ? "bg-[#7c3aed] text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-[#1e1e2e]"
              }`}>
            {t.label}
            {t.key === "requests" && requests.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">{requests.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Admin: New Order Form */}
      {showForm && !isCustomer && (
        <OrderForm isRequest={false} onDone={onFormDone} />
      )}

      {/* Customer: Place Order tab shows form */}
      {tab === "form" && isCustomer && (
        <OrderForm isRequest={true} onDone={onFormDone} />
      )}

      {/* Orders / Requests views */}
      {tab === "orders" && (
        <>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} type="text"
                placeholder="Search orders..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#111118] border border-[#1e1e2e] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]/50" />
            </div>
            <button className="px-4 py-2 bg-[#111118] border border-[#1e1e2e] hover:border-[#7c3aed]/50 text-slate-400 hover:text-white rounded-lg flex items-center gap-2 transition-all">
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>

          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <OrderTable
              orders={orders} loading={loading} error={error} isCustomer={isCustomer}
              showRequestActions={false} onAdvance={onAdvance} onCancel={onCancel} actioningId={actioningId}
            />
          </div>
        </>
      )}

      {tab === "requests" && isAdminOrOp && (
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
          <OrderTable
            orders={requests} loading={reqLoading} error={reqError} isCustomer={false}
            showRequestActions={true} onAdvance={onAdvance} onCancel={onCancel}
            onApprove={onApprove} onReject={onReject} actioningId={actioningId}
          />
        </div>
      )}
    </div>
  );
}
