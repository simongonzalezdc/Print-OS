/**
 * STL File Parser
 * Supports both ASCII and binary STL formats
 */

import { MeshData } from '@/types';

interface STLTriangle {
  normal: [number, number, number];
  vertices: [
    [number, number, number],
    [number, number, number],
    [number, number, number]
  ];
}

/**
 * Parse STL file (ASCII or binary)
 */
export async function parseSTL(file: File): Promise<MeshData> {
  const buffer = await file.arrayBuffer();
  const dataView = new DataView(buffer);
  
  // Check if ASCII (first 80 bytes should contain "solid" for ASCII STL)
  const header = new TextDecoder().decode(buffer.slice(0, 80));
  const isASCII = header.trim().toLowerCase().startsWith('solid');

  if (isASCII) {
    return parseASCIISTL(new TextDecoder().decode(buffer));
  } else {
    return parseBinarySTL(dataView);
  }
}

/**
 * Parse ASCII STL format
 */
function parseASCIISTL(text: string): MeshData {
  const triangles: STLTriangle[] = [];
  const lines = text.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]?.trim();
    
    if (line?.startsWith('facet normal')) {
      // Parse normal
      const normalMatch = line.match(/facet normal\s+([\d\.\-eE]+)\s+([\d\.\-eE]+)\s+([\d\.\-eE]+)/);
      if (!normalMatch) {
        i++;
        continue;
      }
      
      const normal: [number, number, number] = [
        parseFloat(normalMatch[1] ?? '0'),
        parseFloat(normalMatch[2] ?? '0'),
        parseFloat(normalMatch[3] ?? '0'),
      ];
      
      // Parse vertices
      const vertices: Array<[number, number, number]> = [];
      i++;
      
      while (i < lines.length && !lines[i]?.trim().startsWith('endfacet')) {
        const vertexLine = lines[i]?.trim();
        if (vertexLine?.startsWith('vertex')) {
          const vertexMatch = vertexLine.match(/vertex\s+([\d\.\-eE]+)\s+([\d\.\-eE]+)\s+([\d\.\-eE]+)/);
          if (vertexMatch) {
            vertices.push([
              parseFloat(vertexMatch[1] ?? '0'),
              parseFloat(vertexMatch[2] ?? '0'),
              parseFloat(vertexMatch[3] ?? '0'),
            ]);
          }
        }
        i++;
      }
      
      if (vertices.length === 3) {
        triangles.push({
          normal,
          vertices: [vertices[0]!, vertices[1]!, vertices[2]!],
        });
      }
    }
    
    i++;
  }
  
  return convertTrianglesToMeshData(triangles);
}

/**
 * Parse binary STL format
 */
function parseBinarySTL(dataView: DataView): MeshData {
  const triangles: STLTriangle[] = [];
  
  // Skip 80-byte header
  let offset = 80;
  
  // Read triangle count (4 bytes, little-endian)
  const triangleCount = dataView.getUint32(offset, true);
  offset += 4;
  
  // Read each triangle (50 bytes each: 12 normal + 36 vertices + 2 attribute)
  for (let i = 0; i < triangleCount; i++) {
    if (offset + 50 > dataView.byteLength) break;
    
    // Read normal (3 floats, 12 bytes)
    const normal: [number, number, number] = [
      dataView.getFloat32(offset, true),
      dataView.getFloat32(offset + 4, true),
      dataView.getFloat32(offset + 8, true),
    ];
    offset += 12;
    
    // Read vertices (3 vertices × 3 floats × 4 bytes = 36 bytes)
    const v1: [number, number, number] = [
      dataView.getFloat32(offset, true),
      dataView.getFloat32(offset + 4, true),
      dataView.getFloat32(offset + 8, true),
    ];
    offset += 12;
    
    const v2: [number, number, number] = [
      dataView.getFloat32(offset, true),
      dataView.getFloat32(offset + 4, true),
      dataView.getFloat32(offset + 8, true),
    ];
    offset += 12;
    
    const v3: [number, number, number] = [
      dataView.getFloat32(offset, true),
      dataView.getFloat32(offset + 4, true),
      dataView.getFloat32(offset + 8, true),
    ];
    offset += 12;
    
    // Skip attribute byte count (2 bytes)
    offset += 2;
    
    triangles.push({
      normal,
      vertices: [v1, v2, v3],
    });
  }
  
  return convertTrianglesToMeshData(triangles);
}

/**
 * Convert STL triangles to MeshData format
 */
function convertTrianglesToMeshData(triangles: STLTriangle[]): MeshData {
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  
  // STL uses Z-up, Three.js uses Y-up, so we swap Y and Z
  for (let i = 0; i < triangles.length; i++) {
    const tri = triangles[i];
    if (!tri) continue;
    
    const baseIndex = vertices.length / 3;
    
    // Add vertices (swap Y and Z for Three.js coordinate system)
    for (const vertex of tri.vertices) {
      vertices.push(vertex[0] ?? 0, vertex[2] ?? 0, vertex[1] ?? 0);
    }
    
    // Add indices
    indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
    
    // Add normals (swap Y and Z)
    const normal = tri.normal;
    for (let j = 0; j < 3; j++) {
      normals.push(normal[0] ?? 0, normal[2] ?? 0, normal[1] ?? 0);
    }
  }
  
  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    normals: new Float32Array(normals),
  };
}

/**
 * Center mesh at origin
 */
export function centerMesh(meshData: MeshData): MeshData {
  const { vertices } = meshData;
  
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
  
  // Calculate center offset
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;
  
  // Translate vertices to center
  const centeredVertices = new Float32Array(vertices.length);
  for (let i = 0; i < vertices.length; i += 3) {
    centeredVertices[i] = (vertices[i] ?? 0) - centerX;
    centeredVertices[i + 1] = (vertices[i + 1] ?? 0) - centerY;
    centeredVertices[i + 2] = (vertices[i + 2] ?? 0) - centerZ;
  }
  
  return {
    ...meshData,
    vertices: centeredVertices,
  };
}

/**
 * Scale mesh by factor
 */
export function scaleMesh(meshData: MeshData, scale: number): MeshData {
  const scaledVertices = new Float32Array(meshData.vertices.length);
  
  for (let i = 0; i < meshData.vertices.length; i++) {
    scaledVertices[i] = (meshData.vertices[i] ?? 0) * scale;
  }
  
  return {
    ...meshData,
    vertices: scaledVertices,
  };
}

