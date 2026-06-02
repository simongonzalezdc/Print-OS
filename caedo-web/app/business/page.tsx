'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSceneStore } from '@/lib/scene/store';
import { CyberCard } from '@/components/ui/CyberCard';
import { CyberButton } from '@/components/ui/CyberButton';
import { CyberInput } from '@/components/ui/CyberInput';
import { MetricDisplay } from '@/components/ui/MetricDisplay';
import { TerminalBlock } from '@/components/ui/TerminalBlock';
import { Brain, Tag, Send, AlertTriangle, Box, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EvalData {
  category: string;
  reasoning: string;
  difficulty: number;
  price_range_low: number;
  price_range_high: number;
  suggested_materials: string[];
  risks: string[];
  grams_estimate_low: number;
  grams_estimate_high: number;
  minutes_estimate_low: number;
  minutes_estimate_high: number;
}

interface Listing {
  title: string;
  description: string;
  tags: string[];
  pricing_strategy: string;
}

interface CostResult {
  profit: number;
  margin: number;
}

export default function BusinessPage() {
  const handoff = useSceneStore((state) => state.handoff.pendingBusinessAnalysis);
  const setPendingBusinessAnalysis = useSceneStore((state) => state.setPendingBusinessAnalysis);
  const setPendingDesignPrompt = useSceneStore((state) => state.setPendingDesignPrompt);
  const router = useRouter();
  
  const [idea, setIdea] = useState('');
  const [platform, setPlatform] = useState('Etsy');
  const [evalData, setEvalData] = useState<EvalData | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGeneratingListing, setIsGeneratingListing] = useState(false);

  // Costing State
  const [grams, setGrams] = useState(100);
  const [minutes, setMinutes] = useState(120);
  const [sellPrice, setSellPrice] = useState(25);
  const [costResult, setCostResult] = useState<CostResult | null>(null);

  // Handle Handoff from Studio
  useEffect(() => {
    if (handoff) {
      const summary = handoff.objects.map(o => o.aiSummary || o.name).join(', ');
      setIdea(summary);
      setGrams(Math.round(handoff.totalGrams));
      
      // Auto-trigger evaluation if we have a clear idea from handoff
      if (summary) {
        handleEvaluate(summary);
      }
    }
  }, [handoff]);

  const handleEvaluate = async (manualIdea?: string) => {
    const concept = manualIdea || idea;
    if (!concept) return;
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/v1/printfarm/business/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: concept, platform })
      });
      const data = await res.json();
      setEvalData(data);
      
      // Auto-calculate initial costs
      handleCalculateCosts(
        handoff ? Math.round(handoff.totalGrams) : (data.grams_estimate_low + data.grams_estimate_high) / 2,
        (data.minutes_estimate_low + data.minutes_estimate_high) / 2,
        data.suggested_materials[0] || 'PLA',
        data.price_range_low
      );
    } catch (error) {
      console.error('Evaluation failed:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCalculateCosts = async (g = grams, m = minutes, mat = 'PLA', price = sellPrice) => {
    try {
      const res = await fetch('/api/v1/printfarm/business/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grams: g, minutes: m, material: mat, sell_price: price })
      });
      const data = await res.json();
      setCostResult(data);
    } catch (error) {
      console.error('Cost calculation failed:', error);
    }
  };

  const handleGenerateListing = async () => {
    if (!idea || !evalData) return;
    setIsGeneratingListing(true);
    try {
      const res = await fetch('/api/v1/printfarm/business/listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, platform })
      });
      const data = await res.json();
      setListing(data);
    } catch (error) {
      console.error('Listing generation failed:', error);
    } finally {
      setIsGeneratingListing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#050505] text-foreground">
      {/* Header */}
      <div className="flex justify-between items-end border-l-4 border-primary pl-4 mb-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-primary">
            MARKET_INTELLIGENCE
          </h1>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
            AI-Driven Commercial Strategy // Caedo API
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          {handoff && (
            <CyberCard variant="outline" className="border-primary bg-primary/5 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <Box className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xxs font-black text-primary uppercase">Active Handoff</p>
                    <p className="text-xs font-bold uppercase truncate max-w-[150px]">
                      {handoff.objects.length} Object(s) from Studio
                    </p>
                  </div>
                </div>
                <button onClick={() => setPendingBusinessAnalysis(null)} className="text-muted-foreground hover:text-primary transition-colors">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </CyberCard>
          )}

          <CyberCard title="PROPOSAL_EVALUATION">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xxs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  PRODUCT_CONCEPT
                </label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="e.g. Industrial cable management rail for server racks"
                  className="w-full bg-background/50 border border-border rounded-[2px] px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 min-h-[100px]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xxs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  TARGET_PLATFORM
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-[2px] px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
                >
                  <option>Etsy</option>
                  <option>Amazon</option>
                  <option>Local Market</option>
                  <option>Personal Webstore</option>
                </select>
              </div>

              <CyberButton 
                onClick={() => handleEvaluate()} 
                className="w-full" 
                loading={isEvaluating}
              >
                <Brain className="w-4 h-4" />
                EXECUTE_AI_ANALYSIS
              </CyberButton>
            </div>
          </CyberCard>

          {evalData && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <CyberCard title="PROFIT_TELEMETRY">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xxs font-bold uppercase">
                        <span>Weight: {grams}g</span>
                      </div>
                      <input 
                        type="range" min="1" max="1000" value={grams} 
                        onChange={(e) => { setGrams(Number(e.target.value)); handleCalculateCosts(Number(e.target.value)); }}
                        className="accent-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xxs font-bold uppercase">
                        <span>Time: {minutes}min</span>
                      </div>
                      <input 
                        type="range" min="1" max="10080" value={minutes} 
                        onChange={(e) => { setMinutes(Number(e.target.value)); handleCalculateCosts(undefined, Number(e.target.value)); }}
                        className="accent-primary"
                      />
                    </div>
                    <CyberInput 
                      label="Selling Price ($)" 
                      type="number" 
                      value={sellPrice} 
                      onChange={(e) => { setSellPrice(Number(e.target.value)); handleCalculateCosts(undefined, undefined, undefined, Number(e.target.value)); }}
                    />
                  </div>

                  {costResult && (
                    <div className="pt-4 border-t border-border/30">
                      <MetricDisplay 
                        label="NET_PROFIT" 
                        value={`$${costResult.profit.toFixed(2)}`} 
                        delta={`${costResult.margin.toFixed(1)}% MARGIN`}
                        deltaType={costResult.margin > 20 ? 'positive' : 'neutral'}
                      />
                    </div>
                  )}
                </div>
              </CyberCard>
            </motion.div>
          )}
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {!evalData ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="h-full flex flex-col items-center justify-center py-20 text-center"
              >
                <Brain className="w-12 h-12 text-primary/20 mb-4 animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Awaiting Concept Input
                </h3>
                <p className="text-xxs opacity-40 mt-1 uppercase">
                  AI will analyze market viability and technical complexity
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <TerminalBlock 
                  title={`STRATEGIC_INSIGHTS // ${evalData.category.toUpperCase()}`}
                  content={evalData.reasoning}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CyberCard>
                    <MetricDisplay label="DIFFICULTY_INDEX" value={`${evalData.difficulty}/5`} />
                  </CyberCard>
                  <CyberCard>
                    <MetricDisplay label="MARKET_PRICE" value={`$${evalData.price_range_low}-${evalData.price_range_high}`} />
                  </CyberCard>
                  <CyberCard>
                    <MetricDisplay label="PRIMARY_MAT" value={evalData.suggested_materials[0] || 'PLA'} />
                  </CyberCard>
                </div>

                <CyberCard title="RISK_FACTORS" variant="outline">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {evalData.risks.map((risk: string, i: number) => (
                      <div key={i} className="flex gap-2 items-start text-xxs font-bold uppercase text-muted-foreground">
                        <AlertTriangle className="w-3 h-3 text-primary shrink-0" />
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </CyberCard>

                <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!listing ? (
                    <CyberButton 
                      onClick={handleGenerateListing} 
                      className="w-full h-16" 
                      variant="outline"
                      loading={isGeneratingListing}
                    >
                      <Tag className="w-4 h-4" />
                      GENERATE_MARKETPLACE_LISTING
                    </CyberButton>
                  ) : (
                    <div className="md:col-span-2">
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <CyberCard title={`LISTING_PREVIEW // ${platform.toUpperCase()}`}>
                          <div className="space-y-4">
                            <CyberInput label="SEO_TITLE" value={listing.title} readOnly />
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xxs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                PRODUCT_DESCRIPTION
                              </label>
                              <div className="bg-black/40 border border-border p-3 rounded text-xs font-mono whitespace-pre-wrap leading-relaxed">
                                {listing.description}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {listing.tags.map((tag: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase border border-primary/20">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                            <div className="p-3 bg-secondary/20 border border-primary/20 rounded">
                              <p className="text-xxs font-bold uppercase text-primary">PRICING_STRATEGY:</p>
                              <p className="text-xs mt-1 text-muted-foreground">{listing.pricing_strategy}</p>
                            </div>
                          </div>
                        </CyberCard>
                      </motion.div>
                    </div>
                  )}

                  <CyberButton 
                    variant="primary" 
                    className="w-full h-16"
                    onClick={() => {
                      setPendingDesignPrompt(`Design a ${idea} optimized for ${platform} platform. Requirements: ${evalData.reasoning}`);
                      router.push('/');
                    }}
                  >
                    <Send className="w-4 h-4" />
                    GENERATE_3D_DESIGN
                  </CyberButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
