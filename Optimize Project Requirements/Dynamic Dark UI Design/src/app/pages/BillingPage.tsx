import { GlassCard } from '../components/GlassCard';
import { DollarSign } from 'lucide-react';

export function BillingPage() {
  const billingData = [
    {
      client: 'TechCorp Inc.',
      standardOrders: 234,
      rushOrders: 12,
      standardRate: 15.50,
      rushRate: 35.00,
      totalRevenue: 4047,
    },
    {
      client: 'Fashion Brands Ltd.',
      standardOrders: 198,
      rushOrders: 8,
      standardRate: 15.50,
      rushRate: 35.00,
      totalRevenue: 3349,
    },
    {
      client: 'Global Retail Co.',
      standardOrders: 312,
      rushOrders: 15,
      standardRate: 15.50,
      rushRate: 35.00,
      totalRevenue: 5361,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Billing Overview</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
          <DollarSign className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-xs text-green-300">Total Monthly Revenue</p>
            <p className="text-lg font-bold text-green-400">
              ${billingData.reduce((sum, item) => sum + item.totalRevenue, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-medium text-slate-400 pb-4">Client</th>
                <th className="text-right text-xs font-medium text-slate-400 pb-4">Standard Orders</th>
                <th className="text-right text-xs font-medium text-slate-400 pb-4">Rush Orders</th>
                <th className="text-right text-xs font-medium text-slate-400 pb-4">Standard Rate</th>
                <th className="text-right text-xs font-medium text-slate-400 pb-4">Rush Rate</th>
                <th className="text-right text-xs font-medium text-slate-400 pb-4">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {billingData.map((row) => (
                <tr key={row.client} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 text-sm text-white font-medium">{row.client}</td>
                  <td className="py-4 text-sm text-slate-300 text-right">{row.standardOrders}</td>
                  <td className="py-4 text-sm text-orange-400 text-right font-semibold">{row.rushOrders}</td>
                  <td className="py-4 text-sm text-slate-400 text-right">${row.standardRate}</td>
                  <td className="py-4 text-sm text-orange-400 text-right">${row.rushRate}</td>
                  <td className="py-4 text-sm text-green-400 text-right font-bold">
                    ${row.totalRevenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-purple-500/30">
                <td className="py-4 text-sm text-white font-bold">Total</td>
                <td className="py-4 text-sm text-white text-right font-semibold">
                  {billingData.reduce((sum, item) => sum + item.standardOrders, 0)}
                </td>
                <td className="py-4 text-sm text-orange-400 text-right font-semibold">
                  {billingData.reduce((sum, item) => sum + item.rushOrders, 0)}
                </td>
                <td className="py-4"></td>
                <td className="py-4"></td>
                <td className="py-4 text-lg text-green-400 text-right font-bold">
                  ${billingData.reduce((sum, item) => sum + item.totalRevenue, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Billing Categories</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">Standard Fulfillment</p>
                <p className="text-xs text-slate-400">48-hour delivery</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-green-400">$15.50</p>
                <p className="text-xs text-slate-500">per order</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">Rush Fulfillment</p>
                <p className="text-xs text-slate-400">24-hour delivery</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-orange-400">$35.00</p>
                <p className="text-xs text-slate-500">per order</p>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Distribution</h3>
          <div className="space-y-4">
            {billingData.map((item) => {
              const total = billingData.reduce((sum, i) => sum + i.totalRevenue, 0);
              const percentage = ((item.totalRevenue / total) * 100).toFixed(1);
              return (
                <div key={item.client}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300">{item.client}</span>
                    <span className="text-sm text-purple-400 font-semibold">{percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-violet-600"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
