import { useEffect, useMemo, useState } from "react";
import { KPICard } from "../components/KPICard";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { api } from "../../lib/api";

export function SLAMonitorPage() {
  type ApiOrder = {
    orderRef: string;
    client: string;
    warehouse: string;
    status: string;
    slaDeadlineAt: string | null;
    slaBreached: boolean;
    slaWarningLeadHours: number;
  };

  type SlaItem = {
    orderId: string;
    client: string;
    warehouse: string;
    deadline: string;
    timeLeft: string;
    status: "breach" | "warning" | "on-track";
    overdueBy: string | null;
  };

  const [slaItems, setSlaItems] = useState<SlaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDeadline = (iso: string) => new Date(iso).toISOString().replace("T", " ").slice(0, 16);

  const formatDurationMs = (ms: number) => {
    const totalMinutes = Math.max(0, Math.floor(ms / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const computeSla = (orders: ApiOrder[]) => {
    const now = Date.now();
    const mapped: SlaItem[] = [];

    for (const o of orders) {
      if (!o.slaDeadlineAt) continue;
      const deadlineTs = new Date(o.slaDeadlineAt).getTime();
      const timeLeftMs = deadlineTs - now;

      let status: SlaItem["status"] = "on-track";
      if (o.slaBreached || timeLeftMs <= 0) status = "breach";
      else if (timeLeftMs <= (o.slaWarningLeadHours ?? 0) * 3600_000) status = "warning";

      const overdueBy = status === "breach" ? formatDurationMs(now - deadlineTs) : null;
      const timeLeft =
        status === "breach"
          ? "OVERDUE"
          : formatDurationMs(timeLeftMs);

      mapped.push({
        orderId: o.orderRef,
        client: o.client,
        warehouse: o.warehouse,
        deadline: formatDeadline(o.slaDeadlineAt),
        timeLeft,
        status,
        overdueBy,
      });
    }

    return mapped.sort((a, b) => a.deadline.localeCompare(b.deadline));
  };

  const fetchSla = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/orders");
      const orders = res.data ?? [];
      setSlaItems(computeSla(orders));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load SLA data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSla();
    const t = window.setInterval(fetchSla, 30_000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpis = useMemo(() => {
    const breaches = slaItems.filter((i) => i.status === "breach").length;
    const warnings = slaItems.filter((i) => i.status === "warning").length;
    const onTrack = slaItems.filter((i) => i.status === "on-track").length;
    return [
      { title: "Breaches", value: breaches, icon: AlertTriangle, iconColor: "text-red-500" },
      { title: "Warnings", value: warnings, icon: Clock, iconColor: "text-amber-500" },
      { title: "On Track", value: onTrack, icon: CheckCircle2, iconColor: "text-emerald-500" },
    ];
  }, [slaItems]);

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
        {loading ? (
          <div className="text-slate-400">Loading...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
