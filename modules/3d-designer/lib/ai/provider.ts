import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { AI_PROVIDERS, AI } from '@/lib/constants';

/**
 * Create AI provider instance based on environment configuration.
 * Supports multiple providers: Ollama, Anthropic, OpenAI, Groq, etc.
 */
export function createAIProvider() {
  const provider = AI.DEFAULT_PROVIDER;

  switch (provider) {
    case AI_PROVIDERS.OLLAMA:
      return createOllamaProvider();

    case AI_PROVIDERS.ANTHROPIC:
      return createAnthropicProvider();

    case AI_PROVIDERS.OPENAI:
      return createOpenAIProvider();

    case AI_PROVIDERS.GOOGLE:
      return createGoogleProvider();

    case AI_PROVIDERS.GROQ:
      return createGroqProvider();

    case AI_PROVIDERS.OPENROUTER:
      return createOpenRouterProvider();

    case AI_PROVIDERS.TOGETHER:
      return createTogetherProvider();

    case AI_PROVIDERS.ZAI:
      return createZAIProvider();

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

/**
 * Ollama (Local AI)
 * Uses OpenAI-compatible endpoint for better stability with AI SDK v2+
 */
function createOllamaProvider() {
  const baseUrlEnv = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  // Ensure it points to the v1 compatible endpoint
  const baseURL = baseUrlEnv.includes('/v1') ? baseUrlEnv : `${baseUrlEnv.replace(/\/$/, '')}/v1`;
  const model = process.env.OLLAMA_MODEL || AI.DEFAULT_MODELS.ollama;

  const ollama = createOpenAI({
    baseURL,
    apiKey: 'ollama', // Required but not checked by Ollama
  });

  // Use .chat() method for chat completions endpoint
  return ollama.chat(model);
}

/**
 * Anthropic Claude
 */
function createAnthropicProvider() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || AI.DEFAULT_MODELS.anthropic;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required when using Anthropic provider');
  }

  return anthropic(model);
}

/**
 * OpenAI GPT
 */
function createOpenAIProvider() {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || AI.DEFAULT_MODELS.openai;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required when using OpenAI provider');
  }

  return openai(model);
}

/**
 * Google Gemini
 */
function createGoogleProvider() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const model = process.env.GOOGLE_AI_MODEL || AI.DEFAULT_MODELS.google;

  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is required when using Google provider');
  }

  return google(model);
}

/**
 * Groq (via OpenAI compatibility)
 */
function createGroqProvider() {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || AI.DEFAULT_MODELS.groq;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is required when using Groq provider');
  }

  // Groq uses OpenAI-compatible API
  return openai(model);
}

/**
 * OpenRouter (multi-provider)
 */
function createOpenRouterProvider() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || AI.DEFAULT_MODELS.openrouter;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is required when using OpenRouter provider');
  }

  // OpenRouter uses OpenAI-compatible API
  return openai(model);
}

/**
 * Together AI (open source models)
 */
function createTogetherProvider() {
  const apiKey = process.env.TOGETHER_API_KEY;
  const model = process.env.TOGETHER_MODEL || AI.DEFAULT_MODELS.together;

  if (!apiKey) {
    throw new Error('TOGETHER_API_KEY is required when using Together provider');
  }

  // Together uses OpenAI-compatible API
  return openai(model);
}

/**
 * Z.AI / GLM-4.6V (via OpenAI-compatible API)
 * Uses the Z.AI Coding Plan endpoint by default (for coding subscribers)
 * Docs: https://docs.z.ai/guides/vlm/glm-4.6v
 * 
 * The Coding Plan endpoint supports GLM-4.6V for visual code generation.
 * Set ZAI_BASE_URL to https://api.z.ai/api/paas/v4 if not using Coding Plan.
 */
function createZAIProvider() {
  const apiKey = process.env.ZAI_API_KEY;
  const model = process.env.ZAI_MODEL || AI.DEFAULT_MODELS.zai;
  // Coding Plan endpoint by default (supports vision for code generation)
  // Override with ZAI_BASE_URL if using standard API
  const baseURL = process.env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4';

  if (!apiKey) {
    throw new Error('ZAI_API_KEY is required when using Z.AI provider');
  }

  // Z.AI uses OpenAI-compatible API
  const zai = createOpenAI({
    baseURL,
    apiKey,
  });

  return zai.chat(model);
}

/**
 * Validate AI provider configuration
 */
export function validateAIProvider(): { isValid: boolean; error?: string } {
  try {
    // Try to create provider - will throw if config is missing
    createAIProvider();
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
  const provider = AI.DEFAULT_PROVIDER;
  const model = getCurrentModel();

  return {
    provider,
    model,
    isLocal: provider === AI_PROVIDERS.OLLAMA,
  };
}

/**
 * Get the current model being used
 */
function getCurrentModel(): string {
  const provider = AI.DEFAULT_PROVIDER;

  switch (provider) {
    case AI_PROVIDERS.OLLAMA:
      return process.env.OLLAMA_MODEL || AI.DEFAULT_MODELS.ollama;
    case AI_PROVIDERS.ANTHROPIC:
      return process.env.ANTHROPIC_MODEL || AI.DEFAULT_MODELS.anthropic;
    case AI_PROVIDERS.OPENAI:
      return process.env.OPENAI_MODEL || AI.DEFAULT_MODELS.openai;
    case AI_PROVIDERS.GOOGLE:
      return process.env.GOOGLE_AI_MODEL || AI.DEFAULT_MODELS.google;
    case AI_PROVIDERS.GROQ:
      return process.env.GROQ_MODEL || AI.DEFAULT_MODELS.groq;
    case AI_PROVIDERS.OPENROUTER:
      return process.env.OPENROUTER_MODEL || AI.DEFAULT_MODELS.openrouter;
    case AI_PROVIDERS.TOGETHER:
      return process.env.TOGETHER_MODEL || AI.DEFAULT_MODELS.together;
    case AI_PROVIDERS.ZAI:
      return process.env.ZAI_MODEL || AI.DEFAULT_MODELS.zai;
    default:
      return 'unknown';
  }
}
