'use client';

import { useEffect, useState } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { DataTable } from '@/components/ui/DataTable';
import { MetricDisplay } from '@/components/ui/MetricDisplay';
import { Plus, Settings, Power, HardDrive, RefreshCw } from 'lucide-react';
import { PrinterModal } from '@/components/panels/PrinterModal';

interface Printer {
  id: number;
  name: string;
  is_active: boolean;
  build_x_mm: number;
  build_y_mm: number;
  build_z_mm: number;
  reliability_score: number;
  api_type: 'none' | 'octoprint' | 'moonraker';
  api_url?: string;
  api_key?: string;
  ip_address?: string;
  current_status: string;
}

type PrinterFormData = Omit<Printer, 'id' | 'current_status'> & {
  id?: number;
  current_status?: string;
  notes?: string;
};

interface PrinterStatus {
  success: boolean;
  status: string;
  temps?: {
    tool0: number;
    bed: number;
  };
}

export default function FacilityPage() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [liveStatus, setLiveStatus] = useState<Record<number, PrinterStatus>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | undefined>();

  useEffect(() => {
    fetchPrinters();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      printers.forEach(printer => {
        if (printer.is_active && printer.api_type !== 'none') {
          fetchLiveStatus(printer.id);
        }
      });
    }, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [printers]);

  async function fetchPrinters() {
    try {
      const res = await fetch('/api/v1/printfarm/printers');
      const data: Printer[] = await res.json();
      setPrinters(data);
      // Fetch initial status for all
      data.forEach(p => {
        if (p.is_active && p.api_type !== 'none') {
          fetchLiveStatus(p.id);
        }
      });
    } catch (error) {
      console.error('Failed to fetch printers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLiveStatus(id: number) {
    try {
      const res = await fetch(`/api/v1/printfarm/printers/${id}/status`);
      const data: PrinterStatus = await res.json();
      setLiveStatus(prev => ({ ...prev, [id]: data }));
    } catch (error) {
      console.error(`Failed to fetch status for printer ${id}:`, error);
    }
  }

  const handleSavePrinter = async (printerData: PrinterFormData) => {
    try {
      const method = printerData.id ? 'PUT' : 'POST';
      const url = printerData.id ? `/api/v1/printfarm/printers/${printerData.id}` : '/api/v1/printfarm/printers';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printerData)
      });
      
      if (!res.ok) throw new Error('Failed to save printer');
      
      fetchPrinters();
    } catch (error) {
      console.error('Error saving printer:', error);
      throw error;
    }
  };

  const togglePrinterStatus = async (printer: Printer) => {
    try {
      await fetch(`/api/v1/printfarm/printers/${printer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...printer, is_active: !printer.is_active })
      });
      fetchPrinters();
    } catch (error) {
      console.error('Failed to toggle printer status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="text-primary font-black animate-pulse uppercase tracking-widest">Initialising_Facility...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#050505] text-foreground">
      {/* Header */}
      <div className="flex justify-between items-end border-l-4 border-primary pl-4 mb-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-primary">
            FLEET_MANAGEMENT
          </h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
            Hardware Resources // Caedo API
          </p>
        </div>
        <CyberButton 
          size="sm" 
          variant="outline" 
          className="gap-2"
          onClick={() => {
            setSelectedPrinter(undefined);
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          PROVISION_NEW_UNIT
        </CyberButton>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CyberCard>
          <MetricDisplay label="TOTAL_CAPACITY" value={printers.length} unit="UNITS" />
        </CyberCard>
        <CyberCard>
          <MetricDisplay 
            label="ONLINE_STATUS" 
            value={printers.filter(p => p.is_active).length} 
            unit="ACTIVE" 
            delta={`${((printers.filter(p => p.is_active).length / (printers.length || 1)) * 100).toFixed(0)}% UTILIZATION`}
          />
        </CyberCard>
        <CyberCard>
          <MetricDisplay label="AVG_RELIABILITY" value="94.2" unit="%" delta="+0.5% THIS_WEEK" deltaType="positive" />
        </CyberCard>
      </div>

      {/* Printer List */}
      <CyberCard title="REGISTERED_UNITS">
        <DataTable
          columns={[
            { header: 'Unit ID', accessor: (p: Printer) => `#${p.id.toString().padStart(3, '0')}` },
            { header: 'Identification', accessor: (p: Printer) => {
              const status = liveStatus[p.id];
              return (
                <div className="flex flex-col">
                  <span className="font-bold">{p.name}</span>
                  <span className="text-[10px] opacity-50 uppercase">{p.api_type !== 'none' ? `${p.api_type} @ ${p.api_url}` : 'MANUAL_CONTROL'}</span>
                  {status?.temps && (
                    <span className="text-[10px] text-primary mt-1 font-mono">
                      T:{status.temps.tool0}°C / B:{status.temps.bed}°C
                    </span>
                  )}
                </div>
              );
            }},
            { header: 'Build Volume', accessor: (p: Printer) => `${p.build_x_mm}x${p.build_y_mm}x${p.build_z_mm}mm` },
            { header: 'Reliability', accessor: (p: Printer) => (
              <div className="flex items-center gap-2">
                <div className="w-16 h-1 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${p.reliability_score * 100}%` }} 
                  />
                </div>
                <span className="text-[10px] font-bold">{(p.reliability_score * 100).toFixed(0)}%</span>
              </div>
            )},
            { header: 'Status', accessor: (p: Printer) => {
              const status = liveStatus[p.id];
              const displayStatus = status?.success ? status.status : (p.is_active ? 'ONLINE' : 'OFFLINE');
              const isError = status && !status.success;
              
              return (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isError ? 'bg-destructive shadow-glow-destructive' : 
                    p.is_active ? 'bg-primary shadow-glow animate-pulse' : 'bg-muted'
                  }`} />
                  <span className={`text-[10px] font-bold uppercase ${
                    isError ? 'text-destructive' :
                    p.is_active ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {displayStatus}
                  </span>
                </div>
              );
            }},
            { header: 'Actions', accessor: (p: Printer) => (
              <div className="flex items-center gap-2">
                <CyberButton 
                  size="icon" 
                  variant="ghost" 
                  title="Refresh Status"
                  onClick={() => fetchLiveStatus(p.id)}
                  disabled={p.api_type === 'none'}
                >
                  <RefreshCw className={`w-3 h-3 ${p.api_type === 'none' ? 'opacity-20' : ''}`} />
                </CyberButton>
                <CyberButton 
                  size="icon" 
                  variant="ghost" 
                  title="Settings"
                  onClick={() => {
                    setSelectedPrinter(p);
                    setModalOpen(true);
                  }}
                >
                  <Settings className="w-3 h-3" />
                </CyberButton>
                <CyberButton 
                  size="icon" 
                  variant="ghost" 
                  title={p.is_active ? 'Power Off' : 'Power On'}
                  onClick={() => togglePrinterStatus(p)}
                >
                  <Power className={`w-3 h-3 ${p.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                </CyberButton>
              </div>
            )},
          ]}
          data={printers}
          emptyMessage="NO_PRINTERS_PROVISIONED"
        />
      </CyberCard>

      {/* Detailed Telemetry Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CyberCard title="RESOURCE_DISTRIBUTION">
          <div className="h-48 flex items-center justify-center border border-primary/10 bg-black/40 rounded">
            <div className="text-center">
              <HardDrive className="w-8 h-8 text-primary/20 mx-auto mb-2" />
              <span className="text-xxs font-bold uppercase text-muted-foreground opacity-50 tracking-tighter">
                Hardware Health Visualization Module Offline
              </span>
            </div>
          </div>
        </CyberCard>
        
        <CyberCard title="MAINTENANCE_LOGS" subtitle="Recent System Events">
          <div className="space-y-3">
            {[
              { unit: 'UNIT_001', event: 'Extruder calibration successful', time: '2h ago', status: 'success' },
              { unit: 'UNIT_004', event: 'Nozzle temp fluctuation detected', time: '5h ago', status: 'warning' },
              { unit: 'SYSTEM', event: 'New firmware deployed to fleet', time: '1d ago', status: 'info' },
            ].map((log, i) => (
              <div key={i} className="flex justify-between items-center p-2 border-b border-border/20 last:border-0">
                <div className="flex gap-3">
                  <span className="text-[10px] font-black text-primary w-16">{log.unit}</span>
                  <span className="text-[10px] uppercase font-bold text-foreground/70">{log.event}</span>
                </div>
                <span className="text-[10px] font-mono opacity-40">{log.time}</span>
              </div>
            ))}
          </div>
        </CyberCard>
      </div>

      <PrinterModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSave={handleSavePrinter}
        printer={selectedPrinter}
      />
    </div>
  );
}
