'use client';

import { useEffect, useState } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { CyberInput } from '@/components/ui/CyberInput';
import { TerminalBlock } from '@/components/ui/TerminalBlock';
import { Save, Database, Shield, Zap, Globe } from 'lucide-react';

interface SettingsState {
  usd_per_kg: number;
  kwh_rate: number;
  labor_rate: number;
  packaging_cost: number;
  platform_fee_percent: number;
  fail_rate_estimate: number;
  labor_setup_minutes_per_job: number;
  ai_model: string;
  api_base: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<SettingsState>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // In a real implementation, we'd fetch this from the API
    // For now, using default values matching the original app
    setSettings({
      usd_per_kg: 20.0,
      kwh_rate: 0.12,
      labor_rate: 25.0,
      packaging_cost: 2.0,
      platform_fee_percent: 10.0,
      fail_rate_estimate: 5.0,
      labor_setup_minutes_per_job: 5.0,
      ai_model: 'glm-4.7',
      api_base: 'https://api.z.ai/api/coding/paas/v4'
    });
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000); // Simulate save
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#050505] text-foreground">
      {/* Header */}
      <div className="flex justify-between items-end border-l-4 border-primary pl-4 mb-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-primary">
            SYSTEM_CONFIGURATION
          </h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
            Global Parameters // Caedo API
          </p>
        </div>
        <CyberButton size="sm" onClick={handleSave} loading={isSaving}>
          <Save className="w-4 h-4" />
          COMMIT_CHANGES
        </CyberButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Economic Parameters */}
        <div className="space-y-6">
          <CyberCard title="ECONOMIC_MODEL" subtitle="Cost & Revenue Calculations">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CyberInput 
                label="Material Cost ($/kg)" 
                type="number" 
                value={settings.usd_per_kg} 
                onChange={e => setSettings({...settings, usd_per_kg: Number(e.target.value)})}
              />
              <CyberInput 
                label="Electricity Rate ($/kWh)" 
                type="number" 
                value={settings.kwh_rate} 
                onChange={e => setSettings({...settings, kwh_rate: Number(e.target.value)})}
              />
              <CyberInput 
                label="Labor Rate ($/hr)" 
                type="number" 
                value={settings.labor_rate} 
                onChange={e => setSettings({...settings, labor_rate: Number(e.target.value)})}
              />
              <CyberInput 
                label="Setup Time (min/job)" 
                type="number" 
                value={settings.labor_setup_minutes_per_job} 
                onChange={e => setSettings({...settings, labor_setup_minutes_per_job: Number(e.target.value)})}
              />
              <CyberInput 
                label="Packaging Cost ($/unit)" 
                type="number" 
                value={settings.packaging_cost} 
                onChange={e => setSettings({...settings, packaging_cost: Number(e.target.value)})}
              />
              <CyberInput 
                label="Platform Fee (%)" 
                type="number" 
                value={settings.platform_fee_percent} 
                onChange={e => setSettings({...settings, platform_fee_percent: Number(e.target.value)})}
              />
            </div>
          </CyberCard>

          <CyberCard title="AI_ORCHESTRATION" subtitle="Intelligence Layer Configuration">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xxs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  CORE_MODEL
                </label>
                <select 
                  value={settings.ai_model}
                  onChange={e => setSettings({...settings, ai_model: e.target.value})}
                  className="w-full bg-background/50 border border-border rounded-[2px] px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
                >
                  <option>glm-4.7</option>
                  <option>glm-4.6v</option>
                  <option>glm-4.0</option>
                </select>
              </div>
              <CyberInput 
                label="API_ENDPOINT" 
                value={settings.api_base} 
                onChange={e => setSettings({...settings, api_base: e.target.value})}
              />
              <div className="p-3 bg-primary/5 border border-primary/20 rounded flex gap-3 items-center">
                <Zap className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xxs font-bold uppercase text-primary/80 leading-tight">
                  Using International Coding Plan // High-priority token processing enabled
                </span>
              </div>
            </div>
          </CyberCard>
        </div>

        {/* System & Security */}
        <div className="space-y-6">
          <TerminalBlock 
            title="SECURITY_POSTURE"
            content="Firewall: ACTIVE\nIntrusion Detection: SCANNING\nEncrypted Handoff: ENABLED\n\nAll commercial evaluations are processed through isolated AI environments to ensure IP protection."
          />

          <CyberCard title="INTEGRATION_STATUS">
            <div className="space-y-4">
              {[
                { name: 'Caedo Engine', status: 'connected', icon: Globe },
                { name: 'PrintFarm DB', status: 'connected', icon: Database },
                { name: 'ZhipuAI Gateway', status: 'connected', icon: Shield },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-border/30 rounded bg-black/20">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-glow" />
                    <span className="text-xxs font-black text-primary uppercase">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CyberCard>

          <CyberCard title="DANGEROUS_ZONE" variant="outline" className="border-destructive/30">
            <p className="text-xxs text-muted-foreground uppercase mb-4">
              Irreversible actions that affect the entire production facility.
            </p>
            <div className="flex flex-col gap-2">
              <CyberButton variant="ghost" className="text-destructive hover:bg-destructive/10 border border-destructive/20 w-full justify-start">
                PURGE_ALL_COMPLETED_JOBS
              </CyberButton>
              <CyberButton variant="ghost" className="text-destructive hover:bg-destructive/10 border border-destructive/20 w-full justify-start">
                RESET_FLEET_TELEMETRY
              </CyberButton>
            </div>
          </CyberCard>
        </div>
      </div>
    </div>
  );
}

