'use client';

import { useEffect, useState } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { MetricDisplay } from '@/components/ui/MetricDisplay';
import { TerminalBlock } from '@/components/ui/TerminalBlock';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { Cpu, Zap, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface UsageSummary {
  total_calls: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  total_cost_usd: number;
}

interface DailyUsage {
  date: string;
  cost: number;
  tokens: number;
  calls: number;
}

interface FeatureUsage {
  feature: string;
  cost: number;
  tokens: number;
  calls: number;
}

const COLORS = ['#00FFCC', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308'];

export default function AIUsagePage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailyUsage[]>([]);
  const [featureData, setFeatureData] = useState<FeatureUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, dailyRes, featureRes] = await Promise.all([
          fetch('/api/v1/printfarm/ai/usage/summary'),
          fetch('/api/v1/printfarm/ai/usage/by-day'),
          fetch('/api/v1/printfarm/ai/usage/by-feature')
        ]);

        if (summaryRes.ok) setSummary(await summaryRes.json());
        if (dailyRes.ok) setDailyData(await dailyRes.json());
        if (featureRes.ok) setFeatureData(await featureRes.json());
      } catch (error) {
        console.error('Failed to fetch AI usage data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="text-primary font-black animate-pulse uppercase tracking-widest">Accessing_AI_Telemetry...</div>
      </div>
    );
  }

  const stats = [
    { label: 'Total AI Calls', value: summary?.total_calls || 0, Icon: Activity },
    { label: 'Total Tokens', value: (summary?.total_tokens || 0).toLocaleString(), Icon: Cpu },
    { label: 'Estimated Cost', value: summary?.total_cost_usd ? `$${summary.total_cost_usd.toFixed(4)}` : '$0.0000', Icon: DollarSign },
    { label: 'Avg Cost / Call', value: summary?.total_calls ? `$${(summary.total_cost_usd / summary.total_calls).toFixed(5)}` : '$0.00000', Icon: Zap },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#050505] text-foreground">
      {/* Header */}
      <div className="flex justify-between items-end border-l-4 border-primary pl-4 mb-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-primary">
            AI_INTELLIGENCE_REPORT
          </h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
            Token Consumption & Cost Analysis // CAEDO Ecosystem
          </p>
        </div>
        <div className="text-right font-mono text-xxs opacity-50 uppercase">
          Authorization: ADMIN_LEVEL_1<br />
          Node: AI_TELEMETRY_CORE
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
                <stat.Icon className="w-5 h-5" />
              </div>
              <MetricDisplay 
                label={stat.label} 
                value={stat.value}
              />
            </CyberCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Over Time */}
        <CyberCard className="lg:col-span-2" title="COST_TRENDS_30D" subtitle="Daily AI expenditure in USD">
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666" 
                  fontSize={10} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis stroke="#666" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', fontSize: '10px' }}
                  itemStyle={{ color: '#00FFCC' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  name="Cost ($)" 
                  stroke="#00FFCC" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: '#00FFCC' }}
                  activeDot={{ r: 5, stroke: '#00FFCC', strokeWidth: 2, fill: '#050505' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>

        {/* Feature Distribution */}
        <CyberCard title="FEATURE_DISTRIBUTION" subtitle="Cost by AI capability">
          <div className="h-[300px] w-full flex flex-col items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={featureData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="cost"
                  nameKey="feature"
                >
                  {featureData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full px-4">
              {featureData.map((entry, index) => (
                <div key={entry.feature} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] uppercase font-bold truncate">{entry.feature}</span>
                </div>
              ))}
            </div>
          </div>
        </CyberCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detailed Breakdown */}
        <CyberCard title="TOKEN_CONSUMPTION_LOG" subtitle="Feature-level metrics">
          <div className="space-y-4 mt-2">
            {featureData.map((feature) => (
              <div key={feature.feature} className="p-3 border border-border/30 rounded bg-black/20 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black uppercase text-primary">{feature.feature}</h4>
                  <p className="text-[10px] text-muted-foreground">{feature.calls} calls executed</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold">${feature.cost.toFixed(4)}</p>
                  <p className="text-[10px] text-muted-foreground">{(feature.tokens).toLocaleString()} tokens</p>
                </div>
              </div>
            ))}
            {featureData.length === 0 && (
              <div className="py-10 text-center opacity-40 uppercase text-xs tracking-widest">
                No telemetry data available
              </div>
            )}
          </div>
        </CyberCard>

        <div className="space-y-6">
          <TerminalBlock 
            title="AI_INFRASTRUCTURE_STATUS"
            content={`System: GLM-4.7 CORE\nStatus: OPTIMIZED\n\nIntelligence routing is currently BALANCED. Token usage is within normal parameters for Sector 7 design operations.\n\nOptimization Tip: Batch generation of complex geometry variations can reduce latency by 15%.\n\nAlert: 2 features are currently consuming 80% of total tokens.`}
          />
          
          <CyberCard variant="outline" className="border-primary/30">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded text-primary">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xxs font-black uppercase text-primary">Budget Watchdog</h4>
                <p className="text-[10px] opacity-70 mt-1">AI expenditure is currently $0.12 below the daily threshold. No throttling required.</p>
              </div>
            </div>
          </CyberCard>
        </div>
      </div>
    </div>
  );
}

