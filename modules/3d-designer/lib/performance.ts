import { useState, useEffect, useCallback, useRef } from 'react';
import { RENDER } from './constants';

export type PerformanceMode = typeof RENDER.PERFORMANCE_MODES[keyof typeof RENDER.PERFORMANCE_MODES];
export type QualityLevel = 'low' | 'medium' | 'high';

export interface PerformanceMetrics {
  fps: number;
  triangleCount: number;
  renderTime: number;
  memoryUsage?: number;
  qualityLevel: QualityLevel;
  performanceMode: PerformanceMode;
}

export interface AdaptiveQualityConfig {
  targetFPS: number;
  minFPS: number;
  qualityThresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

// Quality level hierarchy for comparisons
const QUALITY_ORDER: QualityLevel[] = ['low', 'medium', 'high'];

/**
 * Performance monitor for CAD applications
 * Tracks FPS, triangle count, and render time to enable adaptive quality
 */
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: RENDER.TARGET_FPS,
    triangleCount: 0,
    renderTime: 0,
    qualityLevel: 'medium',
    performanceMode: RENDER.PERFORMANCE_MODES.BALANCED,
  });

  const [adaptiveEnabled, setAdaptiveEnabled] = useState(true);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const fpsBufferRef = useRef<number[]>([]);
  const renderTimeBufferRef = useRef<number[]>([]);

  // Measure render time for a frame
  const measureRenderTime = useCallback((startTime: number) => {
    const renderTime = Date.now() - startTime;
    renderTimeBufferRef.current.push(renderTime);
    
    // Keep only last 30 measurements
    if (renderTimeBufferRef.current.length > 30) {
      renderTimeBufferRef.current.shift();
    }
  }, []);

  // Calculate average FPS
  const calculateAverageFPS = useCallback((): number => {
    const now = Date.now();
    frameCountRef.current++;
    
    if (now - lastTimeRef.current >= 1000) {
      const fps = (frameCountRef.current * 1000) / (now - lastTimeRef.current);
      fpsBufferRef.current.push(fps);
      
      // Keep only last 10 FPS measurements
      if (fpsBufferRef.current.length > 10) {
        fpsBufferRef.current.shift();
      }
      
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
    
    // Return average FPS from buffer
    const fpsArray = fpsBufferRef.current;
    return fpsArray.length > 0 
      ? fpsArray.reduce((a, b) => a + b, 0) / fpsArray.length 
      : RENDER.TARGET_FPS;
  }, []);

  // Quality level comparison helpers
  const maxQuality = (a: QualityLevel, b: QualityLevel): QualityLevel => {
    return QUALITY_ORDER.indexOf(a) > QUALITY_ORDER.indexOf(b) ? a : b;
  };

  const minQuality = (a: QualityLevel, b: QualityLevel): QualityLevel => {
    return QUALITY_ORDER.indexOf(a) < QUALITY_ORDER.indexOf(b) ? a : b;
  };

  // Auto-adjust quality based on performance
  const adjustQualityBasedOnPerformance = useCallback((currentFPS: number, triangleCount: number) => {
    if (!adaptiveEnabled) return;

    const config: AdaptiveQualityConfig = {
      targetFPS: RENDER.TARGET_FPS,
      minFPS: RENDER.MIN_FPS,
      qualityThresholds: {
        low: RENDER.COMPLEXITY_THRESHOLDS.LOW,
        medium: RENDER.COMPLEXITY_THRESHOLDS.MEDIUM,
        high: RENDER.COMPLEXITY_THRESHOLDS.HIGH,
      },
    };

    let newQuality: QualityLevel = 'medium';

    // Adjust based on FPS
    if (currentFPS < config.minFPS * 1.1) {
      newQuality = 'low';
    } else if (currentFPS > config.targetFPS * 0.95) {
      newQuality = triangleCount > config.qualityThresholds.medium ? 'medium' : 'high';
    } else {
      newQuality = triangleCount > config.qualityThresholds.high ? 'low' : 'medium';
    }

    // Adjust based on scene complexity
    if (triangleCount > config.qualityThresholds.high) {
      newQuality = minQuality(newQuality, 'medium');
    } else if (triangleCount < config.qualityThresholds.low) {
      newQuality = maxQuality(newQuality, 'high');
    }

    setMetrics(prev => ({
      ...prev,
      qualityLevel: newQuality,
      fps: currentFPS,
      triangleCount,
    }));
  }, [adaptiveEnabled]);

  // Update metrics
  const updateMetrics = useCallback((triangleCount: number = 0, renderStartTime?: number) => {
    const currentFPS = calculateAverageFPS();
    
    if (renderStartTime) {
      measureRenderTime(renderStartTime);
    }

    const avgRenderTime = renderTimeBufferRef.current.length > 0 
      ? renderTimeBufferRef.current.reduce((a, b) => a + b, 0) / renderTimeBufferRef.current.length 
      : 0;

    setMetrics(prev => ({
      ...prev,
      fps: currentFPS,
      triangleCount,
      renderTime: avgRenderTime,
    }));

    // Auto-adjust quality if enabled
    if (adaptiveEnabled) {
      adjustQualityBasedOnPerformance(currentFPS, triangleCount);
    }
  }, [calculateAverageFPS, measureRenderTime, adjustQualityBasedOnPerformance, adaptiveEnabled]);

  // Set performance mode
  const setPerformanceMode = useCallback((mode: PerformanceMode) => {
    setMetrics(prev => ({
      ...prev,
      performanceMode: mode,
      qualityLevel: mode === RENDER.PERFORMANCE_MODES.PRECISION ? 'high' :
                   mode === RENDER.PERFORMANCE_MODES.SPEED ? 'low' : 'medium',
    }));
  }, []);

  // Enable/disable adaptive quality
  const setAdaptiveQuality = useCallback((enabled: boolean) => {
    setAdaptiveEnabled(enabled);
  }, []);

  // Get quality settings for current performance mode
  const getQualitySettings = useCallback(() => {
    const mode = metrics.performanceMode;
    const quality = metrics.qualityLevel;
    
    let settings = RENDER.QUALITY_SETTINGS[mode];
    
    // Override based on quality level if different from mode
    if (quality === 'high' && mode !== RENDER.PERFORMANCE_MODES.PRECISION) {
      settings = RENDER.QUALITY_SETTINGS.precision;
    } else if (quality === 'low' && mode !== RENDER.PERFORMANCE_MODES.SPEED) {
      settings = RENDER.QUALITY_SETTINGS.speed;
    }

    return settings;
  }, [metrics.performanceMode, metrics.qualityLevel]);

  // Performance warnings
  const getPerformanceWarnings = useCallback(() => {
    const warnings: string[] = [];
    
    if (metrics.fps < RENDER.MIN_FPS) {
      warnings.push('Performance degraded - consider reducing scene complexity');
    }
    
    if (metrics.triangleCount > RENDER.COMPLEXITY_THRESHOLDS.HIGH) {
      warnings.push('High triangle count - consider using Speed mode');
    }
    
    if (metrics.renderTime > 50) { // >50ms render time
      warnings.push('High render time - quality automatically reduced');
    }
    
    return warnings;
  }, [metrics.fps, metrics.triangleCount, metrics.renderTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      frameCountRef.current = 0;
      fpsBufferRef.current = [];
      renderTimeBufferRef.current = [];
    };
  }, []);

  return {
    metrics,
    updateMetrics,
    setPerformanceMode,
    setAdaptiveQuality,
    getQualitySettings,
    getPerformanceWarnings,
    adaptiveEnabled,
  };
}

/**
 * Hook for wireframe/technical view optimizations
 */
export function useTechnicalViewOptimizations() {
  const [isTechnicalView, setIsTechnicalView] = useState(false);
  const [wireframeEnabled, setWireframeEnabled] = useState(false);
  const [lowDPIEnabled, setLowDPIEnabled] = useState(false);

  const enterTechnicalView = useCallback(() => {
    setIsTechnicalView(true);
    setWireframeEnabled(true);
    setLowDPIEnabled(true);
  }, []);

  const exitTechnicalView = useCallback(() => {
    setIsTechnicalView(false);
    setWireframeEnabled(false);
    setLowDPIEnabled(false);
  }, []);

  // Get optimized settings for technical views
  const getTechnicalViewSettings = useCallback(() => {
    if (!isTechnicalView) return null;

    return {
      dpr: [0.5, 1] as [number, number], // Lower DPI for battery life
      wireframe: wireframeEnabled,
      shadows: false, // Disable shadows for technical clarity
      antialias: false, // Disable antialiasing for crisp lines
      targetFPS: 30, // Higher FPS for better responsiveness
    };
  }, [isTechnicalView, wireframeEnabled, lowDPIEnabled]);

  return {
    isTechnicalView,
    wireframeEnabled,
    lowDPIEnabled,
    enterTechnicalView,
    exitTechnicalView,
    getTechnicalViewSettings,
    setWireframeEnabled,
    setLowDPIEnabled,
  };
}