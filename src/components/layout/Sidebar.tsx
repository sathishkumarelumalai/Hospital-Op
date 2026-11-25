import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  History, 
  TrendingUp, 
  LogOut,
  Settings,
  ShieldCheck,
  Cpu,
  Monitor,
  Download
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { View } from '../../types';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [downloadingZip, setDownloadingZip] = useState(false);

  const handleDownloadProjectZip = async () => {
    if (downloadingZip) return;
    setDownloadingZip(true);
    try {
      const response = await fetch('/api/download-project');
      if (!response.ok) {
        throw new Error('Failed to download archive');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = 'carepredict-os-project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Project ZIP download error:', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <aside className="w-[72px] lg:w-72 border-r border-hud-border h-screen flex flex-col bg-hud-bg z-20 transition-all duration-500 ease-in-out">
      <div className="h-20 flex items-center px-6 border-b border-hud-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 hud-panel flex items-center justify-center text-hud-accent shadow-[0_4px_12px_rgba(16,185,129,0.1)]">
            <Cpu size={18} />
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="font-display text-[14px] font-black tracking-tight text-hud-ink uppercase italic">CarePredict_OS</span>
            <div className="flex items-center gap-1.5">
              <div className="indicator bg-hud-safe indicator-glow text-hud-safe" />
              <span className="font-mono text-[8.5px] opacity-40 uppercase tracking-widest">Protocol_Active</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-10 mt-6">
        <div className="space-y-1.5">
          <p className="label-font px-4 mb-4 hidden lg:block">Vector_Array</p>
          <NavItem 
            active={activeView === 'dashboard'} 
            onClick={() => onViewChange('dashboard')}
            icon={<Monitor size={20} />}
            label="Overview" 
          />
          <NavItem 
            active={activeView === 'history'} 
            onClick={() => onViewChange('history')}
            icon={<History size={20} />}
            label="Registry" 
          />
          <NavItem 
            active={activeView === 'forecast'} 
            onClick={() => onViewChange('forecast')}
            icon={<TrendingUp size={20} />}
            label="Predictor" 
          />
        </div>

        <div className="space-y-1.5">
          <p className="label-font px-4 mb-4 hidden lg:block">System_Opt</p>
          <NavItem 
            active={false} 
            onClick={() => {}}
            icon={<Settings size={20} />}
            label="Calibration" 
          />
          <NavItem 
            active={false} 
            onClick={() => {}}
            icon={<ShieldCheck size={20} />}
            label="Compliance" 
          />
          <NavItem
            active={false}
            onClick={handleDownloadProjectZip}
            icon={<Download size={20} className={downloadingZip ? 'animate-bounce' : ''} />}
            label={downloadingZip ? 'Packing ZIP...' : 'Download ZIP'}
          />
        </div>
      </nav>

      <div className="p-4 border-t border-hud-border">
        <div className="hud-panel p-3 border-none flex items-center gap-3 group cursor-pointer hover:bg-hud-accent/5 transition-all">
          <div className="w-8 h-8 rounded-sm bg-hud-accent/10 flex items-center justify-center text-hud-accent">
            <span className="font-mono text-[10px] font-bold">DR</span>
          </div>
          <div className="hidden lg:flex flex-col flex-1 min-w-0">
            <p className="text-[11px] font-bold truncate tracking-tight text-hud-ink uppercase">Dr_Adonvane</p>
            <p className="text-[8px] text-hud-muted truncate font-mono uppercase">ID_042_AUTH</p>
          </div>
          <LogOut size={14} className="text-hud-muted group-hover:text-hud-accent transition-colors" />
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
        "w-full flex items-center gap-4 px-4 py-3 border-none text-[12px] font-mono transition-all relative group",
        active 
          ? "text-hud-accent bg-hud-accent/5 border-l-2 border-l-hud-accent" 
          : "text-hud-muted hover:text-hud-ink hover:bg-hud-accent/5"
      )}
    >
      <span className={cn("transition-all duration-300", active ? "text-hud-accent" : "opacity-50 group-hover:opacity-100")}>
        {icon}
      </span>
      <span className="hidden lg:block uppercase tracking-wider">{label}</span>
      {active && (
        <div className="absolute right-0 w-1 h-3 bg-hud-accent shadow-[0_0_12px_#10B981]" />
      )}
    </button>
  );
}
