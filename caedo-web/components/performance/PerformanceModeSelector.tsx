'use client';

import { useState } from 'react';
import { RENDER } from '@/lib/constants';
import { usePerformanceMonitor } from '@/lib/performance';
import { 
  Gauge, 
  Zap, 
  Target, 
  Settings, 
  Eye,
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';

interface PerformanceModeSelectorProps {
  className?: string;
}

const PERFORMANCE_ICONS = {
  precision: Target,
  balanced: Gauge,
  speed: Zap,
};

export function PerformanceModeSelector({ className }: PerformanceModeSelectorProps) {
  const {
    metrics,
    setPerformanceMode,
    getQualitySettings,
    getPerformanceWarnings,
    adaptiveEnabled,
    setAdaptiveQuality,
  } = usePerformanceMonitor();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const currentIcon = PERFORMANCE_ICONS[metrics.performanceMode];
  const CurrentIcon = currentIcon;

  const warnings = getPerformanceWarnings();
  const qualitySettings = getQualitySettings();

  const handleModeChange = (mode: keyof typeof RENDER.PERFORMANCE_MODES) => {
    setPerformanceMode(RENDER.PERFORMANCE_MODES[mode]);
    setShowDropdown(false);
  };

  const toggleAdaptiveQuality = () => {
    setAdaptiveQuality(!adaptiveEnabled);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        {/* Performance Mode Selector */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 border rounded-md bg-background hover:bg-accent transition-colors"
          >
            <CurrentIcon className="h-4 w-4" />
            <span className="hidden sm:inline text-sm font-medium">
              {metrics.performanceMode.charAt(0).toUpperCase() + metrics.performanceMode.slice(1)}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
              {metrics.fps.toFixed(0)}fps
            </span>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-background border rounded-md shadow-lg z-50">
              <div className="p-1">
                <button
                  onClick={() => handleModeChange('PRECISION')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-accent transition-colors ${
                    metrics.performanceMode === 'precision' ? 'bg-accent' : ''
                  }`}
                >
                  <Target className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Precision</span>
                    <span className="text-xs text-muted-foreground">Max quality</span>
                  </div>
                </button>
                <button
                  onClick={() => handleModeChange('BALANCED')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-accent transition-colors ${
                    metrics.performanceMode === 'balanced' ? 'bg-accent' : ''
                  }`}
                >
                  <Gauge className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Balanced</span>
                    <span className="text-xs text-muted-foreground">Quality & performance</span>
                  </div>
                </button>
                <button
                  onClick={() => handleModeChange('SPEED')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-accent transition-colors ${
                    metrics.performanceMode === 'speed' ? 'bg-accent' : ''
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Speed</span>
                    <span className="text-xs text-muted-foreground">Max performance</span>
                  </div>
                </button>
                
                <div className="border-t my-1"></div>
                
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-accent transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span className="text-sm">{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Technical View Toggle */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 border rounded-md bg-background hover:bg-accent transition-colors"
          onClick={() => {
            // TODO: Implement technical view toggle
          }}
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Technical</span>
        </button>

        {/* Performance Status Indicators */}
        <div className="flex items-center gap-1">
          {/* FPS Indicator */}
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            metrics.fps >= RENDER.TARGET_FPS 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-secondary text-secondary-foreground'
          }`}>
            {metrics.fps.toFixed(0)} fps
          </span>

          {/* Quality Level Indicator */}
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            metrics.qualityLevel === 'high' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
              : metrics.qualityLevel === 'medium'
              ? 'bg-secondary text-secondary-foreground'
              : 'border border-input bg-background'
          }`}>
            {metrics.qualityLevel}
          </span>

          {/* Performance Warnings */}
          {warnings.length > 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">
                {warnings.length}
              </span>
            </div>
          )}

          {/* Performance OK Indicator */}
          {warnings.length === 0 && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>

      {/* Advanced Performance Panel */}
      {showAdvanced && (
        <div className="absolute top-full right-0 mt-2 p-4 bg-background border rounded-lg shadow-lg min-w-[300px] z-50">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Advanced Performance</h4>
            
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Triangles:</span>
                <div className="font-mono">{metrics.triangleCount.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Render time:</span>
                <div className="font-mono">{metrics.renderTime.toFixed(1)}ms</div>
              </div>
            </div>

            {/* Adaptive Quality Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Adaptive Quality</span>
              <button
                onClick={toggleAdaptiveQuality}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  adaptiveEnabled 
                    ? 'bg-primary text-primary-foreground' 
                    : 'border border-input bg-background hover:bg-accent'
                }`}
              >
                {adaptiveEnabled ? 'On' : 'Off'}
              </button>
            </div>

            {/* Quality Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">DPR Range:</span>
                <span className="font-mono">
                  {qualitySettings.dpr[0]} - {qualitySettings.dpr[1]}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Target FPS:</span>
                <span className="font-mono">{qualitySettings.targetFPS}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Shadows:</span>
                <span className="font-mono">{qualitySettings.shadows ? 'On' : 'Off'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Antialiasing:</span>
                <span className="font-mono">{qualitySettings.antialias ? 'On' : 'Off'}</span>
              </div>
            </div>

            {/* Performance Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <AlertTriangle className="h-3 w-3" />
                  Performance Warnings
                </div>
                {warnings.map((warning, index) => (
                  <div key={index} className="text-xs text-muted-foreground pl-5">
                    • {warning}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Click outside to close dropdowns */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}