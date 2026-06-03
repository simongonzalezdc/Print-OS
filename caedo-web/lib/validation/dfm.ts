import { MeshData, ValidationResult, ValidationIssue, BoundingBox } from '@/types';
import { WALL_THICKNESS, MIN_FEATURES, VALIDATION } from '@/lib/constants/dfm';
import { SCENE } from '@/lib/constants';

/**
 * Design for Manufacturing (DFM) validation
 * Checks 3D models for printability issues
 */

type BuildVolume = {
  x: number;
  y: number;
  z: number;
} | {
  X: number;
  Y: number;
  Z: number;
};

export interface DFMValidationOptions {
  /** Minimum wall thickness in mm */
  minWallThickness?: number;

  /** Maximum overhang angle in degrees */
  maxOverhangAngle?: number;

  /** Minimum feature size in mm */
  minFeatureSize?: number;

  /** Build volume constraints */
  buildVolume?: BuildVolume;
}

const normalizeBuildVolume = (volume: BuildVolume): { x: number; y: number; z: number } => {
  if ('X' in volume) {
    return { x: volume.X, y: volume.Y, z: volume.Z };
  }
  return volume;
};

/**
 * Validate mesh for 3D printing constraints
 */
export function validateDFM(
  meshData: MeshData,
  options: DFMValidationOptions = {}
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Validate input data
  if (!meshData || !meshData.vertices || !meshData.indices || !meshData.normals) {
    issues.push({
      severity: 'error',
      code: 'INVALID_MESH_DATA',
      message: 'Invalid mesh data provided for validation',
      autoFixable: false,
    });
    
    return {
      isValid: false,
      issues,
      stats: {
        triangleCount: 0,
        vertexCount: 0,
        boundingBox: { min: [0, 0, 0], max: [0, 0, 0] },
        volume: 0,
        surfaceArea: 0,
        isManifold: false,
      },
    };
  }

  // Default options
  const opts = {
    minWallThickness: WALL_THICKNESS.STRUCTURAL_MIN,
    maxOverhangAngle: 45,
    minFeatureSize: MIN_FEATURES.DETAIL_SIZE,
    buildVolume: SCENE.BUILD_PLATE,
    ...options,
  };

  // Basic geometry checks
  if (!isValidGeometry(meshData)) {
    issues.push({
      severity: 'error',
      code: 'INVALID_GEOMETRY',
      message: 'Mesh contains invalid geometry (degenerate triangles, etc.)',
      autoFixable: true,
    });
  }

  // Manifold check
  if (!isManifold(meshData)) {
    issues.push({
      severity: 'error',
      code: 'NON_MANIFOLD',
      message: 'Mesh is not manifold (has holes or open edges)',
      autoFixable: false,
    });
  }

  // Self-intersection check (simplified for performance)
  if (hasSelfIntersections(meshData)) {
    issues.push({
      severity: 'warning',
      code: 'SELF_INTERSECTION',
      message: 'Mesh may have self-intersecting geometry',
      autoFixable: false,
    });
  }

  // Wall thickness check
  const wallIssues = checkWallThickness(meshData, opts.minWallThickness);
  issues.push(...wallIssues);

  // Overhang check
  const overhangIssues = checkOverhangs(meshData, opts.maxOverhangAngle);
  issues.push(...overhangIssues);

  // Feature size check
  const featureIssues = checkFeatureSizes(meshData, opts.minFeatureSize);
  issues.push(...featureIssues);

  // Build volume check
  const bounds = calculateBoundingBox(meshData);
  
  const buildVolume = normalizeBuildVolume(opts.buildVolume as BuildVolume);
    
  if (!isWithinBuildVolume(bounds, buildVolume)) {
    issues.push({
      severity: 'error',
      code: 'OUTSIDE_BUILD_VOLUME',
      message: `Model exceeds build volume (${buildVolume.x}×${buildVolume.y}×${buildVolume.z}mm)`,
      autoFixable: false,
    });
  }

  // Calculate mesh statistics
  const stats = calculateMeshStats(meshData);

  // Check for excessive complexity
  if (stats.triangleCount > VALIDATION.MAX_TRIANGLES_ERROR) {
    issues.push({
      severity: 'error',
      code: 'TOO_COMPLEX',
      message: `Mesh has excessive complexity (${stats.triangleCount.toLocaleString()} triangles)`,
      autoFixable: false,
    });
  } else if (stats.triangleCount > VALIDATION.MAX_TRIANGLES_WARNING) {
    issues.push({
      severity: 'warning',
      code: 'HIGH_COMPLEXITY',
      message: `Mesh has high complexity (${stats.triangleCount.toLocaleString()} triangles)`,
      autoFixable: false,
    });
  }

  return {
    isValid: !issues.some(issue => issue.severity === 'error'),
    issues,
    stats,
  };
}

/**
 * Check if geometry is valid
 */
function isValidGeometry(meshData: MeshData): boolean {
  const { vertices, indices, normals } = meshData;

  // Check array lengths are consistent
  if (vertices.length % 3 !== 0) return false;
  if (indices.length % 3 !== 0) return false;
  if (normals.length % 3 !== 0) return false;
  if (normals.length !== vertices.length) return false;

  // Check for reasonable bounds
  if (vertices.length === 0 || indices.length === 0) return false;

  // Check for NaN or infinite values
  for (let i = 0; i < vertices.length; i++) {
    const value = vertices[i];
    if (value === undefined || !isFinite(value)) return false;
  }
  
  for (let i = 0; i < normals.length; i++) {
    const value = normals[i];
    if (value === undefined || !isFinite(value)) return false;
  }

  // Check for degenerate triangles
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] ?? 0;
    const i1 = indices[i + 1] ?? 0;
    const i2 = indices[i + 2] ?? 0;

    // Validate indices are in range
    if (i0 >= vertices.length / 3 || i1 >= vertices.length / 3 || i2 >= vertices.length / 3) {
      return false;
    }

    const v0 = [vertices[i0 * 3] ?? 0, vertices[i0 * 3 + 1] ?? 0, vertices[i0 * 3 + 2] ?? 0];
    const v1 = [vertices[i1 * 3] ?? 0, vertices[i1 * 3 + 1] ?? 0, vertices[i1 * 3 + 2] ?? 0];
    const v2 = [vertices[i2 * 3] ?? 0, vertices[i2 * 3 + 1] ?? 0, vertices[i2 * 3 + 2] ?? 0];

    // Check if triangle has zero area
    if (triangleArea(v0, v1, v2) < 1e-6) {
      return false;
    }
  }

  return true;
}

/**
 * Check if mesh is manifold (watertight)
 */
function isManifold(meshData: MeshData): boolean {
  // Simplified check: count edges and see if they appear exactly twice
  const edgeCount = new Map<string, number>();

  for (let i = 0; i < meshData.indices.length; i += 3) {
    const i0 = meshData.indices[i] ?? 0;
    const i1 = meshData.indices[i + 1] ?? 0;
    const i2 = meshData.indices[i + 2] ?? 0;

    // Validate indices
    if (i0 >= meshData.vertices.length / 3 || i1 >= meshData.vertices.length / 3 || i2 >= meshData.vertices.length / 3) {
      return false;
    }

    // Add edges (sorted to ensure consistent key)
    addEdge(edgeCount, i0, i1);
    addEdge(edgeCount, i1, i2);
    addEdge(edgeCount, i2, i0);
  }

  // Check if all edges appear exactly twice
  for (const count of edgeCount.values()) {
    if (count !== 2) {
      return false;
    }
  }

  return true;
}

/**
 * Check for self-intersections (simplified)
 */
function hasSelfIntersections(meshData: MeshData): boolean {
  // This is a complex check - simplified version for performance
  // In a real implementation, you'd use a proper intersection library
  
  // Check for obvious issues like vertices outside reasonable bounds
  for (let i = 0; i < meshData.vertices.length; i += 3) {
    const x = meshData.vertices[i] ?? 0;
    const y = meshData.vertices[i + 1] ?? 0;
    const z = meshData.vertices[i + 2] ?? 0;
    
    // Check for extremely large values that might indicate errors
    if (Math.abs(x) > 10000 || Math.abs(y) > 10000 || Math.abs(z) > 10000) {
      return true;
    }
  }

  return false; // Simplified - assume no intersections for now
}

/**
 * Check wall thickness
 */
function checkWallThickness(meshData: MeshData, minThickness: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Simplified wall thickness check
  // In a real implementation, this would raycast from surface to find thin areas

  // For now, just check if mesh seems too thin overall
  const bounds = calculateBoundingBox(meshData);
  const dimensions = [
    (bounds.max[0] ?? 0) - (bounds.min[0] ?? 0),
    (bounds.max[1] ?? 0) - (bounds.min[1] ?? 0),
    (bounds.max[2] ?? 0) - (bounds.min[2] ?? 0),
  ];

  const minDimension = Math.min(...dimensions);
  if (minDimension < minThickness) {
    issues.push({
      severity: 'warning',
      code: 'THIN_WALLS',
      message: `Model may have walls thinner than ${minThickness}mm`,
      suggestion: 'Increase wall thickness or use supports',
      autoFixable: false,
    });
  }

  return issues;
}

/**
 * Check overhangs
 */
function checkOverhangs(meshData: MeshData, maxAngle: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Simplified overhang check
  // Check face normals against up vector
  let overhangCount = 0;
  
  for (let i = 0; i < meshData.normals.length; i += 3) {
    const normal = [
      meshData.normals[i] ?? 0,
      meshData.normals[i + 1] ?? 0,
      meshData.normals[i + 2] ?? 0,
    ];

    // Dot product with up vector [0, 0, 1]
    const dotProduct = normal[2] ?? 0; // Z component
    const angle = Math.acos(Math.abs(dotProduct)) * 180 / Math.PI;

    if (angle > maxAngle) {
      overhangCount++;
    }
  }

  // Only report if significant portion has overhangs
  const totalFaces = meshData.normals.length / 3;
  if (overhangCount > totalFaces * 0.1) { // More than 10% of faces
    issues.push({
      severity: 'warning',
      code: 'OVERHANG',
      message: `${((overhangCount / totalFaces) * 100).toFixed(1)}% of faces exceed ${maxAngle}° overhang angle`,
      suggestion: 'Add supports or reduce overhang angle',
      autoFixable: false,
    });
  }

  return issues;
}

/**
 * Check feature sizes
 */
function checkFeatureSizes(meshData: MeshData, minSize: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check edge lengths with optimization - sample every 100th triangle
  const step = Math.max(1, Math.floor(meshData.indices.length / 300));
  
  for (let i = 0; i < meshData.indices.length; i += step * 3) {
    const i0 = (meshData.indices[i] ?? 0) * 3;
    const i1 = (meshData.indices[i + 1] ?? 0) * 3;
    const i2 = (meshData.indices[i + 2] ?? 0) * 3;

    // Validate indices
    if (i0 >= meshData.vertices.length || i1 >= meshData.vertices.length || i2 >= meshData.vertices.length) {
      continue;
    }

    const v0 = [
      meshData.vertices[i0] ?? 0, 
      meshData.vertices[i0 + 1] ?? 0, 
      meshData.vertices[i0 + 2] ?? 0
    ];
    const v1 = [
      meshData.vertices[i1] ?? 0, 
      meshData.vertices[i1 + 1] ?? 0, 
      meshData.vertices[i1 + 2] ?? 0
    ];
    const v2 = [
      meshData.vertices[i2] ?? 0, 
      meshData.vertices[i2 + 1] ?? 0, 
      meshData.vertices[i2 + 2] ?? 0
    ];

    const edge1 = distance(v0, v1);
    const edge2 = distance(v1, v2);
    const edge3 = distance(v2, v0);

    if (edge1 < minSize || edge2 < minSize || edge3 < minSize) {
      issues.push({
        severity: 'warning',
        code: 'SMALL_FEATURES',
        message: `Some features smaller than ${minSize}mm may not print reliably`,
        autoFixable: false,
      });
      break; // Only report once
    }
  }

  return issues;
}

/**
 * Check if model fits in build volume
 */
function isWithinBuildVolume(bounds: BoundingBox, buildVolume: { x: number; y: number; z: number }): boolean {
  const width = (bounds.max[0] ?? 0) - (bounds.min[0] ?? 0);
  const height = (bounds.max[1] ?? 0) - (bounds.min[1] ?? 0);
  const depth = (bounds.max[2] ?? 0) - (bounds.min[2] ?? 0);

  return width <= buildVolume.x && height <= buildVolume.y && depth <= buildVolume.z;
}

/**
 * Calculate mesh statistics
 */
function calculateMeshStats(meshData: MeshData) {
  const bounds = calculateBoundingBox(meshData);
  const volume = estimateVolume(meshData);
  const surfaceArea = estimateSurfaceArea(meshData);

  return {
    triangleCount: meshData.indices.length / 3,
    vertexCount: meshData.vertices.length / 3,
    boundingBox: bounds,
    volume,
    surfaceArea,
    isManifold: isManifold(meshData),
  };
}

/**
 * Calculate bounding box
 */
function calculateBoundingBox(meshData: MeshData): BoundingBox {
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];

  for (let i = 0; i < meshData.vertices.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      const vertexValue = meshData.vertices[i + j] ?? 0;
      min[j] = Math.min(min[j] ?? 0, vertexValue);
      max[j] = Math.max(max[j] ?? 0, vertexValue);
    }
  }

  return { 
    min: min as [number, number, number], 
    max: max as [number, number, number] 
  };
}

/**
 * Estimate volume (simplified)
 */
function estimateVolume(meshData: MeshData): number {
  // Simplified volume calculation using signed volume
  let volume = 0;

  for (let i = 0; i < meshData.indices.length; i += 3) {
    const i0 = (meshData.indices[i] ?? 0) * 3;
    const i1 = (meshData.indices[i + 1] ?? 0) * 3;
    const i2 = (meshData.indices[i + 2] ?? 0) * 3;

    // Validate indices
    if (i0 >= meshData.vertices.length || i1 >= meshData.vertices.length || i2 >= meshData.vertices.length) {
      continue;
    }

    const v0 = [meshData.vertices[i0] ?? 0, meshData.vertices[i0 + 1] ?? 0, meshData.vertices[i0 + 2] ?? 0];
    const v1 = [meshData.vertices[i1] ?? 0, meshData.vertices[i1 + 1] ?? 0, meshData.vertices[i1 + 2] ?? 0];
    const v2 = [meshData.vertices[i2] ?? 0, meshData.vertices[i2 + 1] ?? 0, meshData.vertices[i2 + 2] ?? 0];

    volume += signedVolumeOfTriangle(v0, v1, v2);
  }

  return Math.abs(volume);
}

/**
 * Estimate surface area
 */
function estimateSurfaceArea(meshData: MeshData): number {
  let area = 0;

  for (let i = 0; i < meshData.indices.length; i += 3) {
    const i0 = (meshData.indices[i] ?? 0) * 3;
    const i1 = (meshData.indices[i + 1] ?? 0) * 3;
    const i2 = (meshData.indices[i + 2] ?? 0) * 3;

    // Validate indices
    if (i0 >= meshData.vertices.length || i1 >= meshData.vertices.length || i2 >= meshData.vertices.length) {
      continue;
    }

    const v0 = [meshData.vertices[i0] ?? 0, meshData.vertices[i0 + 1] ?? 0, meshData.vertices[i0 + 2] ?? 0];
    const v1 = [meshData.vertices[i1] ?? 0, meshData.vertices[i1 + 1] ?? 0, meshData.vertices[i1 + 2] ?? 0];
    const v2 = [meshData.vertices[i2] ?? 0, meshData.vertices[i2 + 1] ?? 0, meshData.vertices[i2 + 2] ?? 0];

    area += triangleArea(v0, v1, v2);
  }

  return area;
}

// Helper functions

function addEdge(edgeCount: Map<string, number>, i1: number, i2: number) {
  const key = i1 < i2 ? `${i1}-${i2}` : `${i2}-${i1}`;
  edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
}

function triangleArea(v1: number[], v2: number[], v3: number[]): number {
  const a = distance(v1, v2);
  const b = distance(v2, v3);
  const c = distance(v3, v1);
  const s = (a + b + c) / 2;
  return Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
}

function signedVolumeOfTriangle(v1: number[], v2: number[], v3: number[]): number {
  return (
    (v1[0] ?? 0) * ((v2[1] ?? 0) * (v3[2] ?? 0) - (v3[1] ?? 0) * (v2[2] ?? 0)) +
    (v2[0] ?? 0) * ((v3[1] ?? 0) * (v1[2] ?? 0) - (v1[1] ?? 0) * (v3[2] ?? 0)) +
    (v3[0] ?? 0) * ((v1[1] ?? 0) * (v2[2] ?? 0) - (v2[1] ?? 0) * (v1[2] ?? 0))
  ) / 6;
}

function distance(v1: number[], v2: number[]): number {
  const dx = (v1[0] ?? 0) - (v2[0] ?? 0);
  const dy = (v1[1] ?? 0) - (v2[1] ?? 0);
  const dz = (v1[2] ?? 0) - (v2[2] ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
