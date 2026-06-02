'use client';

import { useSceneStore } from '@/lib/scene/store';
import { getShortcutsList } from '@/lib/keyboard/shortcuts';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { CyberCard } from './CyberCard';

export const ShortcutsModal = () => {
  const { helpModalOpen, setHelpModalOpen } = useSceneStore();
  const shortcuts = getShortcutsList();

  if (!helpModalOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-lg"
        >
          <CyberCard className="relative overflow-hidden border-primary/50 shadow-[0_0_30px_rgba(0,255,204,0.15)]">
            <div className="flex items-center justify-between mb-6 border-b border-primary/20 pb-4">
              <div className="flex items-center gap-3 text-primary">
                <Keyboard className="w-6 h-6" aria-hidden="true" />
                <h2 id="shortcuts-title" className="text-xl font-black uppercase tracking-[0.2em]">COMMAND_SHORTCUTS</h2>
              </div>
              <button 
                onClick={() => setHelpModalOpen(false)}
                className="p-2 hover:bg-primary/10 rounded-full transition-colors text-muted-foreground hover:text-primary"
                aria-label="Close shortcuts modal"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div 
              className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar"
              role="list"
              aria-label="List of keyboard shortcuts"
            >
              {shortcuts.map((s, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-3 border border-border/30 rounded bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                  role="listitem"
                >
                  <span className="text-xs font-bold text-muted-foreground uppercase">{s.description}</span>
                  <div className="flex gap-1" aria-label={`Keys: ${s.keys}`}>
                    {s.keys.split('+').map((key, ki) => (
                      <span key={ki} className="flex items-center gap-1">
                        <kbd className="px-2 py-1 min-w-[2.5rem] text-center bg-zinc-800 border border-zinc-700 rounded text-[10px] font-mono font-black text-primary shadow-sm">
                          {key.trim()}
                        </kbd>
                        {ki < s.keys.split('+').length - 1 && <span className="text-muted-foreground text-[10px] self-center" aria-hidden="true">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-primary/10 text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter opacity-50">
                CAEDO_OS // v0.1.0 // SECTOR_7_TERMINAL
              </p>
            </div>
          </CyberCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

