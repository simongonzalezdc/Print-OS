'use client';

import { useState, useEffect } from 'react';
import { Settings, Printer, Palette, User, Check, ChevronDown, Brain, Database } from 'lucide-react';
import { AIMemoryTab } from './ai/AIMemoryTab';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  UserPreferences, 
  loadUserPreferences, 
  saveUserPreferences, 
  DEFAULT_PREFERENCES 
} from '@/lib/storage/user-preferences';
import { 
  PRINTER_PROFILES, 
  listPrinterProfiles 
} from '@/lib/constants/printer-profiles';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'printer' | 'experience' | 'preferences' | 'memory' | 'system'>('printer');
  
  // Load preferences on mount
  useEffect(() => {
    loadUserPreferences().then((prefs) => {
      setPreferences(prefs);
      setLoading(false);
    });
  }, []);
  
  // Save preferences
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveUserPreferences(preferences);
      onClose();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Update a nested preference field
  const updatePref = <K extends keyof UserPreferences>(
    key: K,
    value: Partial<UserPreferences[K]>
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: typeof prev[key] === 'object' && !Array.isArray(prev[key])
        ? { ...prev[key], ...value }
        : value,
    }));
  };
  
  if (loading) {
    return (
      <div className="w-96 h-[500px] flex items-center justify-center glass-pro-elevated rounded-xl">
        <div className="animate-pulse text-white/50">Loading settings...</div>
      </div>
    );
  }
  
  const printerProfiles = listPrinterProfiles();
  const selectedPrinter = PRINTER_PROFILES[preferences.printer.profileId] ?? PRINTER_PROFILES['generic']!;
  
  return (
    <div className="w-96 h-[500px] flex flex-col glass-pro-elevated rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <Settings className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-white">Settings</h2>
            <p className="text-xxs text-white/50">Customize your experience</p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {[
          { id: 'printer', label: 'Printer', icon: Printer },
          { id: 'experience', label: 'User', icon: User },
          { id: 'preferences', label: 'Design', icon: Palette },
          { id: 'memory', label: 'Memory', icon: Brain },
          { id: 'system', label: 'System', icon: Database },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-colors",
              activeTab === id
                ? "text-white border-b-2 border-purple-500 bg-white/5"
                : "text-white/50 hover:text-white/70 hover:bg-white/5"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'printer' && (
          <>
            {/* Printer Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">3D Printer</label>
              <div className="relative">
                <select
                  value={preferences.printer.profileId}
                  onChange={(e) => updatePref('printer', { profileId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer hover:border-white/20 transition-colors"
                >
                  {printerProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id} className="bg-gray-900">
                      {profile.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
              </div>
            </div>
            
            {/* Printer Info */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Build Volume</span>
                <span className="text-white">
                  {selectedPrinter.buildVolume.x} × {selectedPrinter.buildVolume.y} × {selectedPrinter.buildVolume.z} mm
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Multi-Color</span>
                <span className={cn(
                  selectedPrinter.multiColor.enabled ? "text-green-400" : "text-white/50"
                )}>
                  {selectedPrinter.multiColor.enabled 
                    ? `${selectedPrinter.multiColor.colorCount} colors (${selectedPrinter.multiColor.system})`
                    : 'Not available'
                  }
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Bed Type</span>
                <span className="text-white capitalize">{selectedPrinter.bedType}</span>
              </div>
            </div>
            
            {/* Materials */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">Common Materials</label>
              <div className="flex flex-wrap gap-2">
                {['PLA', 'PETG', 'ABS', 'TPU', 'ASA'].map((material) => (
                  <button
                    key={material}
                    onClick={() => {
                      const materials = preferences.printer.materials.includes(material)
                        ? preferences.printer.materials.filter(m => m !== material)
                        : [...preferences.printer.materials, material];
                      updatePref('printer', { materials });
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs border transition-colors",
                      preferences.printer.materials.includes(material)
                        ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                    )}
                  >
                    {material}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Multi-color options */}
            {selectedPrinter.multiColor.enabled && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/70">Filament Colors</label>
                <input
                  type="text"
                  placeholder="e.g., Black, White, Gold, Red"
                  value={preferences.printer.additionalColors?.join(', ') || ''}
                  onChange={(e) => updatePref('printer', { 
                    additionalColors: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                  })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30"
                />
                <p className="text-xxs text-white/40">Comma-separated list of your loaded filaments</p>
              </div>
            )}
          </>
        )}
        
        {activeTab === 'experience' && (
          <>
            {/* Experience Level */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">Experience Level</label>
              <div className="space-y-2">
                {[
                  { id: 'beginner', label: 'Beginner', desc: 'Just getting started with 3D printing' },
                  { id: 'intermediate', label: 'Intermediate', desc: 'Comfortable slicing and printing' },
                  { id: 'advanced', label: 'Advanced', desc: 'Design my own models, know DFM' },
                ].map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => updatePref('experience', { level: id as UserPreferences['experience']['level'] })}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                      preferences.experience.level === id
                        ? "bg-purple-500/10 border-purple-500/50"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      preferences.experience.level === id
                        ? "border-purple-500 bg-purple-500"
                        : "border-white/30"
                    )}>
                      {preferences.experience.level === id && (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-white">{label}</div>
                      <div className="text-xxs text-white/50">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Primary Use Case */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">What do you mainly create?</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Functional parts',
                  'Organizers',
                  'Electronics cases',
                  'Decorative',
                  'Mechanical',
                  'Prototypes',
                ].map((useCase) => (
                  <button
                    key={useCase}
                    onClick={() => updatePref('useCases', { primary: useCase })}
                    className={cn(
                      "px-2.5 py-1.5 rounded-md text-xs border transition-colors",
                      preferences.useCases.primary === useCase
                        ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                    )}
                  >
                    {useCase}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Common Components */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">Components you often design for</label>
              <input
                type="text"
                placeholder="e.g., Raspberry Pi 4, Arduino Nano, NEMA 17"
                value={preferences.commonComponents.join(', ')}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  commonComponents: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30"
              />
            </div>
          </>
        )}
        
        {activeTab === 'preferences' && (
          <>
            {/* Design Preferences */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-white/70">Design Style</label>
              
              {[
                { key: 'preferMinimalist', label: 'Minimalist designs', desc: 'Clean, simple geometry' },
                { key: 'prioritizeStrength', label: 'Prioritize strength', desc: 'Thicker walls, more material' },
                { key: 'prioritizePrintSpeed', label: 'Prioritize speed', desc: 'Faster prints, thinner walls' },
              ].map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => updatePref('designPreferences', { 
                    [key]: !preferences.designPreferences[key as keyof typeof preferences.designPreferences]
                  })}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border transition-colors",
                    preferences.designPreferences[key as keyof typeof preferences.designPreferences]
                      ? "bg-purple-500/10 border-purple-500/50"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="text-left">
                    <div className="text-sm text-white">{label}</div>
                    <div className="text-xxs text-white/50">{desc}</div>
                  </div>
                  <div className={cn(
                    "w-8 h-5 rounded-full transition-colors relative",
                    preferences.designPreferences[key as keyof typeof preferences.designPreferences]
                      ? "bg-purple-500"
                      : "bg-white/20"
                  )}>
                    <div className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                      preferences.designPreferences[key as keyof typeof preferences.designPreferences]
                        ? "translate-x-3.5"
                        : "translate-x-0.5"
                    )} />
                  </div>
                </button>
              ))}
            </div>
            
            {/* AI Verbosity */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">AI Response Style</label>
              <div className="space-y-2">
                {[
                  { id: 'concise', label: 'Concise', desc: 'Just the code and key info' },
                  { id: 'detailed', label: 'Detailed', desc: 'Full explanations included' },
                  { id: 'educational', label: 'Educational', desc: 'Teach me as we go' },
                ].map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => updatePref('aiPreferences', { 
                      verbosity: id as UserPreferences['aiPreferences']['verbosity']
                    })}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors",
                      preferences.aiPreferences.verbosity === id
                        ? "bg-purple-500/10 border-purple-500/50"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full border-2",
                      preferences.aiPreferences.verbosity === id
                        ? "border-purple-500 bg-purple-500"
                        : "border-white/30"
                    )} />
                    <div>
                      <div className="text-xs text-white">{label}</div>
                      <div className="text-xxs text-white/40">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'memory' && (
          <AIMemoryTab />
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">Data Management</label>
              <p className="text-xxs text-white/40">Secure your database and configuration by creating periodic backups.</p>
              
              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  onClick={async () => {
                    const toastId = toast.loading('Preparing backup...');
                    try {
                      window.location.href = '/api/v1/printfarm/system/backup';
                      toast.success('Backup download started', { id: toastId });
                    } catch {
                      toast.error('Backup failed', { id: toastId });
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="text-left">
                    <div className="text-sm text-white group-hover:text-primary transition-colors">Export Backup</div>
                    <div className="text-xxs text-white/50">Download farm.db as a ZIP archive</div>
                  </div>
                  <Database className="w-4 h-4 text-white/30 group-hover:text-primary transition-colors" />
                </button>

                <div className="relative">
                  <input
                    type="file"
                    accept=".zip"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      if (!confirm('Warning: Restoring will overwrite your current database. Continue?')) return;
                      
                      const toastId = toast.loading('Restoring data...');
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await fetch('/api/v1/printfarm/system/restore', {
                          method: 'POST',
                          body: formData
                        });
                        if (res.ok) {
                          toast.success('System restored successfully. Refreshing...', { id: toastId });
                          setTimeout(() => window.location.reload(), 2000);
                        } else {
                          throw new Error('Restore failed');
                        }
                      } catch {
                        toast.error('Failed to restore backup', { id: toastId });
                      }
                    }}
                  />
                  <div className="w-full flex items-center justify-between p-3 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors group">
                    <div className="text-left">
                      <div className="text-sm text-red-200">Restore System</div>
                      <div className="text-xxs text-red-500/50">Upload a previously exported ZIP backup</div>
                    </div>
                    <Database className="w-4 h-4 text-red-500/30" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex justify-between text-[10px] text-white/30 uppercase font-mono">
                <span>Core Engine</span>
                <span>v1.0.0-PRO</span>
              </div>
              <div className="flex justify-between text-[10px] text-white/30 uppercase font-mono mt-1">
                <span>Last Sync</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-white/10 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 rounded-lg bg-purple-500 text-sm text-white font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
