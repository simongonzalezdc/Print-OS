import JSZip from 'jszip';
import { ExportResult, SceneObject } from '@/types';
import { EXPORT } from '@/lib/constants';
import { ExportMeshData, transformMeshData } from '@/lib/export/utils';

/**
 * 3MF Export Implementation
 * Creates 3MF files compatible with Orca Slicer
 */

interface Mesh3MF extends ExportMeshData {
  color?: string;
}

interface Scene3MF {
  meshes: Mesh3MF[];
  title: string;
  creator: string;
}

/**
 * Export scene to 3MF format
 */
export async function exportTo3MF(
  meshes: Mesh3MF[],
  options: {
    title?: string;
    includeThumbnail?: boolean;
    thumbnailData?: string; // base64
  } = {}
): Promise<ExportResult> {
  try {
    const zip = new JSZip();

    // 3MF structure
    const scene: Scene3MF = {
      meshes,
      title: options.title || 'Caedo Export',
      creator: EXPORT.CREATOR,
    };

    // Generate required XML files
    zip.file('[Content_Types].xml', generateContentTypes());
    zip.file('_rels/.rels', generateRelationships());
    zip.file('3D/3dmodel.model', generateModelXML(scene));

    // Optional thumbnail
    if (options.includeThumbnail && options.thumbnailData) {
      zip.folder('Metadata');
      zip.file('Metadata/thumbnail.png', options.thumbnailData, { base64: true });
    }

    // Generate ZIP file
    const blob = await zip.generateAsync({ type: 'blob' });

    return {
      success: true,
      blob,
      filename: `${scene.title.replace(/[^a-z0-9]/gi, '_')}.3mf`,
    };

  } catch (error) {
    console.error('3MF export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '3MF export failed',
    };
  }
}

/**
 * Generate [Content_Types].xml
 */
function generateContentTypes(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
  <Default Extension="png" ContentType="image/png" />
</Types>`;
}

/**
 * Generate _rels/.rels
 */
function generateRelationships(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Id="rel0" />
</Relationships>`;
}

/**
 * Generate 3D/3dmodel.model (main model file)
 */
function generateModelXML(scene: Scene3MF): string {
  const resources = scene.meshes.map((mesh, index) => {
    const objectId = index + 1;
    const vertices = formatVertices(mesh.vertices);
    const triangles = formatTriangles(mesh.indices);

    return `
  <object id="${objectId}" name="${mesh.name}" type="model">
    <mesh>
      <vertices>
        ${vertices}
      </vertices>
      <triangles>
        ${triangles}
      </triangles>
    </mesh>
  </object>`;
  }).join('');

  const buildItems = scene.meshes.map((_, index) => {
    const objectId = index + 1;
    return `  <item objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 0 0 0" />`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">${scene.title}</metadata>
  <metadata name="Designer">${scene.creator}</metadata>
  <metadata name="CreationDate">${new Date().toISOString()}</metadata>
  <metadata name="Application">Caedo 3D</metadata>

  <resources>
    ${resources}
  </resources>

  <build>
    ${buildItems}
  </build>
</model>`;
}

/**
 * Format vertices for 3MF XML
 */
export function formatVertices(vertices: Float32Array): string {
  const vertexStrings: string[] = [];

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i]?.toFixed(6) || '0.000000';
    const y = vertices[i + 1]?.toFixed(6) || '0.000000';
    const z = vertices[i + 2]?.toFixed(6) || '0.000000';
    vertexStrings.push(`        <vertex x="${x}" y="${y}" z="${z}" />`);
  }

  return vertexStrings.join('\n');
}

/**
 * Format triangles for 3MF XML
 */
export function formatTriangles(indices: Uint32Array): string {
  const triangleStrings: string[] = [];

  for (let i = 0; i < indices.length; i += 3) {
    const v1 = indices[i] ?? 0;
    const v2 = indices[i + 1] ?? 0;
    const v3 = indices[i + 2] ?? 0;
    triangleStrings.push(`        <triangle v1="${v1}" v2="${v2}" v3="${v3}" />`);
  }

  return triangleStrings.join('\n');
}

/**
 * Convert SceneObject to Mesh3MF format
 */
export function sceneObjectToMesh3MF(object: SceneObject): Mesh3MF {
  if (!object.meshData) {
    return {
      name: object.name,
      vertices: new Float32Array(),
      indices: new Uint32Array(),
      normals: new Float32Array(),
      color: object.color,
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
    color: object.color,
  };
}
