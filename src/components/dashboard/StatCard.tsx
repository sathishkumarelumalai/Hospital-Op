import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  description?: string;
}

export function StatCard({ label, value, icon, trend, description }: StatCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="hud-panel p-6 group transition-all"
    >
      <div className="scanline" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div className="w-9 h-9 hud-border flex items-center justify-center text-hud-muted group-hover:text-hud-accent group-hover:border-hud-accent/50 transition-all duration-300">
            {icon}
          </div>
          {trend !== undefined && (
            <div className="flex flex-col items-end">
              <span className={cn(
                "font-mono text-[10px] font-bold px-2 py-0.5 hud-border",
                trend > 0 ? "text-hud-safe border-hud-safe/20 bg-hud-safe/5" : "text-hud-alert border-hud-alert/20 bg-hud-alert/5"
              )}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            </div>
          )}
        </div>

        <div>
          <p className="label-font mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-mono tracking-tight font-black text-hud-ink">{value}</p>
            <span className="text-[10px] font-mono opacity-20 uppercase tracking-widest">Units</span>
          </div>
          {description && (
            <div className="mt-4 pt-4 border-t border-hud-border/50">
              <p className="text-[9px] text-hud-muted font-mono leading-relaxed uppercase tracking-tight">
                // {description}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-hud-ink/10" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-hud-ink/10" />
    </motion.div>
  );
}
