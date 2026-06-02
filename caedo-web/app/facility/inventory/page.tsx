'use client';

import { useState, useEffect } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { DataTable } from '@/components/ui/DataTable';
import { Package, Plus, Trash2, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InventoryItem {
  id: number;
  material: string;
  color: string;
  weight_g: number;
  cost_per_kg: number | null;
  status: 'in_stock' | 'low' | 'out_of_stock';
  min_threshold_g: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    material: 'PLA',
    color: '',
    weight_g: 1000,
    cost_per_kg: 20,
    min_threshold_g: 200
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      const res = await fetch('/api/v1/printfarm/inventory');
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async () => {
    if (!newItem.color) {
      toast.error('Color is required');
      return;
    }
    try {
      const res = await fetch('/api/v1/printfarm/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        toast.success('Stock added');
        setIsAdding(false);
        setNewItem({ ...newItem, color: '' });
        fetchInventory();
      }
    } catch (error) {
      toast.error('Failed to add inventory');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this item from inventory?')) return;
    try {
      const res = await fetch(`/api/v1/printfarm/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Item removed');
        fetchInventory();
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#050505] text-foreground">
      <div className="flex justify-between items-end border-l-4 border-primary pl-4 mb-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-primary">
            MATERIAL_VAULT
          </h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
            Filament Inventory // Caedo OS
          </p>
        </div>
        <CyberButton 
          size="sm" 
          variant="outline" 
          className="gap-2"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus className="w-4 h-4" />
          ADD_NEW_SPOOL
        </CyberButton>
      </div>

      {isAdding && (
        <CyberCard className="p-6 border-primary/30">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-primary/60">Material</label>
              <select 
                value={newItem.material}
                onChange={e => setNewItem({...newItem, material: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white"
              >
                <option value="PLA">PLA</option>
                <option value="PETG">PETG</option>
                <option value="TPU">TPU</option>
                <option value="ABS">ABS</option>
                <option value="ASA">ASA</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-primary/60">Color Name</label>
              <input 
                type="text" 
                placeholder="e.g. Galaxy Black"
                value={newItem.color}
                onChange={e => setNewItem({...newItem, color: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-primary/60">Initial Weight (g)</label>
              <input 
                type="number" 
                value={newItem.weight_g}
                onChange={e => setNewItem({...newItem, weight_g: parseFloat(e.target.value)})}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-primary/60">Min Threshold (g)</label>
              <input 
                type="number" 
                value={newItem.min_threshold_g}
                onChange={e => setNewItem({...newItem, min_threshold_g: parseFloat(e.target.value)})}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="flex gap-2">
              <CyberButton onClick={handleAdd} className="flex-1">CONFIRM</CyberButton>
              <CyberButton variant="ghost" onClick={() => setIsAdding(false)}>CANCEL</CyberButton>
            </div>
          </div>
        </CyberCard>
      )}

      <CyberCard title="CURRENT_RESERVES">
        <DataTable
          columns={[
            { header: 'ID', accessor: (i: InventoryItem) => `#${i.id.toString().padStart(3, '0')}` },
            { header: 'Material', accessor: (i: InventoryItem) => (
              <span className="font-black text-primary">{i.material}</span>
            )},
            { header: 'Identification', accessor: (i: InventoryItem) => (
              <div className="flex flex-col">
                <span className="font-bold">{i.color}</span>
                <span className="text-[9px] opacity-50 uppercase">SKU: {i.material.slice(0,3)}-{i.color.slice(0,3).toUpperCase()}</span>
              </div>
            )},
            { header: 'Stock Level', accessor: (i: InventoryItem) => {
              const percentage = (i.weight_g / 1000) * 100;
              return (
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000",
                        i.status === 'in_stock' ? "bg-primary shadow-glow" :
                        i.status === 'low' ? "bg-yellow-500 shadow-glow-yellow" :
                        "bg-destructive shadow-glow-destructive"
                      )}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold w-12">{i.weight_g.toFixed(0)}g</span>
                </div>
              );
            }},
            { header: 'Status', accessor: (i: InventoryItem) => (
              <div className="flex items-center gap-2">
                {i.status === 'in_stock' ? <CheckCircle2 className="w-3 h-3 text-primary" /> :
                 i.status === 'low' ? <AlertTriangle className="w-3 h-3 text-yellow-500 animate-pulse" /> :
                 <AlertCircle className="w-3 h-3 text-destructive animate-pulse" />}
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  i.status === 'in_stock' ? "text-primary" :
                  i.status === 'low' ? "text-yellow-500" :
                  "text-destructive"
                )}>
                  {i.status.replace('_', ' ')}
                </span>
              </div>
            )},
            { header: 'Actions', accessor: (i: InventoryItem) => (
              <CyberButton 
                size="icon" 
                variant="ghost" 
                className="text-white/20 hover:text-destructive"
                onClick={() => handleDelete(i.id)}
              >
                <Trash2 className="w-3 h-3" />
              </CyberButton>
            )}
          ]}
          data={items}
          emptyMessage="VAULT_EMPTY // NO_MATERIALS_REGISTERED"
        />
      </CyberCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CyberCard title="REORDER_ADVISORY">
          <div className="space-y-4">
            {items.filter(i => i.status !== 'in_stock').length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center opacity-30 italic">
                <CheckCircle2 className="w-8 h-8 mb-2" />
                <p className="text-xs uppercase font-bold">All reserves within operational bounds</p>
              </div>
            ) : (
              items.filter(i => i.status !== 'in_stock').map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 border border-white/5 bg-white/5 rounded-lg">
                  <div className="flex gap-3 items-center">
                    <AlertTriangle className={cn("w-4 h-4", item.status === 'low' ? 'text-yellow-500' : 'text-destructive')} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-white">{item.material} // {item.color}</span>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold">Action Required: Procure replacement spool</span>
                    </div>
                  </div>
                  <CyberButton size="sm" variant="outline" className="h-7 text-[9px] px-3">PURCHASE</CyberButton>
                </div>
              ))
            )}
          </div>
        </CyberCard>

        <CyberCard title="CONSUMPTION_ANALYTICS">
          <div className="h-48 flex items-center justify-center border border-primary/10 bg-black/40 rounded">
            <div className="text-center">
              <Package className="w-8 h-8 text-primary/20 mx-auto mb-2" />
              <span className="text-xxs font-bold uppercase text-muted-foreground opacity-50 tracking-tighter">
                Material Flow Analysis Module Offline
              </span>
            </div>
          </div>
        </CyberCard>
      </div>
    </div>
  );
}
