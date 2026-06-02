'use client';

import { Bot, X, Settings, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIPanelHeaderProps {
    statusLoading: boolean;
    providerStatus: { isValid: boolean; error?: string } | null;
    providerInfo: { provider: string; model: string; isLocal: boolean };
    onToggleSettings: () => void;
    onTogglePanel: () => void;
}

export function AIPanelHeader({
    statusLoading,
    providerStatus,
    providerInfo,
    onToggleSettings,
    onTogglePanel
}: AIPanelHeaderProps) {
    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
            <div className="flex items-center gap-2.5">
                <div className="relative">
                    <Bot className="w-5 h-5 text-primary" />
                    <div className={cn(
                        "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-black",
                        statusLoading ? "bg-white/20" :
                            providerStatus?.isValid ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"
                    )} />
                </div>
                <div>
                    <h3 className="text-xs font-bold tracking-widest text-white uppercase flex items-center gap-2">
                        AI_DESIGN_CORE
                        {providerStatus?.isValid && (
                            <span className="text-[9px] font-normal text-white/40 tracking-normal normal-case px-1.5 py-0.5 rounded bg-white/5 border border-white/10 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-green-500" />
                                {providerInfo.model}
                            </span>
                        )}
                    </h3>
                    <div className="text-[9px] text-white/30 flex items-center gap-1.5 leading-none mt-1">
                        {statusLoading ? (
                            <span className="flex items-center gap-1">
                                <Loader2 className="w-2 h-2 animate-spin" />
                                Initializing...
                            </span>
                        ) : providerStatus?.isValid ? (
                            <span className="text-green-500/50">SYSTEM_READY // {providerInfo.provider.toUpperCase()}</span>
                        ) : (
                            <span className="text-red-500/50 flex items-center gap-1">
                                <AlertCircle className="w-2 h-2" />
                                LINK_OFFLINE
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={onToggleSettings}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                    title="AI Settings"
                    aria-label="AI Settings"
                >
                    <Settings className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                    onClick={onTogglePanel}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                    title="Close AI Panel"
                    aria-label="Close AI Panel"
                >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
