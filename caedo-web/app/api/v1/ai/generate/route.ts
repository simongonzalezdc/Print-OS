import { NextRequest, NextResponse } from 'next/server';
import { streamText, LanguageModel } from 'ai';
import { createAIProvider } from '@/lib/ai/provider';
import { classifyRequest } from '@/lib/ai/classifier';
import { generateCacheKey, getCachedResponse, setCachedResponse } from '@/lib/ai/cache';
import { buildSystemPrompt, buildRefinementPrompt, SystemPromptContext } from '@/lib/ai/system-prompt';
import { checkAIRateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_CONFIG } from '@/lib/constants';
import { PrinterProfile } from '@/lib/constants/printer-profiles';
import { UserPreferences } from '@/lib/storage/user-preferences';
import { log } from '@/lib/logger';

// AI SDK 5.0 message part types
type MessagePart = { type: 'text'; text: string } | { type: string;[key: string]: unknown };

// AI SDK 5.0 message format - can have either content (string) or parts (array)
type AIMessage = {
  role: 'user' | 'assistant' | 'system';
  content?: string;
  parts?: MessagePart[];
};

// Scene context for current objects
type SceneContext = {
  objects: Array<{
    id: string;
    name: string;
    type: string;
    position: [number, number, number];
    selected: boolean;
  }>;
  selectedIds: string[];
};

type ImageData = {
  name: string;
  data: string;  // base64 data URL
};

type GenerateRequestBody = {
  prompt?: string;
  messages?: AIMessage[];
  sceneContext?: SceneContext;
  printerProfile?: Partial<PrinterProfile>;
  userPreferences?: Partial<UserPreferences>;
  existingCode?: string;
  images?: ImageData[];  // Reference images for multi-modal AI
};

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded && forwarded.trim()) {
    const ips = forwarded.split(',');
    const firstIP = ips[0];
    return firstIP ? firstIP.trim() : 'unknown';
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP && realIP.trim()) {
    return realIP.trim();
  }

  return 'unknown';
}

/**
 * Request validation with enhanced security
 */
function validateRequest(body: unknown): { isValid: boolean; error?: string; data?: GenerateRequestBody } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be valid JSON' };
  }

  const data = body as Partial<GenerateRequestBody>;

  // Validate prompt
  if (data.prompt) {
    if (typeof data.prompt !== 'string') {
      return { isValid: false, error: 'Prompt must be a string' };
    }
    if (data.prompt.length > 5000) {
      return { isValid: false, error: 'Prompt too long (max 5000 characters)' };
    }
  }

  // Validate messages - supports both AI SDK 4.x (content string) and 5.x (parts array)
  if (data.messages) {
    if (!Array.isArray(data.messages)) {
      return { isValid: false, error: 'Messages must be an array' };
    }
    if (data.messages.length > 20) {
      return { isValid: false, error: 'Too many messages (max 20)' };
    }

    for (const message of data.messages) {
      if (!message || typeof message !== 'object') {
        return { isValid: false, error: 'Invalid message format' };
      }

      const { role, content, parts } = message as { role?: string; content?: string; parts?: unknown[] };

      if (!role || !['user', 'assistant', 'system'].includes(role)) {
        return { isValid: false, error: 'Invalid message role' };
      }

      // AI SDK 5.0 uses parts array, 4.x uses content string
      // Accept either format
      if (content !== undefined && typeof content !== 'string') {
        return { isValid: false, error: 'Message content must be a string' };
      }
      if (parts !== undefined && !Array.isArray(parts)) {
        return { isValid: false, error: 'Message parts must be an array' };
      }

      // Only validate USER message length - assistant messages can be longer (they contain code)
      if (role === 'user') {
        let textContent = '';
        if (typeof content === 'string') {
          textContent = content;
        } else if (Array.isArray(parts)) {
          textContent = parts
            .filter((p): p is { type: 'text'; text: string } =>
              typeof p === 'object' && p !== null && (p as { type?: string }).type === 'text')
            .map(p => p.text)
            .join('');
        }

        if (textContent.length > 2000) {
          return { isValid: false, error: 'Message too long (max 2000 characters)' };
        }
      }
    }
  }

  // Validate existingCode
  if (data.existingCode && typeof data.existingCode !== 'string') {
    return { isValid: false, error: 'Existing code must be a string' };
  }

  if (data.existingCode && data.existingCode.length > 50000) {
    return { isValid: false, error: 'Existing code too long (max 50000 characters)' };
  }

  return { isValid: true, data: data as GenerateRequestBody };
}

/**
 * POST /api/ai/generate
 *
 * Generate JSCAD code from natural language prompts.
 * Supports iterative refinement and scene context.
 */
export async function POST(request: NextRequest) {
  try {
    // Distributed Rate limiting using Upstash Redis
    const clientId = getClientIP(request);
    const ratelimit = await checkAIRateLimit(clientId);

    if (!ratelimit.success) {
      log.warn('[AI Route] Rate limit exceeded for client:', clientId);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before making another request.',
          retryAfter: Math.ceil((ratelimit.reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': ratelimit.limit.toString(),
            'X-RateLimit-Remaining': ratelimit.remaining.toString(),
            'X-RateLimit-Reset': ratelimit.reset.toString(),
          }
        }
      );
    }

    // Parse and validate request
    let body: GenerateRequestBody;
    try {
      const rawBody = await request.json();
      const validation = validateRequest(rawBody);

      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      body = validation.data!;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { prompt, messages = [], existingCode, sceneContext, printerProfile, userPreferences, images = [] } = body;

    // Helper to extract text content from a message (supports both AI SDK 4.x and 5.x formats)
    const getMessageContent = (msg: AIMessage): string => {
      if (typeof msg.content === 'string') {
        return msg.content;
      }
      if (Array.isArray(msg.parts)) {
        return msg.parts
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
          .map(p => p.text)
          .join('');
      }
      return '';
    };

    // Find the last user message
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((message) => message.role === 'user');

    const userPrompt = prompt?.trim() || (lastUserMessage ? getMessageContent(lastUserMessage).trim() : '');

    if (!userPrompt) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Classify request for optimal model routing
    const classification = classifyRequest({
      prompt: userPrompt,
      hasImages: images.length > 0,
      objectCount: sceneContext?.objects.length || 0,
      existingCode
    });

    log.info('[AI Route] Classification:', classification.model, '(', classification.complexity, ') - Reason:', classification.reason);

    // Fetch AI Memory from backend
    let aiMemory = [];
    try {
        const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
        const memoryRes = await fetch(`${backendUrl}/api/v1/ai/memory`);
        if (memoryRes.ok) {
            aiMemory = await memoryRes.json();
        }
    } catch (error) {
        log.error('Failed to fetch AI memory from backend:', error);
    }

    // Create AI provider with classified model
    let provider: LanguageModel;
    try {
        const providerInstance = createAIProvider(classification.model);
        provider = providerInstance as LanguageModel;
    } catch (error) {
        log.error('AI provider creation failed:', error);
        return NextResponse.json(
            { error: 'AI service unavailable. Please check configuration.' },
            { status: 503 }
        );
    }

    // Build system prompt with full context (printer profile, user preferences, scene, memory)
    const promptContext: SystemPromptContext = {
      sceneContext: sceneContext as SystemPromptContext['sceneContext'],
      printerProfile: printerProfile as PrinterProfile | undefined,
      userPreferences: userPreferences as UserPreferences | undefined,
      aiMemory: aiMemory,
    };

    const systemPrompt = existingCode
      ? buildRefinementPrompt(existingCode, userPrompt)
      : buildSystemPrompt(promptContext);

    // Cache lookup
    const cacheKey = generateCacheKey(systemPrompt, userPrompt, sceneContext);
    const cached = await getCachedResponse(cacheKey);

    if (cached) {
      log.info('[AI Route] Cache Hit:', cacheKey);
      // Return cached response in a format compatible with useChat
      // useChat expects a stream or a specific JSON format
      return NextResponse.json([
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: cached.text,
          createdAt: new Date(),
        }
      ]);
    }

    // Create a promise that rejects after timeout with proper cleanup
    let timeoutId: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, RATE_LIMIT_CONFIG.TIMEOUT_MS);
    });

    try {
      // Build the content array for multi-modal support
      // If images are present, use messages format with image parts
      type ContentPart = { type: 'text'; text: string } | { type: 'image'; image: string };
      const userContent: ContentPart[] = [{ type: 'text', text: userPrompt }];

      // Add images if present (for vision-capable models)
      if (images.length > 0) {
        log.info('[AI Route] Processing', images.length, 'images for multi-modal request');
        for (const img of images) {
          // img.data is a data URL like "data:image/png;base64,..."
          userContent.push({
            type: 'image',
            image: img.data,
          });
        }
      }

      const result = await Promise.race([
        streamText({
          model: provider,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userContent }
          ],
          maxRetries: 3,
          temperature: 0.1,
          maxOutputTokens: 65536, // Maximum output for GLM-4.6 max plan - full thinking + code
          onFinish: async ({ text, usage }) => {
            log.info('AI generation completed:', text.length, 'characters');

            // Save to cache
            await setCachedResponse(cacheKey, {
              text,
              model: classification.model,
              timestamp: Date.now()
            });

            // Log usage to backend for cost tracking
            try {
              const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
              const promptTokens = (usage as any).promptTokens || 0;
              const completionTokens = (usage as any).completionTokens || 0;
              
              await fetch(`${backendUrl}/api/v1/ai/usage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  feature: 'code_generation',
                  model: classification.model,
                  prompt_tokens: promptTokens,
                  completion_tokens: completionTokens,
                  client_id: clientId,
                  endpoint: '/api/v1/ai/generate'
                }),
              });
            } catch (error) {
              log.error('Failed to log AI usage to backend:', error);
            }
          },
          onError: ({ error }) => {
            log.error('AI streaming error:', error);
          },
        }),
        timeoutPromise
      ]);

      // Use toUIMessageStreamResponse() for compatibility with useChat from @ai-sdk/react (AI SDK 5.0+)
      // toTextStreamResponse() returns raw text which useChat cannot parse into messages
      return result.toUIMessageStreamResponse();

    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (error instanceof Error && error.message === 'Request timeout') {
        return NextResponse.json(
          {
            success: false,
            error_code: 'TIMEOUT',
            error_message: 'Request timeout. Please try a simpler prompt.',
            required_fields: [],
            fallback_used: false
          },
          { status: 408 }
        );
      }

      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

  } catch (error) {
    log.error('AI generation error:', error);

    // Provide user-friendly error messages
    let errorMessage = 'Failed to generate code';
    let errorCode = 'INTERNAL_ERROR';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'AI service is currently busy. Please try again.';
        errorCode = 'TIMEOUT';
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait before trying again.';
        errorCode = 'RATE_LIMIT';
        statusCode = 429; // Too Many Requests
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.';
        errorCode = 'NETWORK_ERROR';
        statusCode = 502; // Bad Gateway
      } else if (error.message.includes('API key') || error.message.includes('authentication')) {
        errorMessage = 'AI service configuration error. Please contact support.';
        errorCode = 'AUTH_ERROR';
        statusCode = 503; // Service Unavailable
      }
    }

    return NextResponse.json(
      {
        success: false,
        error_code: errorCode,
        error_message: errorMessage,
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/ai/generate/status
 *
 * Check the status of a generation task (for future async processing)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json(
      { error: 'taskId parameter is required' },
      { status: 400 }
    );
  }

  // For now, return completed status
  // Future: Implement async task queue for complex generations
  return NextResponse.json({
    taskId,
    status: 'completed',
    result: 'Task completed successfully'
  });
}
