import { Bell } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  userName: string;
  notifications?: number;
}

export function Header({ userName, notifications = 0 }: HeaderProps) {
  const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="sticky top-0 h-16 bg-slate-950/40 backdrop-blur-xl border-b border-slate-800/50 flex items-center justify-between px-8 z-10 ml-64">
      <div>
        <h2 className="text-lg text-white">Welcome back, <span className="font-semibold text-purple-400">{userName}</span></h2>
        <p className="text-xs text-slate-400">{currentDate}</p>
      </div>

      <button className="relative p-2 rounded-lg hover:bg-slate-800/40 transition-all">
        <Bell className="w-5 h-5 text-slate-400" />
        {notifications > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-semibold">
            {notifications}
          </span>
        )}
      </button>
    </div>
  );
}
