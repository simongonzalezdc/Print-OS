'use client';

import { useState, useMemo } from 'react';
import { Eye, EyeOff, Lock, Unlock, Edit2, GripVertical } from 'lucide-react';
import { useSceneStore } from '@/lib/scene/store';
import { SceneObject } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Objects Panel - Object hierarchy and management
 * Similar to Blender's outliner or Fusion 360's browser
 */
export function ObjectsPanel() {
  const objects = useSceneStore((state) => state.objects);
  const selectedIds = useSceneStore((state) => state.selectedIds);
  const selectObject = useSceneStore((state) => state.selectObject);
  const updateObject = useSceneStore((state) => state.updateObject);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const objectList = useMemo(() => Array.from(objects.values()), [objects]);

  const handleSelect = (id: string, event: React.MouseEvent) => {
    if (event.shiftKey) {
      selectObject(id, true);
    } else {
      selectObject(id, false);
    }
  };

  const handleToggleVisibility = (id: string) => {
    const obj = objects.get(id);
    if (obj) {
      updateObject(id, { visible: !obj.visible });
    }
  };

  const handleToggleLock = (id: string) => {
    const obj = objects.get(id);
    if (obj) {
      updateObject(id, { locked: !obj.locked });
    }
  };

  const handleStartRename = (obj: SceneObject) => {
    setEditingId(obj.id);
    setEditName(obj.name);
  };

  const handleFinishRename = (id: string) => {
    if (editName.trim()) {
      updateObject(id, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName('');
  };


  if (objectList.length === 0) {
    return (
      <div className="h-full flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-3 py-2 border-b border-border/50">
          <h2 className="text-sm font-semibold text-foreground/90">Objects</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          No objects in scene
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/50">
        <h2 className="text-sm font-semibold text-foreground/90">Objects</h2>
        <p className="text-xs text-muted-foreground">{objectList.length} object(s)</p>
      </div>

      {/* Object List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {objectList.map((obj) => {
          const isSelected = selectedIds.has(obj.id);
          const isEditing = editingId === obj.id;

          return (
            <div
              key={obj.id}
              className={cn(
                "group flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors",
                isSelected
                  ? "bg-primary/20 border border-primary/30"
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              {/* Drag Handle */}
              <GripVertical className="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground/60" />

              {/* Visibility Toggle */}
              <button
                onClick={() => handleToggleVisibility(obj.id)}
                className="p-0.5 hover:bg-white/10 rounded transition-colors"
                title={obj.visible ? 'Hide' : 'Show'}
              >
                {obj.visible ? (
                  <Eye className="w-3.5 h-3.5 text-white/60" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-white/30" />
                )}
              </button>

              {/* Lock Toggle */}
              <button
                onClick={() => handleToggleLock(obj.id)}
                className="p-0.5 hover:bg-white/10 rounded transition-colors"
                title={obj.locked ? 'Unlock' : 'Lock'}
              >
                {obj.locked ? (
                  <Lock className="w-3.5 h-3.5 text-white/60" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-white/30" />
                )}
              </button>

              {/* Object Name */}
              <button
                onClick={(e) => handleSelect(obj.id, e)}
                className="flex-1 text-left min-w-0"
                onDoubleClick={() => handleStartRename(obj)}
              >
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleFinishRename(obj.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename(obj.id);
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditName('');
                      }
                    }}
                    className="w-full px-1 py-0.5 bg-background border border-primary rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                ) : (
                  <span
                    className={cn(
                      "text-xs truncate block",
                      isSelected ? "text-white font-medium" : "text-white/70",
                      !obj.visible && "opacity-50",
                      obj.locked && "italic"
                    )}
                  >
                    {obj.name}
                  </span>
                )}
              </button>

              {/* Actions */}
              {!isEditing && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleStartRename(obj)}
                    className="p-0.5 hover:bg-white/10 rounded transition-colors"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3 text-white/40 hover:text-white/60" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 border-t border-border/50 bg-muted/20">
        <p className="text-[10px] text-muted-foreground">
          Double-click to rename • Shift+click to multi-select
        </p>
      </div>
    </div>
  );
}

