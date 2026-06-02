'use client';

import { CyberCard } from '@/components/ui/CyberCard';
import { MetricDisplay } from '@/components/ui/MetricDisplay';
import { CyberButton } from '@/components/ui/CyberButton';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Package, Truck, ShoppingCart } from 'lucide-react';

const materialInventory = [
  { name: 'PLA (Black)', stock: 4500, capacity: 5000, daysLeft: 12 },
  { name: 'PLA (Teal)', stock: 1200, capacity: 5000, daysLeft: 3 },
  { name: 'PETG (Clear)', stock: 3800, capacity: 5000, daysLeft: 25 },
  { name: 'TPU (Red)', stock: 800, capacity: 2000, daysLeft: 15 },
  { name: 'ABS (Gray)', stock: 2100, capacity: 5000, daysLeft: 8 },
];

const consumptionData = [
  { name: 'PLA', value: 65 },
  { name: 'PETG', value: 20 },
  { name: 'TPU', value: 5 },
  { name: 'ABS', value: 10 },
];

const COLORS = ['#00FFCC', '#00FFCC88', '#00FFCC44', '#FF005588'];

export default function MaterialsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#050505] text-foreground pb-24">
      {/* Header */}
      <div className="flex justify-between items-end border-l-4 border-primary pl-4 mb-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-primary">
            MATERIAL_LOGISTICS
          </h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
            Inventory & Burn-Rate Analytics // Analytics Module
          </p>
        </div>
      </div>

      {/* High Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CyberCard>
          <MetricDisplay label="TOTAL_INVENTORY" value="12.4" unit="KG" />
        </CyberCard>
        <CyberCard>
          <MetricDisplay label="DAILY_BURN_RATE" value="450" unit="G/DAY" delta="+15G" deltaType="negative" />
        </CyberCard>
        <CyberCard>
          <MetricDisplay label="LOW_STOCK_ALERTS" value="2" unit="SPOOLS" />
        </CyberCard>
        <CyberCard>
          <MetricDisplay label="EST_REORDER_COST" value="$245" unit="USD" />
        </CyberCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Status */}
        <CyberCard title="INVENTORY_LEVELS_BY_WEIGHT" className="lg:col-span-2">
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materialInventory}>
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
                  tickFormatter={(val: number | string) => `${val}g`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', border: '1px solid #00FFCC33', fontSize: '10px' }}
                />
                <Bar dataKey="stock" radius={[2, 2, 0, 0]}>
                  {materialInventory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.daysLeft < 5 ? '#FF0055' : '#00FFCC'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>

        {/* Material Mix */}
        <CyberCard title="MATERIAL_UTILIZATION_MIX">
          <div className="h-80 w-full pt-4 flex flex-col items-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={consumptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {consumptionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', border: '1px solid #00FFCC33', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2">
              {consumptionData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] font-black uppercase text-muted-foreground">{item.name}</span>
                  <span className="text-[10px] font-mono text-primary">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </CyberCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CyberCard title="DEPLETION_FORECAST">
          <div className="space-y-4 pt-2">
            {materialInventory.slice(0, 3).map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 border border-border/30 rounded bg-black/20 group hover:border-primary/30 transition-colors">
                <div className="flex gap-4 items-center">
                  <div className={cn(
                    "p-2 rounded",
                    item.daysLeft < 5 ? "bg-destructive/10 text-destructive animate-pulse" : "bg-primary/10 text-primary"
                  )}>
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase">{item.name}</span>
                    <span className="text-[10px] font-mono opacity-40 uppercase">BURN: {(item.stock / 20).toFixed(0)}g / DAY</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded",
                    item.daysLeft < 5 ? "bg-destructive text-white" : "bg-primary/20 text-primary"
                  )}>
                    {item.daysLeft} DAYS LEFT
                  </span>
                  <p className="text-[10px] font-mono opacity-40 mt-1">EST: Dec 30</p>
                </div>
              </div>
            ))}
          </div>
        </CyberCard>

        <CyberCard title="SUPPLY_CHAIN_AUTOMATION" variant="outline">
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-black uppercase text-primary">Pending Reorder</p>
                    <p className="text-[10px] text-foreground/60 uppercase">Draft #PO-2025-142</p>
                  </div>
                </div>
                <CyberButton size="sm" variant="outline" className="text-[10px] h-7 px-3">EXECUTE_PO</CyberButton>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xxs font-mono opacity-70">
                  <span>3x PLA Teal (1kg)</span>
                  <span>$59.97</span>
                </div>
                <div className="flex justify-between text-xxs font-mono opacity-70">
                  <span>1x ABS Gray (1kg)</span>
                  <span>$24.50</span>
                </div>
                <div className="border-t border-border/20 pt-2 flex justify-between text-xs font-black text-primary">
                  <span>TOTAL_ESTIMATE</span>
                  <span>$84.47</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 items-start p-3 bg-secondary/20 border border-border/30 rounded italic">
              <Truck className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xxs text-muted-foreground leading-relaxed uppercase">
                Predictive ordering enabled. AI will automatically generate purchase orders 5 days before estimated depletion.
              </p>
            </div>
          </div>
        </CyberCard>
      </div>
    </div>
  );
}

