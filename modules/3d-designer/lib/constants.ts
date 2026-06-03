// =============================================================================
// VoiceForge 3D - Application Constants
// =============================================================================
// Local-first parametric 3D design for Orca Slicer
// =============================================================================

// -----------------------------------------------------------------------------
// Application Info
// -----------------------------------------------------------------------------

export const APP_NAME = 'VoiceForge 3D';
export const APP_VERSION = '0.1.0';
export const APP_DESCRIPTION = 'Voice-first AI-powered parametric 3D design for 3D printing';

// -----------------------------------------------------------------------------
// Feature Flags
// -----------------------------------------------------------------------------

export const FEATURES = {
  VOICE_ENABLED: process.env.NEXT_PUBLIC_ENABLE_VOICE !== 'false',
  WEBGPU_ENABLED: process.env.NEXT_PUBLIC_ENABLE_WEBGPU !== 'false',
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
} as const;

// -----------------------------------------------------------------------------
// AI Provider Configuration
// -----------------------------------------------------------------------------

export const AI_PROVIDERS = {
  OLLAMA: 'ollama',
  ANTHROPIC: 'anthropic',
  OPENAI: 'openai',
  OPENROUTER: 'openrouter',
  GROQ: 'groq',
  TOGETHER: 'together',
  GOOGLE: 'google',
  ZAI: 'zai',  // Z.AI / GLM-4
} as const;

export type AIProvider = typeof AI_PROVIDERS[keyof typeof AI_PROVIDERS];

export const AI = {
  // Default provider (can be overridden by env)
  DEFAULT_PROVIDER: (process.env.AI_PROVIDER || 'ollama') as AIProvider,

  // Model defaults per provider
  DEFAULT_MODELS: {
    ollama: 'deepseek-coder-v2:latest',
    anthropic: 'claude-sonnet-4-20250514',
    openai: 'gpt-4o',
    openrouter: 'anthropic/claude-sonnet-4-20250514',
    groq: 'llama-3.1-70b-versatile',
    together: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    google: 'gemini-1.5-pro',
    zai: 'glm-4.6v',  // GLM-4.6V vision model (supports images)
  },

  // Timeouts (ms)
  TIMEOUTS: {
    CODE_GENERATION: 30_000,  // 30s for JSCAD generation
    EXPLANATION: 15_000,      // 15s for explaining code
  },

  // Tool calling
  MAX_TOOL_STEPS: 5,
} as const;

// -----------------------------------------------------------------------------
// Rate Limiting Configuration
// -----------------------------------------------------------------------------

export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 60000,      // 1 minute window
  MAX_REQUESTS: 1000,    // Unlimited for max plan
  TIMEOUT_MS: 300000,    // 5 minute timeout for complex thinking + generation
} as const;

// -----------------------------------------------------------------------------
// Voice Recognition
// -----------------------------------------------------------------------------

export const VOICE = {
  // Recognition settings
  LANGUAGE: 'en-US',
  CONTINUOUS: false,
  INTERIM_RESULTS: true,

  // Timeouts
  SILENCE_TIMEOUT: 2000,      // Stop after 2s silence
  MAX_RECORDING_TIME: 30_000, // 30s max

  // Amplitude thresholds
  SILENCE_THRESHOLD: 0.01,
  SPEECH_THRESHOLD: 0.1,
} as const;

// -----------------------------------------------------------------------------
// 3D Rendering (React Three Fiber) - CAD Optimized
// -----------------------------------------------------------------------------

export const RENDER = {
  // Frame rate targets (CAD-optimized: prioritize precision over smoothness)
  TARGET_FPS: 24,           // Reduced from 60 - CAD applications don't need 60 FPS
  MIN_FPS: 20,              // Minimum acceptable FPS for CAD work

  // Canvas defaults - CAD-optimized
  DEFAULT_DPR: [1, 1.5] as [number, number], // Reduced from [1, 2] - better battery life
  DEFAULT_FOV: 45,
  NEAR_CLIP: 0.1,
  FAR_CLIP: 1000,

  // Camera defaults
  DEFAULT_CAMERA_POSITION: [150, 150, 150] as [number, number, number],
  DEFAULT_CAMERA_TARGET: [0, 0, 0] as [number, number, number],

  // Shadow settings - reduced for performance
  SHADOW_MAP_SIZE: 1024,    // Reduced from 2048
  SHADOW_BIAS: -0.0001,

  // CAD-specific performance settings
  GPU_POWER_PREFERENCE: 'default', // Changed from 'high-performance' for better battery life

  // Performance modes
  PERFORMANCE_MODES: {
    PRECISION: 'precision',   // Max quality, lower FPS
    BALANCED: 'balanced',     // Balanced quality and performance  
    SPEED: 'speed',           // Max performance, lower quality
  } as const,

  // Adaptive quality thresholds
  COMPLEXITY_THRESHOLDS: {
    LOW: 1000,      // Triangles for low complexity
    MEDIUM: 10000,  // Triangles for medium complexity
    HIGH: 50000,    // Triangles for high complexity
  },

  // Quality settings per mode
  QUALITY_SETTINGS: {
    precision: {
      dpr: [1, 2] as [number, number],
      shadows: true,
      antialias: true,
      targetFPS: 24,
    },
    balanced: {
      dpr: [1, 1.5] as [number, number],
      shadows: true,
      antialias: true,
      targetFPS: 24,
    },
    speed: {
      dpr: [0.75, 1] as [number, number],
      shadows: false,
      antialias: false,
      targetFPS: 20,
    },
  },
} as const;

// -----------------------------------------------------------------------------
// Scene & Viewport
// -----------------------------------------------------------------------------

export const SCENE = {
  // Build plate (common 3D printers)
  BUILD_PLATE: {
    X: 250,  // mm
    Y: 250,  // mm
    Z: 250,  // mm (max print height)
  },

  // Grid settings (matches build plate)
  GRID_SIZE: 250,
  GRID_DIVISIONS: 16,  // ~15.6mm per division
  GRID_COLOR_CENTER: '#444444',
  GRID_COLOR_GRID: '#222222',

  // Snap settings
  SNAP_TRANSLATE: 1.0,  // 1mm
  SNAP_ROTATE: 15,      // degrees
  SNAP_SCALE: 0.1,

  // Selection visuals
  SELECTION_COLOR: '#3b82f6',
  HOVER_COLOR: '#94a3b8',
  ERROR_COLOR: '#ef4444',  // For DFM violations
  OUTLINE_THICKNESS: 2,

  // History
  MAX_HISTORY_ENTRIES: 100,
} as const;

// -----------------------------------------------------------------------------
// JSCAD Execution
// -----------------------------------------------------------------------------

export const JSCAD = {
  // Execution limits
  EXECUTION_TIMEOUT: 30000,  // 30s max for complex models with many boolean operations
  MAX_TRIANGLES: 500_000,    // Warn above this

  // Debounce for parameter changes
  PARAMETER_DEBOUNCE: 300,  // ms

  // Worker settings
  USE_WORKER: true,  // Run JSCAD in Web Worker
} as const;

// -----------------------------------------------------------------------------
// Export Pipeline (Orca Slicer)
// -----------------------------------------------------------------------------

export const EXPORT = {
  // Supported formats
  FORMATS: ['3mf', 'stl', 'stl-ascii'] as const,

  // Default format for Orca Slicer
  DEFAULT_FORMAT: '3mf' as const,

  // File size limits (bytes)
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB

  // 3MF metadata
  CREATOR: 'VoiceForge 3D',

  // Validation thresholds (from DFM rules)
  MIN_WALL_THICKNESS: 1.2,  // mm
  MAX_OVERHANG_ANGLE: 45,   // degrees
} as const;

// -----------------------------------------------------------------------------
// Local Storage Keys (IndexedDB)
// -----------------------------------------------------------------------------

export const STORAGE_KEYS = {
  // Project data
  PROJECTS: 'voiceforge-projects',
  CURRENT_PROJECT: 'voiceforge-current-project',

  // Auto-save
  AUTOSAVE_PREFIX: 'voiceforge-autosave-',

  // User preferences
  PREFERENCES: 'voiceforge-preferences',

  // AI conversation history
  AI_HISTORY: 'voiceforge-ai-history',
} as const;

// -----------------------------------------------------------------------------
// UI Constants
// -----------------------------------------------------------------------------

export const UI = {
  // Panel widths
  TOOLS_PANEL_WIDTH: 64,
  AI_PANEL_WIDTH: 360,
  CODE_PANEL_WIDTH: 400,
  PROPERTIES_PANEL_WIDTH: 280,

  // Animation durations (ms)
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },

  // Toast settings
  TOAST_DURATION: 4000,

  // Keyboard shortcuts
  SHORTCUTS: {
    UNDO: 'mod+z',
    REDO: 'mod+shift+z',
    DELETE: 'backspace',
    DUPLICATE: 'mod+d',
    SELECT_ALL: 'mod+a',
    DESELECT: 'escape',
    VOICE: 'ctrl+space',
    EXPORT: 'mod+e',
    VALIDATE: 'mod+shift+v',
    // Performance mode shortcuts
    PRECISION_MODE: 'mod+1',
    BALANCED_MODE: 'mod+2',
    SPEED_MODE: 'mod+3',
  },
} as const;

// -----------------------------------------------------------------------------
// Error Codes
// -----------------------------------------------------------------------------

export const ERROR_CODES = {
  // AI errors
  AI_ERROR: 'AI_ERROR',
  AI_TIMEOUT: 'AI_TIMEOUT',
  AI_INVALID_RESPONSE: 'AI_INVALID_RESPONSE',

  // JSCAD errors
  JSCAD_SYNTAX_ERROR: 'JSCAD_SYNTAX_ERROR',
  JSCAD_EXECUTION_ERROR: 'JSCAD_EXECUTION_ERROR',
  JSCAD_TIMEOUT: 'JSCAD_TIMEOUT',

  // Export errors
  EXPORT_FAILED: 'EXPORT_FAILED',
  MESH_INVALID: 'MESH_INVALID',
  MESH_TOO_LARGE: 'MESH_TOO_LARGE',

  // Validation errors
  VALIDATION_NON_MANIFOLD: 'VALIDATION_NON_MANIFOLD',
  VALIDATION_THIN_WALL: 'VALIDATION_THIN_WALL',
  VALIDATION_OVERHANG: 'VALIDATION_OVERHANG',
  VALIDATION_TOO_LARGE: 'VALIDATION_TOO_LARGE',

  // Voice errors
  VOICE_NOT_SUPPORTED: 'VOICE_NOT_SUPPORTED',
  VOICE_PERMISSION_DENIED: 'VOICE_PERMISSION_DENIED',
  VOICE_RECOGNITION_FAILED: 'VOICE_RECOGNITION_FAILED',

  // Storage errors
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_READ_ERROR: 'STORAGE_READ_ERROR',
  STORAGE_WRITE_ERROR: 'STORAGE_WRITE_ERROR',

  // Performance errors
  PERFORMANCE_DEGRADED: 'PERFORMANCE_DEGRADED',
  QUALITY_AUTO_ADJUSTED: 'QUALITY_AUTO_ADJUSTED',

  // Generic errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;
