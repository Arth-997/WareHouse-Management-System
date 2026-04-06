import { Search, Filter, Plus } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";

export function OrdersPage() {
  const orders = [
    { 
      id: 'ORD-2024-3421', 
      client: 'TechCorp India', 
      sku: 'SKU-8721',
      qty: 150,
      warehouse: 'WH-Mumbai-01',
      status: 'in-progress',
      created: '2026-03-15 10:30',
      deadline: '2026-03-17 14:00'
    },
    { 
      id: 'ORD-2024-3420', 
      client: 'Global Retail Ltd', 
      sku: 'SKU-5692',
      qty: 280,
      warehouse: 'WH-Delhi-01',
      status: 'completed',
      created: '2026-03-14 09:15',
      deadline: '2026-03-16 12:00'
    },
    { 
      id: 'ORD-2024-3419', 
      client: 'FastMart Solutions', 
      sku: 'SKU-3412',
      qty: 95,
      warehouse: 'WH-Bangalore-01',
      status: 'in-progress',
      created: '2026-03-15 14:20',
      deadline: '2026-03-16 16:30'
    },
    { 
      id: 'ORD-2024-3418', 
      client: 'Metro Supplies', 
      sku: 'SKU-9876',
      qty: 450,
      warehouse: 'WH-Mumbai-01',
      status: 'pending',
      created: '2026-03-16 08:00',
      deadline: '2026-03-18 10:00'
    },
  ];

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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
