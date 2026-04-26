import { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Search } from 'lucide-react';

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const inventoryData = [
    { sku: 'SKU-001', description: 'Electronic Widget A', warehouse: 'Los Angeles', onHand: 1250, available: 1180, storageType: 'Ambient' },
    { sku: 'SKU-002', description: 'Premium Component B', warehouse: 'New York', onHand: 890, available: 850, storageType: 'Cold' },
    { sku: 'SKU-003', description: 'Industrial Part C', warehouse: 'Chicago', onHand: 2340, available: 2290, storageType: 'Ambient' },
    { sku: 'SKU-004', description: 'Chemical Solution D', warehouse: 'Dallas', onHand: 450, available: 420, storageType: 'Hazardous' },
    { sku: 'SKU-005', description: 'Luxury Item E', warehouse: 'Los Angeles', onHand: 670, available: 650, storageType: 'Cold' },
  ];

  const filteredData = inventoryData.filter(item =>
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Inventory</h2>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search SKU or description..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-medium text-slate-400 pb-4 cursor-pointer hover:text-purple-400">SKU</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-4 cursor-pointer hover:text-purple-400">Description</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-4 cursor-pointer hover:text-purple-400">Warehouse</th>
                <th className="text-right text-xs font-medium text-slate-400 pb-4 cursor-pointer hover:text-purple-400">On-Hand Qty</th>
                <th className="text-right text-xs font-medium text-slate-400 pb-4 cursor-pointer hover:text-purple-400">Available Qty</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-4">Storage Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.sku} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 text-sm text-white font-mono">{item.sku}</td>
                  <td className="py-4 text-sm text-slate-300">{item.description}</td>
                  <td className="py-4 text-sm text-slate-300">{item.warehouse}</td>
                  <td className="py-4 text-sm text-white text-right font-semibold">{item.onHand.toLocaleString()}</td>
                  <td className="py-4 text-sm text-green-400 text-right font-semibold">{item.available.toLocaleString()}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.storageType === 'Ambient' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      item.storageType === 'Cold' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                      'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {item.storageType}
                    </span>
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
