'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Loader2, FileCode } from 'lucide-react';
import { useSceneStore } from '@/lib/scene/store';
import { MeshImporter } from '@/lib/import/three-importer';
import { centerMesh, scaleMesh } from '@/lib/import/stl-parser';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImportPanelProps {
  onClose: () => void;
}

/**
 * Import Panel - Import STL/3MF files
 */
export function ImportPanel({ onClose }: ImportPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importOptions, setImportOptions] = useState({
    center: true,
    scale: 1.0,
  });

  const addObject = useSceneStore((state) => state.addObject);

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'stl' && ext !== '3mf') {
      toast.error('Only STL and 3MF files are supported');
      return;
    }

    setImporting(true);
    try {
      const meshData = await MeshImporter.importFile(file);
      
      // Apply options
      let processedMesh = meshData;
      if (importOptions.center) {
        processedMesh = centerMesh(processedMesh);
      }
      if (importOptions.scale !== 1.0) {
        processedMesh = scaleMesh(processedMesh, importOptions.scale);
      }

      // Create a dummy JSCAD code that represents the imported mesh
      const jscadCode = `// Imported ${ext.toUpperCase()}: ${file.name}
// This mesh is imported directly as geometry.
const main = () => {
  return cube({size: 0.1}); // Minimal placeholder
};`;

      const objectId = addObject(jscadCode, file.name.replace(/\.(stl|3mf)$/i, ''));
      
      // Update object with imported mesh data
      const updateObject = useSceneStore.getState().updateObject;
      updateObject(objectId, { 
        meshData: processedMesh,
        // Tag as imported mesh
        notes: `Imported from ${file.name}`
      });

      toast.success(`Imported "${file.name}"`);
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  }, [importOptions, addObject, onClose]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const stlFile = files.find(f => f.name.toLowerCase().endsWith('.stl'));
    
    if (stlFile) {
      handleFile(stlFile);
    } else {
      toast.error('Please drop an STL file');
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="w-96 h-[calc(100vh-160px)] flex flex-col glass-pro-elevated rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-transparent">
        <h2 className="font-semibold text-sm text-white">Import</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={cn(
          "flex-1 flex flex-col items-center justify-center p-8 m-4 border-2 border-dashed rounded-lg transition-colors",
          isDragging
            ? "border-primary bg-primary/10"
            : "border-white/20 hover:border-white/30"
        )}
      >
        {importing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm text-white/70">Importing...</span>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-white/40 mb-4" />
            <p className="text-sm text-white/70 mb-2">Drop STL or 3MF file here</p>
            <p className="text-xs text-white/50 mb-4">or</p>
            <label className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-white rounded-lg cursor-pointer border border-primary/30 transition-colors">
              <input
                type="file"
                accept=".stl,.3mf"
                onChange={handleFileInput}
                className="hidden"
              />
              Browse Files
            </label>
          </>
        )}
      </div>

      {/* Import Options */}
      <div className="p-4 border-t border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase text-white/40 tracking-widest">Import Settings</label>
          <FileCode className="w-3 h-3 text-primary/40" />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="center"
            checked={importOptions.center}
            onChange={(e) => setImportOptions({ ...importOptions, center: e.target.checked })}
            className="rounded border-border bg-background text-primary focus:ring-primary"
          />
          <label htmlFor="center" className="text-sm text-white/70 cursor-pointer">
            Center at origin
          </label>
        </div>

        <div>
          <label htmlFor="scale" className="block text-sm text-white/70 mb-1">
            Scale: {importOptions.scale}x
          </label>
          <input
            type="range"
            id="scale"
            min="0.1"
            max="10"
            step="0.1"
            value={importOptions.scale}
            onChange={(e) => setImportOptions({ ...importOptions, scale: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

