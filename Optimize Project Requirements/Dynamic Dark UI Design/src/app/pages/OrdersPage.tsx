import { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Search, Clock } from 'lucide-react';

export function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const ordersData = [
    { id: 'ORD-4521', priority: 'High', status: 'Pending', slaDeadline: '2026-04-07 14:00', client: 'TechCorp Inc.', sku: 'SKU-001' },
    { id: 'ORD-4520', priority: 'Medium', status: 'Dispatched', slaDeadline: '2026-04-08 10:00', client: 'Fashion Brands Ltd.', sku: 'SKU-002' },
    { id: 'ORD-4519', priority: 'Low', status: 'Delivered', slaDeadline: '2026-04-06 16:00', client: 'Global Retail Co.', sku: 'SKU-003' },
    { id: 'ORD-4518', priority: 'High', status: 'Pending', slaDeadline: '2026-04-07 09:00', client: 'TechCorp Inc.', sku: 'SKU-004' },
    { id: 'ORD-4517', priority: 'Medium', status: 'Dispatched', slaDeadline: '2026-04-09 12:00', client: 'Fashion Brands Ltd.', sku: 'SKU-005' },
  ];

  const filteredData = ordersData.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Orders</h2>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order or client..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-medium text-slate-400 pb-4">Order ID</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-4">Client</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-4">SKU</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-4">Priority</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-4">Status</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-4">SLA Deadline</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((order) => (
                <tr key={order.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 text-sm text-white font-mono font-semibold">{order.id}</td>
                  <td className="py-4 text-sm text-slate-300">{order.client}</td>
                  <td className="py-4 text-sm text-slate-400 font-mono">{order.sku}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.priority === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      order.priority === 'Medium' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      order.status === 'Dispatched' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Clock className="w-4 h-4" />
                      {order.slaDeadline}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
