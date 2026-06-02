'use client';

import React from 'react';
import {
    parseStructuredResponse,
    isClarifyResponse,
    isDesignResponse,
    ClarifyResponse,
    DesignResponse
} from '@/lib/ai/structured-response';

/**
 * Render clarifying questions from AI
 */
export function ClarifyingQuestions({ response }: { response: ClarifyResponse }) {
    return (
        <div className="space-y-3">
            {/* Understanding */}
            <div className="text-white/80">
                <span className="text-primary/80">💭</span> {response.understanding}
            </div>

            {/* Questions */}
            <div className="space-y-2">
                <div className="text-white/60 text-[10px] uppercase tracking-wide">Questions:</div>
                {response.questions.map((question, i) => (
                    <div key={i} className="flex gap-2 text-white/90 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/10">
                        <span className="text-primary font-bold">{i + 1}.</span>
                        <span>{question}</span>
                    </div>
                ))}
            </div>

            {/* Default assumptions */}
            {response.assumptions && (
                <div className="text-white/50 text-[10px] italic border-t border-white/10 pt-2 mt-2">
                    💡 {response.assumptions}
                </div>
            )}
        </div>
    );
}

/**
 * Render design explanation from AI
 */
export function DesignExplanation({ response }: { response: DesignResponse }) {
    const { summary, explanation, dfmChecks, suggestions } = response;

    return (
        <div className="space-y-3">
            {/* Summary */}
            <div className="text-white font-medium">
                ✅ {summary}
            </div>

            {/* What I Built / What Changed */}
            {explanation?.whatIBuilt && (
                <div className="text-white/80 leading-relaxed">
                    {explanation.whatIBuilt}
                </div>
            )}
            {explanation?.whatChanged && (
                <div className="text-white/80 leading-relaxed">
                    <span className="text-yellow-400/80">Changed:</span> {explanation.whatChanged}
                </div>
            )}

            {/* Design Decisions */}
            {explanation?.designDecisions && explanation.designDecisions.length > 0 && (
                <div className="space-y-1">
                    <div className="text-white/60 text-[10px] uppercase tracking-wide">Design Decisions:</div>
                    {explanation.designDecisions.map((decision, i) => (
                        <div key={i} className="flex gap-1.5 text-white/70">
                            <span className="text-green-400/70">→</span>
                            <span>{decision}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Dimensions */}
            {explanation?.dimensions && Object.keys(explanation.dimensions).length > 0 && (
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                    <div className="text-white/60 text-[10px] uppercase tracking-wide mb-1">Dimensions:</div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-white/80">
                        {Object.entries(explanation.dimensions).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                                <span className="text-white/50">{key}:</span>
                                <span className="font-mono text-primary/80">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Print Notes */}
            {explanation?.printNotes && (
                <div className="flex gap-1.5 text-white/60 bg-blue-500/10 rounded-lg px-2.5 py-1.5 border border-blue-500/20">
                    <span>🖨️</span>
                    <span>{explanation.printNotes}</span>
                </div>
            )}

            {/* DFM Checks */}
            {dfmChecks && dfmChecks.length > 0 && (
                <div className="space-y-0.5">
                    <div className="text-white/60 text-[10px] uppercase tracking-wide">DFM Checks:</div>
                    {dfmChecks.map((check, i) => (
                        <div key={i} className="text-white/60 text-[10px]">
                            {check}
                        </div>
                    ))}
                </div>
            )}

            {/* Suggestions */}
            {suggestions && suggestions.length > 0 && (
                <div className="border-t border-white/10 pt-2 space-y-1">
                    <div className="text-white/60 text-[10px] uppercase tracking-wide">Want me to:</div>
                    {suggestions.map((suggestion, i) => (
                        <div key={i} className="text-purple-300/80 text-[11px]">
                            💡 {suggestion}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Format AI response with markdown-like styling
 */
export function FormattedAIResponse({ content }: { content: string }) {
    // Try to parse as structured response first
    const structured = parseStructuredResponse(content);

    if (structured) {
        if (isClarifyResponse(structured)) {
            return <ClarifyingQuestions response={structured} />;
        }
        if (isDesignResponse(structured)) {
            return <DesignExplanation response={structured} />;
        }
    }

    // Fallback: Remove code blocks for display (they're extracted separately for execution)
    const textWithoutCode = content.replace(/```[\s\S]*?```/g, '').trim();

    // If empty after removing code blocks, show a placeholder
    if (!textWithoutCode) {
        return (
            <div className="text-white/50 italic">
                Processing design...
            </div>
        );
    }

    // Parse into sections
    const sections = textWithoutCode.split(/\*\*([^*]+)\*\*/g);

    if (sections.length <= 1) {
        // No markdown headers, show as simple text with line breaks
        return (
            <div className="space-y-1">
                {textWithoutCode.split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;

                    // Bullet points
                    if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                        return (
                            <div key={i} className="flex gap-1.5 text-white/80">
                                <span className="text-primary/70">•</span>
                                <span>{trimmed.replace(/^[-•]\s*/, '')}</span>
                            </div>
                        );
                    }

                    return <p key={i} className="text-white/70">{trimmed}</p>;
                })}
            </div>
        );
    }

    // Has markdown headers
    const elements: React.ReactElement[] = [];

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i]?.trim();
        if (!section) continue;

        // Even indices are regular text, odd indices are header text
        if (i % 2 === 1) {
            // This is a header
            elements.push(
                <h4 key={`h-${i}`} className="text-white font-semibold mt-2 mb-1 first:mt-0">
                    {section.replace(/:$/, '')}
                </h4>
            );
        } else {
            // This is content - parse for bullet points
            const lines = section.split('\n').filter(l => l.trim());
            lines.forEach((line, j) => {
                const trimmed = line.trim();
                if (!trimmed) return;

                if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                    elements.push(
                        <div key={`b-${i}-${j}`} className="flex gap-1.5 text-white/80 ml-1">
                            <span className="text-primary/60">•</span>
                            <span>{trimmed.replace(/^[-•]\s*/, '')}</span>
                        </div>
                    );
                } else {
                    elements.push(
                        <p key={`p-${i}-${j}`} className="text-white/70">{trimmed}</p>
                    );
                }
            });
        }
    }

    return <div className="space-y-0.5">{elements}</div>;
}
