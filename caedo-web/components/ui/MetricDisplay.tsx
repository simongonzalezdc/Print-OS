import React from 'react';
import { cn } from '@/lib/utils';

interface MetricDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string | number;
  deltaType?: 'positive' | 'negative' | 'neutral';
  className?: string;
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  label,
  value,
  unit,
  delta,
  deltaType = 'neutral',
  className,
}) => {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-xxs font-bold uppercase tracking-tighter text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-primary tracking-tighter tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-bold text-primary/60 uppercase">
            {unit}
          </span>
        )}
      </div>
      {delta && (
        <span className={cn(
          "text-xxs font-bold flex items-center gap-1",
          deltaType === 'positive' && "text-primary",
          deltaType === 'negative' && "text-destructive",
          deltaType === 'neutral' && "text-muted-foreground"
        )}>
          {deltaType === 'positive' && "↑"}
          {deltaType === 'negative' && "↓"}
          {delta}
        </span>
      )}
    </div>
  );
};

