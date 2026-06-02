'use client';

import { useRef, useEffect, useState } from 'react';
import { Code, Copy, Check, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSceneStore } from '@/lib/scene/store';

export function CodePanel() {
  const selectedIds = useSceneStore((state) => state.selectedIds);
  const objects = useSceneStore((state) => state.objects);
  const [copied, setCopied] = useState(false);

  const selectedObjects = Array.from(selectedIds)
    .map(id => objects.get(id))
    .filter((obj): obj is NonNullable<typeof obj> => obj !== undefined);

  const selectedObject = selectedObjects[0];

  const copyCode = async () => {
    if (!selectedObject?.jscadCode) return;
    try {
      await navigator.clipboard.writeText(selectedObject.jscadCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">JSCAD Source</span>
        </div>

        {selectedObject && (
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors border border-border"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selectedObjects.length > 1 && (
          <div className="border-b border-border bg-secondary/10 p-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {selectedObjects.map((obj) => (
              <div
                key={obj.id}
                className={cn(
                  'text-xs px-2 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer border',
                  obj.id === selectedObject?.id
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-background border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {obj.name}
              </div>
            ))}
          </div>
        )}

        {selectedObject ? (
          <div className="relative flex-1 overflow-hidden">
             <div className="absolute top-0 left-0 right-0 bottom-0 overflow-auto scrollbar-thin">
                <CodeEditor code={selectedObject.jscadCode} objectName={selectedObject.name} />
             </div>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function CodeEditor({ code, objectName }: { code: string; objectName: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [code]);

  return (
    <div className="min-h-full bg-zinc-950"> {/* Force darker bg for code */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-zinc-900/50">
        <span className="text-xs font-mono text-muted-foreground">{objectName}.jscad</span>
        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Read Only</span>
      </div>
      
      <textarea
        ref={textareaRef}
        value={code}
        readOnly
        className="w-full min-h-full bg-transparent text-zinc-300 font-mono text-[13px] leading-relaxed p-4 resize-none border-0 focus:outline-none selection:bg-primary/20 selection:text-primary"
        spellCheck={false}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 p-8 text-center">
      <FileCode className="w-12 h-12 mb-4 opacity-20" />
      <h3 className="text-sm font-medium text-foreground mb-2">No Selection</h3>
      <p className="text-xs max-w-[200px]">
        Select an object in the scene to view its source code.
      </p>
    </div>
  );
}
