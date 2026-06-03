/**
 * Mesh Validation for 3D Printing
 * 
 * Validates geometry before export to ensure print-ready models.
 * Checks for common issues that cause print failures.
 */

import {
  MeshData,
  ValidationResult,
  ValidationIssue,
  ValidationSeverity,
  MeshStats,
  BoundingBox
} from '@/types';
import {
  WALL_THICKNESS,
  MIN_FEATURES,
  BUILD_VOLUMES,
  VALIDATION
} from '@/lib/constants/dfm';
import { FOOTWEAR_DFM } from '@/lib/constants/footwear-dfm';

// Re-export types for convenience
export type { ValidationResult, ValidationIssue, ValidationSeverity, MeshStats };

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

/**
 * Validate mesh for 3D printing readiness
 */
export function validateMeshForPrinting(
  meshData: MeshData,
  options: {
    buildVolume?: { x: number; y: number; z: number };
    checkManifold?: boolean;
    checkWallThickness?: boolean;
    isFootwear?: boolean;
  } = {}
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const buildVolume = options.buildVolume || BUILD_VOLUMES.DEFAULT;

  // Calculate mesh statistics
  const stats = calculateMeshStats(meshData);

  // Run validation checks
  issues.push(...checkEmptyMesh(stats));
  issues.push(...checkBuildVolume(stats, buildVolume));
  issues.push(...checkTriangleCount(stats));
  issues.push(...checkMinimumSize(stats));
  issues.push(...checkNegativeZ(meshData));

  if (options.checkManifold !== false) {
    issues.push(...checkManifold(meshData));
  }

  if (options.isFootwear) {
    issues.push(...checkFootwearRules(meshData, stats));
  }

  // Determine overall validity
  const hasErrors = issues.some(i => i.severity === 'error');

  return {
    isValid: !hasErrors,
    issues,
    stats,
  };
}

// =============================================================================
// MESH STATISTICS
// =============================================================================

/**
 * Calculate comprehensive mesh statistics
 */
export function calculateMeshStats(meshData: MeshData): MeshStats {
  const { vertices, indices } = meshData;

  const vertexCount = vertices.length / 3;
  const triangleCount = indices.length / 3;

  // Calculate bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i] ?? 0;
    const y = vertices[i + 1] ?? 0;
    const z = vertices[i + 2] ?? 0;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  // Handle empty mesh
  if (!isFinite(minX)) {
    minX = minY = minZ = 0;
    maxX = maxY = maxZ = 0;
  }

  const boundingBox: BoundingBox = {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
  };

  // Estimate volume (rough approximation using bounding box)
  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const volume = sizeX * sizeY * sizeZ;

  // Estimate surface area (rough approximation)
  const surfaceArea = 2 * (sizeX * sizeY + sizeY * sizeZ + sizeZ * sizeX);

  // Check if manifold (simplified check)
  const isManifold = checkManifoldSimple(indices);

  return {
    vertexCount,
    triangleCount,
    boundingBox,
    volume,
    surfaceArea,
    isManifold,
  };
}

/**
 * Simple manifold check - returns true if all edges have exactly 2 adjacent faces
 */
function checkManifoldSimple(indices: Uint32Array): boolean {
  const edgeCount = new Map<string, number>();

  for (let i = 0; i < indices.length; i += 3) {
    const v1 = indices[i] ?? 0;
    const v2 = indices[i + 1] ?? 0;
    const v3 = indices[i + 2] ?? 0;

    const edges = [
      [Math.min(v1, v2), Math.max(v1, v2)],
      [Math.min(v2, v3), Math.max(v2, v3)],
      [Math.min(v3, v1), Math.max(v3, v1)],
    ];

    for (const [a, b] of edges) {
      const key = `${a}-${b}`;
      edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
    }
  }

  for (const count of edgeCount.values()) {
    if (count !== 2) return false;
  }

  return true;
}

// =============================================================================
// VALIDATION CHECKS
// =============================================================================

function checkEmptyMesh(stats: MeshStats): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (stats.vertexCount === 0 || stats.triangleCount === 0) {
    issues.push({
      code: 'empty_mesh',
      severity: 'error',
      message: 'Mesh is empty - contains no vertices or triangles',
      autoFixable: false,
    });
  }

  return issues;
}

function checkBuildVolume(
  stats: MeshStats,
  buildVolume: { x: number; y: number; z: number }
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const size = getBoundingBoxSize(stats.boundingBox);

  if (size[0] > buildVolume.x || size[1] > buildVolume.y || size[2] > buildVolume.z) {
    issues.push({
      code: 'exceeds_build_volume',
      severity: 'error',
      message: `Model exceeds build volume (${size[0].toFixed(1)}×${size[1].toFixed(1)}×${size[2].toFixed(1)}mm)`,
      suggestion: `Resize to fit within ${buildVolume.x}×${buildVolume.y}×${buildVolume.z}mm`,
      autoFixable: false,
    });
  } else if (
    size[0] > buildVolume.x * 0.9 ||
    size[1] > buildVolume.y * 0.9 ||
    size[2] > buildVolume.z * 0.9
  ) {
    issues.push({
      code: 'near_build_volume_limit',
      severity: 'warning',
      message: 'Model uses >90% of build volume',
      suggestion: 'Consider leaving margin for brim/raft',
      autoFixable: false,
    });
  }

  return issues;
}

function getBoundingBoxSize(bb: BoundingBox): [number, number, number] {
  return [
    bb.max[0] - bb.min[0],
    bb.max[1] - bb.min[1],
    bb.max[2] - bb.min[2],
  ];
}

function checkTriangleCount(stats: MeshStats): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (stats.triangleCount > VALIDATION.MAX_TRIANGLES_ERROR) {
    issues.push({
      code: 'too_many_triangles',
      severity: 'error',
      message: `Mesh has too many triangles (${stats.triangleCount.toLocaleString()})`,
      suggestion: 'Simplify the model to reduce triangle count',
      autoFixable: false,
    });
  } else if (stats.triangleCount > VALIDATION.MAX_TRIANGLES_WARNING) {
    issues.push({
      code: 'high_triangle_count',
      severity: 'warning',
      message: `High triangle count (${stats.triangleCount.toLocaleString()}) may slow slicing`,
      suggestion: 'Consider reducing complexity for faster slicing',
      autoFixable: false,
    });
  }

  return issues;
}

function checkMinimumSize(stats: MeshStats): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const size = getBoundingBoxSize(stats.boundingBox);

  // Check if any dimension is too small to print
  const minDimension = Math.min(...size);

  if (minDimension < MIN_FEATURES.DETAIL_SIZE) {
    issues.push({
      code: 'too_small',
      severity: 'error',
      message: `Model has features smaller than printable (${minDimension.toFixed(2)}mm)`,
      suggestion: `Minimum printable feature size is ${MIN_FEATURES.DETAIL_SIZE}mm`,
      autoFixable: false,
    });
  }

  // Check for very thin dimensions (potential wall thickness issues)
  if (minDimension > 0 && minDimension < WALL_THICKNESS.STRUCTURAL_MIN) {
    issues.push({
      code: 'thin_dimension',
      severity: 'warning',
      message: `Model may have thin walls (${minDimension.toFixed(2)}mm)`,
      suggestion: `Recommended minimum: ${WALL_THICKNESS.STRUCTURAL_MIN}mm for structural parts`,
      autoFixable: false,
    });
  }

  return issues;
}

function checkNegativeZ(meshData: MeshData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { vertices } = meshData;

  let minZ = Infinity;
  for (let i = 2; i < vertices.length; i += 3) {
    minZ = Math.min(minZ, vertices[i] ?? 0);
  }

  if (isFinite(minZ) && minZ < -0.01) {
    issues.push({
      code: 'below_build_plate',
      severity: 'warning',
      message: `Model extends below build plate (Z=${minZ.toFixed(2)}mm)`,
      suggestion: 'Model will be auto-corrected to sit on Z=0 during export',
      autoFixable: true,
    });
  }

  return issues;
}

function checkManifold(meshData: MeshData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { indices } = meshData;

  // Build edge map to check for non-manifold edges
  // Each edge should appear exactly twice (once per adjacent face)
  const edgeCount = new Map<string, number>();

  for (let i = 0; i < indices.length; i += 3) {
    const v1 = indices[i] ?? 0;
    const v2 = indices[i + 1] ?? 0;
    const v3 = indices[i + 2] ?? 0;

    // Add edges (sorted so direction doesn't matter)
    const edges = [
      [Math.min(v1, v2), Math.max(v1, v2)],
      [Math.min(v2, v3), Math.max(v2, v3)],
      [Math.min(v3, v1), Math.max(v3, v1)],
    ];

    for (const [a, b] of edges) {
      const key = `${a}-${b}`;
      edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
    }
  }

  // Check for non-manifold edges (not exactly 2 faces)
  let nonManifoldEdges = 0;
  let boundaryEdges = 0;

  for (const count of edgeCount.values()) {
    if (count === 1) boundaryEdges++;
    else if (count > 2) nonManifoldEdges++;
  }

  if (boundaryEdges > 0) {
    issues.push({
      code: 'non_manifold_boundary',
      severity: 'error',
      message: `Mesh is not watertight (${boundaryEdges} boundary edges)`,
      suggestion: 'The mesh has holes and may not slice correctly. Try repairing in slicer.',
      autoFixable: true,
    });
  }

  if (nonManifoldEdges > 0) {
    issues.push({
      code: 'non_manifold_edges',
      severity: 'error',
      message: `Mesh has non-manifold geometry (${nonManifoldEdges} edges)`,
      suggestion: 'Some edges are shared by more than 2 faces. Try repairing in slicer.',
      autoFixable: true,
    });
  }

  return issues;
}

function checkFootwearRules(_meshData: MeshData, stats: MeshStats): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const size = getBoundingBoxSize(stats.boundingBox);

  // 1. Min Sole Thickness check (approximate from height)
  if (size[2] < FOOTWEAR_DFM.min_sole_thickness) {
    issues.push({
      code: 'footwear_sole_thin',
      severity: 'error',
      message: `Shoe sole is too thin (${size[2].toFixed(1)}mm)`,
      suggestion: `Minimum functional sole thickness for TPU is ${FOOTWEAR_DFM.min_sole_thickness}mm`,
      autoFixable: false,
    });
  }

  // 2. Mesh Density / Lattice Check
  // TPU footwear is usually sparse (lattice). If surface area to volume ratio is very low, it might be too solid/heavy.
  const saVolRatio = stats.surfaceArea / stats.volume;
  if (saVolRatio < 0.1) {
    issues.push({
      code: 'footwear_too_solid',
      severity: 'warning',
      message: 'Model appears too solid for TPU footwear',
      suggestion: 'Consider using a lattice structure to save weight and improve cushioning',
      autoFixable: false,
    });
  }

  // 3. TPU Print Speed Warning
  issues.push({
    code: 'footwear_speed_limit',
    severity: 'warning',
    message: `TPU 90A requires slow printing (max ${FOOTWEAR_DFM.max_print_speed}mm/s)`,
    suggestion: 'Ensure your slicer profile matches this speed limit',
    autoFixable: false,
  });

  // 4. Filament Drying Reminder
  issues.push({
    code: 'footwear_drying_required',
    severity: 'info',
    message: 'TPU 90A must be dried at 65°C for 8+ hours before printing',
    autoFixable: false,
  });

  return issues;
}

// =============================================================================
// QUICK VALIDATION (for UI feedback)
// =============================================================================

/**
 * Quick validation for real-time UI feedback
 * Only checks fast operations
 */
export function quickValidate(meshData: MeshData): {
  isValid: boolean;
  errorCount: number;
  warningCount: number;
} {
  const stats = calculateMeshStats(meshData);
  const issues = [
    ...checkEmptyMesh(stats),
    ...checkBuildVolume(stats, BUILD_VOLUMES.DEFAULT),
    ...checkMinimumSize(stats),
  ];

  return {
    isValid: !issues.some(i => i.severity === 'error'),
    errorCount: issues.filter(i => i.severity === 'error').length,
    warningCount: issues.filter(i => i.severity === 'warning').length,
  };
}

// =============================================================================
// PRINT TIME ESTIMATION
// =============================================================================

/**
 * Rough print time estimate based on volume and surface area
 * This is a very rough approximation - actual time depends on slicer settings
 */
export function estimatePrintTime(
  stats: MeshStats,
  options: {
    layerHeight?: number;  // mm
    printSpeed?: number;   // mm/s
    infillPercent?: number;
  } = {}
): { hours: number; minutes: number } {
  const layerHeight = options.layerHeight || 0.2;
  const printSpeed = options.printSpeed || 60;
  const infillPercent = options.infillPercent || 15;

  // Surface area is a better proxy for travel time than just volume
  // Rough estimate: assume path length relates to surface area / layer count
  const totalLength = (stats.volume / layerHeight) + (stats.surfaceArea * 1.5) + (infillPercent * 2); // Approximate extruded + travel

  const timeSeconds = totalLength / printSpeed;
  const hours = Math.floor(timeSeconds / 3600);
  const minutes = Math.floor((timeSeconds % 3600) / 60);

  return { hours, minutes };
}
