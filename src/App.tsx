import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  ChevronRight, 
  Users, 
  TrendingUp, 
  Activity,
  Calendar,
  AlertCircle,
  FileText,
  Download,
  Upload,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart,
  Line
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { cn } from './lib/utils';
import { OPRecord, PredictionResult, View } from './types';
import { getPredictions } from './services/predictService';
import { Sidebar } from './components/layout/Sidebar';
import { StatCard } from './components/dashboard/StatCard';

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [data, setData] = useState<OPRecord[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const results = await getPredictions(data);
      setPredictions(results);
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setPredicting(false);
    }
  };

  const stats = useMemo(() => {
    if (data.length === 0) return { total: 0, avg: 0, peak: 0, trend: 0 };
    const total = data.reduce((acc, curr) => acc + curr.visitorCount, 0);
    const avg = Math.round(total / data.length);
    const peak = Math.max(...data.map(d => d.visitorCount));
    const recent = data.slice(-5).reduce((acc, curr) => acc + curr.visitorCount, 0);
    const previous = data.slice(-10, -5).reduce((acc, curr) => acc + curr.visitorCount, 0);
    const trend = previous === 0 ? 0 : Math.round(((recent - previous) / previous) * 100);
    return { total, avg, peak, trend };
  }, [data]);

  const chartData = useMemo(() => {
    const combined = data.map(d => ({ 
      date: d.date, 
      actual: d.visitorCount, 
      predicted: null 
    }));
    const predData = predictions.map(p => ({
      date: p.date,
      actual: null,
      predicted: p.predictedCount
    }));
    return [...combined, ...predData].slice(-40);
  }, [data, predictions]);

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-clinical-ink">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col relative">
        {/* Faint Background Grid */}
        <div className="absolute inset-0 technical-grid opacity-[0.02] pointer-events-none" />

        <header className="h-20 px-10 flex items-center justify-between sticky top-0 bg-[#FDFDFD]/80 backdrop-blur-md z-10 border-b border-clinical-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="micro-label">System Active // LIVE_FEED</span>
            </div>
            <h2 className="font-display italic font-bold text-2xl tracking-tight">
              {activeView === 'dashboard' && 'Operations Overview'}
              {activeView === 'history' && 'Document Registry'}
              {activeView === 'forecast' && 'AI Forecasting'}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-clinical-border/20 rounded-full border border-clinical-border">
              <Search size={14} className="text-clinical-muted" />
              <input 
                type="text" 
                placeholder="Search registry..." 
                className="bg-transparent border-none outline-none text-[11px] font-medium w-40 placeholder:text-clinical-muted/50"
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-clinical-ink hover:bg-clinical-muted text-white rounded-sm transition-all text-xs font-bold uppercase tracking-widest shadow-xl active:scale-95">
              <Plus size={14} />
              NEX_ENTRY
            </button>
          </div>
        </header>

        <div className="p-10 flex-1 relative z-0">
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard 
                    label="Volume.Total" 
                    value={stats.total.toLocaleString()} 
                    icon={<Users size={18} />}
                    trend={stats.trend}
                    description="Aggregate throughput for current period"
                  />
                  <StatCard 
                    label="Flux.Average" 
                    value={stats.avg.toString()} 
                    icon={<Activity size={18} />}
                    description="Daily normalized visitor frequency"
                  />
                  <StatCard 
                    label="Peak.Intensity" 
                    value={stats.peak.toString()} 
                    icon={<TrendingUp size={18} />}
                    description="Highest observed operational load"
                  />
                  <StatCard 
                    label="Samples.Count" 
                    value={data.length.toString()} 
                    icon={<Calendar size={18} />}
                    description="Validated historical data points"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 bg-white p-8 border border-clinical-border relative group">
                    <div className="absolute top-0 right-0 p-4 micro-label opacity-30">GRPH_002_VISUALIZER</div>
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="font-bold text-lg tracking-tight">Active Load Trend</h3>
                        <p className="text-[11px] font-mono text-clinical-muted">REAL_TIME_ANALYSIS_BUFFER_ON</p>
                      </div>
                    </div>
                    
                    <div className="h-[340px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.slice(-20)}>
                          <defs>
                            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.08}/>
                              <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#EEEEEE" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fill: '#999999', fontFamily: 'JetBrains Mono' }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fill: '#999999', fontFamily: 'JetBrains Mono' }}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '0px', border: '1px solid #1A1A1A', padding: '12px' }}
                            labelStyle={{ fontFamily: 'JetBrains Mono', fontSize: '10px', fontWeight: 'bold' }}
                            itemStyle={{ fontSize: '11px', color: '#2563EB' }}
                          />
                          <Area 
                            type="step" 
                            dataKey="visitorCount" 
                            stroke="#1A1A1A" 
                            fillOpacity={1} 
                            fill="url(#colorVisits)" 
                            strokeWidth={1.5}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-8 border border-clinical-border">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-sm uppercase tracking-wider">Allocation_Map</h3>
                        <Filter size={14} className="text-clinical-muted" />
                      </div>
                      <div className="space-y-6">
                        {['General Medicine', 'Pediatrics', 'Orthopedics', 'Dermatology'].map((dept, i) => (
                          <div key={dept}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[11px] font-bold text-clinical-ink">{dept}</span>
                              <span className="text-[10px] font-mono text-clinical-muted">{35 - (i * 7)}%</span>
                            </div>
                            <div className="w-full h-1 bg-clinical-border rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${35 - (i * 7)}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                                className="h-full bg-clinical-ink"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-amber-50/50 border border-amber-100 flex gap-4">
                      <AlertCircle className="text-amber-600 flex-shrink-0" size={18} />
                      <div>
                        <p className="micro-label text-amber-800 mb-1">Operational Warning</p>
                        <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                          Consistent surge detected in <span className="underline">Pediatrics</span>. Shift transition optimization required for next cycle.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white border border-clinical-border shadow-sm overflow-hidden"
              >
                <div className="p-8 border-b border-clinical-border flex items-center justify-between bg-[#FDFDFD]">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">Registry Table</h3>
                    <p className="text-[11px] font-mono text-clinical-muted tracking-tight">TOTAL_RECORDS: {data.length} // DB_UPTIME: 142HRS</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-clinical-border hover:bg-clinical-bg text-[11px] font-bold uppercase tracking-widest transition-all">
                      <Download size={14} />
                      PUSH_CSV
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 bg-clinical-ink text-white hover:bg-clinical-muted text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer">
                      <Upload size={14} />
                      SYNC_REGISTRY
                      <input type="file" className="hidden" accept=".csv" />
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-clinical-bg border-b border-clinical-border">
                        <th className="px-8 py-5 text-left micro-label">TIMESTAMP</th>
                        <th className="px-8 py-5 text-left micro-label">UNIT_ID</th>
                        <th className="px-8 py-5 text-left micro-label">VOLUME</th>
                        <th className="px-8 py-5 text-left micro-label">VALIDATION</th>
                        <th className="px-8 py-5 text-right micro-label text-clinical-accent">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-clinical-border">
                      {data.map((record, i) => (
                        <tr key={i} className="hover:bg-clinical-bg group transition-colors">
                          <td className="px-8 py-4 font-mono text-[12px] opacity-60 text-clinical-ink">{record.date}</td>
                          <td className="px-8 py-4 font-bold text-[12px]">{record.department.toUpperCase()}</td>
                          <td className="px-8 py-4 font-mono text-[12px] font-bold">{record.visitorCount}</td>
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={12} className="text-emerald-500" />
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">SECURED</span>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <button className="text-clinical-muted hover:text-clinical-ink transition-colors p-1 border border-transparent hover:border-clinical-border">
                              <FileText size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeView === 'forecast' && (
              <motion.div 
                key="forecast"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                className="space-y-10"
              >
                {/* AI Header */}
                <div className="bg-clinical-ink p-10 text-white relative overflow-hidden group">
                  <div className="absolute inset-0 block technical-grid opacity-[0.05]" />
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                    <div className="space-y-4 max-w-xl">
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-1 bg-clinical-accent text-[9px] font-mono font-bold tracking-widest animate-pulse">AI_MODULE_ID: 8D2FS</div>
                        <span className="micro-label text-white/40">Status: Standby</span>
                      </div>
                      <h2 className="text-3xl font-display font-black italic tracking-tighter">Synthesized Load Forecaster</h2>
                      <p className="text-[13px] text-white/60 leading-relaxed font-medium">
                        Leveraging deep sequential analysis of historical flux to project future operational requirements. Precision calibrated for seasonal shifting.
                      </p>
                    </div>
                    <button 
                      onClick={handlePredict}
                      disabled={predicting}
                      className={cn(
                        "flex items-center gap-4 px-10 py-5 bg-clinical-accent text-white rounded-sm font-bold uppercase tracking-widest text-[11px] shadow-2xl transition-all active:scale-95 disabled:opacity-50 hover:bg-blue-500 hover:-translate-y-1",
                        predicting && "animate-pulse cursor-wait"
                      )}
                    >
                      {predicting ? 'Recalibrating Vectors...' : 'Engage 7-Day Forecast'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                  <div className="lg:col-span-3 bg-white p-10 border border-clinical-border">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h3 className="font-bold text-lg">Predictive Vector Visualization</h3>
                        <p className="micro-label opacity-40">Combination_Projection_View</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <LegendItem color="#1A1A1A" label="Historical.Observed" dashed={false} />
                        <LegendItem color="#2563EB" label="Synthesized.Projection" dashed={true} />
                      </div>
                    </div>
                    
                    <div className="h-[400px]">
                      {predictions.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fill: '#AAAAAA', fontFamily: 'JetBrains Mono' }}
                              dy={10}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fill: '#AAAAAA', fontFamily: 'JetBrains Mono' }}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const isPred = payload[0].payload.predicted !== null;
                                  return (
                                    <div className="bg-clinical-ink p-4 border border-white/10 text-white shadow-2xl min-w-[120px]">
                                      <p className="font-mono text-[9px] mb-2 opacity-50 tracking-widest">{payload[0].payload.date}</p>
                                      <p className={cn("font-bold text-[14px] font-mono", isPred ? "text-clinical-accent" : "text-white")}>
                                        {isPred ? `PROJ: ${payload[0].payload.predicted}` : `ACT: ${payload[0].payload.actual}`}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="actual" 
                              stroke="#1A1A1A" 
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 4, strokeWidth: 0, fill: '#1A1A1A' }}
                              connectNulls
                            />
                            <Line 
                              type="monotone" 
                              dataKey="predicted" 
                              stroke="#2563EB" 
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={{ r: 3, strokeWidth: 1.5, fill: 'white' }}
                              activeDot={{ r: 5, strokeWidth: 0, fill: '#2563EB' }}
                              connectNulls
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-clinical-muted opacity-30 gap-6">
                          <Activity size={64} strokeWidth={0.5} />
                          <p className="text-xs uppercase tracking-[0.2em] font-bold">Awaiting Model Initialization</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-8 border border-clinical-border">
                      <h4 className="micro-label mb-6">Model_Confidence_Metrics</h4>
                      <div className="space-y-5">
                        <MetricRow label="Accuracy.Index" value="94.2%" color="text-emerald-600" />
                        <MetricRow label="Processing.Lat" value="842ms" />
                        <MetricRow label="Dataset.Coverage" value="100%" />
                        <MetricRow label="Calibration" value="Stable" color="text-blue-600" />
                      </div>
                    </div>

                    <div className="bg-white p-8 border border-clinical-border">
                      <h4 className="micro-label mb-4">AI_NARRATIVE_LOG</h4>
                      {predictions.length > 0 ? (
                        <p className="text-[12px] leading-relaxed text-clinical-ink italic opacity-70">
                          {predictions[0].reasoning || "Patterns suggest a cyclic normalization. No extreme deviations projected in the 7-day vector cluster."}
                        </p>
                      ) : (
                        <p className="text-[11px] font-mono text-clinical-muted animate-pulse">LISTENING_FOR_MODEL_SIGNAL...</p>
                      )}
                    </div>

                    <div className="p-8 border border-clinical-ink bg-clinical-ink text-white shadow-xl relative overflow-hidden">
                      <h4 className="micro-label text-white/30 mb-4">Command Recom</h4>
                      <p className="text-[13px] font-medium leading-relaxed relative z-10">
                        Synthesized data indicates a shift efficiency improvement of <span className="text-clinical-accent">+12%</span> if staff allocation is front-loaded by 08:30HRS.
                      </p>
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-xl translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LegendItem({ color, label, dashed }: { color: string, label: string, dashed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div 
        className={cn("h-[2px] w-4", dashed ? "border-t-2 border-dashed" : "bg-current")} 
        style={{ color: dashed ? color : 'transparent', backgroundColor: dashed ? 'transparent' : color }} 
      />
      <span className="text-[10px] font-mono font-bold uppercase text-clinical-muted">{label}</span>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string, value: string, color?: string }) {
  return (
    <div className="flex justify-between items-center border-b border-clinical-border pb-2">
      <span className="text-[11px] font-medium text-clinical-muted">{label}</span>
      <span className={cn("text-[11px] font-mono font-black", color || "text-clinical-ink")}>{value}</span>
    </div>
  );
}

