'use client';

import { useEffect, useState } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { MetricDisplay } from '@/components/ui/MetricDisplay';
import { DataTable } from '@/components/ui/DataTable';
import { TerminalBlock } from '@/components/ui/TerminalBlock';
import { Box, Printer as PrinterIcon, Activity, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Printer {
  id: number;
  name: string;
  is_active: boolean;
  make: string;
  model: string;
}

interface Job {
  id: number;
  name: string;
  status: string;
}

interface StatItem {
  label: string;
  value: number | string;
  unit?: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  icon: typeof PrinterIcon; // icon type from lucide
}

export default function DashboardPage() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [printersRes, jobsRes] = await Promise.all([
          fetch('/api/v1/printfarm/printers'),
          fetch('/api/v1/printfarm/jobs')
        ]);
        
        const printersData: Printer[] = await printersRes.json();
        const jobsData: Job[] = await jobsRes.json();
        
        setPrinters(printersData);
        setJobs(jobsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const stats: StatItem[] = [
    { label: 'Active Printers', value: printers.filter(p => p.is_active).length, unit: `/${printers.length}`, icon: PrinterIcon },
    { label: 'Pending Jobs', value: jobs.filter(j => j.status === 'queued').length, unit: 'JOBS', icon: Clock },
    { label: 'Daily Revenue', value: '$142.50', delta: '+12%', deltaType: 'positive', icon: TrendingUp },
    { label: 'System Health', value: '98.2', unit: '%', icon: Activity },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="text-primary font-black animate-pulse uppercase tracking-widest">Initialising_System...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#050505] text-foreground">
      {/* Header */}
      <div className="flex justify-between items-end border-l-4 border-primary pl-4 mb-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-primary">
            SYSTEM_DASHBOARD
          </h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
            Operational Intelligence // Caedo API
          </p>
        </div>
        <div className="text-right font-mono text-xxs opacity-50">
          STARDATE: 2025.12.27<br />
          LOCATION: SECTOR_7_FACILITY
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <CyberCard className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary shadow-[0_0_15px_rgba(0,255,204,0.2)]">
                <stat.icon className="w-5 h-5" />
              </div>
              <MetricDisplay 
                label={stat.label} 
                value={stat.value} 
                unit={stat.unit} 
                delta={stat.delta} 
                deltaType={stat.deltaType}
              />
            </CyberCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <CyberCard title="ACTIVE_JOB_QUEUE">
            <DataTable
              columns={[
                { header: 'Job ID', accessor: (j: Job) => `#${j.id.toString().padStart(4, '0')}` },
                { header: 'Product', accessor: 'name' as keyof Job },
                { header: 'Status', accessor: (j: Job) => (
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                    j.status === 'printing' ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted text-muted-foreground"
                  )}>
                    {j.status}
                  </span>
                )},
                { header: 'Progress', accessor: (j: Job) => (
                  <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary shadow-glow" 
                      style={{ width: `${j.status === 'printing' ? '45%' : '0%'}` }} 
                    />
                  </div>
                )}
              ]}
              data={jobs.slice(0, 5)}
              emptyMessage="NO_ACTIVE_JOBS"
            />
          </CyberCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CyberCard title="FLEET_STATUS" subtitle="Printer Telemetry">
              <div className="space-y-3">
                {printers.slice(0, 3).map((p: Printer) => (
                  <div key={p.id} className="flex items-center justify-between p-2 border border-border/30 rounded bg-black/20">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", p.is_active ? "bg-primary shadow-glow" : "bg-muted")} />
                      <span className="text-xs font-bold uppercase">{p.name}</span>
                    </div>
                    <span className="text-xxs font-mono opacity-60">{p.make} {p.model}</span>
                  </div>
                ))}
              </div>
            </CyberCard>
            
            <CyberCard title="HANDOFF_INBOX" subtitle="Designs from Caedo">
              <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-primary/20 rounded-lg">
                <Box className="w-8 h-8 text-primary/40 mb-2" />
                <p className="text-xxs font-bold uppercase text-muted-foreground">
                  No pending handoffs
                </p>
                <p className="text-[10px] opacity-40 mt-1">
                  Designs exported to Caedo API will appear here
                </p>
              </div>
            </CyberCard>
          </div>
        </div>

        {/* Sidebar / AI Consultant */}
        <div className="space-y-6">
          <TerminalBlock 
            title="AI_CONSULTANT_CORE"
            content="System online. Monitoring printer fleet efficiency.\n\nOptimization suggestion: Printer #002 is currently idle. Consider re-routing Job #0142 to minimize lead time.\n\nForecast: Daily margin is up 12% compared to previous stardate."
          />
          
          <CyberCard title="SECURITY_ALERTS" variant="outline">
            <div className="space-y-2">
              <div className="flex gap-2 text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-xxs font-bold uppercase">Nozzle temp fluctuation detected on Printer #004</span>
              </div>
              <div className="flex gap-2 text-primary">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span className="text-xxs font-bold uppercase">Market price for 'Cable Organizer' trending +15%</span>
              </div>
            </div>
          </CyberCard>
        </div>
      </div>
    </div>
  );
}

