import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Plus, X, Check, XCircle, PackageCheck } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../components/AuthContext";

type InventoryRequest = {
    id: string;
    warehouse: { code: string; name: string };
    client: { code: string; name: string };
    sku: { skuCode: string; description: string };
    requestedQty: number;
    status: string;
    notes: string | null;
    requestedBy: { name: string };
    respondedBy: { name: string } | null;
    createdAt: string;
};

type DropdownItem = { id: string; code?: string; name: string };
type SkuItem = { id: string; skuCode: string; description: string; client: string };

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    approved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    received: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export function InventoryRequestsPage() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<InventoryRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actioningId, setActioningId] = useState<string | null>(null);

    // Create form
    const [showForm, setShowForm] = useState(false);
    const [clients, setClients] = useState<DropdownItem[]>([]);
    const [warehouses, setWarehouses] = useState<DropdownItem[]>([]);
    const [skus, setSkus] = useState<SkuItem[]>([]);
    const [formClientId, setFormClientId] = useState("");
    const [formWarehouseId, setFormWarehouseId] = useState("");
    const [formSkuId, setFormSkuId] = useState("");
    const [formQty, setFormQty] = useState(1);
    const [formNotes, setFormNotes] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const isWarehouseStaff = ["IT_ADMINISTRATOR", "WAREHOUSE_MANAGER", "WAREHOUSE_OPERATOR"].includes(user?.role ?? "");
    const canApprove = ["IT_ADMINISTRATOR", "CLIENT_USER"].includes(user?.role ?? "");

    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/inventory-requests");
            setRequests(res.data ?? []);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

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

    const onCreateRequest = async (e?: FormEvent) => {
        e?.preventDefault();
        setCreateError(null);
        setCreating(true);
        try {
            await api.post("/inventory-requests", {
                clientId: formClientId,
                warehouseId: formWarehouseId,
                skuId: formSkuId,
                requestedQty: formQty,
                notes: formNotes || undefined,
            });
            setShowForm(false);
            setFormNotes("");
            setFormQty(1);
            await fetchRequests();
        } catch (err: any) {
            setCreateError(err?.response?.data?.message ?? "Failed to create request");
        } finally {
            setCreating(false);
        }
    };

    const onApprove = async (id: string) => {
        setActioningId(id);
        try {
            await api.patch(`/inventory-requests/${id}/approve`);
            await fetchRequests();
        } catch (err: any) {
            alert(err?.response?.data?.message ?? "Approve failed");
        } finally {
            setActioningId(null);
        }
    };

    const onReject = async (id: string) => {
        setActioningId(id);
        try {
            await api.patch(`/inventory-requests/${id}/reject`);
            await fetchRequests();
        } catch (err: any) {
            alert(err?.response?.data?.message ?? "Reject failed");
        } finally {
            setActioningId(null);
        }
    };

    const onConfirmReceived = async (id: string) => {
        setActioningId(id);
        try {
            await api.patch(`/inventory-requests/${id}/received`);
            await fetchRequests();
        } catch (err: any) {
            alert(err?.response?.data?.message ?? "Confirm received failed");
        } finally {
            setActioningId(null);
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
                <h1 className="text-white text-2xl">Inventory Requests</h1>
                {isWarehouseStaff && (
                    <button
                        onClick={openForm}
                        className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d2fd4] text-white rounded-lg flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)]"
                    >
                        <Plus className="w-4 h-4" />
                        New Request
                    </button>
                )}
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="bg-[#111118] border border-[#7c3aed]/30 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white text-lg">Create Inventory Request</h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={onCreateRequest} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="block text-sm text-slate-300">Client</label>
                            <select
                                value={formClientId}
                                onChange={(e) => {
                                    setFormClientId(e.target.value);
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
                        <div className="space-y-1">
                            <label className="block text-sm text-slate-300">Notes (optional)</label>
                            <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                                placeholder="Reason for request..."
                                className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]/50" />
                        </div>
                        <div className="flex items-end">
                            <button type="submit" disabled={creating}
                                className="w-full px-4 py-2.5 bg-[#7c3aed] hover:bg-[#6d2fd4] text-white rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                                <Plus className="w-4 h-4" />
                                {creating ? "Creating..." : "Create Request"}
                            </button>
                        </div>
                    </form>
                    {createError && <p className="text-red-400 text-sm">{createError}</p>}
                </div>
            )}

            {/* Requests Table */}
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
                                    <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Client</th>
                                    <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Warehouse</th>
                                    <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">SKU</th>
                                    <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Qty</th>
                                    <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Status</th>
                                    <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Requested By</th>
                                    <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Notes</th>
                                    <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req, idx) => (
                                    <tr key={req.id} className={`border-b border-[#1e1e2e] hover:bg-[#0a0a0f] transition-colors ${idx % 2 === 0 ? "bg-[#111118]" : "bg-[#0f0f16]"}`}>
                                        <td className="px-6 py-4 text-slate-300">{req.client.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-400 font-mono text-sm">{req.warehouse.code}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <span className="text-white font-mono text-sm">{req.sku.skuCode}</span>
                                                <p className="text-slate-500 text-xs">{req.sku.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-white">{req.requestedQty}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs border ${STATUS_COLORS[req.status] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{req.requestedBy.name}</td>
                                        <td className="px-6 py-4 text-slate-500 text-sm max-w-[200px] truncate">{req.notes ?? "—"}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {req.status === "pending" && canApprove && (
                                                    <>
                                                        <button onClick={() => onApprove(req.id)} disabled={actioningId === req.id}
                                                            className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-1 transition-all disabled:opacity-50">
                                                            <Check className="w-3 h-3" /> Approve
                                                        </button>
                                                        <button onClick={() => onReject(req.id)} disabled={actioningId === req.id}
                                                            className="px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-1 transition-all disabled:opacity-50">
                                                            <XCircle className="w-3 h-3" /> Reject
                                                        </button>
                                                    </>
                                                )}
                                                {req.status === "approved" && isWarehouseStaff && (
                                                    <button onClick={() => onConfirmReceived(req.id)} disabled={actioningId === req.id}
                                                        className="px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs flex items-center gap-1 transition-all disabled:opacity-50">
                                                        <PackageCheck className="w-3 h-3" /> Confirm Received
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                                            No inventory requests found.
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
