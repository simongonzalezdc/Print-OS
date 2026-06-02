'use client';

import { useState, useEffect } from 'react';
import { History, RotateCcw, Save, Trash2, Clock, MessageSquare, ChevronRight } from 'lucide-react';
import { useSceneStore } from '@/lib/scene/store';
import { VersionManager, DesignVersion } from '@/lib/storage/versioning';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CyberCard } from '../ui/CyberCard';
import { CyberButton } from '../ui/CyberButton';

interface VersionHistoryPanelProps {
  objectId: string;
  onClose: () => void;
}

export function VersionHistoryPanel({ objectId, onClose }: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const object = useSceneStore((state) => state.objects.get(objectId));
  const updateObject = useSceneStore((state) => state.updateObject);

  useEffect(() => {
    fetchVersions();
  }, [objectId]);

  async function fetchVersions() {
    setLoading(true);
    try {
      const data = await VersionManager.getVersions(objectId);
      setVersions(data);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveCurrent = async () => {
    if (!object) return;
    try {
      await VersionManager.saveVersion(objectId, object.jscadCode, 'Manual Snapshot');
      await fetchVersions();
      toast.success('Version saved');
    } catch (error) {
      toast.error('Failed to save version');
    }
  };

  const handleRollback = async (version: DesignVersion) => {
    if (!confirm('Are you sure you want to rollback to this version? Current unsaved changes will be lost.')) return;
    
    try {
      // Save current as a version before rolling back
      if (object) {
        await VersionManager.saveVersion(objectId, object.jscadCode, 'Pre-rollback snapshot');
      }
      
      updateObject(objectId, { jscadCode: version.code });
      toast.success('Rolled back to version from ' + new Date(version.timestamp).toLocaleString());
      onClose();
    } catch (error) {
      toast.error('Failed to rollback');
    }
  };

  if (!object) return null;

  return (
    <div className="w-[400px] h-[600px] flex flex-col glass-pro-elevated rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Version_History</h2>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <span className="text-xxs font-black text-white/40 uppercase tracking-tighter">Current: {object.name}</span>
        <CyberButton size="sm" variant="outline" className="h-7 gap-1.5" onClick={handleSaveCurrent}>
          <Save className="w-3 h-3" />
          SNAPSHOT
        </CyberButton>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center opacity-50 animate-pulse text-xs uppercase font-bold tracking-widest">
            Retrieving_Snapshots...
          </div>
        ) : versions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30 italic">
            <Clock className="w-12 h-12" />
            <p className="text-xs">No saved versions for this object</p>
          </div>
        ) : (
          versions.map((v) => (
            <div key={v.id} className="group p-3 rounded-lg border border-white/5 bg-white/5 hover:border-primary/30 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-primary/80 uppercase">{v.label || 'Auto Snapshot'}</span>
                  <span className="text-[9px] text-white/40 font-mono">{new Date(v.timestamp).toLocaleString()}</span>
                </div>
                <CyberButton size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRollback(v)}>
                  <RotateCcw className="w-3 h-3" />
                </CyberButton>
              </div>
              
              {v.aiPrompt && (
                <div className="flex items-start gap-2 bg-black/40 p-2 rounded border border-white/5 mb-2">
                  <MessageSquare className="w-2.5 h-2.5 text-primary/40 mt-0.5 shrink-0" />
                  <p className="text-[9px] text-white/60 italic line-clamp-2 leading-tight">
                    {v.aiPrompt}
                  </p>
                </div>
              )}
              
              <div className="text-[8px] font-mono text-white/20 line-clamp-1 opacity-50">
                {v.code.slice(0, 100)}...
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-white/10 bg-black/40 text-center">
        <p className="text-[9px] text-white/20 uppercase font-black tracking-tighter">
          CAEDO_OS // LOCAL_RECOVERY_VAULT
        </p>
      </div>
    </div>
  );
}
