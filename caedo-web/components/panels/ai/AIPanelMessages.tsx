'use client';

import React from 'react';
import { Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TerminalBlock } from '@/components/ui/TerminalBlock';

interface AIPanelMessagesProps {
    messages: Array<{
        id: string;
        role: 'user' | 'assistant' | 'system' | 'data';
        content: string;
        experimental_attachments?: Array<{
            name: string;
            contentType: string;
            url: string;
        }>;
    }>;
    isLoading: boolean;
    scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function AIPanelMessages({ messages, isLoading, scrollRef }: AIPanelMessagesProps) {
    return (
        <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-40 py-10">
                    <Sparkles className="w-8 h-8 text-primary" />
                    <div className="space-y-1">
                        <p className="text-sm font-bold uppercase tracking-wider">Neural_Link_Active</p>
                        <p className="text-[10px] max-w-[180px]">Describe your 3D design requirement in natural language.</p>
                    </div>
                </div>
            ) : (
                messages.map((m) => (
                    <div
                        key={m.id}
                        className={cn(
                            "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                            m.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
                            m.role === 'user'
                                ? "bg-white/5 border-white/10 text-white/50"
                                : "bg-primary/10 border-primary/20 text-primary"
                        )}>
                            {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={cn(
                            "flex flex-col gap-1 max-w-[85%]",
                            m.role === 'user' ? "items-end" : "items-start"
                        )}>
                            {/* Attachments (Images) */}
                            {m.experimental_attachments && m.experimental_attachments.length > 0 && (
                                <div className="flex gap-2 mb-2 flex-wrap">
                                    {m.experimental_attachments.map((attachment, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={attachment.url}
                                                alt={attachment.name}
                                                className="w-20 h-20 object-cover rounded-lg border border-white/10 bg-black/40"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {m.role === 'assistant' ? (
                                <div className="w-full max-w-full">
                                    <TerminalBlock 
                                        title="AI_ASSISTANT_RESPONSE" 
                                        content={m.content} 
                                        className="text-[13px] rounded-tl-none border-white/10"
                                        showCursor={isLoading && m === messages[messages.length - 1]}
                                    />
                                </div>
                            ) : (
                                <div className={cn(
                                    "px-3 py-2 rounded-2xl text-[13px] leading-relaxed shadow-lg",
                                    "bg-white/10 text-white rounded-tr-none border border-white/5"
                                )}>
                                    <p className="whitespace-pre-wrap">{m.content}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3 animate-pulse">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-black/40 border border-white/10 px-3 py-2 rounded-2xl rounded-tl-none">
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
