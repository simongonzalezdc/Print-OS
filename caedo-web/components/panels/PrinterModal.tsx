'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Globe, Key, Activity } from 'lucide-react';
import { CyberCard } from '../ui/CyberCard';
import { CyberButton } from '../ui/CyberButton';
import { CyberInput } from '../ui/CyberInput';

interface Printer {
  id?: number;
  name: string;
  is_active: boolean;
  build_x_mm: number;
  build_y_mm: number;
  build_z_mm: number;
  reliability_score: number;
  api_type: 'none' | 'octoprint' | 'moonraker';
  api_url?: string;
  api_key?: string;
  ip_address?: string;
  notes?: string;
}

interface PrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (printer: Printer) => Promise<void>;
  printer?: Printer;
}

export const PrinterModal = ({ isOpen, onClose, onSave, printer }: PrinterModalProps) => {
  const [formData, setFormData] = useState<Printer>({
    name: '',
    is_active: true,
    build_x_mm: 220,
    build_y_mm: 220,
    build_z_mm: 250,
    reliability_score: 0.9,
    api_type: 'none',
    api_url: '',
    api_key: '',
    ip_address: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (printer) {
      setFormData(printer);
    } else {
      setFormData({
        name: '',
        is_active: true,
        build_x_mm: 220,
        build_y_mm: 220,
        build_z_mm: 250,
        reliability_score: 0.9,
        api_type: 'none',
        api_url: '',
        api_key: '',
        ip_address: '',
        notes: ''
      });
    }
  }, [printer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save printer:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-2xl"
        >
          <CyberCard className="relative overflow-hidden border-primary/50 shadow-[0_0_30px_rgba(0,255,204,0.15)]">
            <div className="flex items-center justify-between mb-6 border-b border-primary/20 pb-4">
              <div className="flex items-center gap-3 text-primary">
                <Cpu className="w-6 h-6" />
                <h2 className="text-xl font-black uppercase tracking-[0.2em]">
                  {printer ? 'UPDATE_UNIT' : 'PROVISION_NEW_UNIT'}
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-primary/10 rounded-full transition-colors text-muted-foreground hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="text-xxs font-black text-primary uppercase tracking-widest border-l-2 border-primary pl-2 mb-2">Basic Info</h3>
                  <CyberInput 
                    label="Unit Name" 
                    placeholder="e.g. Ender 3 V3" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <CyberInput 
                      label="Build X (mm)" 
                      type="number"
                      value={formData.build_x_mm}
                      onChange={e => setFormData({...formData, build_x_mm: parseInt(e.target.value)})}
                      required
                    />
                    <CyberInput 
                      label="Build Y (mm)" 
                      type="number"
                      value={formData.build_y_mm}
                      onChange={e => setFormData({...formData, build_y_mm: parseInt(e.target.value)})}
                      required
                    />
                    <CyberInput 
                      label="Build Z (mm)" 
                      type="number"
                      value={formData.build_z_mm}
                      onChange={e => setFormData({...formData, build_z_mm: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xxs font-black text-primary uppercase tracking-widest border-l-2 border-primary pl-2 mb-2">Integration</h3>
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-xxs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                      API Type
                    </label>
                    <select 
                      className="w-full bg-background/50 border border-border rounded-[2px] px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      value={formData.api_type}
                      onChange={e => setFormData({...formData, api_type: e.target.value as any})}
                    >
                      <option value="none">Manual Control</option>
                      <option value="octoprint">OctoPrint</option>
                      <option value="moonraker">Moonraker / Klipper</option>
                    </select>
                  </div>

                  {formData.api_type !== 'none' && (
                    <>
                      <CyberInput 
                        label="API URL" 
                        placeholder="http://192.168.1.10" 
                        leftIcon={<Globe className="w-4 h-4" />}
                        value={formData.api_url}
                        onChange={e => setFormData({...formData, api_url: e.target.value})}
                      />
                      <CyberInput 
                        label="API Key" 
                        type="password"
                        placeholder="Your API Key" 
                        leftIcon={<Key className="w-4 h-4" />}
                        value={formData.api_key}
                        onChange={e => setFormData({...formData, api_key: e.target.value})}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-primary/10 flex justify-end gap-3">
                <CyberButton variant="ghost" onClick={onClose} type="button">
                  CANCEL
                </CyberButton>
                <CyberButton loading={loading} type="submit">
                  {printer ? 'UPDATE_HARDWARE' : 'CONFIRM_PROVISIONING'}
                </CyberButton>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-primary/10 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter opacity-50">
                CAEDO_OS // UNIT_REGISTRATION_PROTOCOL
              </p>
            </div>
          </CyberCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
