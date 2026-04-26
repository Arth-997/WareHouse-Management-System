import { Package, ShoppingCart, AlertTriangle, TrendingUp, Users, DollarSign } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { GlassCard } from '../components/GlassCard';

interface OverviewPageProps {
  userRole: 'operations' | 'client' | 'finance';
}

export function OverviewPage({ userRole }: OverviewPageProps) {
  if (userRole === 'operations') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard title="Total Orders" value="2,847" icon={ShoppingCart} trend={{ value: "12% from last week", isPositive: true }} />
          <KPICard title="Active Inventory" value="45,231" icon={Package} iconColor="text-blue-500" />
          <KPICard title="SLA Breaches" value="8" icon={AlertTriangle} iconColor="text-red-500" trend={{ value: "3 from yesterday", isPositive: false }} />
          <KPICard title="Warehouses" value="12" icon={TrendingUp} iconColor="text-green-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Warehouse Status</h3>
            <div className="space-y-3">
              {['Los Angeles', 'New York', 'Chicago', 'Dallas'].map((location, idx) => (
                <div key={location} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">{location}</p>
                    <p className="text-xs text-slate-400">Zone {idx + 1}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-600 to-violet-600" style={{ width: `${75 - idx * 10}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-white">{75 - idx * 10}%</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Orders</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left text-xs font-medium text-slate-400 pb-3">Order ID</th>
                    <th className="text-left text-xs font-medium text-slate-400 pb-3">Status</th>
                    <th className="text-left text-xs font-medium text-slate-400 pb-3">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'ORD-4521', status: 'Pending', priority: 'High' },
                    { id: 'ORD-4520', status: 'Dispatched', priority: 'Medium' },
                    { id: 'ORD-4519', status: 'Delivered', priority: 'Low' },
                    { id: 'ORD-4518', status: 'Pending', priority: 'High' },
                  ].map((order) => (
                    <tr key={order.id} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                      <td className="py-3 text-sm text-white font-mono">{order.id}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          order.status === 'Dispatched' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                          order.priority === 'Medium' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {order.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (userRole === 'finance') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard title="Total Revenue" value="$847,231" icon={DollarSign} trend={{ value: "18% from last month", isPositive: true }} />
          <KPICard title="Outstanding Invoices" value="$42,150" icon={AlertTriangle} iconColor="text-orange-500" />
          <KPICard title="Active Clients" value="47" icon={Users} iconColor="text-blue-500" />
        </div>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Client Billing Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-400 pb-3">Client</th>
                  <th className="text-left text-xs font-medium text-slate-400 pb-3">Active Orders</th>
                  <th className="text-left text-xs font-medium text-slate-400 pb-3">Delivered</th>
                  <th className="text-left text-xs font-medium text-slate-400 pb-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { client: 'TechCorp Inc.', active: 45, delivered: 312, revenue: '$145,200' },
                  { client: 'Fashion Brands Ltd.', active: 32, delivered: 289, revenue: '$98,400' },
                  { client: 'Global Retail Co.', active: 28, delivered: 401, revenue: '$178,900' },
                ].map((row) => (
                  <tr key={row.client} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                    <td className="py-4 text-sm text-white font-medium">{row.client}</td>
                    <td className="py-4 text-sm text-slate-300">{row.active}</td>
                    <td className="py-4 text-sm text-slate-300">{row.delivered}</td>
                    <td className="py-4 text-sm text-green-400 font-semibold">{row.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard title="My Inventory" value="8,421" icon={Package} iconColor="text-blue-500" />
        <KPICard title="My Orders" value="124" icon={ShoppingCart} trend={{ value: "5 new this week", isPositive: true }} />
        <KPICard title="Pending Requests" value="3" icon={AlertTriangle} iconColor="text-yellow-500" />
      </div>

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">My Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-medium text-slate-400 pb-3">Order ID</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-3">SKU</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-3">Destination</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'ORD-4521', sku: 'SKU-782', status: 'Dispatched', dest: 'New York' },
                { id: 'ORD-4498', sku: 'SKU-156', status: 'Delivered', dest: 'Chicago' },
                { id: 'ORD-4476', sku: 'SKU-923', status: 'Pending', dest: 'Dallas' },
              ].map((order) => (
                <tr key={order.id} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                  <td className="py-3 text-sm text-white font-mono">{order.id}</td>
                  <td className="py-3 text-sm text-slate-300 font-mono">{order.sku}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      order.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      order.status === 'Dispatched' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-slate-300">{order.dest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
