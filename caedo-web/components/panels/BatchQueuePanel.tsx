'use client';

import { useState, useEffect } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { CyberInput } from '@/components/ui/CyberInput';
import { 
  Layers, Plus, Play, CheckCircle2, 
  CircleDashed, AlertCircle, X, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BatchJob {
  id: string;
  prompts: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: any[];
}

export const BatchQueuePanel = () => {
  const [prompts, setPrompts] = useState<string[]>(['']);
  const [activeJobs, setActiveJobs] = useState<BatchJob[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Poll for status of active jobs
  useEffect(() => {
    const interval = setInterval(async () => {
      const processingJobs = activeJobs.filter(j => j.status === 'processing');
      if (processingJobs.length === 0) return;

      for (const job of processingJobs) {
        try {
          const res = await fetch(`/api/v1/ai/batch?jobId=${job.id}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setActiveJobs(prev => prev.map(j => 
                j.id === job.id ? { ...j, status: 'completed', results: data } : j
              ));
              toast.success(`Batch job ${job.id} completed!`);
            }
          }
        } catch (error) {
          console.error('Error polling batch job:', error);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeJobs]);

  const addPrompt = () => setPrompts([...prompts, '']);
  const removePrompt = (index: number) => setPrompts(prompts.filter((_, i) => i !== index));
  const updatePrompt = (index: number, val: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = val;
    setPrompts(newPrompts);
  };

  const submitBatch = async () => {
    const validPrompts = prompts.filter(p => p.trim().length > 0);
    if (validPrompts.length === 0) {
      toast.error('Add at least one prompt');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/ai/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts: validPrompts }),
      });

      if (res.ok) {
        const { job_id } = await res.json();
        setActiveJobs([{
          id: job_id,
          prompts: validPrompts,
          status: 'processing'
        }, ...activeJobs]);
        setPrompts(['']);
        toast.success('Batch job queued');
      } else {
        toast.error('Failed to queue batch');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 overflow-hidden">
      <div className="flex items-center justify-between border-b border-primary/20 pb-2">
        <div className="flex items-center gap-2 text-primary">
          <Layers className="w-5 h-5" />
          <h2 className="font-black uppercase tracking-widest text-sm">BATCH_QUEUE</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {/* New Batch Section */}
        <CyberCard title="NEW_BATCH" variant="outline">
          <div className="space-y-3">
            {prompts.map((prompt, i) => (
              <div key={i} className="flex gap-2 group">
                <CyberInput 
                  value={prompt}
                  onChange={(e) => updatePrompt(i, e.target.value)}
                  placeholder={`Variation #${i + 1}...`}
                  className="flex-1"
                />
                <button 
                  onClick={() => removePrompt(i)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                  disabled={prompts.length === 1}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <div className="flex gap-2 pt-2">
              <CyberButton 
                variant="outline" 
                size="sm" 
                onClick={addPrompt}
                className="flex-1 text-[10px]"
              >
                <Plus className="w-3 h-3 mr-1" /> ADD_VARIATION
              </CyberButton>
              <CyberButton 
                variant="primary" 
                size="sm" 
                onClick={submitBatch}
                disabled={isSubmitting}
                className="flex-1 text-[10px]"
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                EXECUTE_BATCH
              </CyberButton>
            </div>
          </div>
        </CyberCard>

        {/* Active/History Section */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">
            QUEUE_TELEMETRY
          </h3>
          <AnimatePresence initial={false}>
            {activeJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative"
              >
                <CyberCard 
                  className={cn(
                    "border-l-2 transition-all",
                    job.status === 'processing' ? "border-l-primary animate-pulse-slow" : 
                    job.status === 'completed' ? "border-l-green-500" : "border-l-destructive"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono opacity-50 uppercase tracking-tighter">JOB_ID: {job.id}</span>
                      <span className="text-xs font-black uppercase">{job.prompts.length} VARIATIONS</span>
                    </div>
                    {job.status === 'processing' ? (
                      <CircleDashed className="w-4 h-4 text-primary animate-spin" />
                    ) : job.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>

                  {job.status === 'completed' && job.results && (
                    <div className="mt-2 pt-2 border-t border-border/20 space-y-1">
                      {job.results.map((res: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[10px] opacity-70 hover:opacity-100 transition-opacity">
                          <span className="truncate flex-1 font-bold">#{i+1}: {res.prompt}</span>
                          <span className="text-primary font-mono ml-2">LOAD_DATA</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CyberCard>
              </motion.div>
            ))}
            {activeJobs.length === 0 && (
              <div className="py-8 text-center opacity-30 uppercase text-[10px] tracking-[0.2em] border border-dashed border-border/20 rounded-lg">
                NO_ACTIVE_JOBS
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

