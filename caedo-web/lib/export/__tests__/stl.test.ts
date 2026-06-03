/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import { exportToSTLBinary, exportToSTLASCII } from '../stl';
import { ExportMeshData } from '../utils';

describe('STL Export', () => {
  const mockMesh: ExportMeshData = {
    name: 'TestCube',
    vertices: new Float32Array([
      0, 0, 0,  1, 0, 0,  1, 1, 0, // Triangle 1
      0, 0, 0,  1, 1, 0,  0, 1, 0  // Triangle 2
    ]),
    indices: new Uint32Array([0, 1, 2, 3, 4, 5]),
    normals: new Float32Array([
      0, 0, 1,  0, 0, 1,  0, 0, 1,
      0, 0, 1,  0, 0, 1,  0, 0, 1
    ])
  };

  describe('exportToSTLBinary', () => {
    it('should generate a valid binary STL blob', () => {
      const result = exportToSTLBinary(mockMesh);
      expect(result.success).toBe(true);
      expect(result.blob).toBeDefined();
      expect(result.filename).toBe('TestCube.stl');
      
      // STL binary size: 80 (header) + 4 (count) + 50 * triangles
      const expectedSize = 84 + (2 * 50);
      expect(result.blob?.size).toBe(expectedSize);
    });

    it('should include the name in the header', async () => {
      const result = exportToSTLBinary(mockMesh);
      if (result.blob) {
        const buffer = await result.blob.arrayBuffer();
        const header = new TextDecoder().decode(new Uint8Array(buffer, 0, 80));
        expect(header).toContain('Caedo 3D - TestCube');
      }
    });
  });

  describe('exportToSTLASCII', () => {
    it('should generate a valid ASCII STL blob', async () => {
      const result = exportToSTLASCII(mockMesh);
      expect(result.success).toBe(true);
      expect(result.blob).toBeDefined();
      
      if (result.blob) {
        const text = await result.blob.text();
        expect(text).toContain('solid TestCube');
        expect(text).toContain('facet normal 0.000000 0.000000 1.000000');
        expect(text).toContain('vertex 0.000000 0.000000 0.000000');
        expect(text).toContain('endsolid TestCube');
      }
    });
  });
});

