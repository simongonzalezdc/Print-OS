import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { AI_PROVIDERS, AI } from '@/lib/constants';

/**
 * Create AI provider instance based on environment configuration.
 */
export function createAIProvider(requestedModel?: string) {
  // Check for Anthropic if model suggests it
  if (requestedModel?.startsWith('claude') || process.env.ANTHROPIC_API_KEY) {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    if (requestedModel?.startsWith('claude')) {
      return anthropic(requestedModel);
    }
    // Fallback to Claude 3.5 Sonnet if images are present and no specific model requested
    if (requestedModel === 'vision-preferred') {
      return anthropic('claude-3-5-sonnet-20241022');
    }
  }

  const apiKey = process.env.ZAI_API_KEY;
  const model = requestedModel || process.env.ZAI_MODEL || AI.DEFAULT_MODELS.zai;
  // Coding Plan endpoint by default (supports vision for code generation)
  const baseURL = process.env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4';

  if (!apiKey) {
    throw new Error('ZAI_API_KEY is required for GLM-4.7');
  }

  // Z.AI uses OpenAI-compatible API
  const zai = createOpenAI({
    baseURL,
    apiKey,
  });

  return zai.chat(model);
}

/**
 * Helper for robust API calls with exponential backoff.
 * Useful for non-streaming AI calls.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Exponential backoff: 1s, 2s, 4s...
      const delay = baseDelay * Math.pow(2, i);
      console.warn(`[AI] Request failed, retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Validate AI provider configuration
 */
export function validateAIProvider(): { isValid: boolean; error?: string } {
  try {
    const apiKey = process.env.ZAI_API_KEY;
    if (!apiKey) throw new Error('ZAI_API_KEY is missing');
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get provider info for UI display
 */
export function getProviderInfo() {
  return {
    provider: AI_PROVIDERS.ZAI,
    model: AI.DEFAULT_MODELS.zai,
    isLocal: false,
  };
}
