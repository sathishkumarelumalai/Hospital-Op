import React from 'react';
import { 
  LayoutDashboard, 
  History, 
  TrendingUp, 
  Hospital,
  LogOut,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { View } from '../../types';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-clinical-border h-screen flex flex-col bg-white z-20">
      <div className="p-8 border-b border-clinical-border flex items-center gap-3">
        <div className="w-9 h-9 bg-clinical-ink rounded-sm flex items-center justify-center text-white shadow-xl rotate-3">
          <Hospital size={20} className="-rotate-3" />
        </div>
        <div className="flex flex-col">
          <span className="font-display font-black tracking-tighter text-xl italic leading-none">CarePredict</span>
          <span className="micro-label mt-1 opacity-60">System v1.0.42</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-8">
        <div className="space-y-1">
          <p className="micro-label px-4 mb-4">Core Fleet</p>
          <NavItem 
            active={activeView === 'dashboard'} 
            onClick={() => onViewChange('dashboard')}
            icon={<LayoutDashboard size={18} />}
            label="Overview" 
          />
          <NavItem 
            active={activeView === 'history'} 
            onClick={() => onViewChange('history')}
            icon={<History size={18} />}
            label="Registry" 
          />
          <NavItem 
            active={activeView === 'forecast'} 
            onClick={() => onViewChange('forecast')}
            icon={<TrendingUp size={18} />}
            label="Predictor" 
          />
        </div>

        <div className="space-y-1">
          <p className="micro-label px-4 mb-4">Administration</p>
          <NavItem 
            active={false} 
            onClick={() => {}}
            icon={<Settings size={18} />}
            label="Calibration" 
          />
          <NavItem 
            active={false} 
            onClick={() => {}}
            icon={<ShieldCheck size={18} />}
            label="Compliance" 
          />
        </div>
      </nav>

      <div className="p-6 border-t border-clinical-border">
        <div className="flex items-center gap-3 p-3 rounded-md border border-clinical-border group cursor-pointer hover:border-clinical-ink transition-all">
          <div className="w-8 h-8 rounded bg-clinical-border group-hover:bg-clinical-ink transition-colors" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold truncate tracking-tight">Dr. Adonvane</p>
            <p className="text-[10px] text-clinical-muted truncate font-mono">STAFF_ID: 9482</p>
          </div>
          <LogOut size={14} className="text-clinical-muted group-hover:text-clinical-ink" />
        </div>
      </div>
    </aside>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-[13px] font-medium transition-all relative group",
        active 
          ? "text-clinical-ink bg-transparent" 
          : "text-clinical-muted hover:text-clinical-ink hover:translate-x-1"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-clinical-accent rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
      )}
      <span className={cn("transition-colors", active ? "text-clinical-accent" : "opacity-40 group-hover:opacity-100")}>
        {icon}
      </span>
      {label}
    </button>
  );
}
