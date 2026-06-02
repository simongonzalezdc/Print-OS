'use client';

import { CyberCard } from '@/components/ui/CyberCard';
import { MetricDisplay } from '@/components/ui/MetricDisplay';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const revenueData = [
  { name: 'Dec 21', revenue: 450, cost: 120 },
  { name: 'Dec 22', revenue: 520, cost: 140 },
  { name: 'Dec 23', revenue: 480, cost: 130 },
  { name: 'Dec 24', revenue: 610, cost: 160 },
  { name: 'Dec 25', revenue: 580, cost: 155 },
  { name: 'Dec 26', revenue: 720, cost: 190 },
  { name: 'Dec 27', revenue: 850, cost: 210 },
];

const productPerformance = [
  { name: 'Cable Rail', margin: 65, volume: 142 },
  { name: 'NEMA Mount', margin: 42, volume: 85 },
  { name: 'Fan Shroud', margin: 58, volume: 110 },
  { name: 'Tool Clip', margin: 72, volume: 210 },
  { name: 'Base Plate', margin: 35, volume: 45 },
];

export default function ProfitabilityPage() {
  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#050505] text-foreground pb-24">
      {/* Header */}
      <div className="flex justify-between items-end border-l-4 border-primary pl-4 mb-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-primary">
            PROFIT_TELEMETRY
          </h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
            Economic Performance // Analytics Module
          </p>
        </div>
      </div>

      {/* High Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CyberCard>
          <MetricDisplay label="MTD_REVENUE" value="$4,152" unit="USD" delta="+18.4%" deltaType="positive" />
        </CyberCard>
        <CyberCard>
          <MetricDisplay label="AVG_MARGIN" value="58.2" unit="%" delta="+2.1%" deltaType="positive" />
        </CyberCard>
        <CyberCard>
          <MetricDisplay label="COST_OF_GOODS" value="$1,720" unit="USD" delta="-4.2%" deltaType="positive" />
        </CyberCard>
        <CyberCard>
          <MetricDisplay label="NET_PROFIT" value="$2,432" unit="USD" delta="+22.5%" deltaType="positive" />
        </CyberCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Cost Timeline */}
        <CyberCard title="REVENUE_VS_OPERATIONAL_COSTS">
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
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
                  tickFormatter={(val: number | string) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', border: '1px solid #00FFCC33', fontSize: '10px' }}
                  itemStyle={{ color: '#00FFCC' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#00FFCC" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#00FFCC' }}
                  activeDot={{ r: 6, stroke: '#00FFCC', strokeWidth: 2, fill: '#050505' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#FF0055" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#FF0055' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>

        {/* Product Margin Analysis */}
        <CyberCard title="PRODUCT_MARGIN_DYNAMICS">
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val: number | string) => `${val}%`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#444" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', border: '1px solid #00FFCC33', fontSize: '10px' }}
                  cursor={{ fill: '#ffffff05' }}
                />
                <Bar dataKey="margin" radius={[0, 2, 2, 0]}>
                  {productPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.margin > 50 ? '#00FFCC' : '#FF0055'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CyberCard title="COST_DISTRIBUTION" className="lg:col-span-1">
          <div className="space-y-4 pt-2">
            {[
              { label: 'Filament', value: 45, color: '#00FFCC' },
              { label: 'Electricity', value: 12, color: '#00FFCC88' },
              { label: 'Labor', value: 28, color: '#00FFCC44' },
              { label: 'Maintenance', value: 15, color: '#FF005588' },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xxs font-black uppercase">
                  <span>{item.label}</span>
                  <span className="text-primary">{item.value}%</span>
                </div>
                <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </CyberCard>

        <CyberCard title="EFFICIENCY_INSIGHTS" className="lg:col-span-2" variant="outline">
          <div className="flex flex-col h-full justify-between gap-4">
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/80 leading-relaxed font-mono">
                  Switching to bulk spool procurement could increase net margin by <span className="text-primary font-bold">4.2%</span>.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <TrendingDown className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/80 leading-relaxed font-mono">
                  Unit #004 failure rate is <span className="text-destructive font-bold">12%</span> above fleet average, impacting overall profitability.
                </p>
              </div>
            </div>
            <div className="p-3 bg-primary/5 border border-primary/20 rounded text-[10px] uppercase font-black tracking-widest text-primary/60 text-center italic">
              AI Recommendation: Calibrate Extruder #004 immediately to recover $14.50 daily waste
            </div>
          </div>
        </CyberCard>
      </div>
    </div>
  );
}

