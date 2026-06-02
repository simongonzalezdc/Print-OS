import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  glow?: boolean;
}

export const CyberButton: React.FC<CyberButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  glow = false,
  disabled,
  ...props
}) => {
  const baseStyles = "relative inline-flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow hover:shadow-glow-lg",
    secondary: "bg-secondary text-foreground hover:bg-secondary/80 border border-border",
    outline: "bg-transparent border border-primary/50 text-primary hover:bg-primary/10 hover:border-primary shadow-[0_0_10px_rgba(0,255,204,0.1)]",
    ghost: "bg-transparent text-muted-foreground hover:text-primary hover:bg-primary/5",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-glow-destructive",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xxs rounded-[2px]",
    md: "px-6 py-2.5 text-xs rounded-[2px]",
    lg: "px-8 py-3.5 text-sm rounded-[2px]",
    icon: "p-2 rounded-[2px]",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], glow && "animate-pulse-glow", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {size !== 'icon' && <span>Processing...</span>}
        </>
      ) : children}
      
      {/* Visual Glitch/Scanline effect on hover */}
      <div className="absolute inset-0 w-full h-full pointer-events-none bg-white/5 opacity-0 hover:opacity-100 transition-opacity z-10" />
    </button>
  );
};

