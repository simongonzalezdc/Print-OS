'use client';

import { useTheme } from '@/lib/theme/provider';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { 
  Sun, Moon, Monitor, Palette, Check, 
  Circle, RefreshCcw, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ACCENT_PRESETS = [
  { name: 'Caedo Teal', color: '#00FFCC' },
  { name: 'Plasma Blue', color: '#3b82f6' },
  { name: 'Neon Purple', color: '#8b5cf6' },
  { name: 'Hot Pink', color: '#ec4899' },
  { name: 'Warning Orange', color: '#f97316' },
  { name: 'Cyber Yellow', color: '#eab308' },
];

export default function AppearanceSettingsPage() {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#050505] text-foreground font-sans">
      {/* Header */}
      <div className="flex justify-between items-end border-l-4 border-primary pl-4 mb-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-primary">
            INTERFACE_CALIBRATION
          </h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
            Visual Environment & Aesthetic Parameters // CAEDO_OS
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Selection */}
        <CyberCard title="BASE_THEME" subtitle="Core luminosity profile">
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { id: 'light', name: 'Light', icon: Sun },
              { id: 'dark', name: 'Dark', icon: Moon },
              { id: 'system', name: 'System', icon: Monitor },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 border rounded transition-all group",
                  theme === t.id 
                    ? "border-primary bg-primary/10" 
                    : "border-border/30 bg-black/20 hover:border-primary/50"
                )}
              >
                <t.icon className={cn(
                  "w-6 h-6 transition-colors",
                  theme === t.id ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )} />
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  theme === t.id ? "text-primary" : "text-muted-foreground"
                )}>
                  {t.name}
                </span>
                {theme === t.id && (
                  <motion.div layoutId="theme-check" className="absolute top-2 right-2">
                    <Check className="w-3 h-3 text-primary" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </CyberCard>

        {/* Accent Color Selection */}
        <CyberCard title="ACCENT_FREQUENCY" subtitle="Primary UI highlight color">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setAccentColor(preset.color)}
                className={cn(
                  "flex items-center gap-3 p-3 border rounded transition-all text-left",
                  accentColor === preset.color 
                    ? "border-primary bg-primary/10" 
                    : "border-border/30 bg-black/20 hover:border-primary/30"
                )}
              >
                <div 
                  className="w-4 h-4 rounded-full shadow-lg" 
                  style={{ backgroundColor: preset.color, boxShadow: `0 0 10px ${preset.color}40` }} 
                />
                <span className={cn(
                  "text-[9px] font-bold uppercase truncate",
                  accentColor === preset.color ? "text-primary" : "text-muted-foreground"
                )}>
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
          
          <div className="mt-6 flex items-center gap-4 p-4 border border-border/20 rounded bg-white/[0.02]">
            <Palette className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-primary">Custom Frequency</p>
              <p className="text-[9px] text-muted-foreground uppercase">Manual hex input for precise calibration</p>
            </div>
            <input 
              type="color" 
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-8 h-8 bg-transparent border-none cursor-pointer rounded overflow-hidden"
            />
          </div>
        </CyberCard>

        {/* Visual Preview */}
        <CyberCard className="lg:col-span-2" title="VISUAL_PREVIEW" subtitle="Real-time rendering of current parameters">
          <div className="mt-4 p-8 rounded-lg bg-black/40 border border-dashed border-primary/20 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shadow-glow">
                  <Eye className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary">Preview Element</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Aesthetic demonstration</p>
                </div>
              </div>
              <div className="flex gap-2">
                <CyberButton size="sm" variant="primary">ACTIVE_ACTION</CyberButton>
                <CyberButton size="sm" variant="outline">SECONDARY_LINK</CyberButton>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-primary/30 rounded bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Circle className="w-3 h-3 fill-primary text-primary" />
                  <span className="text-[9px] font-black uppercase text-primary">System Node 01</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary shadow-glow w-[65%]" />
                </div>
              </div>
              <div className="p-4 border border-border/20 rounded bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-2">
                  <Circle className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[9px] font-black uppercase text-muted-foreground">System Node 02</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-muted w-[30%]" />
                </div>
              </div>
              <div className="p-4 border border-border/20 rounded bg-white/[0.02] flex items-center justify-center">
                <RefreshCcw className="w-5 h-5 text-primary/40 animate-spin-slow" />
              </div>
            </div>
          </div>
        </CyberCard>
      </div>
    </div>
  );
}

