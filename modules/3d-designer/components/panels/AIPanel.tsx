'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Sparkles, Bot, User, Loader2, AlertCircle, X, Settings, Zap, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSceneStore } from '@/lib/scene/store';
import { VoiceInput } from '@/components/voice/VoiceInput';
import { SettingsPanel } from './SettingsPanel';
import {
  UserPreferences,
  loadUserPreferences,
  needsOnboarding,
  completeOnboarding,
  DEFAULT_PREFERENCES
} from '@/lib/storage/user-preferences';
import { getPrinterProfile, PrinterProfile } from '@/lib/constants/printer-profiles';
import {
  parseStructuredResponse,
  isClarifyResponse,
  isDesignResponse,
  DesignResponse,
  ClarifyResponse
} from '@/lib/ai/structured-response';

interface AIPanelProps {
  /** Callback function to toggle panel expansion */
  onToggle: () => void;
}

/**
 * Render clarifying questions from AI
 */
function ClarifyingQuestions({ response }: { response: ClarifyResponse }) {
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
function DesignExplanation({ response }: { response: DesignResponse }) {
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
 * Shows headers, bullet points, and code blocks nicely
 * Now also handles structured responses with explanations
 */
function FormattedAIResponse({ content }: { content: string }) {
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

/**
 * AI Assistant Panel Component
 *
 * Provides a chat interface for interacting with AI to generate 3D models.
 * Features include:
 * - Natural language to JSCAD code generation
 * - Real-time AI provider status monitoring
 * - Voice input integration
 * - Conversation history
 * - Error handling and user feedback
 *
 * @param props - Component props
 *
 * @example
 * <AIPanel onToggle={() => setExpanded(!expanded)} />
 */
export function AIPanel({ onToggle }: AIPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef(false); // Guard against multiple finish calls
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [input, setInput] = useState('');
  const [providerStatus, setProviderStatus] = useState<{ isValid: boolean; error?: string } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Settings and preferences state
  const [showSettings, setShowSettings] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [printerProfile, setPrinterProfile] = useState<PrinterProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<Array<{
    id: string;
    data: string;  // base64 data URL
    name: string;
    preview: string;  // blob URL for preview
  }>>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const objects = useSceneStore((state) => state.objects);
  const selectedIds = useSceneStore((state) => state.selectedIds);
  const setAIProcessing = useSceneStore((state) => state.setAIProcessing);
  const addObject = useSceneStore((state) => state.addObject);
  const updateObject = useSceneStore((state) => state.updateObject);
  const setStorePrinterProfile = useSceneStore((state) => state.setPrinterProfile);

  // Provider info fetched from API to avoid hydration mismatch
  const [providerInfo, setProviderInfo] = useState<{ provider: string; model: string; isLocal: boolean }>({
    provider: 'loading',
    model: '...',
    isLocal: false,
  });

  // Load user preferences and check for onboarding
  useEffect(() => {
    const loadPrefs = async () => {
      const prefs = await loadUserPreferences();
      setUserPreferences(prefs);
      const profile = getPrinterProfile(prefs.printer.profileId);
      setPrinterProfile(profile);
      setStorePrinterProfile(profile);

      // Check if onboarding is needed
      const needsSetup = await needsOnboarding();
      if (needsSetup) {
        setShowOnboarding(true);
      }
    };
    loadPrefs();
  }, [showSettings]); // Reload when settings panel closes

  /**
   * Extract JSCAD code from AI response text.
   * Looks for code blocks marked with ```javascript or ```jscad or just ```
   * More flexible regex to handle various formatting from different AI models.
   */
  const extractJSCADCode = (text: string): string | null => {
    // Try multiple regex patterns to handle different code block formats
    const patterns = [
      // Standard format with optional language and flexible whitespace
      /```(?:javascript|jscad|js|typescript|ts)?[\s\r\n]*([\s\S]*?)```/g,
      // Fallback: code that looks like JSCAD even without backticks
      /(?:const|function|import)\s+(?:jscad|main|\{[^}]*\})\s*=?[\s\S]*?(?=\n\n|$)/g,
    ];

    for (const regex of patterns) {
      const matches = [...text.matchAll(regex)];

      if (matches.length > 0) {
        // Return the last code block (most likely the final JSCAD code)
        const lastMatch = matches.at(-1);
        const code = lastMatch?.[1]?.trim() || lastMatch?.[0]?.trim();

        if (!code) continue;

        // Validate it looks like JSCAD code (has relevant keywords)
        const jscadKeywords = ['main', 'cuboid', 'cylinder', 'sphere', 'union', 'subtract', 'intersect', '@jscad', 'primitives', 'roundedCuboid'];
        const hasJscadCode = jscadKeywords.some(keyword => code.includes(keyword));

        if (hasJscadCode) {
          console.log('[AIPanel] Found JSCAD code with pattern:', regex.source.substring(0, 50));
          return code;
        }
      }
    }

    return null;
  };

  // Memoize scene context to prevent unnecessary re-renders
  const sceneContext = useMemo(() => ({
    objects: Array.from(objects.values()).map(obj => ({
      id: obj.id,
      name: obj.name,
      type: 'jscad',
      position: obj.position,
      selected: selectedIds.has(obj.id),
    })),
    selectedIds: Array.from(selectedIds),
  }), [objects, selectedIds]);

  // Get the code of the selected object or the most recently created object
  // This is used for refinement requests ("make it more realistic", etc.)
  const existingCode = useMemo(() => {
    // First priority: selected object
    const selectedIdArray = Array.from(selectedIds);
    if (selectedIdArray.length === 1) {
      const selectedId = selectedIdArray[0];
      if (selectedId) {
        const selectedObj = objects.get(selectedId);
        if (selectedObj?.jscadCode) {
          console.log('[AIPanel] Using selected object code for refinement:', selectedObj.name);
          return selectedObj.jscadCode;
        }
      }
    }

    // Second priority: most recently added object (last in the map)
    const allObjects = Array.from(objects.values());
    if (allObjects.length > 0) {
      const lastObj = allObjects[allObjects.length - 1];
      if (lastObj?.jscadCode) {
        console.log('[AIPanel] Using last created object code for refinement:', lastObj.name);
        return lastObj.jscadCode;
      }
    }

    return undefined;
  }, [objects, selectedIds]);

  // Memoize full context including printer profile and preferences
  const fullContext = useMemo(() => ({
    sceneContext,
    existingCode, // Include for refinement requests
    printerProfile: printerProfile ? {
      id: printerProfile.id,
      name: printerProfile.name,
      manufacturer: printerProfile.manufacturer,
      buildVolume: printerProfile.buildVolume,
      nozzle: printerProfile.nozzle,  // Required for DFM calculations
      multiColor: printerProfile.multiColor,
      bedType: printerProfile.bedType,
      dfm: printerProfile.dfm,
    } : undefined,
    userPreferences: {
      printer: userPreferences.printer,
      experience: userPreferences.experience,
      useCases: userPreferences.useCases,
      commonComponents: userPreferences.commonComponents,
      designPreferences: userPreferences.designPreferences,
      aiPreferences: userPreferences.aiPreferences,
    },
  }), [sceneContext, existingCode, printerProfile, userPreferences]);

  // Memoize callbacks to prevent useChat from re-initializing
  interface FinishEvent {
    messages?: Array<{
      role: string;
      parts?: Array<{ type: string; text?: string }>;
      content?: string;
    }>;
  }
  const handleFinish = useCallback((event: FinishEvent) => {
    // Guard against multiple calls (can happen during rapid streaming)
    if (!isProcessingRef.current) {
      console.log('[AIPanel] onFinish called but not processing, skipping');
      return;
    }
    isProcessingRef.current = false;

    // AI SDK 5.0: onFinish receives an event object, not the message directly
    console.log('[AIPanel] onFinish called with event:', event);

    setAIProcessing(false);
    setIsLoading(false);

    // Get the last assistant message from the messages array
    const messagesArray = event.messages || [];
    const lastAssistantMessage = messagesArray.filter((m: { role: string }) => m.role === 'assistant').pop();

    console.log('[AIPanel] Messages array length:', messagesArray.length);
    console.log('[AIPanel] Last assistant message:', lastAssistantMessage);

    if (lastAssistantMessage) {
      // Extract content from the message
      const content = lastAssistantMessage.parts
        ? lastAssistantMessage.parts.map((part: { type: string; text?: string }) => (part.type === 'text' ? part.text : '')).join('')
        : (lastAssistantMessage as unknown as { content?: string }).content || '';

      console.log('[AIPanel] Extracted content:', content);
      console.log('[AIPanel] Content length:', content.length);

      const structured = parseStructuredResponse(content);

      // Check if this is a design response (has code) vs clarify response (no code)
      const isDesignResponse = structured && 'code' in structured;
      const designSummary = isDesignResponse ? structured.summary : undefined;
      let jscadCode = isDesignResponse ? structured.code : null;
      if (!jscadCode) {
        jscadCode = extractJSCADCode(content);
      }

      console.log('[AIPanel] Extracted JSCAD code:', jscadCode ? `${jscadCode.substring(0, 100)}...` : null);

      // Only warn if it's a design response with empty code (clarify responses don't have code)
      if (isDesignResponse && !structured.code.trim()) {
        console.warn('[AIPanel] Structured response missing code field');
      }

      if (jscadCode) {
        try {
          console.log('[AIPanel] Calling addObject with code length:', jscadCode.length);
          // Use name from structured response if available (only DesignResponse has parameters)
          const objectName = isDesignResponse && typeof structured.parameters?.name === 'string'
            ? structured.parameters.name
            : 'AI Generated Object';

          // Check if this is a refinement (we have an existing object to update)
          const selectedIdArray = Array.from(selectedIds);
          const allObjects = Array.from(objects.values());
          const existingObjectId = selectedIdArray.length === 1
            ? selectedIdArray[0]
            : (allObjects.length > 0 ? allObjects[allObjects.length - 1]?.id : null);

          let objectId: string;

          // If we have an existing object with JSCAD code, UPDATE it instead of creating new
          if (existingObjectId) {
            const existingObj = objects.get(existingObjectId);
            if (existingObj?.jscadCode) {
              console.log('[AIPanel] Updating existing object:', existingObj.name);
              // Update the existing object with new code
              // The SceneObject component will re-generate mesh when jscadCode changes
              updateObject(existingObjectId, {
                jscadCode: jscadCode,
                meshData: undefined, // Clear cached mesh to force re-generation
              });
              objectId = existingObjectId;

              toast.success('Object updated!', {
                description: designSummary || 'Design modified successfully.',
              });
            } else {
              // No existing JSCAD code, create new object
              objectId = addObject(jscadCode, objectName);
              toast.success('Object created!', {
                description: designSummary || 'JSCAD code executed and added to scene.',
              });
            }
          } else {
            // No existing object, create new one
            objectId = addObject(jscadCode, objectName);
            toast.success('Object created!', {
              description: designSummary || 'JSCAD code executed and added to scene.',
            });
          }

          // Only update with AI metadata if this is a design response (not a clarify response)
          if (isDesignResponse) {
            updateObject(objectId, {
              aiSummary: structured.summary,
              aiParameters: structured.parameters,
              aiDfMNotes: structured.dfmChecks,
            });

            if (structured.warnings?.length) {
              toast.warning('DFM notes', {
                description: structured.warnings.join(' • '),
              });
            }
          }
        } catch (err) {
          console.error('[AIPanel] Failed to add/update object:', err);
          toast.error('Failed to create/update object', {
            description: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      } else {
        console.log('[AIPanel] No JSCAD code found in response. Content preview:', content.substring(0, 200));
        toast.info('No executable code found', {
          description: 'The AI response did not contain JSCAD code.',
        });
      }
    } else {
      console.log('[AIPanel] No assistant message found in messages array');
    }

    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, [addObject, updateObject, setAIProcessing, objects, selectedIds]);

  const handleError = useCallback((error: Error) => {
    // Reset processing flag on error
    isProcessingRef.current = false;

    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    console.error('[AIPanel] AI stream error:', errorMessage);
    toast.error('AI chat error', {
      description: errorMessage,
    });
    setAIProcessing(false);
    setIsLoading(false);
  }, [setAIProcessing]);

  // Memoize transport to prevent recreation
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/ai/generate',
  }), []);

  const chatResult = useChat({
    transport,
    onFinish: handleFinish,
    onError: handleError,
    // Throttle UI updates to prevent "Maximum update depth exceeded" error
    // This limits re-renders during streaming to every 50ms
    experimental_throttle: 50,
  });

  const { messages, sendMessage } = chatResult;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // Validate input length (API has 2000 char limit per message)
    if (trimmedInput.length > 2000) {
      toast.error('Message too long', {
        description: 'Please keep messages under 2000 characters.',
      });
      return;
    }

    setAIProcessing(true);
    setIsLoading(true);
    isProcessingRef.current = true;
    console.log('[AIPanel] Sending message:', trimmedInput);

    try {
      // AI SDK v5 sendMessage - include images as experimental_attachments
      // Include full context with printer profile and user preferences in body
      const bodyWithImages: Record<string, unknown> = {
        ...fullContext,
        // Also include image data in body for server-side processing
        images: uploadedImages.map(img => ({
          name: img.name,
          data: img.data,
        })),
      };

      const messageOptions: { body: Record<string, unknown>; experimental_attachments?: Array<{ name: string; contentType: string; url: string }> } = {
        body: bodyWithImages,
      };

      // Add attachments if we have images (for client-side display)
      if (uploadedImages.length > 0) {
        messageOptions.experimental_attachments = uploadedImages.map(img => ({
          name: img.name,
          contentType: 'image/png',
          url: img.data,
        }));
      }

      await sendMessage({
        text: trimmedInput,
      }, messageOptions);

      // Clear images after sending
      uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
      setUploadedImages([]);
      setInput('');
    } catch (error) {
      isProcessingRef.current = false;
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      toast.error('Failed to send message', {
        description: errorMessage,
      });
      setAIProcessing(false);
      setIsLoading(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    // Validate length before setting
    if (trimmedText.length > 2000) {
      toast.error('Voice input too long', {
        description: 'Please keep messages under 2000 characters.',
      });
      return;
    }

    setInput(trimmedText);
    setTimeout(() => {
      const form = document.getElementById('ai-chat-form') as HTMLFormElement;
      form?.requestSubmit();
    }, 500);
  };

  // Image upload handler
  const handleImageUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const maxImages = 3;
    const maxSizeMB = 5;

    if (uploadedImages.length + files.length > maxImages) {
      toast.error('Too many images', {
        description: `Maximum ${maxImages} images allowed.`,
      });
      return;
    }

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error('Invalid file type', {
          description: 'Please upload an image file (PNG, JPG, etc.).',
        });
        return;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error('File too large', {
          description: `Maximum file size is ${maxSizeMB}MB.`,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const preview = URL.createObjectURL(file);
        const id = `img-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        setUploadedImages(prev => [...prev, {
          id,
          data: dataUrl,
          name: file.name,
          preview,
        }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }, [uploadedImages.length]);

  const removeImage = useCallback((id: string) => {
    setUploadedImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  // Debounced scroll effect to prevent excessive scrolling during streaming
  useEffect(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      scrollRef.current?.scrollTo?.({
        top: scrollRef.current?.scrollHeight ?? 0,
        behavior: 'smooth',
      });
    }, 100); // Debounce by 100ms

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages]);

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/ai/status');
        if (!response.ok) {
          throw new Error('Failed to reach AI provider');
        }
        const data = await response.json();
        if (isMounted) {
          setProviderStatus(data);
          // Update provider info from server response
          if (data.providerInfo) {
            setProviderInfo(data.providerInfo);
          }
          setStatusLoading(false);
        }
      } catch (error) {
        if (!isMounted) return;
        setProviderStatus({
          isValid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        setStatusLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const statusLabel = providerStatus
    ? providerStatus.isValid
      ? 'Connected'
      : providerStatus.error
        ? `Error: ${providerStatus.error}`
        : 'Provider unavailable'
    : statusLoading
      ? 'Checking provider...'
      : 'Provider unavailable';

  const isProviderReady = providerStatus?.isValid ?? false;

  // Show settings panel if open
  if (showSettings) {
    return <SettingsPanel onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="w-96 h-[calc(100vh-160px)] flex flex-col glass-pro-elevated rounded-xl overflow-hidden shadow-2xl">
      {/* Header - Glassmorphic */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/20 border border-primary/30">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-white">AI Copilot</h2>
            <p className="text-xxs text-white/50">
              {printerProfile ? printerProfile.name : 'Magic Lens'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Printer/Multi-color indicator */}
          {printerProfile?.multiColor.enabled && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 mr-1">
              <Zap className="w-3 h-3 text-purple-400" />
              <span className="text-xxs text-purple-300">{printerProfile.multiColor.colorCount}C</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30 border border-white/10">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full transition-colors",
              providerStatus?.isValid ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]" : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]"
            )} />
            <span className="text-xxs text-white/70">{statusLabel}</span>
          </div>

          {/* Settings button */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggle}
            aria-label="Close AI panel"
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area - Custom Scrollbar */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/40 p-6 text-center">
            {showOnboarding && !userPreferences.onboardingComplete ? (
              // Onboarding prompt for new users
              <>
                <div className="p-3 rounded-full bg-purple-500/10 mb-4">
                  <Zap className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-sm font-medium text-white/80 mb-2">Welcome to VoiceForge 3D!</h3>
                <p className="text-xs text-white/50 max-w-[240px] leading-relaxed mb-4">
                  Let's set up your printer to optimize every design for your specific hardware.
                </p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
                >
                  Set Up Printer
                </button>
                <button
                  onClick={async () => {
                    await completeOnboarding({});
                    setShowOnboarding(false);
                  }}
                  className="mt-2 text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  Skip for now
                </button>
              </>
            ) : (
              // Normal empty state
              <>
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Bot className="w-8 h-8 text-primary/60" />
                </div>
                <h3 className="text-sm font-medium text-white/80 mb-1">Start Designing</h3>
                <p className="text-xs text-white/50 max-w-[220px] leading-relaxed mb-3">
                  {printerProfile
                    ? `Optimized for ${printerProfile.name}`
                    : 'Try "Create a 50mm box" or "Add a screw hole"'
                  }
                </p>
                {printerProfile?.multiColor.enabled && (
                  <p className="text-xxs text-purple-400/70 max-w-[200px]">
                    💡 Tip: Ask for multi-color designs! You have {printerProfile.multiColor.colorCount} colors available.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => {
          const content = message.parts
            ? message.parts.map(part => (part.type === 'text' ? part.text : '')).join('')
            : ('content' in message && typeof message.content === 'string' ? message.content : 'Message');

          return (
            <div key={message.id} className={cn("flex gap-2 animate-slide-up-fade", message.role === 'user' ? "flex-row-reverse" : "")}>
              <div className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-1 border text-xs font-bold",
                message.role === 'user'
                  ? "bg-primary/30 border-primary/50 text-primary"
                  : "bg-white/10 border-white/20 text-white/70"
              )}>
                {message.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              </div>

              <div className={cn(
                "text-xs rounded-lg px-3 py-2 max-w-xs leading-relaxed border overflow-hidden",
                message.role === 'user'
                  ? "bg-primary/20 text-white border-primary/30"
                  : "bg-white/5 text-white/90 border-white/10"
              )}>
                {message.role === 'assistant' ? (
                  <FormattedAIResponse content={content} />
                ) : (
                  content
                )}
              </div>
            </div>
          );
        })}

        {/* Loading State */}
        {isLoading && (
          <div className="flex gap-2 animate-slide-up-fade">
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center mt-1 border border-white/20">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
            </div>
            <div className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-primary/60 animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-primary/60 animate-pulse delay-100" />
                <div className="w-1 h-1 rounded-full bg-primary/60 animate-pulse delay-200" />
              </div>
              <span className="text-xxs text-white/50">Thinking...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {providerStatus && !providerStatus.isValid && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-2 animate-slide-up-fade">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-red-400 text-xs font-medium">Provider Error</div>
              <div className="text-red-300/70 text-xxs">{providerStatus.error}</div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Glassmorphic */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-t from-black/40 to-transparent">
        {/* Image Upload Preview */}
        {uploadedImages.length > 0 && (
          <div className="mb-3 flex gap-2 flex-wrap">
            {uploadedImages.map(img => (
              <div key={img.id} className="relative group">
                <img
                  src={img.preview}
                  alt={img.name}
                  className="w-16 h-16 object-cover rounded-lg border border-white/20"
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] truncate px-1 rounded-b-lg">
                  {img.name.substring(0, 10)}
                </div>
              </div>
            ))}
          </div>
        )}

        <VoiceInput onTranscript={handleVoiceTranscript} />

        {/* Hidden file input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleImageUpload(e.target.files)}
          className="hidden"
        />

        <form id="ai-chat-form" onSubmit={onSubmit} className="mt-3 relative">
          <div className="flex gap-2">
            {/* Image upload button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isLoading || !isProviderReady || uploadedImages.length >= 3}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Upload reference image"
            >
              <ImagePlus className="w-4 h-4" />
            </button>

            {/* Text input */}
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={uploadedImages.length > 0 ? "Describe what you want based on this image..." : "What do you want to build?"}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-10 py-2 text-sm text-white placeholder:text-white/40 input-glow disabled:opacity-40 transition-all"
                disabled={isLoading || !isProviderReady}
              />
              <button
                type="submit"
                disabled={isLoading || !input?.trim() || !isProviderReady}
                className="absolute right-1.5 top-1.5 p-1.5 bg-primary/80 hover:bg-primary text-white rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>

        <div className="flex justify-between items-center mt-3 px-1 text-xxs text-white/50">
          <span className="truncate">
            {providerInfo.model} {providerInfo.isLocal ? '(local)' : ''}
          </span>
          <span className="ml-2">⌘K</span>
        </div>
      </div>
    </div>
  );
}
