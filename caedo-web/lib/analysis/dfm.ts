import { MeshData, ValidationResult, ValidationIssue, Vector3Tuple } from '@/types';

/**
 * Design-for-Manufacturability (DFM) Analyzer
 * Analyzes 3D meshes for common FDM 3D printing issues.
 */
export function analyzeMeshDFM(meshData: MeshData): ValidationResult {
  const issues: ValidationIssue[] = [];
  const { vertices, normals, indices } = meshData;
  
  // 1. Overhang Analysis
  const overhangIssues = checkOverhangs(vertices, normals, indices);
  issues.push(...overhangIssues);
  
  // 2. Wall Thickness (Improved analysis)
  const thicknessIssues = checkWallThickness(vertices, normals, indices);
  issues.push(...thicknessIssues);

  // 3. Bridge Analysis
  const bridgeIssues = checkBridges(vertices, normals, indices);
  issues.push(...bridgeIssues);
  
  const boundingBox = getBoundingBox(vertices);

  return {
    isValid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    stats: {
      triangleCount: indices.length / 3,
      vertexCount: vertices.length / 3,
      boundingBox,
      volume: calculateVolume(vertices, indices),
      surfaceArea: 0, // Placeholder
      isManifold: true // Placeholder
    }
  };
}

function checkOverhangs(_vertices: Float32Array, normals: Float32Array, indices: Uint32Array): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const thresholdRad = (45 * Math.PI) / 180; // 45 degrees
  
  let overhangCount = 0;
  let criticalOverhangCount = 0;
  
  // Sample triangles to check overhangs
  for (let i = 0; i < indices.length; i += 3 * 10) { 
    const idx = indices[i];
    if (idx === undefined) continue;
    
    const normalIndex = idx * 3;
    const nz = normals[normalIndex + 2];
    if (nz === undefined) continue;
    
    // Angle between normal and down vector [0, 0, -1]
    const dot = -nz; 
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    
    if (angle < thresholdRad) {
      overhangCount++;
      if (angle < (thresholdRad - 0.17)) { // ~10 degrees more steep
        criticalOverhangCount++;
      }
    }
  }
  
  if (criticalOverhangCount > 5) {
    issues.push({
      severity: 'error',
      code: 'CRITICAL_OVERHANG',
      message: 'Severe unsupported overhangs detected. Support structures are MANDATORY.',
      autoFixable: false,
      suggestion: 'Try re-orienting the part or adding chamfers to angles > 45°.'
    });
  } else if (overhangCount > 10) {
    issues.push({
      severity: 'warning',
      code: 'STEEP_OVERHANG',
      message: 'Steep overhangs detected. Print quality may be degraded without supports.',
      autoFixable: false,
      suggestion: 'Enable support generation in your slicer.'
    });
  }
  
  return issues;
}

/**
 * Heuristic-based wall thickness check using ray-casting simulation
 */
function checkWallThickness(vertices: Float32Array, normals: Float32Array, _indices: Uint32Array): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const MIN_WALL_STRUCTURAL = 1.2;
  const ABSOLUTE_MIN = 0.4;
  
  let thinCount = 0;
  let criticalThinCount = 0;
  
  for (let i = 0; i < vertices.length; i += 3 * 20) {
    const vx = vertices[i];
    const vy = vertices[i + 1];
    const vz = vertices[i + 2];
    
    const nx = normals[i];
    const ny = normals[i + 1];
    const nz = normals[i + 2];

    if (vx === undefined || vy === undefined || vz === undefined) continue;
    if (nx === undefined || ny === undefined || nz === undefined) continue;
    
    const rayDist = MIN_WALL_STRUCTURAL * 2;
    for (let j = 0; j < vertices.length; j += 3 * 50) {
      if (i === j) continue;
      
      const vjx = vertices[j];
      const vjy = vertices[j+1];
      const vjz = vertices[j+2];

      if (vjx === undefined || vjy === undefined || vjz === undefined) continue;

      const dx = vjx - vx;
      const dy = vjy - vy;
      const dz = vjz - vz;
      
      const distSq = dx*dx + dy*dy + dz*dz;
      if (distSq < rayDist * rayDist) {
        const dist = Math.sqrt(distSq);
        const dot = dx*(-nx) + dy*(-ny) + dz*(-nz);
        if (dot > 0.8) { 
          if (dist < ABSOLUTE_MIN) criticalThinCount++;
          else if (dist < MIN_WALL_STRUCTURAL) thinCount++;
        }
      }
    }
  }
  
  if (criticalThinCount > 2) {
    issues.push({
      severity: 'error',
      code: 'CRITICAL_THIN_WALL',
      message: 'Detected walls thinner than 0.4mm. These cannot be printed with a standard 0.4mm nozzle.',
      autoFixable: false,
      suggestion: 'Increase wall thickness to at least 1.2mm (3 perimeters).'
    });
  } else if (thinCount > 5) {
    issues.push({
      severity: 'warning',
      code: 'THIN_WALL',
      message: 'Some sections are thinner than 1.2mm. Structural integrity may be compromised.',
      autoFixable: false,
      suggestion: 'Standardize on 1.6mm or 2.0mm walls for functional parts.'
    });
  }
  
  return issues;
}

/**
 * Basic bridge detection for horizontal spans
 */
function checkBridges(_vertices: Float32Array, normals: Float32Array, indices: Uint32Array): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const MAX_BRIDGE_SPAN = 15.0; // mm
  
  let horizontalFaceCount = 0;
  for (let i = 0; i < indices.length; i += 3 * 5) {
    const idx = indices[i];
    if (idx === undefined) continue;
    const normalIndex = idx * 3;
    const nz = normals[normalIndex + 2];
    if (nz === undefined) continue;
    
    if (nz < -0.98) { 
      horizontalFaceCount++;
    }
  }
  
  if (horizontalFaceCount > 50) {
    issues.push({
      severity: 'warning',
      code: 'POTENTIAL_BRIDGE',
      message: 'Large horizontal spans detected. These may sag or fail without supports.',
      autoFixable: false,
      suggestion: `Ensure spans are under ${MAX_BRIDGE_SPAN}mm or add vertical support pillars.`
    });
  }
  
  return issues;
}

function getBoundingBox(vertices: Float32Array) {
  let min: Vector3Tuple = [Infinity, Infinity, Infinity];
  let max: Vector3Tuple = [-Infinity, -Infinity, -Infinity];
  
  for (let i = 0; i < vertices.length; i += 3) {
    const vx = vertices[i];
    const vy = vertices[i+1];
    const vz = vertices[i+2];

    if (vx === undefined || vy === undefined || vz === undefined) continue;

    min[0] = Math.min(min[0], vx);
    min[1] = Math.min(min[1], vy);
    min[2] = Math.min(min[2], vz);
    max[0] = Math.max(max[0], vx);
    max[1] = Math.max(max[1], vy);
    max[2] = Math.max(max[2], vz);
  }
  
  return { min, max };
}

function calculateVolume(vertices: Float32Array, indices: Uint32Array): number {
  let totalVolume = 0;
  for (let i = 0; i < indices.length; i += 3) {
    const i1 = indices[i];
    const i2 = indices[i+1];
    const i3 = indices[i+2];

    if (i1 === undefined || i2 === undefined || i3 === undefined) continue;

    const v1x = vertices[i1 * 3];
    const v1y = vertices[i1 * 3 + 1];
    const v1z = vertices[i1 * 3 + 2];
    
    const v2x = vertices[i2 * 3];
    const v2y = vertices[i2 * 3 + 1];
    const v2z = vertices[i2 * 3 + 2];
    
    const v3x = vertices[i3 * 3];
    const v3y = vertices[i3 * 3 + 1];
    const v3z = vertices[i3 * 3 + 2];

    if (v1x === undefined || v1y === undefined || v1z === undefined) continue;
    if (v2x === undefined || v2y === undefined || v2z === undefined) continue;
    if (v3x === undefined || v3y === undefined || v3z === undefined) continue;
    
    totalVolume += (-v3x * v2y * v1z + v2x * v3y * v1z + v3x * v1y * v2z - v1x * v3y * v2z - v2x * v1y * v3z + v1x * v2y * v3z) / 6.0;
  }
  return Math.abs(totalVolume);
}
