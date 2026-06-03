import { ExportResult, SceneObject } from '@/types';
import { ExportMeshData, transformMeshData } from '@/lib/export/utils';

/**
 * STL Export Implementation
 * Binary and ASCII STL formats
 */

type STLMesh = ExportMeshData;

/**
 * Export to binary STL format
 */
export function exportToSTLBinary(mesh: STLMesh): ExportResult {
  try {
    const { vertices, indices } = mesh;
    const triangleCount = indices.length / 3;

    // STL binary format:
    // - Header (80 bytes)
    // - Triangle count (4 bytes, uint32)
    // - Triangles (50 bytes each): normal(12) + vertices(36) + attribute(2)

    const bufferSize = 84 + (triangleCount * 50); // Header + triangles
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    let offset = 0;

    // Header (80 bytes)
    const header = `VoiceForge 3D - ${mesh.name}`.padEnd(80, '\0');
    for (let i = 0; i < 80; i++) {
      view.setUint8(offset++, header.charCodeAt(i));
    }

    // Triangle count (4 bytes, little-endian)
    view.setUint32(offset, triangleCount, true);
    offset += 4;

    // Triangles
    for (let i = 0; i < indices.length; i += 3) {
      const i0 = (indices[i] ?? 0) * 3;
      const i1 = (indices[i + 1] ?? 0) * 3;
      const i2 = (indices[i + 2] ?? 0) * 3;

      // Calculate face normal (simple average for now)
      const normal = calculateFaceNormal(
        [vertices[i0] ?? 0, vertices[i0 + 1] ?? 0, vertices[i0 + 2] ?? 0],
        [vertices[i1] ?? 0, vertices[i1 + 1] ?? 0, vertices[i1 + 2] ?? 0],
        [vertices[i2] ?? 0, vertices[i2 + 1] ?? 0, vertices[i2 + 2] ?? 0]
      );

      // Normal vector (12 bytes, float32, little-endian)
      view.setFloat32(offset, normal[0] ?? 0, true); offset += 4;
      view.setFloat32(offset, normal[1] ?? 0, true); offset += 4;
      view.setFloat32(offset, normal[2] ?? 0, true); offset += 4;

      // Vertex 1 (12 bytes)
      view.setFloat32(offset, vertices[i0] ?? 0, true); offset += 4;
      view.setFloat32(offset, vertices[i0 + 1] ?? 0, true); offset += 4;
      view.setFloat32(offset, vertices[i0 + 2] ?? 0, true); offset += 4;

      // Vertex 2 (12 bytes)
      view.setFloat32(offset, vertices[i1] ?? 0, true); offset += 4;
      view.setFloat32(offset, vertices[i1 + 1] ?? 0, true); offset += 4;
      view.setFloat32(offset, vertices[i1 + 2] ?? 0, true); offset += 4;

      // Vertex 3 (12 bytes)
      view.setFloat32(offset, vertices[i2] ?? 0, true); offset += 4;
      view.setFloat32(offset, vertices[i2 + 1] ?? 0, true); offset += 4;
      view.setFloat32(offset, vertices[i2 + 2] ?? 0, true); offset += 4;

      // Attribute byte count (2 bytes, uint16, little-endian)
      view.setUint16(offset, 0, true); offset += 2;
    }

    const blob = new Blob([buffer], { type: 'application/octet-stream' });

    return {
      success: true,
      blob,
      filename: `${mesh.name.replace(/[^a-z0-9]/gi, '_')}.stl`,
    };

  } catch (error) {
    console.error('STL binary export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'STL binary export failed',
    };
  }
}

/**
 * Export to ASCII STL format
 */
export function exportToSTLASCII(mesh: STLMesh): ExportResult {
  try {
    const { vertices, indices, name } = mesh;
    let stl = `solid ${name}\n`;

    for (let i = 0; i < indices.length; i += 3) {
      const i0 = (indices[i] ?? 0) * 3;
      const i1 = (indices[i + 1] ?? 0) * 3;
      const i2 = (indices[i + 2] ?? 0) * 3;

      // Calculate face normal
      const normal = calculateFaceNormal(
        [vertices[i0] ?? 0, vertices[i0 + 1] ?? 0, vertices[i0 + 2] ?? 0],
        [vertices[i1] ?? 0, vertices[i1 + 1] ?? 0, vertices[i1 + 2] ?? 0],
        [vertices[i2] ?? 0, vertices[i2 + 1] ?? 0, vertices[i2 + 2] ?? 0]
      );

      stl += `  facet normal ${(normal[0] ?? 0).toFixed(6)} ${(normal[1] ?? 0).toFixed(6)} ${(normal[2] ?? 0).toFixed(6)}\n`;
      stl += `    outer loop\n`;

      // Vertex 1
      stl += `      vertex ${(vertices[i0] ?? 0).toFixed(6)} ${(vertices[i0 + 1] ?? 0).toFixed(6)} ${(vertices[i0 + 2] ?? 0).toFixed(6)}\n`;

      // Vertex 2
      stl += `      vertex ${(vertices[i1] ?? 0).toFixed(6)} ${(vertices[i1 + 1] ?? 0).toFixed(6)} ${(vertices[i1 + 2] ?? 0).toFixed(6)}\n`;

      // Vertex 3
      stl += `      vertex ${(vertices[i2] ?? 0).toFixed(6)} ${(vertices[i2 + 1] ?? 0).toFixed(6)} ${(vertices[i2 + 2] ?? 0).toFixed(6)}\n`;

      stl += `    endloop\n`;
      stl += `  endfacet\n`;
    }

    stl += `endsolid ${name}\n`;

    const blob = new Blob([stl], { type: 'text/plain' });

    return {
      success: true,
      blob,
      filename: `${name.replace(/[^a-z0-9]/gi, '_')}.stl`,
    };

  } catch (error) {
    console.error('STL ASCII export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'STL ASCII export failed',
    };
  }
}

/**
 * Calculate face normal from three vertices
 */
function calculateFaceNormal(v1: number[], v2: number[], v3: number[]): number[] {
  // Vectors from v1 to v2 and v1 to v3
  const edge1 = [(v2[0] ?? 0) - (v1[0] ?? 0), (v2[1] ?? 0) - (v1[1] ?? 0), (v2[2] ?? 0) - (v1[2] ?? 0)];
  const edge2 = [(v3[0] ?? 0) - (v1[0] ?? 0), (v3[1] ?? 0) - (v1[1] ?? 0), (v3[2] ?? 0) - (v1[2] ?? 0)];

  // Cross product for normal
  const normal = [
    (edge1[1] ?? 0) * (edge2[2] ?? 0) - (edge1[2] ?? 0) * (edge2[1] ?? 0),
    (edge1[2] ?? 0) * (edge2[0] ?? 0) - (edge1[0] ?? 0) * (edge2[2] ?? 0),
    (edge1[0] ?? 0) * (edge2[1] ?? 0) - (edge1[1] ?? 0) * (edge2[0] ?? 0),
  ];

  // Normalize
  const length = Math.sqrt((normal[0] ?? 0) * (normal[0] ?? 0) + (normal[1] ?? 0) * (normal[1] ?? 0) + (normal[2] ?? 0) * (normal[2] ?? 0));
  if (length > 0) {
    return normal.map(n => n / length);
  }

  return [0, 0, 1]; // Default normal if calculation fails
}

/**
 * Convert SceneObject to STLMesh format
 */
export function sceneObjectToSTLMesh(object: SceneObject): STLMesh {
  if (!object.meshData) {
    return {
      name: object.name,
      vertices: new Float32Array(),
      indices: new Uint32Array(),
      normals: new Float32Array(),
    };
  }

  const transformed = transformMeshData(
    object.meshData,
    object.position,
    object.rotation,
    object.scale
  );

  return {
    name: object.name,
    vertices: transformed.vertices,
    indices: transformed.indices,
    normals: transformed.normals,
  };
}
