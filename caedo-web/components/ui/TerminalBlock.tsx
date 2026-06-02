import React from 'react';
import { cn } from '@/lib/utils';

interface TerminalBlockProps {
  title?: string;
  content: string;
  className?: string;
  showCursor?: boolean;
}

export const TerminalBlock: React.FC<TerminalBlockProps> = ({
  title = "SYSTEM_READOUT",
  content,
  className,
  showCursor = true,
}) => {
  return (
    <div className={cn(
      "bg-[#050505] border border-primary/50 p-4 font-mono text-sm text-primary relative overflow-hidden",
      "shadow-[inset_0_0_20px_rgba(0,255,204,0.05)]",
      className
    )}>
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,100,0.02))] z-10 bg-[length:100%_2px,3px_100%]" />
      
      <div className="flex justify-between items-center mb-4 border-b border-primary/30 pb-2 text-xxs font-bold opacity-70">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {title}
        </div>
        <div>VER: 4.0.8</div>
      </div>
      
      <div className="space-y-2 relative z-20">
        {content.split('\n').map((line, i) => (
          <p key={i} className="leading-relaxed">
            <span className="opacity-50 mr-2">{'>'}</span>
            {line}
            {showCursor && i === content.split('\n').length - 1 && (
              <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse align-middle" />
            )}
          </p>
        ))}
      </div>
    </div>
  );
};

