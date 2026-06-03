/**
 * Design for Manufacturing (DFM) Constants
 * 
 * These values represent the constraints and best practices for FDM/FFF 3D printing.
 * The AI uses these when generating JSCAD code to ensure printable output.
 */

// =============================================================================
// WALL THICKNESS
// =============================================================================

export const WALL_THICKNESS = {
  /** Absolute minimum - single extrusion width (0.4mm nozzle) */
  ABSOLUTE_MIN: 0.4,
  
  /** Minimum for structural parts (3 perimeters) */
  STRUCTURAL_MIN: 1.2,
  
  /** Recommended default for functional parts */
  RECOMMENDED: 1.6,
  
  /** Safe default for most applications */
  DEFAULT: 2.0,
  
  /** Minimum for thin walls/features */
  THIN_FEATURE_MIN: 0.8,
} as const;

// =============================================================================
// OVERHANGS & BRIDGES
// =============================================================================

export const OVERHANG = {
  /** Maximum angle from vertical that prints well without supports */
  SAFE_ANGLE: 45,
  
  /** Maximum angle that may print with quality loss */
  MAX_ANGLE: 55,
  
  /** Angle beyond which supports are required */
  REQUIRES_SUPPORT_ANGLE: 60,
} as const;

export const BRIDGE = {
  /** Maximum unsupported horizontal span with good quality */
  EXCELLENT: 5,
  
  /** Maximum span with acceptable quality */
  ACCEPTABLE: 10,
  
  /** Maximum span before quality degrades significantly */
  MAX_RECOMMENDED: 20,
} as const;

// =============================================================================
// TOLERANCES & FITS
// =============================================================================

export const TOLERANCE = {
  /** XY accuracy of typical FDM printer */
  XY_ACCURACY: 0.2,
  
  /** Z accuracy (layer-dependent) */
  Z_ACCURACY: 0.1,
  
  /** Clearance for sliding/moving parts */
  SLIDING_FIT: 0.3,
  
  /** Clearance for loose assembly */
  LOOSE_FIT: 0.5,
  
  /** Interference for press-fit connections */
  PRESS_FIT: -0.1,
  
  /** Transition fit (snug but removable) */
  TRANSITION_FIT: 0.1,
  
  /** Default clearance when not specified */
  DEFAULT_CLEARANCE: 0.3,
} as const;

// =============================================================================
// HOLE SIZING
// =============================================================================

export const SCREW_HOLES = {
  M2: { tap: 1.6, clearance: 2.2, counterbore: 4.0 },
  M2_5: { tap: 2.05, clearance: 2.7, counterbore: 5.0 },
  M3: { tap: 2.5, clearance: 3.2, counterbore: 6.0 },
  M4: { tap: 3.3, clearance: 4.3, counterbore: 8.0 },
  M5: { tap: 4.2, clearance: 5.3, counterbore: 10.0 },
  M6: { tap: 5.0, clearance: 6.4, counterbore: 12.0 },
  M8: { tap: 6.8, clearance: 8.4, counterbore: 16.0 },
} as const;

export const HEAT_SET_INSERTS = {
  M2: { holeDiameter: 3.2, depth: 4.0 },
  M2_5: { holeDiameter: 3.6, depth: 5.0 },
  M3: { holeDiameter: 4.0, depth: 5.7 },
  M4: { holeDiameter: 5.6, depth: 8.1 },
  M5: { holeDiameter: 6.4, depth: 9.5 },
} as const;

export const NUT_POCKETS = {
  M2: { width: 4.6, height: 1.8, depth: 2.5 },
  M3: { width: 5.7, height: 2.6, depth: 3.5 },
  M4: { width: 7.2, height: 3.4, depth: 4.5 },
  M5: { width: 8.2, height: 4.0, depth: 5.5 },
  M6: { width: 10.0, height: 5.0, depth: 6.5 },
} as const;

// =============================================================================
// FIRST LAYER (ELEPHANT'S FOOT)
// =============================================================================

export const FIRST_LAYER = {
  /** Chamfer height to prevent elephant's foot */
  CHAMFER_HEIGHT: 0.5,
  
  /** Chamfer angle in degrees */
  CHAMFER_ANGLE: 45,
  
  /** Whether to apply chamfer by default */
  APPLY_BY_DEFAULT: true,
} as const;

// =============================================================================
// MINIMUM FEATURE SIZES
// =============================================================================

export const MIN_FEATURES = {
  /** Minimum printable hole diameter */
  HOLE_DIAMETER: 2.0,
  
  /** Minimum pin/post diameter */
  PIN_DIAMETER: 3.0,
  
  /** Minimum text height for readability */
  TEXT_HEIGHT: 5.0,
  
  /** Minimum text stroke width */
  TEXT_STROKE: 0.8,
  
  /** Minimum slot width */
  SLOT_WIDTH: 2.0,
  
  /** Minimum detail size (single extrusion) */
  DETAIL_SIZE: 0.4,
  
  /** Minimum emboss depth */
  EMBOSS_DEPTH: 0.6,
  
  /** Minimum engrave depth */
  ENGRAVE_DEPTH: 0.4,
} as const;

// =============================================================================
// BUILD VOLUME (common 3D Printers)
// =============================================================================

export const BUILD_VOLUMES = {
  BAMBU_X1C: { x: 256, y: 256, z: 256 },
  BAMBU_P1S: { x: 256, y: 256, z: 256 },
  BAMBU_A1: { x: 256, y: 256, z: 256 },
  BAMBU_A1_MINI: { x: 180, y: 180, z: 180 },
  /** Default build volume for validation */
  DEFAULT: { x: 250, y: 250, z: 250 },
} as const;

// =============================================================================
// VALIDATION THRESHOLDS
// =============================================================================

export const VALIDATION = {
  /** Minimum volume to be considered valid (mm³) */
  MIN_VOLUME: 1.0,
  
  /** Maximum triangle count before warning */
  MAX_TRIANGLES_WARNING: 500000,
  
  /** Maximum triangle count before error */
  MAX_TRIANGLES_ERROR: 2000000,
  
  /** Tolerance for manifold check (mm) */
  MANIFOLD_TOLERANCE: 0.001,
} as const;

// =============================================================================
// PRINT QUALITY PRESETS
// =============================================================================

export const PRINT_PRESETS = {
  /** Draft quality - fast prints, lower detail */
  DRAFT: {
    layerHeight: 0.3,
    wallLoops: 2,
    infillPercent: 10,
    topLayers: 3,
    bottomLayers: 3,
    printSpeed: 100,
    description: 'Fast prototyping, low detail',
  },
  
  /** Standard quality - balanced speed and quality */
  STANDARD: {
    layerHeight: 0.2,
    wallLoops: 3,
    infillPercent: 15,
    topLayers: 4,
    bottomLayers: 4,
    printSpeed: 60,
    description: 'General purpose, good balance',
  },
  
  /** Fine quality - detailed prints */
  FINE: {
    layerHeight: 0.12,
    wallLoops: 4,
    infillPercent: 20,
    topLayers: 5,
    bottomLayers: 5,
    printSpeed: 40,
    description: 'High detail, smooth surfaces',
  },
  
  /** Structural - strong functional parts */
  STRUCTURAL: {
    layerHeight: 0.2,
    wallLoops: 4,
    infillPercent: 40,
    topLayers: 6,
    bottomLayers: 6,
    printSpeed: 50,
    description: 'Strong functional parts',
  },
} as const;

// =============================================================================
// MATERIAL PROPERTIES (for reference)
// =============================================================================

export const MATERIALS = {
  PLA: {
    name: 'PLA',
    bedTemp: 60,
    nozzleTemp: 210,
    shrinkage: 0.3, // percent
    strengthRating: 3,
    heatResistance: 'low',
    notes: 'Easy to print, biodegradable, low warp',
  },
  PETG: {
    name: 'PETG',
    bedTemp: 80,
    nozzleTemp: 240,
    shrinkage: 0.4,
    strengthRating: 4,
    heatResistance: 'medium',
    notes: 'Strong, flexible, food-safe options available',
  },
  ABS: {
    name: 'ABS',
    bedTemp: 100,
    nozzleTemp: 250,
    shrinkage: 0.8,
    strengthRating: 4,
    heatResistance: 'high',
    notes: 'Requires enclosure, prone to warping',
  },
  TPU: {
    name: 'TPU',
    bedTemp: 50,
    nozzleTemp: 230,
    shrinkage: 0.2,
    strengthRating: 5,
    heatResistance: 'medium',
    notes: 'Flexible, requires slow print speed',
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ScrewSize = keyof typeof SCREW_HOLES;
export type HeatSetSize = keyof typeof HEAT_SET_INSERTS;
export type NutSize = keyof typeof NUT_POCKETS;
export type BuildVolume = keyof typeof BUILD_VOLUMES;
export type PrintPreset = keyof typeof PRINT_PRESETS;
export type MaterialType = keyof typeof MATERIALS;
