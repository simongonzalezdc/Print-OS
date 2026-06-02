import React from 'react';
import { cn } from '@/lib/utils';

interface CyberCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'outline' | 'ghost';
  glow?: boolean;
}

export const CyberCard: React.FC<CyberCardProps> = ({
  title,
  subtitle,
  children,
  className,
  variant = 'default',
  glow = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        variant === 'default' && "bg-secondary/30 border border-border rounded-lg p-4",
        variant === 'outline' && "border border-primary/30 rounded-lg p-4 bg-transparent hover:border-primary/50",
        variant === 'ghost' && "bg-transparent p-4",
        glow && "shadow-glow hover:shadow-glow-lg",
        className
      )}
      {...props}
    >
      {/* Decorative Corner */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/50" />
      
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary" />
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xxs text-muted-foreground uppercase mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Bottom Corner Accent */}
      <div className="absolute bottom-0 right-0 w-4 h-0.5 bg-primary/20" />
    </div>
  );
};

