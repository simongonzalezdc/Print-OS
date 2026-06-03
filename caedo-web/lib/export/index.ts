/**
 * Export Pipeline for 3D Printing
 * 
 * Central export module that handles validation, preparation, and export
 * to various formats (3MF, STL) optimized for slicers.
 */

import { SceneObject, MeshData } from '@/types';
import { exportTo3MF, sceneObjectToMesh3MF } from './3mf';
import { exportToSTLBinary, exportToSTLASCII } from './stl';
import { validateMeshForPrinting, ValidationResult } from './validate';
import { transformMeshData } from './utils';

// =============================================================================
// EXPORT OPTIONS
// =============================================================================

export type ExportFormat = '3mf' | 'stl-binary' | 'stl-ascii';

export interface ExportOptions {
  format: ExportFormat;
  title?: string;
  
  // Validation options
  skipValidation?: boolean;
  allowWarnings?: boolean;  // Export even with warnings (default: true)
  allowErrors?: boolean;    // Export even with errors (default: false)
  
  // Auto-fix options
  autoFixZPosition?: boolean;  // Move to Z=0 if needed (default: true)
  
  // 3MF specific
  includeThumbnail?: boolean;
  thumbnailData?: string;
}

export interface ExportResultWithValidation {
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
  validation?: ValidationResult;
}

// =============================================================================
// MAIN EXPORT FUNCTION
// =============================================================================

/**
 * Export scene objects for 3D printing
 * Validates geometry and applies auto-fixes before export
 */
export async function exportForPrinting(
  objects: SceneObject[],
  options: ExportOptions
): Promise<ExportResultWithValidation> {
  const {
    format,
    skipValidation = false,
    allowWarnings = true,
    allowErrors = false,
    autoFixZPosition = true,
  } = options;
  
  // Filter objects with mesh data
  const exportableObjects = objects.filter(obj => obj.meshData);
  
  if (exportableObjects.length === 0) {
    return {
      success: false,
      error: 'No objects with geometry to export',
    };
  }
  
  // Combine all meshes for validation
  const combinedMesh = combineObjectMeshes(exportableObjects, autoFixZPosition);
  
  // Validate if not skipped
  let validation: ValidationResult | undefined;
  if (!skipValidation) {
    validation = validateMeshForPrinting(combinedMesh);
    
    const hasErrors = !validation.isValid;
    const hasWarnings = validation.issues.some(i => i.severity === 'warning');
    
    // Block export if validation fails
    if (hasErrors && !allowErrors) {
      return {
        success: false,
        error: 'Export blocked due to validation errors',
        validation,
      };
    }
    
    if (hasWarnings && !allowWarnings) {
      return {
        success: false,
        error: 'Export blocked due to validation warnings',
        validation,
      };
    }
  }
  
  // Perform export based on format
  let result: ExportResultWithValidation;
  
  switch (format) {
    case '3mf':
      result = await exportTo3MF(
        exportableObjects.map(obj => sceneObjectToMesh3MF(obj)),
        {
          title: options.title,
          includeThumbnail: options.includeThumbnail,
          thumbnailData: options.thumbnailData,
        }
      );
      break;
      
    case 'stl-binary':
      // For STL, combine all objects into single mesh
      result = exportToSTLBinary({
        name: options.title || 'Caedo_Export',
        ...combinedMesh,
      });
      break;
      
    case 'stl-ascii':
      result = exportToSTLASCII({
        name: options.title || 'Caedo_Export',
        ...combinedMesh,
      });
      break;
      
    default:
      return {
        success: false,
        error: `Unknown export format: ${format}`,
      };
  }
  
  return {
    ...result,
    validation,
  };
}

// =============================================================================
// MESH UTILITIES
// =============================================================================

/**
 * Combine multiple object meshes into a single mesh
 * Optionally auto-fix Z position
 */
function combineObjectMeshes(
  objects: SceneObject[],
  autoFixZ: boolean
): MeshData {
  const allVertices: number[] = [];
  const allIndices: number[] = [];
  const allNormals: number[] = [];
  
  let vertexOffset = 0;
  let minZ = Infinity;
  
  // First pass: collect all vertices and find minZ
  for (const obj of objects) {
    if (!obj.meshData) continue;
    
    const transformed = transformMeshData(
      obj.meshData,
      obj.position,
      obj.rotation,
      obj.scale
    );
    
    // Find minZ for this mesh
    for (let i = 2; i < transformed.vertices.length; i += 3) {
      minZ = Math.min(minZ, transformed.vertices[i] ?? 0);
    }
  }
  
  // Calculate Z offset if needed
  const zOffset = autoFixZ && isFinite(minZ) && Math.abs(minZ) > 0.01 ? -minZ : 0;
  
  // Second pass: combine meshes with offset
  for (const obj of objects) {
    if (!obj.meshData) continue;
    
    const transformed = transformMeshData(
      obj.meshData,
      obj.position,
      obj.rotation,
      obj.scale
    );
    
    // Add vertices with Z offset
    for (let i = 0; i < transformed.vertices.length; i += 3) {
      allVertices.push(transformed.vertices[i] ?? 0);
      allVertices.push(transformed.vertices[i + 1] ?? 0);
      allVertices.push((transformed.vertices[i + 2] ?? 0) + zOffset);
    }
    
    // Add indices with offset
    for (let i = 0; i < transformed.indices.length; i++) {
      allIndices.push((transformed.indices[i] ?? 0) + vertexOffset);
    }
    
    // Add normals (unchanged)
    for (let i = 0; i < transformed.normals.length; i++) {
      allNormals.push(transformed.normals[i] ?? 0);
    }
    
    vertexOffset += transformed.vertices.length / 3;
  }
  
  return {
    vertices: new Float32Array(allVertices),
    indices: new Uint32Array(allIndices),
    normals: new Float32Array(allNormals),
  };
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export { validateMeshForPrinting, calculateMeshStats } from './validate';
export type { ValidationResult, ValidationIssue, MeshStats } from './validate';

