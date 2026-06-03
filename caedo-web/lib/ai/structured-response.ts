export interface DesignExplanation {
  whatIBuilt?: string;
  whatChanged?: string;
  designDecisions?: string[];
  dimensions?: Record<string, string>;
  printNotes?: string;
  beforeAfter?: {
    before: string;
    after: string;
  };
}

export interface ClarifyResponse {
  mode: 'clarify';
  understanding: string;
  questions: string[];
  assumptions: string;
}

export interface DesignResponse {
  mode: 'design';
  summary: string;
  explanation?: DesignExplanation;
  parameters: Record<string, string | number>;
  dfmChecks: string[];
  warnings: string[];
  suggestions?: string[];
  code: string;
}

// Union type for all possible responses
export type StructuredAIResponse = ClarifyResponse | DesignResponse;

// Legacy interface for backwards compatibility
export interface LegacyStructuredResponse {
  summary: string;
  parameters: Record<string, string | number>;
  dfmChecks: string[];
  warnings: string[];
  code: string;
}

// Type guards
export function isClarifyResponse(response: StructuredAIResponse): response is ClarifyResponse {
  return response.mode === 'clarify';
}

export function isDesignResponse(response: StructuredAIResponse): response is DesignResponse {
  return response.mode === 'design' || (!('mode' in response) && 'code' in response);
}

/**
 * Parse the assistant response into the structured payload required by our guardrails.
 * Returns null if the response does not contain the required JSON block.
 * 
 * Supports two modes:
 * - "clarify": AI is asking clarifying questions
 * - "design": AI is delivering a design with explanation
 */
export function parseStructuredResponse(content: string): StructuredAIResponse | null {
  if (!content?.trim()) return null;

  const jsonPayload = extractJsonPayload(content);
  if (!jsonPayload) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonPayload);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    // Check if this is a clarification response
    if (parsed.mode === 'clarify') {
      const understanding = typeof parsed.understanding === 'string' ? parsed.understanding.trim() : '';
      const questions = Array.isArray(parsed.questions) ? parsed.questions.map(String) : [];
      const assumptions = typeof parsed.assumptions === 'string' ? parsed.assumptions.trim() : '';

      if (questions.length === 0) {
        return null;
      }

      return {
        mode: 'clarify',
        understanding,
        questions,
        assumptions,
      };
    }

    // Otherwise, it's a design response
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
    const parameters = isRecord(parsed.parameters) ? parsed.parameters : {};
    const dfmChecks = Array.isArray(parsed.dfmChecks) ? parsed.dfmChecks.map(String) : [];
    const warnings = Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : [];
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : [];
    const code = typeof parsed.code === 'string' ? stripCodeFence(parsed.code) : '';

    // Parse explanation object
    let explanation: DesignExplanation | undefined;
    if (parsed.explanation && typeof parsed.explanation === 'object') {
      explanation = {
        whatIBuilt: typeof parsed.explanation.whatIBuilt === 'string' ? parsed.explanation.whatIBuilt : undefined,
        whatChanged: typeof parsed.explanation.whatChanged === 'string' ? parsed.explanation.whatChanged : undefined,
        designDecisions: Array.isArray(parsed.explanation.designDecisions) 
          ? parsed.explanation.designDecisions.map(String) 
          : undefined,
        dimensions: isRecord(parsed.explanation.dimensions) 
          ? Object.fromEntries(Object.entries(parsed.explanation.dimensions).map(([k, v]) => [k, String(v)]))
          : undefined,
        printNotes: typeof parsed.explanation.printNotes === 'string' ? parsed.explanation.printNotes : undefined,
        beforeAfter: parsed.explanation.beforeAfter && typeof parsed.explanation.beforeAfter === 'object'
          ? {
              before: String(parsed.explanation.beforeAfter.before || ''),
              after: String(parsed.explanation.beforeAfter.after || ''),
            }
          : undefined,
      };
    }

    // For design mode, code is required
    if (!code.trim()) {
      return null;
    }

    return {
      mode: 'design',
      summary,
      explanation,
      parameters,
      dfmChecks,
      warnings,
      suggestions,
      code,
    };
  } catch (error) {
    console.warn('[AI] Failed to parse structured response:', error);
    return null;
  }
}

function extractJsonPayload(content: string): string | null {
  // Method 1: Look for ```json code blocks (preferred format)
  const jsonBlockPattern = /```json([\s\S]*?)```/gi;
  const matches = [...content.matchAll(jsonBlockPattern)];
  if (matches.length > 0) {
    return matches.at(-1)?.[1]?.trim() ?? null;
  }

  // Method 2: Look for XML-style tags
  const tagPattern = /<caedo-response>([\s\S]*?)<\/caedo-response>/i;
  const tagMatch = content.match(tagPattern);
  if (tagMatch?.[1]) {
    return tagMatch[1].trim();
  }

  // Method 3: Look for explicit markers
  const explicitPattern = /VOICEFORGE_RESPONSE_START([\s\S]*?)VOICEFORGE_RESPONSE_END/;
  const explicitMatch = content.match(explicitPattern);
  if (explicitMatch?.[1]) {
    return explicitMatch[1].trim();
  }

  // Method 4: Try to find raw JSON object in content (fallback for AI that doesn't use fences)
  // Look for JSON that starts with { "mode": or { "summary": or { "code":
  const rawJsonPattern = /\{[\s\n]*"(?:mode|summary|code)"[\s\S]*\}(?=\s*$|\n|$)/;
  const rawJsonMatch = content.match(rawJsonPattern);
  if (rawJsonMatch?.[0]) {
    // Validate it's actually valid JSON before returning
    try {
      JSON.parse(rawJsonMatch[0]);
      return rawJsonMatch[0];
    } catch {
      // Not valid JSON, continue to try other methods
    }
  }

  // Method 5: If the entire content looks like a JSON object, try it directly
  const trimmed = content.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      // Not valid JSON
    }
  }

  return null;
}

function stripCodeFence(codeBlock: string): string {
  if (!codeBlock) return '';

  const fencePattern = /```(?:javascript|jscad|js|typescript|ts)?/gi;
  let cleaned = codeBlock.replace(fencePattern, '');
  cleaned = cleaned.replace(/```/g, '');
  return cleaned.trim();
}

function isRecord(value: unknown): value is Record<string, string | number> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

