import { GlassCard } from '../components/GlassCard';
import { AlertTriangle, Clock } from 'lucide-react';

export function SLAMonitorPage() {
  const breachedOrders = [
    { id: 'ORD-4501', sku: 'SKU-001', client: 'TechCorp Inc.', deadline: '2026-04-05 10:00', hoursLate: 28 },
    { id: 'ORD-4489', sku: 'SKU-004', client: 'Fashion Brands Ltd.', deadline: '2026-04-04 14:00', hoursLate: 52 },
  ];

  const atRiskOrders = [
    { id: 'ORD-4521', sku: 'SKU-001', client: 'TechCorp Inc.', deadline: '2026-04-07 14:00', hoursRemaining: 32 },
    { id: 'ORD-4518', sku: 'SKU-004', client: 'Global Retail Co.', deadline: '2026-04-07 09:00', hoursRemaining: 27 },
  ];

  const onTrackOrders = [
    { id: 'ORD-4520', sku: 'SKU-002', client: 'Fashion Brands Ltd.', deadline: '2026-04-08 10:00', hoursRemaining: 58 },
    { id: 'ORD-4517', sku: 'SKU-005', client: 'TechCorp Inc.', deadline: '2026-04-09 12:00', hoursRemaining: 78 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">SLA Monitor</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-6 border-2 border-red-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400">Breached</h3>
              <p className="text-2xl font-bold text-red-400">{breachedOrders.length}</p>
            </div>
          </div>
          <div className="space-y-3">
            {breachedOrders.map((order) => (
              <div key={order.id} className="p-4 bg-red-950/20 border border-red-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono font-semibold text-white">{order.id}</span>
                  <span className="text-xs text-red-400 font-medium">{order.hoursLate}h late</span>
                </div>
                <p className="text-xs text-slate-400 mb-1">{order.client}</p>
                <p className="text-xs text-slate-500">SKU: {order.sku}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 border-2 border-yellow-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400">At Risk</h3>
              <p className="text-2xl font-bold text-yellow-400">{atRiskOrders.length}</p>
            </div>
          </div>
          <div className="space-y-3">
            {atRiskOrders.map((order) => (
              <div key={order.id} className="p-4 bg-yellow-950/20 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono font-semibold text-white">{order.id}</span>
                  <span className="text-xs text-yellow-400 font-medium">{order.hoursRemaining}h left</span>
                </div>
                <p className="text-xs text-slate-400 mb-1">{order.client}</p>
                <p className="text-xs text-slate-500">SKU: {order.sku}</p>
                <div className="mt-2 w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                    style={{ width: `${(order.hoursRemaining / 48) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 border-2 border-green-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400">On Track</h3>
              <p className="text-2xl font-bold text-green-400">{onTrackOrders.length}</p>
            </div>
          </div>
          <div className="space-y-3">
            {onTrackOrders.map((order) => (
              <div key={order.id} className="p-4 bg-green-950/20 border border-green-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono font-semibold text-white">{order.id}</span>
                  <span className="text-xs text-green-400 font-medium">{order.hoursRemaining}h left</span>
                </div>
                <p className="text-xs text-slate-400 mb-1">{order.client}</p>
                <p className="text-xs text-slate-500">SKU: {order.sku}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
