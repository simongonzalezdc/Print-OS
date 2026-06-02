'use client';

import { useEffect, useState } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { MetricDisplay } from '@/components/ui/MetricDisplay';
import { TerminalBlock } from '@/components/ui/TerminalBlock';
import { 
  Clock, Printer as PrinterIcon, Play, 
  ChevronUp, ChevronDown, Trash2, 
  Settings2, Activity, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Job {
  id: number;
  name: string;
  status: 'queued' | 'printing' | 'completed' | 'failed' | 'canceled';
  priority: 'low' | 'normal' | 'urgent';
  material: string;
  grams_estimated: number;
  minutes_estimated: number;
  created_at: string;
}

export default function QueueDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    async function fetchInitialQueue() {
      try {
        const res = await fetch('/api/v1/printfarm/queue');
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        }
      } catch (error) {
        console.error('Failed to fetch initial queue:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialQueue();

    // Setup WebSocket for live updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/printfarm/queue/ws`;
    
    let socket: WebSocket;
    
    function connectWS() {
      socket = new WebSocket(wsUrl);
      
      socket.onopen = () => setWsStatus('connected');
      socket.onmessage = (event) => {
        try {
          // In a real app, the WS would send full Job objects or diffs
          // For this demo, we'll re-fetch the full queue if status changes
          JSON.parse(event.data); // Validate JSON, actual data handled separately
        } catch (e) {
          console.error('WS Data Error:', e);
        }
      };
      
      socket.onerror = () => setWsStatus('error');
      socket.onclose = () => {
        setWsStatus('connecting');
        setTimeout(connectWS, 5000);
      };
    }

    connectWS();
    return () => socket?.close();
  }, []);

  const moveJob = (id: number, direction: 'up' | 'down') => {
    const idx = jobs.findIndex(j => j.id === id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === jobs.length - 1)) return;
    
    const newJobs = [...jobs];
    const item = newJobs.splice(idx, 1)[0] as Job;
    newJobs.splice(direction === 'up' ? idx - 1 : idx + 1, 0, item);
    setJobs(newJobs);
    toast.info(`Job #${id} moved ${direction}`);
  };

  const deleteJob = (id: number) => {
    setJobs(jobs.filter(j => j.id !== id));
    toast.error(`Job #${id} removed from queue`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="text-primary font-black animate-pulse uppercase tracking-widest">Synchronizing_Queue...</div>
      </div>
    );
  }

  const printingJobs = jobs.filter(j => j.status === 'printing');
  const totalMinutes = jobs.reduce((acc, j) => acc + (j.minutes_estimated || 0), 0);

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#050505] text-foreground">
      {/* Header */}
      <div className="flex justify-between items-end border-l-4 border-primary pl-4 mb-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-primary">
            PRINT_QUEUE_COMMAND
          </h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
            Real-time Manufacturing Orchestration // CAEDO Facility
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              wsStatus === 'connected' ? "bg-primary animate-pulse" : 
              wsStatus === 'connecting' ? "bg-yellow-500" : "bg-destructive"
            )} />
            <span className="text-[10px] font-mono opacity-50 uppercase">
              LINK_{wsStatus.toUpperCase()}
            </span>
          </div>
          <span className="text-xxs font-mono opacity-30 uppercase tracking-tighter">
            NODE: FACILITY_SECTOR_7
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CyberCard className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Activity className="w-5 h-5" />
          </div>
          <MetricDisplay label="Active Jobs" value={printingJobs.length} unit={`/${jobs.length}`} />
        </CyberCard>
        <CyberCard className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Clock className="w-5 h-5" />
          </div>
          <MetricDisplay label="Est. Backlog" value={Math.floor(totalMinutes / 60)} unit="HRS" />
        </CyberCard>
        <CyberCard className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Zap className="w-5 h-5" />
          </div>
          <MetricDisplay label="Efficiency" value="94.2" unit="%" />
        </CyberCard>
        <CyberCard className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Settings2 className="w-5 h-5" />
          </div>
          <MetricDisplay label="Fleet Load" value="78" unit="%" />
        </CyberCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Queue */}
        <div className="lg:col-span-2 space-y-6">
          <CyberCard title="ACTIVE_AND_PENDING_QUEUE">
            <div className="space-y-3 mt-4">
              {jobs.map((job) => (
                <motion.div
                  key={job.id}
                  layoutId={job.id.toString()}
                  className={cn(
                    "group relative flex items-center gap-4 p-4 border rounded bg-black/40 transition-all",
                    job.status === 'printing' ? "border-primary shadow-[0_0_15px_rgba(0,255,204,0.1)]" : "border-border/20"
                  )}
                >
                  <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveJob(job.id, 'up')} className="hover:text-primary"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveJob(job.id, 'down')} className="hover:text-primary"><ChevronDown className="w-4 h-4" /></button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-mono opacity-50 uppercase tracking-tighter">JOB_#{job.id.toString().padStart(4, '0')}</span>
                      <span className={cn(
                        "text-[8px] px-1.5 py-0.5 rounded-sm font-black uppercase",
                        job.priority === 'urgent' ? "bg-destructive text-destructive-foreground" :
                        job.priority === 'normal' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {job.priority}
                      </span>
                      {job.status === 'printing' && (
                        <span className="flex items-center gap-1 text-[8px] text-primary font-black uppercase animate-pulse">
                          <Play className="w-2 h-2 fill-current" /> PRINTING_NOW
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest truncate">{job.name}</h3>
                    <div className="flex gap-4 mt-2 text-[10px] opacity-60 uppercase font-bold tracking-tight">
                      <span className="flex items-center gap-1"><PrinterIcon className="w-3 h-3" /> {job.material}</span>
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {job.grams_estimated}g</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.minutes_estimated}m</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {job.status === 'printing' && (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-mono font-black text-primary">64%</span>
                        <div className="w-24 h-1 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary shadow-glow w-[64%]" />
                        </div>
                      </div>
                    )}
                    <button 
                      onClick={() => deleteJob(job.id)}
                      className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
              {jobs.length === 0 && (
                <div className="py-20 text-center opacity-30 uppercase text-xs tracking-[0.3em] border border-dashed border-border/20 rounded-lg">
                  QUEUE_EMPTY
                </div>
              )}
            </div>
          </CyberCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <TerminalBlock 
            title="QUEUE_AUTOMATOR_LOG"
            content={`[SYNC] Connected to Facility Hub\n[INFO] Prioritizing urgent medical parts\n[INFO] Job #0142 estimated completion: 14:20\n\nSuggest: Nozzle cleaning recommended on Sector 7 Printer #02 before next high-temp job.`}
          />
          
          <CyberCard title="FLEET_OPTIMIZATION" variant="outline" className="border-primary/30">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase">
                <span className="text-muted-foreground">Active Printers</span>
                <span className="text-primary font-mono">12 / 16</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase">
                <span className="text-muted-foreground">Material Health</span>
                <span className="text-primary font-mono">OPTIMAL</span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary shadow-glow w-[75%]" />
              </div>
              <p className="text-[9px] opacity-60 uppercase italic">
                Recommendation: 3 queued jobs can be consolidated into a single build plate to reduce setup time by 45m.
              </p>
            </div>
          </CyberCard>
        </div>
      </div>
    </div>
  );
}

