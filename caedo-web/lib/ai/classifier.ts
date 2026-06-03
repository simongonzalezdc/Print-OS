/**
 * CAEDO AI Complexity Classifier
 * Analyzes prompts and context to route to optimal models.
 */

export interface ClassificationResult {
  model: string;
  complexity: 'low' | 'medium' | 'high';
  reason: string;
}

export interface ClassificationContext {
  prompt: string;
  hasImages: boolean;
  objectCount: number;
  existingCode?: string;
}

const COMPLEX_KEYWORDS = [
  'complex', 'detailed', 'precise', 'mechanical', 'assembly', 
  'parametric', 'optimized', 'structure', 'mathematical', 'gear',
  'thread', 'joint', 'hinge', 'lattice', 'voronoi'
];

/**
 * Classifies a request based on prompt text and context.
 */
export function classifyRequest(context: ClassificationContext): ClassificationResult {
  const { prompt, hasImages, objectCount, existingCode } = context;
  const lowerPrompt = prompt.toLowerCase();
  
  // Rule 1: Multi-modal always goes to vision-capable model
  if (hasImages) {
    return {
      model: 'claude-3-5-sonnet-20241022', // Preferred for high-quality vision
      complexity: 'high',
      reason: 'Image context requires Claude 3.5 Sonnet Vision for optimal translation'
    };
  }

  // Rule 2: Large existing codebases require high-reasoning models
  if (existingCode && existingCode.length > 5000) {
    return {
      model: 'glm-4.7',
      complexity: 'high',
      reason: 'Large existing codebase requires high reasoning capacity'
    };
  }

  // Rule 3: Keywords indicating mechanical or geometric complexity
  const keywordMatch = COMPLEX_KEYWORDS.find(kw => lowerPrompt.includes(kw));
  if (keywordMatch) {
    return {
      model: 'glm-4.7',
      complexity: 'high',
      reason: `Complexity keyword detected: "${keywordMatch}"`
    };
  }

  // Rule 4: Many objects in scene
  if (objectCount > 5) {
    return {
      model: 'glm-4.7',
      complexity: 'medium',
      reason: `High scene complexity (${objectCount} objects)`
    };
  }

  // Rule 5: Simple primitives or short prompts can use faster models
  if (prompt.length < 50 && !existingCode) {
    return {
      model: 'glm-4-flash',
      complexity: 'low',
      reason: 'Short prompt with no existing code'
    };
  }

  // Default fallback
  return {
    model: 'glm-4.7',
    complexity: 'medium',
    reason: 'Standard request - defaulting to primary model'
  };
}

