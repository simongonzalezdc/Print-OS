import type { PrinterProfile } from '@/lib/constants/printer-profiles';

  // =============================================================================
// VoiceForge 3D - Core Type Definitions
// =============================================================================
// Local-first parametric 3D design for Orca Slicer
// =============================================================================

// -----------------------------------------------------------------------------
// Geometry Types (JSCAD)
// -----------------------------------------------------------------------------

export type Vector3Tuple = [number, number, number];

export interface BoundingBox {
  min: Vector3Tuple;
  max: Vector3Tuple;
}

/**
 * JSCAD Geometry Vertex
 * Represents a 3D point in space
 */
export interface JSCADVertex {
  0: number;
  1: number;
  2: number;
}

/**
 * JSCAD Geometry Polygon
 * A polygon made up of vertices
 */
export interface JSCADPolygon {
  vertices: JSCADVertex[];
  color?: string;
  tags?: string[];
}

/**
 * JSCAD Geometry Base Interface
 * Common structure for all JSCAD geometry objects
 */
export interface JSCADGeometryBase {
  isRetesselated?: boolean;
  isCanonicalized?: boolean;
}

/**
 * JSCAD Geometry Primitive
 * Base geometry object with polygons
 */
export interface JSCADPrimitive extends JSCADGeometryBase {
  polygons: JSCADPolygon[];
}

/**
 * JSCAD Geometry CSG (Constructive Solid Geometry)
 * Base type for CSG operations
 */
export interface JSCADCSG extends JSCADGeometryBase {
  polygons: JSCADPolygon[];
}

/**
 * JSCAD Geometry Shape
 * A 2D shape that can be extruded
 */
export interface JSCADShape extends JSCADGeometryBase {
  sides: Array<{
    vertex0: JSCADVertex;
    vertex1: JSCADVertex;
  }>;
}

/**
 * JSCAD Geometry Path
 * A path made up of points
 */
export interface JSCADPath extends JSCADGeometryBase {
  points: JSCADVertex[];
  isClosed?: boolean;
}

/**
 * Union type for all JSCAD geometry objects
 */
export type JSCADGeometryObject =
  | JSCADPrimitive
  | JSCADCSG
  | JSCADShape
  | JSCADPath;

/**
 * JSCAD geometry objects that have polygons (for mesh conversion)
 */
export type JSCADGeometryWithPolygons = JSCADPrimitive | JSCADCSG;

/** 
 * JSCAD geometry output (can be single or array)
 * This replaces the generic `object | object[]` with proper typing
 */
export type JSCADGeometry = JSCADGeometryObject | JSCADGeometryObject[];

/** 
 * Legacy type alias for backward compatibility
 * @deprecated Use JSCADGeometry instead
 */
export type LegacyJSCADGeometry = object | object[];

/**
 * Converted Three.js-compatible mesh data
 */
export interface MeshData {
  vertices: Float32Array;
  indices: Uint32Array;
  normals: Float32Array;
}

// -----------------------------------------------------------------------------
// Scene Object Types
// -----------------------------------------------------------------------------

export interface SceneObject {
  id: string;
  name: string;
  
  /** JSCAD source code that generates this object */
  jscadCode: string;
  
  /** Cached mesh data (derived from JSCAD code) */
  meshData?: MeshData;
  
  /** Transform applied after JSCAD generation */
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  
  /** Display properties */
  color: string;
  visible: boolean;
  locked: boolean;
  
  /** DFM validation status */
  validation?: ValidationResult;
  
  /** Mesh statistics (cached from validation) */
  stats?: MeshStats;
  
  /** AI-generated metadata */
  aiSummary?: string;
  aiParameters?: Record<string, unknown>;
  aiDfMNotes?: string[];
  
  /** Timestamps */
  createdAt: number;
  updatedAt: number;
}

// -----------------------------------------------------------------------------
// Project Types
// -----------------------------------------------------------------------------

export interface Project {
  id: string;
  name: string;
  description?: string;
  
  /** All objects in the scene */
  objects: SceneObject[];
  
  /** Scene settings */
  settings: SceneSettings;
  
  /** Thumbnail for project list (base64) */
  thumbnail?: string;
  
  /** Timestamps */
  createdAt: number;
  updatedAt: number;
}

export interface SceneSettings {
  /** Build plate size (mm) */
  buildPlate: { x: number; y: number; z: number };
  
  /** Display options */
  gridVisible: boolean;
  axesVisible: boolean;
  
  /** Units for display (internally always mm) */
  displayUnits: 'mm' | 'cm' | 'in';
}

export const DEFAULT_SCENE_SETTINGS: SceneSettings = {
  buildPlate: { x: 250, y: 250, z: 250 },
  gridVisible: true,
  axesVisible: true,
  displayUnits: 'mm',
};

// -----------------------------------------------------------------------------
// History Types (Undo/Redo)
// -----------------------------------------------------------------------------

export type HistoryActionType = 'add' | 'update' | 'delete' | 'batch';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  type: HistoryActionType;
  description: string;
  objectIds: string[];
  previousState: Partial<SceneObject>[];
  newState: Partial<SceneObject>[];
}

// -----------------------------------------------------------------------------
// Validation Types (DFM)
// -----------------------------------------------------------------------------

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  
  /** Location in 3D space where issue occurs */
  location?: Vector3Tuple;
  
  /** Suggested fix */
  suggestion?: string;
  
  /** Can this be auto-fixed? */
  autoFixable: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  stats: MeshStats;
}

export interface MeshStats {
  triangleCount: number;
  vertexCount: number;
  boundingBox: BoundingBox;
  volume: number;        // mm³
  surfaceArea: number;   // mm²
  isManifold: boolean;
}

// -----------------------------------------------------------------------------
// Export Types
// -----------------------------------------------------------------------------

export type ExportFormat = '3mf' | 'stl' | 'stl-ascii';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  
  /** Include thumbnail in 3MF */
  includeThumbnail: boolean;
  
  /** Auto-repair mesh issues before export */
  autoRepair: boolean;
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
  validation?: ValidationResult;
}

// -----------------------------------------------------------------------------
// Voice Types
// -----------------------------------------------------------------------------

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'error';

export interface VoiceStateIdle {
  status: 'idle';
}

export interface VoiceStateListening {
  status: 'listening';
  amplitude: number;
}

export interface VoiceStateProcessing {
  status: 'processing';
}

export interface VoiceStateError {
  status: 'error';
  message: string;
}

export type VoiceState =
  | VoiceStateIdle
  | VoiceStateListening
  | VoiceStateProcessing
  | VoiceStateError;

// -----------------------------------------------------------------------------
// AI Types
// -----------------------------------------------------------------------------

export type AIMessageRole = 'user' | 'assistant' | 'system';

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  timestamp: number;
  
  /** If assistant generated JSCAD code */
  generatedCode?: string;
}

export interface AIGenerationRequest {
  prompt: string;
  
  /** Current scene context for the AI */
  sceneContext?: {
    objects: Array<{ id: string; name: string; jscadCode: string }>;
    selectedObjectId?: string;
  };
  
  /** Previous code to modify (for iterative refinement) */
  existingCode?: string;
}

export interface AIGenerationResult {
  success: boolean;
  code?: string;
  explanation?: string;
  error?: string;
}

// -----------------------------------------------------------------------------
// Tool/Mode Types
// -----------------------------------------------------------------------------

export type EditorTool =
  | 'select'
  | 'pan'
  | 'orbit';

export type TransformMode = 'translate' | 'rotate' | 'scale';
export type TransformSpace = 'world' | 'local';

// -----------------------------------------------------------------------------
// Store Types
// -----------------------------------------------------------------------------

export interface SceneStore {
  // Project
  project: Project | null;
  initProject: () => Project | null;
  createProject: (name?: string, description?: string) => Project;
  renameProject: (name: string, description?: string) => void;
  openProject: (projectId: string) => Project | null;
  listProjects: () => Project[];
  
  // Objects
  objects: Map<string, SceneObject>;
  selectedIds: Set<string>;
  
  // History
  history: HistoryEntry[];
  historyIndex: number;
  
  // UI State
  activeTool: EditorTool;
  transformMode: TransformMode;
  transformSpace: TransformSpace;
  
  // Voice State
  voiceState: VoiceState;
  
  isAIProcessing: boolean;
  printerProfile: PrinterProfile | null;
  
  // Computed
  getObject: (id: string) => SceneObject | undefined;
  getSelectedObjects: () => SceneObject[];

  // Object Actions
  addObject: (code: string, name?: string) => string;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  deleteObject: (id: string) => void;
  duplicateObject: (id: string) => string;
  deleteSelectedObjects: () => void;
  selectObject: (id: string, additive?: boolean) => void;
  deselectAll: () => void;
  
  // History Actions
  undo: () => void;
  redo: () => void;
  
  // Project Actions
  loadProject: (project: Project) => void;
  saveProject: () => Project | undefined;
  
  // Voice Actions
  setVoiceState: (voiceState: VoiceState) => void;
  
  setAIProcessing: (isProcessing: boolean) => void;
  setPrinterProfile: (profile: PrinterProfile | null) => void;
  
  // Transform Actions
  setTransformMode: (mode: TransformMode) => void;
}

// -----------------------------------------------------------------------------
// Error Types
// -----------------------------------------------------------------------------

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: number;
}

// -----------------------------------------------------------------------------
// User Preferences
// -----------------------------------------------------------------------------

export interface UserPreferences {
  /** Preferred AI provider */
  aiProvider: string;
  
  /** Voice input enabled */
  voiceEnabled: boolean;
  
  /** Auto-save interval (ms), 0 = disabled */
  autoSaveInterval: number;
  
  /** Theme */
  theme: 'dark' | 'light' | 'system';
  
  /** Show DFM warnings in real-time */
  showDFMWarnings: boolean;
  
  /** Default export format */
  defaultExportFormat: ExportFormat;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  aiProvider: 'anthropic',
  voiceEnabled: true,
  autoSaveInterval: 30000, // 30 seconds
  theme: 'dark',
  showDFMWarnings: true,
  defaultExportFormat: '3mf',
};
