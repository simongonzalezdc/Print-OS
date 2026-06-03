import JSZip from 'jszip';

interface WorkerMeshPayload {
  name: string;
  vertices: Float32Array;
  indices: Uint32Array;
}

interface Export3MFPayload {
  title: string;
  creator?: string;
  meshes: WorkerMeshPayload[];
  includeThumbnail?: boolean;
  thumbnailData?: string;
}

type ExportWorkerMessage =
  | { type: 'EXPORT_3MF'; payload: Export3MFPayload; id: string }
  | { type: 'EXPORT_STL_BINARY' | 'EXPORT_STL_ASCII'; payload: WorkerMeshPayload; id: string };

/**
 * Web Worker for handling heavy mesh export operations (JSZip compression, STL generation)
 * off the main UI thread to prevent UI freezing.
 */

// --- 3MF Helpers (Duplicated for worker isolation) ---

function generateContentTypes(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
  <Default Extension="png" ContentType="image/png" />
</Types>`;
}

function generateRelationships(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Id="rel0" />
</Relationships>`;
}

function formatVertices(vertices: Float32Array): string {
  const vertexStrings: string[] = [];
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i]?.toFixed(6) || '0.000000';
    const y = vertices[i + 1]?.toFixed(6) || '0.000000';
    const z = vertices[i + 2]?.toFixed(6) || '0.000000';
    vertexStrings.push(`        <vertex x="${x}" y="${y}" z="${z}" />`);
  }
  return vertexStrings.join('\n');
}

function formatTriangles(indices: Uint32Array): string {
  const triangleStrings: string[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const v1 = indices[i] ?? 0;
    const v2 = indices[i + 1] ?? 0;
    const v3 = indices[i + 2] ?? 0;
    triangleStrings.push(`        <triangle v1="${v1}" v2="${v2}" v3="${v3}" />`);
  }
  return triangleStrings.join('\n');
}

function generateModelXML(payload: Export3MFPayload): string {
  const resources = payload.meshes.map((mesh, index: number) => {
    const objectId = index + 1;
    return `
  <object id="${objectId}" name="${mesh.name}" type="model">
    <mesh>
      <vertices>
        ${formatVertices(mesh.vertices)}
      </vertices>
      <triangles>
        ${formatTriangles(mesh.indices)}
      </triangles>
    </mesh>
  </object>`;
  }).join('');

  const buildItems = payload.meshes.map((_, index: number) => {
    const objectId = index + 1;
    return `  <item objectid="${objectId}" transform="1 0 0 0 1 0 0 0 1 0 0 0" />`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">${payload.title}</metadata>
  <metadata name="Designer">${payload.creator}</metadata>
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

// --- STL Helpers ---

function calculateFaceNormal(v1: number[], v2: number[], v3: number[]): number[] {
  const edge1 = [(v2[0] ?? 0) - (v1[0] ?? 0), (v2[1] ?? 0) - (v1[1] ?? 0), (v2[2] ?? 0) - (v1[2] ?? 0)];
  const edge2 = [(v3[0] ?? 0) - (v1[0] ?? 0), (v3[1] ?? 0) - (v1[1] ?? 0), (v3[2] ?? 0) - (v1[2] ?? 0)];
  const normal = [
    (edge1[1] ?? 0) * (edge2[2] ?? 0) - (edge1[2] ?? 0) * (edge2[1] ?? 0),
    (edge1[2] ?? 0) * (edge2[0] ?? 0) - (edge1[0] ?? 0) * (edge2[2] ?? 0),
    (edge1[0] ?? 0) * (edge2[1] ?? 0) - (edge1[1] ?? 0) * (edge2[0] ?? 0),
  ];
  const length = Math.sqrt((normal[0] ?? 0) * (normal[0] ?? 0) + (normal[1] ?? 0) * (normal[1] ?? 0) + (normal[2] ?? 0) * (normal[2] ?? 0));
  return length > 0 ? normal.map(n => n / length) : [0, 0, 1];
}

// --- Main Worker Loop ---

self.onmessage = async (e: MessageEvent<ExportWorkerMessage>) => {
  const { type, payload, id } = e.data;

  try {
    if (type === 'EXPORT_3MF') {
      const zip = new JSZip();
      zip.file('[Content_Types].xml', generateContentTypes());
      zip.file('_rels/.rels', generateRelationships());
      zip.file('3D/3dmodel.model', generateModelXML(payload));

      if (payload.includeThumbnail && payload.thumbnailData) {
        zip.folder('Metadata');
        zip.file('Metadata/thumbnail.png', payload.thumbnailData, { base64: true });
      }

      const blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      self.postMessage({ 
        type: 'EXPORT_SUCCESS', 
        id, 
        payload: { blob, filename: `${payload.title.replace(/[^a-z0-9]/gi, '_')}.3mf` } 
      });
    } 
    
    else if (type === 'EXPORT_STL_BINARY') {
      const { vertices, indices, name } = payload;
      const triangleCount = indices.length / 3;
      const bufferSize = 84 + (triangleCount * 50);
      const buffer = new ArrayBuffer(bufferSize);
      const view = new DataView(buffer);
      let offset = 0;

      const header = `Caedo 3D - ${name}`.padEnd(80, '\0');
      for (let i = 0; i < 80; i++) view.setUint8(offset++, header.charCodeAt(i));
      
      view.setUint32(offset, triangleCount, true);
      offset += 4;

      for (let i = 0; i < indices.length; i += 3) {
        const i0 = (indices[i] ?? 0) * 3;
        const i1 = (indices[i + 1] ?? 0) * 3;
        const i2 = (indices[i + 2] ?? 0) * 3;

        const normal = calculateFaceNormal(
          [vertices[i0] ?? 0, vertices[i0+1] ?? 0, vertices[i0+2] ?? 0],
          [vertices[i1] ?? 0, vertices[i1+1] ?? 0, vertices[i1+2] ?? 0],
          [vertices[i2] ?? 0, vertices[i2+1] ?? 0, vertices[i2+2] ?? 0]
        );

        view.setFloat32(offset, normal[0] ?? 0, true); offset += 4;
        view.setFloat32(offset, normal[1] ?? 0, true); offset += 4;
        view.setFloat32(offset, normal[2] ?? 0, true); offset += 4;

        const vertexIndices = [i0, i1, i2];
        for (let j = 0; j < 3; j++) {
          const idx = vertexIndices[j]!;
          view.setFloat32(offset, vertices[idx] ?? 0, true); offset += 4;
          view.setFloat32(offset, vertices[idx+1] ?? 0, true); offset += 4;
          view.setFloat32(offset, vertices[idx+2] ?? 0, true); offset += 4;
        }
        view.setUint16(offset, 0, true); offset += 2;
      }

      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      self.postMessage({ 
        type: 'EXPORT_SUCCESS', 
        id, 
        payload: { blob, filename: `${name.replace(/[^a-z0-9]/gi, '_')}.stl` } 
      });
    }

    else if (type === 'EXPORT_STL_ASCII') {
      const { vertices, indices, name } = payload;
      let stl = `solid ${name}\n`;

      for (let i = 0; i < indices.length; i += 3) {
        const i0 = (indices[i] ?? 0) * 3;
        const i1 = (indices[i+1] ?? 0) * 3;
        const i2 = (indices[i+2] ?? 0) * 3;

        const normal = calculateFaceNormal(
          [vertices[i0] ?? 0, vertices[i0+1] ?? 0, vertices[i0+2] ?? 0],
          [vertices[i1] ?? 0, vertices[i1+1] ?? 0, vertices[i1+2] ?? 0],
          [vertices[i2] ?? 0, vertices[i2+1] ?? 0, vertices[i2+2] ?? 0]
        );

        stl += `  facet normal ${(normal[0] ?? 0).toFixed(6)} ${(normal[1] ?? 0).toFixed(6)} ${(normal[2] ?? 0).toFixed(6)}\n`;
        stl += `    outer loop\n`;
        stl += `      vertex ${(vertices[i0] ?? 0).toFixed(6)} ${(vertices[i0+1] ?? 0).toFixed(6)} ${(vertices[i0+2] ?? 0).toFixed(6)}\n`;
        stl += `      vertex ${(vertices[i1] ?? 0).toFixed(6)} ${(vertices[i1+1] ?? 0).toFixed(6)} ${(vertices[i1+2] ?? 0).toFixed(6)}\n`;
        stl += `      vertex ${(vertices[i2] ?? 0).toFixed(6)} ${(vertices[i2+1] ?? 0).toFixed(6)} ${(vertices[i2+2] ?? 0).toFixed(6)}\n`;
        stl += `    endloop\n  endfacet\n`;
      }
      stl += `endsolid ${name}\n`;

      const blob = new Blob([stl], { type: 'text/plain' });
      self.postMessage({ 
        type: 'EXPORT_SUCCESS', 
        id, 
        payload: { blob, filename: `${name.replace(/[^a-z0-9]/gi, '_')}.stl` } 
      });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'EXPORT_ERROR', 
      id, 
      error: error instanceof Error ? error.message : 'Unknown export error' 
    });
  }
};
