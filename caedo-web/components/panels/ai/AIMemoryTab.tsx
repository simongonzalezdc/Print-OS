'use client';

import { useState, useEffect } from 'react';
import { Brain, Trash2, Plus, Star, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AIMemory {
  id: number;
  category: string;
  content: string;
  importance: number;
  created_at: string;
}

export function AIMemoryTab() {
  const [memories, setMemories] = useState<AIMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMemory, setNewMemory] = useState({ category: 'style', content: '', importance: 0.5 });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchMemories();
  }, []);

  async function fetchMemories() {
    try {
      const res = await fetch('/api/v1/printfarm/ai/memory');
      const data = await res.json();
      setMemories(data);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newMemory.content) return;
    try {
      const res = await fetch('/api/v1/printfarm/ai/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemory)
      });
      if (res.ok) {
        setNewMemory({ category: 'style', content: '', importance: 0.5 });
        setIsAdding(false);
        fetchMemories();
        toast.success('Memory preserved');
      }
    } catch {
      toast.error('Failed to save memory');
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/v1/printfarm/ai/memory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMemories(memories.filter(m => m.id !== id));
        toast.success('Memory cleared');
      }
    } catch {
      toast.error('Failed to delete memory');
    }
  }

  async function handleImportance(id: number, current: number) {
    const nextImportance = current >= 1.0 ? 0.1 : current + 0.3;
    try {
      const res = await fetch(`/api/v1/printfarm/ai/memory/${id}/importance?importance=${nextImportance}`, {
        method: 'PATCH'
      });
      if (res.ok) {
        fetchMemories();
      }
    } catch {
      toast.error('Failed to update importance');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-white/70 flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-purple-400" />
          AI Design Memory
        </label>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 hover:bg-white/10 rounded text-purple-400"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isAdding && (
        <div className="bg-white/5 border border-purple-500/30 rounded-lg p-3 space-y-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex gap-2">
            <select 
              value={newMemory.category}
              onChange={e => setNewMemory({...newMemory, category: e.target.value})}
              className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xxs text-white"
            >
              <option value="style">Style</option>
              <option value="naming">Naming</option>
              <option value="technical">Technical</option>
              <option value="material">Material</option>
            </select>
          </div>
          <textarea 
            placeholder="e.g. Always use camelCase for variables. Prefer rounded corners (2mm) for structural parts."
            value={newMemory.content}
            onChange={e => setNewMemory({...newMemory, content: e.target.value})}
            className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-white placeholder:text-white/20 min-h-[60px]"
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setIsAdding(false)}
              className="text-xxs text-white/40 hover:text-white/60"
            >
              Cancel
            </button>
            <button 
              onClick={handleAdd}
              className="bg-purple-500 hover:bg-purple-600 text-white text-xxs px-3 py-1 rounded font-bold"
            >
              SAVE_PREFERENCE
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
        {loading ? (
          <div className="text-center py-8 text-xxs text-white/20 animate-pulse">Syncing design neural pathways...</div>
        ) : memories.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/5 rounded-lg">
            <p className="text-xxs text-white/30 uppercase tracking-widest font-bold">No persistent memories yet</p>
            <p className="text-[10px] text-white/20 mt-1">Start adding preferences to personalize your AI</p>
          </div>
        ) : (
          memories.map((m) => (
            <div key={m.id} className="group relative bg-white/5 border border-white/10 rounded-lg p-2.5 hover:border-purple-500/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-500/10 px-1.5 rounded flex items-center gap-1">
                      <Tag className="w-2 h-2" />
                      {m.category}
                    </span>
                    <span className="text-[9px] text-white/30 font-mono">#{m.id}</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">{m.content}</p>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleImportance(m.id, m.importance)}
                    className={cn(
                      "p-1.5 rounded hover:bg-white/10",
                      m.importance > 0.7 ? "text-yellow-500" : "text-white/20"
                    )}
                    title="Importance"
                  >
                    <Star className="w-3 h-3 fill-current" />
                  </button>
                  <button 
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-white/5">
        <p className="text-[9px] text-white/20 leading-tight">
          Memory snippets are injected into every AI generation prompt to ensure consistency with your unique design style and technical requirements.
        </p>
      </div>
    </div>
  );
}
