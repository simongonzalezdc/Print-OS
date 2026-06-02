'use client';

import { useEffect, useState } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { DataTable } from '@/components/ui/DataTable';
import { MetricDisplay } from '@/components/ui/MetricDisplay';
import { Play, XCircle, CheckCircle, Filter, RotateCcw, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  id: number;
  name: string;
  status: string;
  material: string;
  weight_g: number;
  estimated_minutes: number;
  priority: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const res = await fetch('/api/v1/printfarm/jobs');
      const data: Job[] = await res.json();
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  const updateJobStatus = async (jobId: number, status: string) => {
    try {
      await fetch(`/api/v1/printfarm/jobs/${jobId}/status?status=${status}`, {
        method: 'PATCH'
      });
      fetchJobs();
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  };

  const autoAssignJobs = async () => {
    try {
      const res = await fetch('/api/v1/printfarm/jobs/auto-assign', { method: 'POST' });
      const assignments = await res.json();
      if (assignments.length > 0) {
        toast.success(`Successfully auto-assigned ${assignments.length} jobs`);
        fetchJobs();
      } else {
        toast.info('No queued jobs available for auto-assignment');
      }
    } catch (error) {
      console.error('Failed to auto-assign jobs:', error);
      toast.error('Auto-assignment failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="text-primary font-black animate-pulse uppercase tracking-widest">Initialising_Queue...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#050505] text-foreground">
      {/* Header */}
      <div className="flex justify-between items-end border-l-4 border-primary pl-4 mb-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-primary">
            EXECUTION_QUEUE
          </h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
            Production Pipeline // Caedo API
          </p>
        </div>
        <div className="flex gap-2">
          <CyberButton size="sm" variant="primary" className="gap-2" onClick={autoAssignJobs}>
            <Zap className="w-3 h-3" />
            AUTO_ASSIGN_ALL
          </CyberButton>
          <CyberButton size="sm" variant="outline" className="gap-2">
            <Filter className="w-3 h-3" />
            FILTER_RESULTS
          </CyberButton>
          <CyberButton size="sm" variant="outline" className="gap-2" onClick={fetchJobs}>
            <RotateCcw className="w-3 h-3" />
            SYNC_QUEUE
          </CyberButton>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CyberCard>
          <MetricDisplay label="ACTIVE_PRINTING" value={jobs.filter(j => j.status === 'printing').length} />
        </CyberCard>
        <CyberCard>
          <MetricDisplay label="QUEUED_TOTAL" value={jobs.filter(j => j.status === 'queued').length} />
        </CyberCard>
        <CyberCard>
          <MetricDisplay label="AVG_COMPLETION_TIME" value="4.2" unit="HRS" />
        </CyberCard>
        <CyberCard>
          <MetricDisplay label="SUCCESS_RATE" value="97.8" unit="%" deltaType="positive" delta="+1.2%" />
        </CyberCard>
      </div>

      {/* Jobs Table */}
      <CyberCard title="CENTRAL_QUEUE">
        <DataTable
          columns={[
            { header: 'ID', accessor: (j: Job) => `#${j.id.toString().padStart(4, '0')}` },
            { header: 'Product Name', accessor: 'name' as keyof Job, className: 'font-bold' },
            { header: 'Specs', accessor: (j: Job) => (
              <div className="flex flex-col text-[10px] opacity-70">
                <span>{j.material} // {j.weight_g}G</span>
                <span>EST: {j.estimated_minutes}MIN</span>
              </div>
            )},
            { header: 'Priority', accessor: (j: Job) => (
              <span className={`text-[10px] font-black uppercase ${
                j.priority === 'urgent' ? 'text-destructive' : 'text-primary'
              }`}>
                {j.priority}
              </span>
            )},
            { header: 'Status', accessor: (j: Job) => (
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  j.status === 'printing' ? 'bg-primary animate-pulse' : 
                  j.status === 'completed' ? 'bg-green-500' : 
                  j.status === 'failed' ? 'bg-destructive' : 'bg-muted'
                }`} />
                <span className="text-[10px] font-bold uppercase">{j.status}</span>
              </div>
            )},
            { header: 'Actions', accessor: (j: Job) => (
              <div className="flex items-center gap-2">
                {j.status === 'queued' && (
                  <CyberButton size="icon" variant="ghost" title="Start" onClick={() => updateJobStatus(j.id, 'printing')}>
                    <Play className="w-3 h-3 text-primary" />
                  </CyberButton>
                )}
                {j.status === 'printing' && (
                  <CyberButton size="icon" variant="ghost" title="Complete" onClick={() => updateJobStatus(j.id, 'completed')}>
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  </CyberButton>
                )}
                {(j.status === 'queued' || j.status === 'printing') && (
                  <CyberButton size="icon" variant="ghost" title="Cancel" onClick={() => updateJobStatus(j.id, 'canceled')}>
                    <XCircle className="w-3 h-3 text-destructive" />
                  </CyberButton>
                )}
              </div>
            )},
          ]}
          data={jobs}
          emptyMessage="QUEUE_EMPTY_AWAITING_TASKS"
        />
      </CyberCard>
    </div>
  );
}

