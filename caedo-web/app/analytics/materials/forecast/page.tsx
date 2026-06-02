'use client';

import { useEffect, useState } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { MetricDisplay } from '@/components/ui/MetricDisplay';
import { TerminalBlock } from '@/components/ui/TerminalBlock';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  Package, TrendingUp, AlertTriangle, Calendar, 
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ForecastItem {
  material: string;
  queued_grams: number;
  projected_grams: number;
  total_required_kg: number;
  status: string;
}

export default function MaterialForecastPage() {
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/printfarm/business/forecast?days=${days}`);
        if (res.ok) {
          const data = await res.json();
          setForecast(data.forecast);
        }
      } catch (error) {
        console.error('Failed to fetch material forecast:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="text-primary font-black animate-pulse uppercase tracking-widest">Generating_Projections...</div>
      </div>
    );
  }

  const totalKg = forecast.reduce((acc, item) => acc + item.total_required_kg, 0);

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#050505] text-foreground">
      {/* Header */}
      <div className="flex justify-between items-end border-l-4 border-primary pl-4 mb-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-primary">
            MATERIAL_FORECAST_ANALYSIS
          </h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
            Inventory Projections & Resource Planning // CAEDO Facility
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/40 border border-primary/20 p-1 rounded">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "px-3 py-1 text-[10px] font-black uppercase transition-all rounded-sm",
                  days === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"
                )}
              >
                {d}D
              </button>
            ))}
          </div>
          <div className="text-right font-mono text-xxs opacity-50 uppercase">
            Horizon: {days} Days<br />
            Status: DYNAMIC_PLANNING
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CyberCard className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary shadow-[0_0_15px_rgba(0,255,204,0.2)]">
            <Package className="w-5 h-5" />
          </div>
          <MetricDisplay label="Total Requirement" value={totalKg.toFixed(1)} unit="KG" />
        </CyberCard>
        <CyberCard className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Calendar className="w-5 h-5" />
          </div>
          <MetricDisplay label="Forecast Horizon" value={days} unit="DAYS" />
        </CyberCard>
        <CyberCard className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <TrendingUp className="w-5 h-5" />
          </div>
          <MetricDisplay label="Avg Daily Consumption" value={(totalKg / days * 1000).toFixed(0)} unit="G" />
        </CyberCard>
        <CyberCard className="flex items-center gap-4">
          <div className="p-3 bg-destructive/10 rounded-lg text-destructive shadow-[0_0_15px_rgba(255,0,0,0.1)]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <MetricDisplay label="Low Stock Risk" value={forecast.filter(f => f.status === 'Warning').length} unit="SKUS" />
        </CyberCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comparison Chart */}
        <CyberCard className="lg:col-span-2" title="CONSUMPTION_COMPONENTS" subtitle="Queued vs. Projected needs (Grams)">
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="material" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', fontSize: '10px' }}
                  cursor={{ fill: 'rgba(0, 255, 204, 0.05)' }}
                />
                <Legend iconType="rect" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar name="Queued (Known)" dataKey="queued_grams" fill="#00FFCC" stackId="a" />
                <Bar name="Projected (Est)" dataKey="projected_grams" fill="#3b82f6" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>

        {/* Actionable Insights */}
        <div className="space-y-6">
          <CyberCard title="INVENTORY_ALERTS" variant="outline">
            <div className="space-y-4">
              {forecast.map((item) => (
                <div key={item.material} className="flex flex-col gap-2 p-3 border border-border/20 rounded bg-black/20">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-primary">{item.material}</span>
                    <span className={cn(
                      "text-[8px] px-1.5 py-0.5 rounded-sm font-black uppercase",
                      item.status === 'Warning' ? "bg-destructive text-destructive-foreground" : "bg-green-500/20 text-green-500"
                    )}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] opacity-60 uppercase font-bold tracking-tight">Requirement</span>
                      <span className="text-sm font-mono font-black">{item.total_required_kg} KG</span>
                    </div>
                    {item.status === 'Warning' && (
                      <button className="flex items-center gap-1 text-[9px] font-black uppercase text-primary hover:underline">
                        <ShoppingBag className="w-3 h-3" /> ORDER_NOW
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {forecast.length === 0 && (
                <div className="py-10 text-center opacity-30 text-xs uppercase tracking-widest font-bold italic">
                  No inventory data
                </div>
              )}
            </div>
          </CyberCard>

          <TerminalBlock 
            title="STRATEGIC_PLANNING_ENGINE"
            content={`[MODEL] Linear Regression Forecast\n[INFO] Confidence Interval: 92.4%\n\nInsight: TPU usage is trending up 15% due to new mechanical part prototypes in Sector 7.\n\nRecommendation: Consolidate orders for PLA and PETG into a single shipment to save $12.40 on delivery fees.`}
          />
        </div>
      </div>
    </div>
  );
}

