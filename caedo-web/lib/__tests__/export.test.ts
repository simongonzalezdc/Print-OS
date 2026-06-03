import { describe, it, expect } from 'vitest';
import { formatVertices, formatTriangles, sceneObjectToMesh3MF } from '../export/3mf';
import { SceneObject } from '@/types';

describe('3MF Export', () => {
  describe('formatVertices', () => {
    it('should format Float32Array to 3MF vertex XML', () => {
      const vertices = new Float32Array([0, 1, 2, 10.5, 20.5, 30.5]);
      const xml = formatVertices(vertices);
      expect(xml).toContain('<vertex x="0.000000" y="1.000000" z="2.000000" />');
      expect(xml).toContain('<vertex x="10.500000" y="20.500000" z="30.500000" />');
    });
  });

  describe('formatTriangles', () => {
    it('should format Uint32Array to 3MF triangle XML', () => {
      const indices = new Uint32Array([0, 1, 2, 3, 4, 5]);
      const xml = formatTriangles(indices);
      expect(xml).toContain('<triangle v1="0" v2="1" v3="2" />');
      expect(xml).toContain('<triangle v1="3" v2="4" v3="5" />');
    });
  });

  describe('sceneObjectToMesh3MF', () => {
    it('should transform mesh data based on object position/rotation/scale', () => {
      const mockObject: Partial<SceneObject> = {
        name: 'Test Object',
        meshData: {
          vertices: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
          indices: new Uint32Array([0, 1, 2]),
          normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])
        },
        position: [10, 20, 30],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: '#ff0000'
      };

      const mesh3MF = sceneObjectToMesh3MF(mockObject as SceneObject);
      expect(mesh3MF.name).toBe('Test Object');
      // Vertex [0,0,0] + position [10,20,30] = [10,20,30]
      expect(mesh3MF.vertices[0]).toBe(10);
      expect(mesh3MF.vertices[1]).toBe(20);
      expect(mesh3MF.vertices[2]).toBe(30);
    });
  });
});
