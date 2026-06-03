import { describe, it, expect } from 'vitest';
import { preprocessJSCADCode, jscadToThreeJS } from '../jscad/executor';
import type { JSCADGeometry } from '@/types';

describe('JSCAD Executor', () => {
  describe('preprocessJSCADCode', () => {
    it('should remove require statements', () => {
      const code = `
        const jscad = require('@jscad/modeling');
        const { cube } = jscad.primitives;
        const main = () => cube();
      `;
      const processed = preprocessJSCADCode(code);
      expect(processed).not.toContain("require('@jscad/modeling')");
      expect(processed).toContain('const main');
      expect(processed).toContain('return main();');
    });

    it('should remove ES6 imports', () => {
      const code = `
        import { primitives } from '@jscad/modeling';
        const main = () => primitives.cube();
      `;
      const processed = preprocessJSCADCode(code);
      expect(processed).not.toContain("import");
      expect(processed).toContain('const main');
    });

    it('should remove custom functions that shadow globals', () => {
      const code = `
        const cube = () => {};
        const main = () => cube();
      `;
      const processed = preprocessJSCADCode(code);
      expect(processed).toContain('// cube is provided by worker');
    });

    it('should remove module.exports', () => {
      const code = `
        const main = () => cube();
        module.exports = { main };
      `;
      const processed = preprocessJSCADCode(code);
      expect(processed).not.toContain('module.exports');
    });

    it('should handle duplicate constants', () => {
      const code = `
        const WALL = 2;
        const main = () => {
          const WALL = 2;
          return cube();
        };
      `;
      const processed = preprocessJSCADCode(code);
      expect(processed).toContain('// WALL already declared at module scope');
    });
  });

  describe('jscadToThreeJS', () => {
    it('should convert polygons to vertices and indices', () => {
      const jscadGeom = {
        polygons: [
          {
            vertices: [
              [0, 0, 0],
              [10, 0, 0],
              [10, 10, 0],
              [0, 10, 0]
            ]
          }
        ]
      };
      
      const meshData = jscadToThreeJS(jscadGeom as unknown as JSCADGeometry);
      
      // 4 points -> 2 triangles -> 6 vertices (duplicated for each triangle in this implementation)
      // Actually the current implementation in executor.ts duplicates vertices for each triangle
      // since it pushes v0, v1, v2 for each triangle.
      expect(meshData.vertices.length).toBe(18); // 2 triangles * 3 vertices * 3 coordinates
      expect(meshData.indices.length).toBe(6);
      expect(meshData.normals.length).toBe(18);
    });

    it('should swap Y and Z axes (JSCAD Z-up to Three.js Y-up)', () => {
      const jscadGeom = {
        polygons: [
          {
            vertices: [
              [1, 2, 3], // x=1, y=2, z=3 (Z is up)
              [4, 5, 6],
              [7, 8, 9]
            ]
          }
        ]
      };
      
      const meshData = jscadToThreeJS(jscadGeom as unknown as JSCADGeometry);
      
      // Three.js: [x, z, y] mapping from JSCAD [x, y, z]
      // Wait, look at executor.ts:
      // const v0_valid = [v0[0] ?? 0, v0[2] ?? 0, v0[1] ?? 0];
      // So [1, 2, 3] becomes [1, 3, 2]
      
      expect(meshData.vertices[0]).toBe(1);
      expect(meshData.vertices[1]).toBe(3);
      expect(meshData.vertices[2]).toBe(2);
    });
  });
});
