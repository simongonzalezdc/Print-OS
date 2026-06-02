'use client';

import { Save, Undo, Redo, MousePointer2, Move, RotateCcw, Maximize2, Copy, Trash2, type LucideIcon } from 'lucide-react';
import { useSceneStore } from '@/lib/scene/store';
import { cn } from '@/lib/utils';
import { TransformMode } from '@/types';

/**
 * Toolbar Component
 * Core editing tools: Select, Transform modes, Undo, Redo, Save
 * Designed to work in floating dock environment (Nov 2025 design)
 * 
 * Keyboard shortcuts:
 * - G: Move (translate)
 * - R: Rotate
 * - S: Scale
 * - Escape: Deselect all
 * - Ctrl+Z: Undo
 * - Ctrl+Shift+Z: Redo
 */
export function Toolbar() {
  const canUndo = useSceneStore((state) => state.historyIndex > 0);
  const canRedo = useSceneStore((state) => state.historyIndex < state.history.length - 1);
  const undo = useSceneStore((state) => state.undo);
  const redo = useSceneStore((state) => state.redo);
  const saveProject = useSceneStore((state) => state.saveProject);
  const transformMode = useSceneStore((state) => state.transformMode);
  const setTransformMode = useSceneStore((state) => state.setTransformMode);
  const selectedIds = useSceneStore((state) => state.selectedIds);
  const duplicateObject = useSceneStore((state) => state.duplicateObject);
  const deleteSelectedObjects = useSceneStore((state) => state.deleteSelectedObjects);
  
  const hasSelection = (selectedIds?.size ?? 0) > 0;

  return (
    <div className="flex items-center gap-0.5">
      {/* Selection Tool */}
      <div className="flex items-center gap-0.5 pr-1">
         <ToolButton icon={MousePointer2} label="Select" active={true} />
      </div>
      
      <div className="w-px h-6 bg-white/10" />
      
      {/* Transform Mode Tools */}
      <div className="flex items-center gap-0.5 px-1">
        <TransformButton 
          icon={Move} 
          mode="translate"
          currentMode={transformMode}
          onClick={() => setTransformMode('translate')}
          label="Move (G)"
          disabled={!hasSelection}
        />
        <TransformButton 
          icon={RotateCcw} 
          mode="rotate"
          currentMode={transformMode}
          onClick={() => setTransformMode('rotate')}
          label="Rotate (R)"
          disabled={!hasSelection}
        />
        <TransformButton 
          icon={Maximize2} 
          mode="scale"
          currentMode={transformMode}
          onClick={() => setTransformMode('scale')}
          label="Scale (S)"
          disabled={!hasSelection}
        />
      </div>
      
      <div className="w-px h-6 bg-white/10" />
      
      {/* Object Actions */}
      {hasSelection && (
        <>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-0.5 px-0.5">
            <IconButton 
              icon={Copy} 
              onClick={() => {
                const firstId = Array.from(selectedIds)[0];
                if (firstId) duplicateObject(firstId);
              }} 
              label="Duplicate (Ctrl+D)" 
            />
            <IconButton 
              icon={Trash2} 
              onClick={deleteSelectedObjects} 
              label="Delete (Del)" 
            />
          </div>
        </>
      )}

      {/* History Tools */}
      <div className="flex items-center gap-0.5 px-0.5">
        <IconButton 
          icon={Undo} 
          onClick={undo} 
          disabled={!canUndo} 
          label="Undo (Ctrl+Z)" 
        />
        <IconButton 
          icon={Redo} 
          onClick={redo} 
          disabled={!canRedo} 
          label="Redo (Ctrl+Shift+Z)" 
        />
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-0.5 pl-0.5">
        <IconButton 
          icon={Save} 
          onClick={() => saveProject()} 
          label="Save Project" 
        />
      </div>
    </div>
  );
}

/**
 * Icon Button - Pro-tier dock button with hover effects
 */
function IconButton({ icon: Icon, onClick, disabled, label }: { icon: LucideIcon, onClick?: () => void, disabled?: boolean, label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "dock-item transition-all duration-200",
        disabled 
          ? "text-muted-foreground/30 cursor-not-allowed" 
          : "text-white/70 hover:text-white active:scale-95"
      )}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}

/**
 * Tool Button - Active state indicator with icon
 */
function ToolButton({ icon: Icon, label, active }: { icon: LucideIcon, label: string, active?: boolean }) {
  return (
    <button
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "dock-item flex items-center gap-1 transition-all duration-200",
        active
          ? "dock-item-active text-white"
          : "text-white/60 hover:text-white"
      )}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      {label && <span className="text-xs font-medium hidden sm:inline">{label}</span>}
    </button>
  );
}

/**
 * Transform Button - Shows active transform mode
 */
function TransformButton({ 
  icon: Icon, 
  mode, 
  currentMode, 
  onClick, 
  label,
  disabled 
}: { 
  icon: LucideIcon; 
  mode: TransformMode;
  currentMode: TransformMode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  const isActive = mode === currentMode;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-pressed={isActive}
      aria-label={label}
      className={cn(
        "dock-item transition-all duration-200",
        disabled 
          ? "text-muted-foreground/30 cursor-not-allowed"
          : isActive 
            ? "text-primary bg-primary/20 ring-1 ring-primary/50" 
            : "text-white/60 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}
