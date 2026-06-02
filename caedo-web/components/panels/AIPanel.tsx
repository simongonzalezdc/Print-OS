'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { toast } from 'sonner';
import { useSceneStore } from '@/lib/scene/store';
import { SettingsPanel } from './SettingsPanel';
import {
  UserPreferences,
  loadUserPreferences,
  DEFAULT_PREFERENCES
} from '@/lib/storage/user-preferences';
import { getPrinterProfile, PrinterProfile } from '@/lib/constants/printer-profiles';
import { VersionManager } from '@/lib/storage/versioning';
import {
  parseStructuredResponse,
} from '@/lib/ai/structured-response';

// Sub-components
import { AIPanelHeader } from './ai/AIPanelHeader';
import { AIPanelMessages } from './ai/AIPanelMessages';
import { AIPanelInput } from './ai/AIPanelInput';

interface AIPanelProps {
  /** Callback function to toggle panel expansion */
  onToggle: () => void;
  /** Initial prompt to populate the input with */
  initialInput?: string;
}

interface ProviderStatus {
  isValid: boolean;
  error?: string;
  providerInfo?: ProviderInfo;
}

interface ProviderInfo {
  provider: string;
  model: string;
  isLocal: boolean;
}

interface UploadedImage {
  id: string;
  data: string;  // base64 data URL
  name: string;
  preview: string;  // blob URL for preview
}

/**
 * AI Assistant Panel Component
 */
export function AIPanel({ onToggle, initialInput }: AIPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);
  const [input, setInput] = useState(initialInput || '');
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Settings and preferences state
  const [showSettings, setShowSettings] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [printerProfile, setPrinterProfile] = useState<PrinterProfile | null>(null);

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const objects = useSceneStore((state) => state.objects);
  const selectedIds = useSceneStore((state) => state.selectedIds);
  const setAIProcessing = useSceneStore((state) => state.setAIProcessing);
  const addObject = useSceneStore((state) => state.addObject);
  const updateObject = useSceneStore((state) => state.updateObject);
  const setStorePrinterProfile = useSceneStore((state) => state.setPrinterProfile);

  const [providerInfo, setProviderInfo] = useState<ProviderInfo>({
    provider: 'loading',
    model: '...',
    isLocal: false,
  });

  // Load user preferences
  useEffect(() => {
    const loadPrefs = async () => {
      const prefs = await loadUserPreferences();
      setUserPreferences(prefs);
      const profile = getPrinterProfile(prefs.printer.profileId);
      setPrinterProfile(profile);
      setStorePrinterProfile(profile);

      // const needsSetup = await needsOnboarding();
      // if (needsSetup) {
      //   setShowOnboarding(true);
      // }
    };
    loadPrefs();
  }, [showSettings, setStorePrinterProfile]);

  /**
   * Extract JSCAD code from AI response text.
   */
  const extractJSCADCode = (text: string): string | null => {
    const patterns = [
      /```(?:javascript|jscad|js|typescript|ts)?[\s\r\n]*([\s\S]*?)```/g,
      /(?:const|function|import)\s+(?:jscad|main|\{[^}]*\})\s*=?[\s\S]*?(?=\n\n|$)/g,
    ];

    for (const regex of patterns) {
      const matches = [...text.matchAll(regex)];
      if (matches.length > 0) {
        const lastMatch = matches.at(-1);
        const code = lastMatch?.[1]?.trim() || lastMatch?.[0]?.trim();
        if (!code) continue;
        const jscadKeywords = ['main', 'cuboid', 'cylinder', 'sphere', 'union', 'subtract', 'intersect', '@jscad', 'primitives', 'roundedCuboid'];
        const hasJscadCode = jscadKeywords.some(keyword => code.includes(keyword));
        if (hasJscadCode) return code;
      }
    }
    return null;
  };

  const sceneContext = useMemo(() => {
    const allObjects = Array.from(objects.values());
    // Prioritize selected objects, then recently updated ones
    const sortedObjects = [...allObjects].sort((a, b) => {
      const aSelected = selectedIds.has(a.id) ? 1 : 0;
      const bSelected = selectedIds.has(b.id) ? 1 : 0;
      if (aSelected !== bSelected) return bSelected - aSelected;
      return b.updatedAt - a.updatedAt;
    });

    // Limit to top 10 relevant objects to keep context small
    const relevantObjects = sortedObjects.slice(0, 10);

    return {
      objects: relevantObjects.map(obj => ({
        id: obj.id,
        name: obj.name,
        type: 'jscad',
        position: obj.position,
        rotation: obj.rotation,
        scale: obj.scale,
        selected: selectedIds.has(obj.id),
        // Include bounding box if available for spatial awareness
        boundingBox: obj.validation?.stats?.boundingBox,
        // Include AI summary if available
        summary: obj.aiSummary,
      })),
      selectedIds: Array.from(selectedIds),
    };
  }, [objects, selectedIds]);

  const existingCode = useMemo(() => {
    const selectedIdArray = Array.from(selectedIds);
    if (selectedIdArray.length === 1) {
      const selectedId = selectedIdArray[0];
      if (selectedId) {
        const selectedObj = objects.get(selectedId);
        if (selectedObj?.jscadCode) return selectedObj.jscadCode;
      }
    }
    const allObjects = Array.from(objects.values());
    if (allObjects.length > 0) {
      const lastObj = allObjects[allObjects.length - 1];
      if (lastObj?.jscadCode) return lastObj.jscadCode;
    }
    return undefined;
  }, [objects, selectedIds]);

  const fullContext = useMemo(() => ({
    sceneContext,
    existingCode,
    printerProfile: printerProfile ? {
      id: printerProfile.id,
      name: printerProfile.name,
      manufacturer: printerProfile.manufacturer,
      buildVolume: printerProfile.buildVolume,
      nozzle: printerProfile.nozzle,
      multiColor: printerProfile.multiColor,
      bedType: printerProfile.bedType,
      dfm: printerProfile.dfm,
    } : undefined,
    userPreferences,
  }), [sceneContext, existingCode, printerProfile, userPreferences]);

  const handleFinish = useCallback((event: { messages?: unknown[] }) => {
    if (!isProcessingRef.current) return;
    isProcessingRef.current = false;

    setAIProcessing(false);
    setIsLoading(false);

    const messagesArray = (event.messages || []) as Array<{ role: string; parts?: unknown[]; content?: string }>;
    const lastAssistantMessage = messagesArray.filter((m) => m.role === 'assistant').pop();

    if (lastAssistantMessage) {
      const assistantMsg = lastAssistantMessage as { parts?: Array<{ type: string; text: string }>; content?: string };
      const content = assistantMsg.parts
        ? assistantMsg.parts.map((part) => (part.type === 'text' ? part.text : '')).join('')
        : assistantMsg.content || '';

      const structured = parseStructuredResponse(content);
      const isDesignResponse = structured && 'code' in structured;
      const designResponse = structured as { code: string; parameters?: { name?: string }; summary?: string; dfmChecks?: string[] };
      let jscadCode = isDesignResponse ? designResponse.code : null;
      if (!jscadCode) {
        jscadCode = extractJSCADCode(content);
      }

      if (jscadCode) {
        try {
          const objectName = isDesignResponse && typeof designResponse.parameters?.name === 'string'
            ? designResponse.parameters.name
            : 'AI Generated Object';

          const selectedIdArray = Array.from(selectedIds);
          const allObjects = Array.from(objects.values());
          const existingObjectId = selectedIdArray.length === 1
            ? selectedIdArray[0]
            : (allObjects.length > 0 ? allObjects[allObjects.length - 1]?.id : null);

          let objectId: string;

          if (existingObjectId) {
            const existingObj = objects.get(existingObjectId);
            if (existingObj?.jscadCode) {
              updateObject(existingObjectId, {
                jscadCode: jscadCode,
                meshData: undefined,
              });
              objectId = existingObjectId;
              toast.success('Object updated!');
            } else {
              objectId = addObject(jscadCode, objectName);
              toast.success('Object created!');
            }
          } else {
            objectId = addObject(jscadCode, objectName);
            toast.success('Object created!');
          }

          if (isDesignResponse) {
            updateObject(objectId, {
              aiSummary: designResponse.summary,
              aiParameters: designResponse.parameters,
              aiDfMNotes: designResponse.dfmChecks,
            });
          }

          // Save to local version history
          VersionManager.saveVersion(
            objectId, 
            jscadCode, 
            `AI: ${designResponse.summary?.slice(0, 30) || 'Design Update'}`,
            messagesArray.filter(m => m.role === 'user').pop()?.content
          ).catch(err => console.error('Failed to save version:', err));

          // Trigger memory extraction to learn user preferences
          fetch('/api/v1/ai/memory/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              messages: messagesArray.map(m => ({
                role: m.role,
                content: m.content || (Array.isArray(m.parts) ? m.parts.map((p) => (
                  typeof p === 'object' && p !== null && 'text' in p && typeof p.text === 'string' ? p.text : ''
                )).join('') : '')
              }))
            })
          }).catch(err => console.error('Failed to extract memories:', err));

        } catch (error) {
          console.error('Finalization error:', error);
          toast.error('Failed to update scene');
        }
      }
    }

    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, [addObject, updateObject, setAIProcessing, objects, selectedIds]);

  const handleError = useCallback((error: Error) => {
    isProcessingRef.current = false;
    toast.error('AI chat error', { description: error.message });
    setAIProcessing(false);
    setIsLoading(false);
  }, [setAIProcessing]);

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/v1/ai/generate',
  }), []);

  const chatResult = useChat({
    transport,
    onFinish: handleFinish,
    onError: handleError,
    experimental_throttle: 50,
  });

  const { messages, sendMessage } = chatResult;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput && uploadedImages.length === 0) return;
    if (trimmedInput.length > 2000) {
      toast.error('Message too long');
      return;
    }

    setAIProcessing(true);
    setIsLoading(true);
    isProcessingRef.current = true;

    try {
      const bodyWithImages: Record<string, unknown> = {
        ...fullContext,
        images: uploadedImages.map(img => ({
          name: img.name,
          data: img.data,
        })),
      };

      const messageOptions: { body: Record<string, unknown>; experimental_attachments?: Array<{ name: string; contentType: string; url: string }> } = {
        body: bodyWithImages,
      };

      if (uploadedImages.length > 0) {
        messageOptions.experimental_attachments = uploadedImages.map(img => ({
          name: img.name,
          contentType: 'image/png',
          url: img.data,
        }));
      }

      await sendMessage({ text: trimmedInput }, messageOptions);
      uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
      setUploadedImages([]);
      setInput('');
    } catch {
      isProcessingRef.current = false;
      toast.error('Failed to send message');
      setAIProcessing(false);
      setIsLoading(false);
    }
  };

  const handleImageUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const preview = URL.createObjectURL(file);
        const id = `img-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setUploadedImages(prev => [...prev, { id, data: dataUrl, name: file.name, preview }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeImage = useCallback((id: string) => {
    setUploadedImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) URL.revokeObjectURL(image.preview);
      return prev.filter(img => img.id !== id);
    });
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/v1/ai/status');
        const data = await response.json();
        setProviderStatus(data);
        if (data.providerInfo) setProviderInfo(data.providerInfo);
        setStatusLoading(false);
      } catch {
        setProviderStatus({ isValid: false, error: 'Link offline' });
        setStatusLoading(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/10 overflow-hidden relative shadow-2xl noise-overlay">
      <AIPanelHeader
        statusLoading={statusLoading}
        providerStatus={providerStatus}
        providerInfo={providerInfo}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onTogglePanel={onToggle}
      />

      <AIPanelMessages
        messages={messages as Array<{ id: string; role: 'user' | 'assistant' | 'system' | 'data'; content: string; parts?: unknown[] }>}
        isLoading={isLoading}
        scrollRef={scrollRef}
      />

      <AIPanelInput
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        onSubmit={onSubmit}
        uploadedImages={uploadedImages}
        onRemoveImage={removeImage}
        onImageUpload={handleImageUpload}
        imageInputRef={imageInputRef}
        onVoiceTranscript={(text) => setInput(text)}
      />

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
