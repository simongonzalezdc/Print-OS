/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import { exportTo3MF } from '../3mf';
import { ExportMeshData } from '../utils';

// JSZip might need some polyfills or mocking in test environment if it uses browser APIs
// But usually it works fine in node/jsdom if not using complex features.

describe('3MF Export', () => {
  const mockMesh: ExportMeshData = {
    name: 'TestCube',
    vertices: new Float32Array([
      0, 0, 0,  1, 0, 0,  1, 1, 0
    ]),
    indices: new Uint32Array([0, 1, 2]),
    normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])
  };

  it('should generate a valid 3MF blob (zip file)', async () => {
    const result = await exportTo3MF([mockMesh], { title: 'Test Scene' });
    
    expect(result.success).toBe(true);
    expect(result.blob).toBeDefined();
    expect(result.filename).toBe('Test_Scene.3mf');
    
    // 3MF is a ZIP file, so it should have a ZIP signature
    if (result.blob) {
      const buffer = await result.blob.arrayBuffer();
      const signature = new Uint8Array(buffer.slice(0, 4));
      // ZIP signature: 50 4B 03 04
      expect(signature[0]).toBe(0x50);
      expect(signature[1]).toBe(0x4B);
      expect(signature[2]).toBe(0x03);
      expect(signature[3]).toBe(0x04);
    }
  });

  it('should include required files in the package', async () => {
    const result = await exportTo3MF([mockMesh]);
    if (result.blob) {
      const JSZip = (await import('jszip')).default;
      const buffer = await result.blob.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      
      expect(zip.file('[Content_Types].xml')).not.toBeNull();
      expect(zip.file('_rels/.rels')).not.toBeNull();
      expect(zip.file('3D/3dmodel.model')).not.toBeNull();
      
      const modelXml = await zip.file('3D/3dmodel.model')?.async('text');
      expect(modelXml).toContain('object id="1" name="TestCube"');
      expect(modelXml).toContain('<vertex x="0.000000" y="0.000000" z="0.000000" />');
    }
  });
});
