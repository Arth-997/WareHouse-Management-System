import { ReactNode } from 'react';
import { cn } from './ui/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div className={cn(
      "bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl shadow-2xl",
      className
    )}>
      {children}
    </div>
  );
}
