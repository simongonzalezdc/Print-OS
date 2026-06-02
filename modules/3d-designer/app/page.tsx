'use client';

import { Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { setupKeyboardShortcuts } from '@/lib/keyboard/shortcuts';
import { Scene } from '@/components/canvas/Scene';
import { AIPanel } from '@/components/panels/AIPanel';
import { CodePanel } from '@/components/panels/CodePanel';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { ExportPanel } from '@/components/panels/ExportPanel';
import { ShapesPanel } from '@/components/panels/ShapesPanel';
import { Toolbar } from '@/components/ui/Toolbar';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GuardrailHUD } from '@/components/ui/GuardrailHUD';
import { Layers, Box, Code2, Download, Command, Shapes, FolderOpen, List, Upload, type LucideIcon } from 'lucide-react';
import { ProjectPanel } from '@/components/panels/ProjectPanel';
import { ObjectsPanel } from '@/components/panels/ObjectsPanel';
import { ImportPanel } from '@/components/panels/ImportPanel';
import { cn } from '@/lib/utils';
import { usePerformanceMonitor } from '@/lib/performance';

/**
 * Main VoiceForge 3D Editor Page
 * Professional Creative Tool Layout - Nov 2025 "Immersive Intelligence" Design
 * 
 * Architecture:
 * - Floating "Dynamic Island" header (maximizes canvas space)
 * - Full-canvas 3D viewport with floating overlays
 * - Floating dock toolbar at bottom-center
 * - Glassmorphic floating panels (not edge-docked)
 * - Immersive HUD displays
 */
export default function EditorPage() {
  // Panel expansion state - default to AI being open
  const [activePanel, setActivePanel] = useState<string | null>('ai');
  const { metrics } = usePerformanceMonitor();

  // Setup keyboard shortcuts
  useEffect(() => {
    const cleanup = setupKeyboardShortcuts();
    return cleanup;
  }, []);

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden selection:bg-primary/30 relative">
      {/* Full Canvas Viewport (Maximized) */}
      <div className="absolute inset-0">
        <ErrorBoundary fallback={<CanvasError />}>
          <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center"><LoadingIndicator message="Initializing Engine..." /></div>}>
            <Scene />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Floating Dynamic Island Header */}
      <motion.header 
        className="absolute top-4 left-1/2 z-50"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', damping: 20 }}
        style={{ x: '-50%' }}
      >
        <div className="dynamic-island flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded-md flex items-center justify-center shadow-glow">
              <Box className="w-3 h-3 text-white" />
            </div>
            <h1 className="text-xs font-bold tracking-tight">VoiceForge<span className="font-light text-muted-foreground">3D</span></h1>
          </div>
          
          <div className="h-3 w-px bg-white/10" />
          
          <div className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            Untitled Project
          </div>

          <div className="h-3 w-px bg-white/10" />

          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="status-pulse" />
            Ready
          </div>
        </div>
      </motion.header>

      {/* Floating Performance HUD (Top Right) */}
      <motion.div 
        className="absolute top-4 right-4 z-40 pointer-events-none"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', damping: 20 }}
      >
        <div className="glass-pro-base rounded-lg text-xxs text-white/70 px-3 py-2 tabular-nums space-y-0.5 min-w-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-white/50">FPS</span>
            <span className="text-white font-mono">{metrics.fps.toFixed(0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/50">Triangles</span>
            <span className="text-white font-mono">{metrics.triangleCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/50">Quality</span>
            <span className="text-white font-mono uppercase">{metrics.qualityLevel}</span>
          </div>
        </div>
      </motion.div>

      {/* Floating Panels Container with AnimatePresence */}
      <AnimatePresence mode="wait">
        {/* AI Panel - Floating on Left Side */}
        {activePanel === 'ai' && (
          <motion.div 
            key="ai-panel"
            className="absolute left-4 top-20 bottom-20 pointer-events-auto z-40"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <AIPanel onToggle={() => togglePanel('ai')} />
          </motion.div>
        )}

        {/* Code Panel - Floating on Left Side */}
        {activePanel === 'code' && (
          <motion.div 
            key="code-panel"
            className="absolute left-4 top-20 bottom-20 pointer-events-auto z-40"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <CodePanel />
          </motion.div>
        )}

        {/* Objects Panel - Floating on Right Side */}
        {activePanel === 'objects' && (
          <motion.div 
            key="objects-panel"
            className="absolute right-4 top-20 w-64 h-[calc(100vh-160px)] pointer-events-auto z-40"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="glass-panel h-full rounded-xl overflow-hidden">
              <ObjectsPanel />
            </div>
          </motion.div>
        )}

        {/* Properties Panel - Floating on Right Side */}
        {activePanel === 'properties' && (
          <motion.div 
            key="properties-panel"
            className="absolute right-4 top-20 h-[calc(100vh-160px)] pointer-events-auto z-40"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <PropertiesPanel />
          </motion.div>
        )}

        {/* Import Panel - Floating on Right Side */}
        {activePanel === 'import' && (
          <motion.div 
            key="import-panel"
            className="absolute right-4 top-20 h-[calc(100vh-160px)] pointer-events-auto z-40"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <ImportPanel onClose={() => togglePanel('import')} />
          </motion.div>
        )}

        {/* Export Panel - Floating on Right Side */}
        {activePanel === 'export' && (
          <motion.div 
            key="export-panel"
            className="absolute right-4 top-20 h-[calc(100vh-160px)] pointer-events-auto z-40"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <ExportPanel />
          </motion.div>
        )}

        {/* Shapes Panel - Floating on Right Side */}
        {activePanel === 'shapes' && (
          <motion.div 
            key="shapes-panel"
            className="absolute right-4 top-20 w-56 h-[calc(100vh-160px)] pointer-events-auto z-40"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="glass-panel h-full rounded-xl overflow-hidden">
              <ShapesPanel />
            </div>
          </motion.div>
        )}

        {/* Project Panel - Floating on Right Side */}
        {activePanel === 'projects' && (
          <motion.div 
            key="projects-panel"
            className="absolute right-4 top-20 h-[calc(100vh-160px)] pointer-events-auto z-40"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <ProjectPanel onClose={() => togglePanel('projects')} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Dock Toolbar (Bottom Center) */}
      <motion.div 
        className="absolute bottom-6 left-1/2 z-50 pointer-events-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', damping: 20 }}
        style={{ x: '-50%' }}
      >
        <div className="floating-dock flex items-center gap-1 px-2 py-2">
          <Toolbar />
          
          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Panel Toggle Buttons */}
          <div className="flex items-center gap-1">
            <PanelTab 
              icon={Command} 
              active={activePanel === 'ai'} 
              onClick={() => togglePanel('ai')} 
              tooltip="AI Assistant"
            />
            <PanelTab 
              icon={Shapes} 
              active={activePanel === 'shapes'} 
              onClick={() => togglePanel('shapes')} 
              tooltip="Shapes Library"
            />
            <PanelTab 
              icon={Code2} 
              active={activePanel === 'code'} 
              onClick={() => togglePanel('code')} 
              tooltip="Code Editor"
            />
            <PanelTab 
              icon={List} 
              active={activePanel === 'objects'} 
              onClick={() => togglePanel('objects')} 
              tooltip="Objects"
            />
            <PanelTab 
              icon={Layers} 
              active={activePanel === 'properties'} 
              onClick={() => togglePanel('properties')} 
              tooltip="Properties"
            />
            <PanelTab 
              icon={Upload} 
              active={activePanel === 'import'} 
              onClick={() => togglePanel('import')} 
              tooltip="Import"
            />
            <PanelTab 
              icon={Download} 
              active={activePanel === 'export'} 
              onClick={() => togglePanel('export')} 
              tooltip="Export"
            />
            <PanelTab 
              icon={FolderOpen} 
              active={activePanel === 'projects'} 
              onClick={() => togglePanel('projects')} 
              tooltip="Projects"
            />
          </div>
        </div>
      </motion.div>

      {/* Floating Status HUD (Bottom Left) */}
      <motion.div 
        className="absolute bottom-6 left-6 z-40 pointer-events-none"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', damping: 20 }}
      >
        <GuardrailHUD />
      </motion.div>
    </div>
  );
}

function PanelTab({ icon: Icon, active, onClick, tooltip }: { icon: LucideIcon, active: boolean, onClick: () => void, tooltip: string }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={cn(
        "p-2.5 rounded-md transition-all duration-200 group relative",
        active 
          ? "bg-primary text-primary-foreground shadow-glow" 
          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      )}
    >
      <Icon className="w-5 h-5" />
      {active && (
        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-white/20 rounded-r-full" />
      )}
    </button>
  );
}

function CanvasError() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-50">
      <div className="text-center max-w-md p-6 bg-card border border-destructive/30 rounded-lg shadow-2xl">
        <div className="text-destructive mb-4 flex justify-center">
           {/* Icon */}
        </div>
        <h3 className="text-lg font-semibold mb-2">Viewport Initialization Failed</h3>
        <p className="text-sm text-muted-foreground mb-4">
          WebGL context could not be created. Please check your browser settings or hardware acceleration.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm transition-colors"
        >
          Reload Interface
        </button>
      </div>
    </div>
  );
}
