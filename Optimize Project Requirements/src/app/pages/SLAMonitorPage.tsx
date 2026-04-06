import { KPICard } from "../components/KPICard";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

export function SLAMonitorPage() {
  const kpis = [
    { title: 'Breaches', value: '7', icon: AlertTriangle, iconColor: 'text-red-500' },
    { title: 'Warnings ≤2h', value: '23', icon: Clock, iconColor: 'text-amber-500' },
    { title: 'On Track', value: '312', icon: CheckCircle2, iconColor: 'text-emerald-500' },
  ];

  const slaItems = [
    {
      orderId: 'ORD-2024-3417',
      client: 'Quick Commerce',
      warehouse: 'WH-Mumbai-01',
      deadline: '2026-03-16 14:00',
      timeLeft: 'OVERDUE',
      status: 'breach',
      overdueBy: '2h 15m',
    },
    {
      orderId: 'ORD-2024-3419',
      client: 'FastMart Solutions',
      warehouse: 'WH-Delhi-01',
      deadline: '2026-03-16 16:30',
      timeLeft: '1h 45m',
      status: 'warning',
      overdueBy: null,
    },
    {
      orderId: 'ORD-2024-3425',
      client: 'TechCorp India',
      warehouse: 'WH-Bangalore-01',
      deadline: '2026-03-16 17:00',
      timeLeft: '45m',
      status: 'warning',
      overdueBy: null,
    },
    {
      orderId: 'ORD-2024-3401',
      client: 'Metro Supplies',
      warehouse: 'WH-Kolkata-01',
      deadline: '2026-03-16 12:00',
      timeLeft: 'OVERDUE',
      status: 'breach',
      overdueBy: '4h 30m',
    },
    {
      orderId: 'ORD-2024-3428',
      client: 'Global Retail Ltd',
      warehouse: 'WH-Mumbai-01',
      deadline: '2026-03-16 18:00',
      timeLeft: '3h 15m',
      status: 'on-track',
      overdueBy: null,
    },
    {
      orderId: 'ORD-2024-3430',
      client: 'Smart Logistics',
      warehouse: 'WH-Delhi-01',
      deadline: '2026-03-16 19:30',
      timeLeft: '4h 45m',
      status: 'on-track',
      overdueBy: null,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'breach':
        return 'bg-red-500/5 border-red-500/20';
      case 'warning':
        return 'bg-amber-500/5 border-amber-500/20';
      case 'on-track':
        return 'bg-emerald-500/5 border-emerald-500/20';
      default:
        return 'bg-[#1e1e2e]';
    }
  };

  const getTimeColor = (status: string) => {
    switch (status) {
      case 'breach':
        return 'text-red-500';
      case 'warning':
        return 'text-amber-500';
      case 'on-track':
        return 'text-emerald-500';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl">SLA Monitor</h1>
        <div className="text-slate-400 text-sm">
          Live feed • Auto-refresh every 30s
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* SLA Feed */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
        <h3 className="text-white text-lg mb-4">Live SLA Feed</h3>
        <div className="space-y-3">
          {slaItems.map((item) => (
            <div
              key={item.orderId}
              className={`p-4 rounded-lg border transition-all hover:shadow-lg ${getStatusColor(item.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-mono">{item.orderId}</span>
                    {item.status === 'breach' && (
                      <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-500">
                        BREACH
                      </span>
                    )}
                    {item.status === 'warning' && (
                      <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-xs text-amber-500">
                        WARNING
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Client</p>
                      <p className="text-slate-300">{item.client}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Warehouse</p>
                      <p className="text-slate-400 font-mono text-sm">{item.warehouse}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Deadline</p>
                      <p className="text-slate-300">{item.deadline}</p>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className={`text-3xl mb-1 ${getTimeColor(item.status)}`}>
                    {item.timeLeft}
                  </div>
                  {item.overdueBy && (
                    <div className="text-xs text-red-400">
                      Overdue by {item.overdueBy}
                    </div>
                  )}
                  {!item.overdueBy && item.status !== 'on-track' && (
                    <div className="text-xs text-amber-400">
                      Time remaining
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
