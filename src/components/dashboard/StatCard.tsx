import React from 'react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  description?: string;
}

export function StatCard({ label, value, icon, trend, description }: StatCardProps) {
  return (
    <div className="bg-white border border-clinical-border p-6 relative overflow-hidden group transition-all hover:border-clinical-ink">
      {/* Decorative grid background */}
      <div className="absolute inset-0 technical-grid opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="p-2 border border-clinical-border rounded-sm group-hover:bg-clinical-ink group-hover:border-clinical-ink group-hover:text-white transition-all">
            {icon}
          </div>
          {trend !== undefined && (
            <div className="flex flex-col items-end">
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                trend > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              )}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className="micro-label opacity-40 mt-1">vs PREV</span>
            </div>
          )}
        </div>

        <div>
          <p className="micro-label mb-2">{label}</p>
          <p className="text-3xl font-mono tracking-tighter font-bold">{value}</p>
          {description && (
            <p className="text-[11px] text-clinical-muted mt-4 font-medium italic opacity-60">
              Note: {description}
            </p>
          )}
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-clinical-accent transition-all duration-300 w-0 group-hover:w-full" />
    </div>
  );
}
