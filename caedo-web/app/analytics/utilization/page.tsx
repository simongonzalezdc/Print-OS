'use client';

import { CyberCard } from '@/components/ui/CyberCard';
import { MetricDisplay } from '@/components/ui/MetricDisplay';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Activity, AlertTriangle, Hammer } from 'lucide-react';

const uptimeData = [
  { time: '00:00', active: 2 },
  { time: '04:00', active: 1 },
  { time: '08:00', active: 4 },
  { time: '12:00', active: 5 },
  { time: '16:00', active: 5 },
  { time: '20:00', active: 3 },
  { time: '23:59', active: 2 },
];

const printerStats = [
  { name: 'Unit 001', uptime: 98, maintenance: 12 },
  { name: 'Unit 002', uptime: 85, maintenance: 45 },
  { name: 'Unit 003', uptime: 92, maintenance: 20 },
  { name: 'Unit 004', uptime: 74, maintenance: 85 },
];

export default function UtilizationPage() {
  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#050505] text-foreground pb-24">
      {/* Header */}
      <div className="flex justify-between items-end border-l-4 border-primary pl-4 mb-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-primary">
            RESOURCE_UTILIZATION
          </h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
            Fleet Uptime & Health // Analytics Module
          </p>
        </div>
      </div>

      {/* High Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CyberCard>
          <MetricDisplay label="FLEET_UPTIME" value="87.4" unit="%" delta="+2.5%" deltaType="positive" />
        </CyberCard>
        <CyberCard>
          <MetricDisplay label="MTBF" value="142" unit="HRS" delta="-12H" deltaType="negative" />
        </CyberCard>
        <CyberCard>
          <MetricDisplay label="ACTIVE_DUTY" value="5" unit="/ 6 UNITS" />
        </CyberCard>
        <CyberCard>
          <MetricDisplay label="MTTR" value="1.4" unit="HRS" delta="-0.2H" deltaType="positive" />
        </CyberCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Load (24h) */}
        <CyberCard title="FLEET_LOAD_TIMELINE" className="lg:col-span-2">
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={uptimeData}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FFCC" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00FFCC" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val: number | string) => `${val}U`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', border: '1px solid #00FFCC33', fontSize: '10px' }}
                />
                <Area 
                  type="stepAfter" 
                  dataKey="active" 
                  stroke="#00FFCC" 
                  fillOpacity={1} 
                  fill="url(#colorActive)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>

        {/* Maintenance Breakdown */}
        <CyberCard title="MAINTENANCE_OVERHEAD">
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={printerStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val: number | string) => `${val}H`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', border: '1px solid #00FFCC33', fontSize: '10px' }}
                />
                <Bar dataKey="maintenance" fill="#FF0055" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CyberCard title="UPCOMING_MAINTENANCE_TASKS">
          <div className="space-y-4 pt-2">
            {[
              { unit: 'Unit 001', task: 'Nozzle Replacement', status: 'OVERDUE', priority: 'high', hours: '+12h' },
              { unit: 'Unit 003', task: 'Lead Screw Lubrication', status: 'SCHEDULED', priority: 'medium', hours: 'in 4h' },
              { unit: 'Unit 002', task: 'Bed Leveling Calibration', status: 'SCHEDULED', priority: 'low', hours: 'in 2d' },
            ].map((task, i) => (
              <div key={i} className="flex justify-between items-center p-3 border border-border/30 rounded bg-black/20 group hover:border-primary/30 transition-colors">
                <div className="flex gap-4 items-center">
                  <div className={cn(
                    "p-2 rounded",
                    task.priority === 'high' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                  )}>
                    <Hammer className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase">{task.unit}</span>
                    <span className="text-xs font-bold uppercase">{task.task}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded",
                    task.status === 'OVERDUE' ? "bg-destructive text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {task.status}
                  </span>
                  <p className="text-[10px] font-mono opacity-40 mt-1">{task.hours}</p>
                </div>
              </div>
            ))}
          </div>
        </CyberCard>

        <CyberCard title="FLEET_HEALTH_ALERTS" variant="outline">
          <div className="space-y-4">
            <div className="flex gap-3 items-start p-3 bg-destructive/5 border border-destructive/20 rounded">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase text-destructive">CRITICAL_WEAR_DETECTED</p>
                <p className="text-xxs text-foreground/70 leading-relaxed uppercase">
                  Unit #004 belt tension is 15% below nominal. High probability of layer shift in next 48h of operation.
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start p-3 bg-primary/5 border border-primary/20 rounded">
              <Activity className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase text-primary">CALIBRATION_OPTIMAL</p>
                <p className="text-xxs text-foreground/70 leading-relaxed uppercase">
                  Units #001, #003, #005 are operating within 99.2% of dimensional accuracy benchmarks.
                </p>
              </div>
            </div>
          </div>
        </CyberCard>
      </div>
    </div>
  );
}

