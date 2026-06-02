'use client';

import { useState, useCallback, useRef } from 'react';
import { Footprints, Upload, Activity, Ruler, Scissors, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { useSceneStore } from '@/lib/scene/store';
import { extractFeaturesFromScan, mapToStandardSize, FootFeatures, ShoeSize } from '@/lib/import/foot-scanner';
import { SizeGrader } from '@/lib/analysis/size-grader';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CyberCard } from '../ui/CyberCard';
import { CyberButton } from '../ui/CyberButton';

interface FootScannerPanelProps {
  onClose: () => void;
}

export function FootScannerPanel({ onClose }: FootScannerPanelProps) {
  const [scanning, setScanning] = useState(false);
  const [features, setFeatures] = useState<FootFeatures | null>(null);
  const [shoeSize, setShoeSize] = useState<ShoeSize | null>(null);
  const [step, setStep] = useState<'upload' | 'analysis' | 'result'>('upload');
  
  const addObject = useSceneStore((state) => state.addObject);

  const handleFileUpload = async (file: File) => {
    setScanning(true);
    setStep('analysis');
    
    try {
      const buffer = await file.arrayBuffer();
      const extracted = extractFeaturesFromScan(buffer);
      const size = mapToStandardSize(extracted.lengthMm, extracted.widthMm);
      
      // Artificial delay for industrial feel
      await new Promise(r => setTimeout(r, 1500));
      
      setFeatures(extracted);
      setShoeSize(size);
      setStep('result');
      toast.success('Biometric analysis complete');
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Failed to analyze scan data');
      setStep('upload');
    } finally {
      setScanning(false);
    }
  };

  const generateLast = () => {
    if (!features || !shoeSize) return;
    
    // Generate JSCAD code for a custom shoe last based on measurements
    const jscadCode = `
// Custom Shoe Last based on Biometric Scan
// Size: EU ${shoeSize.euSize} (${shoeSize.widthCategory})
// Length: ${features.lengthMm.toFixed(1)}mm, Width: ${features.widthMm.toFixed(1)}mm

const main = () => {
  const L = ${features.lengthMm};
  const W = ${features.widthMm};
  const H = ${features.archHeightMm * 2.5}; // Approx heel to ankle height
  
  // Simplified biometric block for base
  const base = roundedCuboid({
    size: [L, W, 10],
    roundRadius: 5,
    center: [0, 0, 5]
  });
  
  const arch = translate(
    [L * 0.05, 0, 5],
    ellipsoid({
      radius: [L * 0.2, W * 0.45, ${features.archHeightMm + 5}],
      center: [0, 0, 0]
    })
  );
  
  return union(base, arch);
};
`;

    addObject(jscadCode, `Custom Last - EU ${shoeSize.euSize}`);
    toast.success('Custom last generated in scene');
    onClose();
  };

  return (
    <div className="w-[450px] h-[600px] flex flex-col bg-black/90 border-l border-primary/20 backdrop-blur-xl shadow-2xl">
      <div className="p-6 border-b border-primary/10 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-primary/20">
            <Footprints className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-primary">Biometric_Scanner</h2>
            <p className="text-[10px] text-muted-foreground font-bold">V2.4 // FOOTWEAR_INTEGRATION</p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
          <Scissors className="w-4 h-4 rotate-90" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {step === 'upload' && (
          <div className="h-full flex flex-col items-center justify-center space-y-6">
            <div className="w-full p-12 border-2 border-dashed border-primary/20 rounded-lg flex flex-col items-center justify-center bg-primary/5 hover:bg-primary/10 transition-all group cursor-pointer relative">
              <input 
                type="file" 
                accept=".stl" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <Upload className="w-12 h-12 text-primary/40 group-hover:text-primary transition-colors mb-4" />
              <p className="text-xs font-bold text-center text-primary/60 uppercase tracking-tighter">
                Drop 3D Scan (Binary STL)<br/>to begin analysis
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="p-3 bg-white/5 border border-white/10 rounded flex flex-col gap-1">
                <span className="text-[9px] font-black text-muted-foreground uppercase">Supported Devices</span>
                <span className="text-[10px] text-white/70">3DMakerpro, EinScan, Creality</span>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded flex flex-col gap-1">
                <span className="text-[9px] font-black text-muted-foreground uppercase">Target Accuracy</span>
                <span className="text-[10px] text-white/70">±0.2mm Tolerance</span>
              </div>
            </div>
          </div>
        )}

        {step === 'analysis' && (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-xs font-black text-primary uppercase tracking-widest animate-pulse">Extracting_Biometrics</p>
              <p className="text-[9px] text-muted-foreground font-mono">Analyzing point cloud geometry...</p>
            </div>
          </div>
        )}

        {step === 'result' && features && shoeSize && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-4">
              <CyberCard className="p-4 border-primary/20">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-primary/60 uppercase mb-1">Standard Size</span>
                  <span className="text-2xl font-black text-primary">EU {shoeSize.euSize}</span>
                  <span className="text-[10px] font-bold text-muted-foreground mt-1">{shoeSize.widthCategory} FIT</span>
                </div>
              </CyberCard>
              <CyberCard className="p-4 border-primary/20">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-primary/60 uppercase mb-1">Arch Profile</span>
                  <span className="text-2xl font-black text-white">{features.archHeightMm > 20 ? 'HIGH' : features.archHeightMm > 10 ? 'MED' : 'LOW'}</span>
                  <span className="text-[10px] font-bold text-muted-foreground mt-1">{features.archHeightMm.toFixed(1)}mm ELEVATION</span>
                </div>
              </CyberCard>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Ruler className="w-3.5 h-3.5 text-primary" />
                Raw Measurements
              </h3>
              <div className="bg-white/5 rounded divide-y divide-white/5 border border-white/5">
                {[
                  { label: 'Foot Length', value: `${features.lengthMm.toFixed(1)}mm` },
                  { label: 'Foot Width', value: `${features.widthMm.toFixed(1)}mm` },
                  { label: 'Instep Girth', value: `${features.instepGirthMm.toFixed(1)}mm` },
                  { label: 'Heel Width', value: `${features.heelWidthMm.toFixed(1)}mm` },
                ].map((item, i) => (
                  <div key={i} className="p-3 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/50 uppercase">{item.label}</span>
                    <span className="text-xs font-mono text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Size Grading Preview */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" />
                Size Grading Preview
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {[shoeSize.euSize - 1, shoeSize.euSize, shoeSize.euSize + 1].map((s) => (
                  <div key={s} className={cn(
                    "flex-shrink-0 w-24 p-3 rounded border flex flex-col items-center gap-1",
                    s === shoeSize.euSize ? "bg-primary/10 border-primary/40" : "bg-white/5 border-white/10 opacity-50"
                  )}>
                    <span className="text-[10px] font-black text-primary uppercase">EU {s}</span>
                    <span className="text-xs font-mono text-white">{(SizeGrader.getScaleFactor(shoeSize.euSize, s) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <CyberButton className="w-full py-6 group" onClick={generateLast}>
              <div className="flex flex-col items-center">
                <span className="text-xs font-black tracking-widest">GENERATE_CUSTOM_LAST</span>
                <span className="text-[9px] opacity-60 font-bold group-hover:opacity-100 transition-opacity">PARAMETRIC_MATCH_PROTOCOL_01</span>
              </div>
            </CyberButton>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-primary/10 bg-black/40">
        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn(
                "w-8 h-1 rounded-full transition-all duration-500",
                step === 'upload' && i === 1 ? "bg-primary" :
                step === 'analysis' && i <= 2 ? "bg-primary" :
                step === 'result' ? "bg-primary" : "bg-white/10"
              )} />
            ))}
          </div>
          <p className="text-[9px] font-mono text-muted-foreground/50">SYSTEM_READY // SECURE_LINK_ACTIVE</p>
        </div>
      </div>
    </div>
  );
}
