import { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Plus, Check, Truck } from 'lucide-react';

interface StockRequestsPageProps {
  userRole: 'operations' | 'client' | 'finance';
}

export function StockRequestsPage({ userRole }: StockRequestsPageProps) {
  const [requests, setRequests] = useState([
    { id: 'SR-001', client: 'TechCorp Inc.', sku: 'SKU-001', quantity: 500, status: 'Pending', date: '2026-04-05' },
    { id: 'SR-002', client: 'Fashion Brands Ltd.', sku: 'SKU-002', quantity: 300, status: 'Approved', date: '2026-04-04' },
    { id: 'SR-003', client: 'Global Retail Co.', sku: 'SKU-003', quantity: 750, status: 'Received', date: '2026-04-03' },
  ]);

  const [showNewForm, setShowNewForm] = useState(false);

  const handleApprove = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
  };

  const handleConfirmReceipt = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'Received' } : r));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Stock Requests</h2>
        {userRole === 'operations' && (
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/30"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        )}
      </div>

      {showNewForm && userRole === 'operations' && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Stock Request</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Client</label>
              <select className="w-full px-4 py-2 bg-slate-950/60 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option>TechCorp Inc.</option>
                <option>Fashion Brands Ltd.</option>
                <option>Global Retail Co.</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">SKU</label>
              <input
                type="text"
                placeholder="SKU-XXX"
                className="w-full px-4 py-2 bg-slate-950/60 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
              <input
                type="number"
                placeholder="0"
                className="w-full px-4 py-2 bg-slate-950/60 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all">
              Submit Request
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        </GlassCard>
      )}

      {userRole === 'client' && requests.filter(r => r.status === 'Pending').length > 0 && (
        <GlassCard className="p-6 border-2 border-yellow-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Action Required</h3>
              <p className="text-sm text-slate-400">You have {requests.filter(r => r.status === 'Pending').length} pending stock request(s)</p>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Request History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-medium text-slate-400 pb-4">Request ID</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-4">Client</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-4">SKU</th>
                <th className="text-right text-xs font-medium text-slate-400 pb-4">Quantity</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-4">Status</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-4">Date</th>
                <th className="text-right text-xs font-medium text-slate-400 pb-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 text-sm text-white font-mono">{request.id}</td>
                  <td className="py-4 text-sm text-slate-300">{request.client}</td>
                  <td className="py-4 text-sm text-slate-400 font-mono">{request.sku}</td>
                  <td className="py-4 text-sm text-white text-right font-semibold">{request.quantity.toLocaleString()}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      request.status === 'Approved' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-slate-400">{request.date}</td>
                  <td className="py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      {userRole === 'client' && request.status === 'Pending' && (
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-xs font-medium transition-all border border-green-500/30"
                        >
                          <Check className="w-3 h-3" />
                          Approve
                        </button>
                      )}
                      {userRole === 'operations' && request.status === 'Approved' && (
                        <button
                          onClick={() => handleConfirmReceipt(request.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-medium transition-all border border-blue-500/30"
                        >
                          <Truck className="w-3 h-3" />
                          Confirm Receipt
                        </button>
                      )}
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
