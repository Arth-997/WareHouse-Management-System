import { LucideIcon } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconColor?: string;
}

export function KPICard({ title, value, icon: Icon, trend, iconColor = 'text-purple-500' }: KPICardProps) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 mb-2">{title}</p>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          {trend && (
            <p className={`text-xs ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-slate-800/40 ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </GlassCard>
  );
}
