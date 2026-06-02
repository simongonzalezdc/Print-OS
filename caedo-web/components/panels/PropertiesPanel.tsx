'use client';

import { useState, useEffect } from 'react';
import { Settings, Layers, Eye, EyeOff, Cuboid, Hash, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSceneStore } from '@/lib/scene/store';
import { SceneObject } from '@/types';

export function PropertiesPanel() {
  const selectedIds = useSceneStore((state) => state.selectedIds);
  const objects = useSceneStore((state) => state.objects);
  const updateObject = useSceneStore((state) => state.updateObject);

  const selectedObjects = Array.from(selectedIds)
    .map(id => objects.get(id))
    .filter(Boolean) as SceneObject[];

  const selectedObject = selectedObjects[0];

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Properties</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {selectedObject ? (
          <ObjectProperties
            object={selectedObject}
            onUpdate={(updates) => updateObject(selectedObject.id, updates)}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function ObjectProperties({
  object,
  onUpdate
}: {
  object: SceneObject;
  onUpdate: (updates: Partial<SceneObject>) => void;
}) {
  return (
    <div className="p-4 space-y-6">
      {/* Basic Info Section */}
      <Section title="Identity">
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <div className="w-8 h-8 bg-secondary rounded border border-border flex items-center justify-center shrink-0">
              <Cuboid className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
               <label className="text-xxs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Name</label>
               <input
                  type="text"
                  value={object.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  className="w-full bg-secondary/50 border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
               <label className="text-xxs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Color</label>
               <div className="flex gap-2">
                  <div className="relative w-8 h-8 rounded border border-border overflow-hidden shrink-0">
                    <input
                      type="color"
                      value={object.color}
                      onChange={(e) => onUpdate({ color: e.target.value })}
                      className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer p-0 border-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={object.color}
                    onChange={(e) => onUpdate({ color: e.target.value })}
                    className="flex-1 bg-secondary/50 border border-border rounded px-2 py-1.5 text-xs font-mono uppercase focus:outline-none focus:border-primary"
                  />
               </div>
            </div>
            
            <div>
               <label className="text-xxs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Visibility</label>
               <button
                onClick={() => onUpdate({ visible: !object.visible })}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded border transition-colors",
                  object.visible 
                    ? "bg-secondary/50 border-border hover:bg-secondary" 
                    : "bg-muted/50 border-transparent text-muted-foreground"
                )}
              >
                {object.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span className="text-xs">{object.visible ? 'Visible' : 'Hidden'}</span>
              </button>
            </div>
          </div>
        </div>
      </Section>

      <div className="h-px bg-border/50" />

      {/* Transform Section */}
      <Section title="Transform">
        <div className="space-y-4">
          <Vector3Input
            label="Position"
            value={object.position}
            onChange={(position) => onUpdate({ position })}
            axisLabels={['X', 'Y', 'Z']}
          />

          <Vector3Input
            label="Rotation"
            value={object.rotation}
            onChange={(rotation) => onUpdate({ rotation })}
            axisLabels={['R', 'P', 'Y']}
          />

          <Vector3Input
            label="Scale"
            value={object.scale}
            onChange={(scale) => onUpdate({ scale })}
            axisLabels={['W', 'H', 'D']}
          />
        </div>
      </Section>

      <div className="h-px bg-border/50" />

      {/* Mesh Stats */}
      {object.meshData && (
        <Section title="Mesh Statistics">
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Vertices" value={object.meshData.vertices.length / 3} icon={Hash} />
            <StatCard label="Triangles" value={object.meshData.indices.length / 3} icon={Cuboid} />
          </div>
        </Section>
      )}

      {/* Validation */}
      {object.validation && object.validation.issues.length > 0 && (
        <Section title="Validation">
          <div className="space-y-2">
            {object.validation.issues.map((issue, index) => (
              <div
                key={index}
                className={cn(
                  'flex flex-col gap-1 p-2 rounded border text-xs',
                  issue.severity === 'error'
                    ? 'bg-destructive/10 border-destructive/20 text-destructive'
                    : issue.severity === 'warning'
                    ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                )}
              >
                <span className="font-medium">{issue.message}</span>
                {issue.suggestion && (
                  <span className="opacity-80 text-xxs">{issue.suggestion}</span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-foreground/80 mb-3 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string, value: number, icon: LucideIcon }) {
  return (
    <div className="bg-secondary/30 border border-border rounded p-2 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-3 h-3" />
        <span className="text-xxs uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-mono text-foreground">{value.toLocaleString()}</span>
    </div>
  );
}

function Vector3Input({
  label,
  value,
  onChange,
  axisLabels = ['X', 'Y', 'Z']
}: {
  label: string;
  value: [number, number, number];
  onChange: (value: [number, number, number]) => void;
  axisLabels?: string[];
}) {
  const [localValues, setLocalValues] = useState<string[]>(value.map(v => v.toString()));

  // Sync local values when store value changes (e.g. from gizmo or AI)
  useEffect(() => {
    setLocalValues(value.map(v => v.toString()));
  }, [value]);

  const handleInputChange = (index: number, newValue: string) => {
    const updatedLocal = [...localValues];
    updatedLocal[index] = newValue;
    setLocalValues(updatedLocal);

    // Only update store if it's a valid number
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue)) {
      const newVector = [...value] as [number, number, number];
      newVector[index] = numValue;
      onChange(newVector);
    }
  };

  const handleBlur = (index: number) => {
    // On blur, ensure local value matches store value (reverts invalid input)
    const updatedLocal = [...localValues];
    const val = value[index];
    updatedLocal[index] = val !== undefined ? val.toString() : '0';
    setLocalValues(updatedLocal);
  };

  return (
    <div>
      <label className="text-xxs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {axisLabels.map((axis, index) => (
          <div key={axis} className="relative group">
             <div className="absolute left-2 top-1.5 text-[10px] font-bold text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors">
               {axis}
             </div>
            <input
              type="text"
              value={localValues[index]}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onBlur={() => handleBlur(index)}
              className="w-full bg-secondary/50 border border-border rounded px-2 pl-5 py-1 text-xs font-mono text-right focus:outline-none focus:border-primary focus:bg-secondary transition-all"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 p-8 text-center">
      <Settings className="w-12 h-12 mb-4 opacity-20" />
      <h3 className="text-sm font-medium text-foreground mb-2">No Properties</h3>
      <p className="text-xs max-w-[200px]">
        Select an object to edit its properties.
      </p>
    </div>
  );
}
