import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Filter,
  ShieldCheck,
  Terminal,
  Zap,
  Info
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
  Line,
  BarChart,
  Bar
} from 'recharts';
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
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addTerminalLog(`FILE: DETECTED_INBOUND_${file.name.toUpperCase()}`);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          addTerminalLog("ERROR: EMPTY_OR_CORRUPT_BUFFER_READ");
          return;
        }

        // Simple CSV parser
        const lines = text.split(/\r?\n/);
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const dateIdx = headers.indexOf('date');
        const deptIdx = headers.indexOf('department');
        const countIdx = headers.indexOf('visitorcount');

        if (dateIdx === -1 || deptIdx === -1 || countIdx === -1) {
          addTerminalLog("ERROR: INVALID_CSV_HEADERS_MISSING_REQUIRED");
          return;
        }

        const parsedRecords: OPRecord[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(',');
          if (parts.length < 3) continue;

          const date = parts[dateIdx]?.trim();
          const department = parts[deptIdx]?.trim();
          const visitorCount = parseInt(parts[countIdx]?.trim() || "0", 10);

          if (date && department && !isNaN(visitorCount)) {
            parsedRecords.push({
              date,
              department,
              visitorCount
            });
          }
        }

        if (parsedRecords.length === 0) {
          addTerminalLog("ERROR: PARSED_0_VALID_METRICS");
          return;
        }

        addTerminalLog(`FILE: PARSED_${parsedRecords.length}_VALID_RECORDS`);
        
        // Push to server
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedRecords)
        });

        const resJson = await response.json();
        if (resJson.success) {
          addTerminalLog(`SYNC: COMMITTED_${parsedRecords.length}_DATA_OBJS_OK`);
          fetchData(); // Refresh list
        } else {
          addTerminalLog("SYNC: REFUSED_BY_CENTRAL_AUTH");
        }
      } catch (err) {
        addTerminalLog("ERROR: BINARY_DESERIALIZATION_CRITICAL");
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be uploaded again
    e.target.value = '';
  };

  const handleDownload = () => {
    if (data.length === 0) {
      addTerminalLog("ERROR: NO_METRICS_TO_EXTRACT");
      return;
    }
    addTerminalLog("FILE: GENERATING_CSV_EXPORT_BUFFER");
    const headers = ["date", "department", "visitorCount"];
    const csvRows = [headers.join(",")];
    
    data.forEach(row => {
      csvRows.push(`${row.date},"${row.department}",${row.visitorCount}`);
    });
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.style.display = 'none';
    link.setAttribute("href", url);
    link.setAttribute("download", `carepredict_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addTerminalLog("FILE: EXPORT_DOWNLOAD_TRIGGERED_OK");
  };

  useEffect(() => {
    fetchData();
    addTerminalLog("SYST: BOOT_SEQUENCE_COMPLETE");
    addTerminalLog("AUTH: CREDENTIAL_KEY_VALIDATED");
    addTerminalLog("OS: CorePredict_OS_V4.2_LOADING...");
    addTerminalLog("MEM: ALLOCATING_BUFFERS_OK");
    addTerminalLog("V-NET: SIGNAL_LOCK_ESTABLISHED");
  }, []);

  const addTerminalLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setTerminalLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 50));
  };

  const fetchData = async () => {
    try {
      addTerminalLog("FETCH: INITIATING_DATA_SYNC_REQUEST");
      const response = await fetch('/api/data');
      const json = await response.json();
      setData(json);
      addTerminalLog(`SYNC: RECEIVED_${json.length}_PACKETS_OK`);
    } catch (error) {
      addTerminalLog("ERROR: DATA_FETCH_INTERRUPTED_CRITICAL");
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    addTerminalLog("AI_INF: INITIALIZING_VECTOR_SYNTHESIS");
    try {
      const results = await getPredictions(data);
      setPredictions(results);
      addTerminalLog("AI_INF: PROJECTION_MATRICES_GENERATED_94%_CONF");
    } catch (error) {
      addTerminalLog("AI_ERR: SYNTHESIS_FAILED_NULL_OR_STALE_INPUT");
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
    return [...combined, ...predData].slice(-30);
  }, [data, predictions]);

  return (
    <div className="flex h-screen bg-hud-bg overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Scanning Line */}
        <div className="scanline" />

        <header className="h-20 px-8 flex items-center justify-between border-b border-hud-border bg-hud-bg/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 hud-panel flex items-center justify-center text-hud-muted">
              <Zap size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="indicator bg-hud-safe indicator-glow text-hud-safe" />
                <span className="label-font opacity-60">System // Live_Metrics</span>
              </div>
              <h2 className="font-display italic font-bold text-xl tracking-tight text-hud-ink uppercase">
                {activeView === 'dashboard' && 'Operations_Overview'}
                {activeView === 'history' && 'Registry_Catalog'}
                {activeView === 'forecast' && 'AI_Forecasting_Engine'}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden xl:flex flex-col items-end mr-6">
              <span className="label-font opacity-30">Network_Load</span>
              <span className="data-font text-hud-safe">0.42_ms_LAT</span>
            </div>
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-hud-panel border border-hud-border">
              <Search size={14} className="text-hud-muted" />
              <input 
                type="text" 
                placeholder="ID_QUERY_INPUT" 
                className="bg-transparent border-none outline-none data-font w-32 placeholder:opacity-20"
              />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".csv" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="hud-panel px-6 py-2.5 bg-hud-accent/10 border-hud-accent text-hud-accent hover:bg-hud-accent/20 transition-all text-[10px] font-mono font-black uppercase tracking-[0.2em] shadow-[0_4px_12px_rgba(16,185,129,0.1)] active:scale-95 group"
            >
              <div className="flex items-center gap-3">
                <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                <span>Upload_Batch</span>
              </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative scrollbar-hide">
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-12 gap-6"
              >
                {/* Stats row */}
                <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard 
                    label="Volume.Total" 
                    value={stats.total.toLocaleString()} 
                    icon={<Users size={18} />}
                    trend={stats.trend}
                    description="Aggregate throughput"
                  />
                  <StatCard 
                    label="Flux.Average" 
                    value={stats.avg.toString()} 
                    icon={<Activity size={18} />}
                    description="Normalized frequency"
                  />
                  <StatCard 
                    label="Peak.Intensity" 
                    value={stats.peak.toString()} 
                    icon={<TrendingUp size={18} />}
                    description="Load ceiling observed"
                  />
                  <StatCard 
                    label="Validated.Samples" 
                    value={data.length.toString()} 
                    icon={<ShieldCheck size={18} />}
                    description="Uptime verified units"
                  />
                </div>

                {/* Main chart */}
                <div className="col-span-12 lg:col-span-8 hud-panel angled-cut p-6 min-h-[460px]">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Terminal size={12} className="text-hud-accent" />
                        <span className="label-font">Visualizer_A1</span>
                      </div>
                      <h3 className="text-hud-ink font-display font-bold text-sm uppercase">Active_Load_Waveform</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <LegendItem color="#10B981" label="Current_Wave" dashed={false} />
                      <div className="w-[1px] h-4 bg-hud-border" />
                      <span className="data-font opacity-30 italic uppercase">Buffer_Active</span>
                    </div>
                  </div>
                  
                  <div className="h-[320px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.slice(-25)}>
                        <defs>
                          <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'IBM Plex Mono' }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'IBM Plex Mono' }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '0' }}
                          labelStyle={{ fontFamily: 'IBM Plex Mono', fontSize: '10px', color: '#64748B' }}
                          itemStyle={{ fontFamily: 'IBM Plex Mono', fontSize: '12px', color: '#10B981', fontWeight: 'bold' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="visitorCount" 
                          stroke="#10B981" 
                          fillOpacity={1} 
                          fill="url(#colorWave)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sidebar details */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  <div className="hud-panel p-6 overflow-visible">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-hud-ink font-mono font-bold text-xs uppercase tracking-widest">Allocation_Map</h3>
                      <Filter size={14} className="text-hud-muted" />
                    </div>
                    <div className="space-y-6">
                      {['General Medicine', 'Pediatrics', 'Orthopedics', 'Dermatology'].map((dept, i) => (
                        <div key={dept} className="group cursor-default">
                          <div className="flex justify-between items-center mb-2">
                            <span className="data-font text-hud-ink group-hover:text-hud-accent transition-colors">{dept}</span>
                            <span className="data-font opacity-40">{35 - (i * 7)}%</span>
                          </div>
                          <div className="w-full h-1 bg-hud-border overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${35 - (i * 7)}%` }}
                              className="h-full bg-hud-accent"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="hud-panel bg-hud-alert/5 border-hud-alert/20 p-6 flex gap-4">
                    <AlertCircle className="text-hud-alert flex-shrink-0 animate-pulse" size={20} />
                    <div>
                      <p className="label-font text-hud-alert opacity-100 mb-1 font-bold italic glitch-text">Alert_Node: Peds_Section</p>
                      <p className="data-font text-hud-alert/80 leading-relaxed">
                        Persistent surge detected in branch Pediatrics. Shift transition optimization required for next cycle.
                      </p>
                    </div>
                  </div>

                  {/* Terminal Log View */}
                  <div className="hud-panel p-4 flex flex-col h-[200px]">
                    <div className="flex items-center gap-2 mb-3 border-b border-hud-border pb-2">
                      <Terminal size={12} className="text-hud-muted" />
                      <span className="label-font">Process_Log</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[9px] uppercase tracking-tighter text-hud-muted selection:bg-hud-accent selection:text-white">
                      {terminalLogs.map((log, i) => (
                        <div key={i} className="hover:text-hud-ink transition-colors">
                          <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-2", i === 0 ? "bg-hud-accent animate-pulse" : "bg-hud-muted/30")} />
                          {log}
                        </div>
                      ))}
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
                className="hud-panel"
              >
                <div className="p-8 border-b border-hud-border flex items-center justify-between bg-hud-panel/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-hud-accent" />
                      <h3 className="font-display font-black text-xl italic uppercase tracking-tight text-hud-ink underline underline-offset-4 decoration-hud-accent/50">Registry_Registry</h3>
                    </div>
                    <p className="data-font opacity-40">INDEX: {data.length} // VOLATILITY: LOW</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleDownload}
                      className="hud-panel px-4 py-2 border-hud-border text-[10px] font-mono font-bold uppercase tracking-widest text-hud-muted hover:text-hud-ink hover:border-hud-ink transition-all"
                    >
                      <Download size={14} className="inline mr-2" />
                      EXTRACT_DATA
                    </button>
                    <label className="hud-panel px-4 py-2 bg-hud-accent text-hud-bg font-black uppercase tracking-widest transition-all cursor-pointer text-[10px] hover:scale-[1.02] active:scale-[0.98]">
                      <Upload size={14} className="inline mr-2" />
                      INJECT_BUFFER
                      <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto h-[calc(100vh-280px)] scrollbar-hide">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-hud-panel z-10">
                      <tr className="border-b border-hud-border">
                        <th className="px-8 py-5 text-left label-font tracking-[0.3em]">Temporal_ID</th>
                        <th className="px-8 py-5 text-left label-font tracking-[0.3em]">Unit_Sector</th>
                        <th className="px-8 py-5 text-left label-font tracking-[0.3em]">Load_Count</th>
                        <th className="px-8 py-5 text-left label-font tracking-[0.3em]">Auth_Status</th>
                        <th className="px-8 py-5 text-right label-font tracking-[0.3em]">CMD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hud-border">
                      {data.map((record, i) => (
                        <tr key={i} className="hover:bg-hud-accent/5 group transition-all">
                          <td className="px-8 py-4 data-font opacity-50 group-hover:opacity-100">{record.date}</td>
                          <td className="px-8 py-4 text-hud-ink font-mono text-[11px] font-black uppercase tracking-wider">{record.department}</td>
                          <td className="px-8 py-4">
                            <span className="data-font text-hud-ink bg-hud-border/30 px-2 py-1">{record.visitorCount}</span>
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={12} className="text-hud-safe" />
                              <span className="data-font text-hud-safe uppercase italic">Validated_OK</span>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <button className="text-hud-muted hover:text-hud-accent p-2 border border-transparent hover:border-hud-accent/50 transition-all">
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
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="space-y-6"
              >
                {/* AI Block */}
                <div className="hud-panel p-8 bg-hud-accent/5 border-hud-accent/30 relative overflow-hidden group">
                  <div className="scanline opacity-10" />
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                    <div className="space-y-4 max-w-xl">
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-1 bg-hud-accent text-white data-font font-black tracking-widest animate-pulse">L_GEN: VECTOR_04</div>
                        <span className="label-font opacity-60">Engine: Active</span>
                      </div>
                      <h2 className="text-3xl font-display font-black italic tracking-tighter text-hud-ink uppercase italic">Synthesized_Load_Module</h2>
                      <p className="data-font text-hud-muted leading-relaxed uppercase tracking-tight">
                        Deep sequential analysis of historical flux buffers used to project temporal operational requirements. High precision calibrated for current seasonal drift.
                      </p>
                    </div>
                    <button 
                      onClick={handlePredict}
                      disabled={predicting}
                      className={cn(
                        "hud-panel px-10 py-5 bg-hud-accent text-white font-black uppercase tracking-widest text-[11px] transition-all active:scale-[0.98] disabled:opacity-50 hover:shadow-[0_8px_30px_rgba(16,185,129,0.2)]",
                        predicting && "animate-pulse cursor-wait"
                      )}
                    >
                      {predicting ? 'Recalibration_Pending...' : 'Sequence_Forecast_Init'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 lg:col-span-8 hud-panel p-8 min-h-[460px]">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h3 className="text-hud-ink font-display font-bold text-base uppercase">Predictive_Waveform_Overlay</h3>
                        <p className="label-font opacity-40">Combination_Projection_Matrix</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <LegendItem color="#64748B" label="Source_Samples" dashed={false} />
                        <LegendItem color="#10B981" label="Synthesized_Wave" dashed={true} />
                      </div>
                    </div>
                    
                    <div className="h-[340px]">
                      {predictions.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#E2E8F0" />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'IBM Plex Mono' }}
                              dy={10}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'IBM Plex Mono' }}
                            />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const isPred = payload[0].payload.predicted !== null;
                                  return (
                                    <div className="bg-hud-panel p-4 border border-hud-border text-hud-ink shadow-2xl min-w-[140px]">
                                      <p className="label-font mb-2 opacity-50 tracking-widest">{payload[0].payload.date}</p>
                                      <p className={cn("font-black text-[16px] font-mono", isPred ? "text-hud-accent" : "text-hud-ink")}>
                                        {isPred ? `SYNTH: ${payload[0].payload.predicted}` : `OBS: ${payload[0].payload.actual}`}
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
                              stroke="#94A3B8" 
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 4, strokeWidth: 0, fill: '#FFFFFF' }}
                              connectNulls
                            />
                            <Line 
                              type="monotone" 
                              dataKey="predicted" 
                              stroke="#10B981" 
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={{ r: 3, strokeWidth: 1.5, fill: '#FFFFFF' }}
                              activeDot={{ r: 5, strokeWidth: 0, fill: '#10B981' }}
                              connectNulls
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-hud-muted opacity-20 gap-6">
                          <Terminal size={64} strokeWidth={0.5} className="animate-pulse" />
                          <p className="label-font tracking-[0.5em] font-black italic">Awaiting_Signal_Lock</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="hud-panel p-6">
                      <h4 className="label-font mb-6 underline underline-offset-4 decoration-hud-accent/30">Confidence_Specs</h4>
                      <div className="space-y-5">
                        <MetricRow label="Accuracy.Index" value="94.2%" color="text-hud-safe" />
                        <MetricRow label="Processing.Lat" value="842ms" color="text-hud-muted" />
                        <MetricRow label="Vector.Coverage" value="100%" color="text-hud-ink" />
                        <MetricRow label="Model.Stability" value="Locked" color="text-hud-accent" />
                      </div>
                    </div>

                    <div className="hud-panel p-6 relative">
                      <div className="scanline h-4 opacity-5" />
                      <h4 className="label-font mb-4">Neural_Synthesis_Log</h4>
                      {predictions.length > 0 ? (
                        <p className="data-font leading-relaxed text-hud-ink italic opacity-70">
                          // {predictions[0].reasoning || "Neural patterns suggest a cyclic stabilization. No extreme deviations projected in the primary vector cluster."}
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <p className="data-font text-hud-muted animate-pulse">// LISTENING_FOR_MODEL_TX...</p>
                          <div className="w-full h-[1px] bg-hud-border" />
                          <p className="data-font text-hud-muted opacity-20">// STANDBY_FOR_INPUT</p>
                        </div>
                      )}
                    </div>

                    <div className="hud-panel p-6 bg-hud-accent border-hud-accent text-white shadow-[0_8px_30px_rgba(16,185,129,0.1)]">
                      <div className="flex items-center gap-2 mb-4">
                        <Info size={14} className="opacity-60" />
                        <h4 className="label-font text-white opacity-100 font-black">AI_Directive</h4>
                      </div>
                      <p className="data-font font-black leading-relaxed">
                        Synthesized data indicates a shift efficiency improvement of <span className="underline">+12.4%</span> if staff allocation is front-loaded by 08:30HRS. EXECUTE_PRIMARY.
                      </p>
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

function LegendItem({ color, label, dashed }: { color: string, label: string, dashed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div 
        className={cn("h-[2px] w-4", dashed ? "border-t-2 border-dashed" : "bg-current")} 
        style={{ color: dashed ? color : 'transparent', backgroundColor: dashed ? 'transparent' : color }} 
      />
      <span className="data-font uppercase opacity-40 group-hover:opacity-100 transition-opacity">{label}</span>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string, value: string, color?: string }) {
  return (
    <div className="flex justify-between items-center border-b border-hud-border pb-3">
      <span className="data-font text-hud-muted uppercase tracking-tighter">{label}</span>
      <span className={cn("data-font font-black underline decoration-hud-border", color || "text-hud-ink")}>{value}</span>
    </div>
  );
}

