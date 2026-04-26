type StatusOption = 'success' | 'warning' | 'danger' | 'neutral' | 'pending' | 'completed' | 'in-progress' | 'cancelled' | 'dispatched';

interface StatusBadgeProps {
  status: StatusOption;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-500 border-red-500/20',
    neutral: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'in-progress': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  const displayLabel = label || status.replace('-', ' ').toUpperCase();

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs border ${styles[status]}`}>
      {displayLabel}
    </span>
  );
}
