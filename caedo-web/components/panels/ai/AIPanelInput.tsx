'use client';

import React from 'react';
import { Send, Zap, ImagePlus, X, Loader2 } from 'lucide-react';
import { VoiceInput } from '@/components/voice/VoiceInput';
import { cn } from '@/lib/utils';

interface AIPanelInputProps {
    input: string;
    setInput: (value: string) => void;
    isLoading: boolean;
    onSubmit: (e: React.FormEvent) => void;
    uploadedImages: Array<{
        id: string;
        data: string;
        preview: string;
        name: string;
    }>;
    onRemoveImage: (id: string) => void;
    onImageUpload: (files: FileList | null) => void;
    imageInputRef: React.RefObject<HTMLInputElement | null>;
    onVoiceTranscript: (text: string) => void;
}

export function AIPanelInput({
    input,
    setInput,
    isLoading,
    onSubmit,
    uploadedImages,
    onRemoveImage,
    onImageUpload,
    imageInputRef,
    onVoiceTranscript
}: AIPanelInputProps) {
    return (
        <div className="p-4 bg-black/40 border-t border-white/10 backdrop-blur-md">
            {/* Uploaded Images Preview */}
            {uploadedImages.length > 0 && (
                <div className="flex gap-2 mb-3 px-1" role="list" aria-label="Uploaded images">
                    {uploadedImages.map((img) => (
                        <div key={img.id} className="relative group" role="listitem">
                            <img
                                src={img.preview}
                                alt={`Reference image: ${img.name}`}
                                className="w-12 h-12 object-cover rounded-md border border-white/20"
                            />
                            <button
                                onClick={() => onRemoveImage(img.id)}
                                aria-label={`Remove image ${img.name}`}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shadow-lg"
                            >
                                <X className="w-2.5 h-2.5" aria-hidden="true" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <form
                id="ai-chat-form"
                onSubmit={onSubmit}
                className="flex flex-col gap-2"
            >
                <div className="flex items-center gap-2 group">
                    <div className="relative flex-1">
                        <label htmlFor="ai-input" className="sr-only">Design prompt</label>
                        <input
                            id="ai-input"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Structure my design..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all pl-10 pr-20"
                            disabled={isLoading}
                        />
                        <SparklesIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" aria-hidden="true" />

                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <input
                                type="file"
                                id="ai-image-upload"
                                ref={imageInputRef}
                                onChange={(e) => onImageUpload(e.target.files)}
                                accept="image/*"
                                multiple
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                disabled={isLoading || uploadedImages.length >= 3}
                                className="p-1.5 text-white/30 hover:text-primary hover:bg-white/5 rounded-lg transition-all"
                                title="Add reference image"
                                aria-label="Add reference image"
                            >
                                <ImagePlus className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <div className="w-px h-4 bg-white/10 mx-0.5" aria-hidden="true" />
                            <VoiceInput
                                onTranscript={onVoiceTranscript}
                                disabled={isLoading}
                                size="sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || (!input.trim() && uploadedImages.length === 0)}
                        aria-label={isLoading ? "Generating design..." : "Send prompt"}
                        className={cn(
                            "p-2.5 rounded-xl transition-all shadow-lg shadow-black/20 flex items-center justify-center",
                            isLoading || (!input.trim() && uploadedImages.length === 0)
                                ? "bg-white/5 text-white/20 border border-white/5"
                                : "bg-primary text-black hover:bg-primary/90 active:scale-95"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                        ) : (
                            <Send className="w-5 h-5" aria-hidden="true" />
                        )}
                    </button>
                </div>

                {/* Helper footer */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 text-[9px] text-white/20 uppercase tracking-tighter">
                        <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> Fast_Engine</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span>Multi_Modal_Ready</span>
                    </div>
                    <p className="text-[9px] text-white/10 italic">
                        Enter to generate design
                    </p>
                </div>
            </form>
        </div>
    );
}

function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" />
        </svg>
    );
}
