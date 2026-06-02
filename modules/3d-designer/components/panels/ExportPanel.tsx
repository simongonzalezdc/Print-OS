'use client';

import { useState } from 'react';
import { Download, Loader2, FileBox, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSceneStore } from '@/lib/scene/store';
import { ExportFormat } from '@/types';
import { exportTo3MF, sceneObjectToMesh3MF } from '@/lib/export/3mf';
import { exportToSTLBinary, exportToSTLASCII, sceneObjectToSTLMesh } from '@/lib/export/stl';
import { autoRepairMeshes, generateThumbnailData, mergeExportMeshes } from '@/lib/export/utils';

export function ExportPanel() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('3mf');
  const [filename, setFilename] = useState('');
  const [includeThumbnail, setIncludeThumbnail] = useState(true);
  const [autoRepair, setAutoRepair] = useState(true);

  const objects = useSceneStore((state) => state.objects);
  const selectedIds = useSceneStore((state) => state.selectedIds);

  const objectsToExport = Array.from(objects.values()).filter(obj =>
    selectedIds.size === 0 || selectedIds.has(obj.id)
  );

  const defaultFilename = objectsToExport.length === 1
    ? objectsToExport[0]?.name || 'export'
    : `VoiceForge_Export_${new Date().toISOString().split('T')[0]}`;

  const handleExport = async () => {
    if (objectsToExport.length === 0) {
      alert('No objects to export. Create some objects first.');
      return;
    }

    setIsExporting(true);

    try {
      const finalFilename = filename || defaultFilename;
      let result;

      if (exportFormat === '3mf') {
        const meshes3MF = autoRepairMeshes(
          objectsToExport
            .filter(obj => obj.meshData)
            .map(sceneObjectToMesh3MF),
          autoRepair
        );

        if (meshes3MF.length === 0) {
          alert('No valid meshes to export.');
          setIsExporting(false);
          return;
        }

        result = await exportTo3MF(meshes3MF, {
          title: finalFilename,
          includeThumbnail,
          thumbnailData: includeThumbnail ? generateThumbnailData() : undefined,
        });

      } else if (exportFormat === 'stl') {
        const meshesSTL = autoRepairMeshes(
          objectsToExport
            .filter(obj => obj.meshData)
            .map(sceneObjectToSTLMesh),
          autoRepair
        );

        if (meshesSTL.length === 0) {
          alert('No valid mesh to export.');
          setIsExporting(false);
          return;
        }

        const combinedMesh = mergeExportMeshes(meshesSTL);

        if (combinedMesh.indices.length === 0) {
          alert('No valid mesh to export.');
          setIsExporting(false);
          return;
        }

        const triangleCount = combinedMesh.indices.length / 3;

        if (triangleCount > 10000) {
          result = exportToSTLBinary(combinedMesh);
        } else {
          result = exportToSTLASCII(combinedMesh);
        }
      }

      if (result?.success && result.blob) {
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || `${finalFilename}.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert(`Export failed: ${result?.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const exportableObjects = objectsToExport.filter(obj => obj.meshData);
  const hasValidObjects = exportableObjects.length > 0;

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Export Pipeline</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {/* Settings Card */}
        <div className="bg-secondary/30 border border-border rounded-lg p-4 space-y-4">
          <div>
            <label className="text-xxs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-2">
               <button
                  onClick={() => setExportFormat('3mf')}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded border transition-all",
                    exportFormat === '3mf' 
                      ? "bg-primary/10 border-primary/50 text-primary" 
                      : "bg-background border-border text-muted-foreground hover:border-primary/30"
                  )}
               >
                 <FileBox className="w-5 h-5 mb-1" />
                 <span className="text-xs font-medium">3MF</span>
               </button>
               <button
                  onClick={() => setExportFormat('stl')}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded border transition-all",
                    exportFormat === 'stl' 
                      ? "bg-primary/10 border-primary/50 text-primary" 
                      : "bg-background border-border text-muted-foreground hover:border-primary/30"
                  )}
               >
                 <FileBox className="w-5 h-5 mb-1" />
                 <span className="text-xs font-medium">STL</span>
               </button>
            </div>
          </div>

          <div>
            <label className="text-xxs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Filename
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={defaultFilename}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {exportFormat === '3mf' && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeThumbnail}
                  onChange={(e) => setIncludeThumbnail(e.target.checked)}
                  className="rounded border-border bg-background text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground/80">Include thumbnail</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRepair}
                  onChange={(e) => setAutoRepair(e.target.checked)}
                  className="rounded border-border bg-background text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground/80">Auto-repair meshes</span>
              </label>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className={cn(
          "rounded-lg p-3 border",
          exportFormat === '3mf' ? "bg-green-500/5 border-green-500/20" : "bg-blue-500/5 border-blue-500/20"
        )}>
          <div className="flex items-start gap-2.5">
            <Info className={cn("w-4 h-4 shrink-0 mt-0.5", exportFormat === '3mf' ? "text-green-500" : "text-blue-500")} />
            <div>
              <h4 className={cn("text-xs font-medium mb-0.5", exportFormat === '3mf' ? "text-green-500" : "text-blue-500")}>
                {exportFormat === '3mf' ? 'Recommended for Modern Slicers' : 'Legacy Format'}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                 {exportFormat === '3mf' 
                    ? "Includes metadata, separate objects, and thumbnails. Best for Orca Slicer." 
                    : "Universal format. Does not support colors, multiple objects, or units."}
              </p>
            </div>
          </div>
        </div>

        {/* Export Action */}
        <div className="pt-4">
          <button
            onClick={handleExport}
            disabled={isExporting || !hasValidObjects}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all shadow-lg',
              hasValidObjects && !isExporting
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 hover:shadow-primary/40'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            )}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export {exportFormat.toUpperCase()}</span>
              </>
            )}
          </button>
          
          <div className="text-center mt-2">
            <span className="text-xxs text-muted-foreground">
               {hasValidObjects ? `${exportableObjects.length} object(s) ready` : "No exportable objects"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
