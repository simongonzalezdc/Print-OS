import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeJSCAD, jscadToThreeJS } from '../executor';
import type { JSCADGeometry, JSCADGeometryObject, MeshData } from '@/types';

// Mock Worker class
class MockWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((error: { message?: string }) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
}

// Mock global Worker
vi.stubGlobal('Worker', MockWorker);

describe('JSCAD Executor', () => {
  let mockWorkerInstance: MockWorker;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Re-stub Worker to capture the instance
    vi.stubGlobal('Worker', class extends MockWorker {
      constructor() {
        super();
        mockWorkerInstance = this;
      }
    });
  });

  describe('executeJSCAD', () => {
    it('should execute valid JSCAD code', async () => {
      // Use unique code to avoid cache
      const code = `const main = () => cube(10); module.exports = { main }; // test-${Math.random()}`;
      const promise = executeJSCAD(code);
      
      // Wait for worker to be instantiated
      await vi.waitFor(() => !!mockWorkerInstance, { timeout: 1000 });

      // Trigger success
      if (mockWorkerInstance.onmessage) {
        mockWorkerInstance.onmessage({
          data: {
            type: 'result',
            result: [{ 
              polygons: [{
                vertices: [
                  [0, 0, 0],
                  [1, 0, 0],
                  [1, 1, 0],
                  [0, 1, 0]
                ]
              }]
            }]
          }
        });
      }

      const result = await promise;
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle execution timeout', async () => {
      vi.useFakeTimers();
      
      // Use unique code to avoid cache
      const code = `const main = () => timeout_cube(10); module.exports = { main }; // timeout-${Math.random()}`;
      const promise = executeJSCAD(code);
      
      // Wait for worker
      await vi.waitFor(() => !!mockWorkerInstance, { timeout: 1000 });
      
      // Fast-forward time past the timeout
      vi.advanceTimersByTime(31000);
      
      await expect(promise).rejects.toThrow(/timeout/);
      
      vi.useRealTimers();
    });

    it('should handle worker errors', async () => {
      const code = `const main = () => cube(10); module.exports = { main }; // error-${Math.random()}`;
      const promise = executeJSCAD(code);
      
      // Wait for worker
      await vi.waitFor(() => !!mockWorkerInstance, { timeout: 1000 });

      // Trigger error
      if (mockWorkerInstance.onerror) {
        mockWorkerInstance.onerror({
          message: 'Worker error'
        });
      }

      await expect(promise).rejects.toThrow(/Worker error/);
    });

    it('should handle invalid JavaScript code', async () => {
      const code = `const main = () => cube(10); module.exports = { main }; // script-error-${Math.random()}`;
      const promise = executeJSCAD(code);
      
      // Wait for worker
      await vi.waitFor(() => !!mockWorkerInstance, { timeout: 1000 });

      // Trigger message error
      if (mockWorkerInstance.onmessage) {
        mockWorkerInstance.onmessage({
          data: {
            type: 'error',
            error: 'SyntaxError: Unexpected token'
          }
        });
      }

      await expect(promise).rejects.toThrow('SyntaxError: Unexpected token');
    });
  });

  describe('jscadToThreeJS', () => {
    it('should convert JSCAD geometry to Three.js mesh data', () => {
      const jscadGeometry: JSCADGeometry = [
        {
          polygons: [{
            vertices: [
              [0, 0, 0],
              [1, 0, 0],
              [1, 1, 0],
              [0, 1, 0]
            ]
          }]
        }
      ];

      const result: MeshData = jscadToThreeJS(jscadGeometry);

      expect(result).toBeDefined();
      expect(result.vertices).toBeDefined();
      expect(result.indices).toBeDefined();
      expect(result.normals).toBeDefined();

      // Should have vertices for 2 triangles (6 vertices total)
      expect(result.vertices.length).toBeGreaterThan(0);
      expect(result.indices.length % 3).toBe(0);
    });

    it('should handle empty geometry', () => {
      const jscadGeometry: JSCADGeometry = [];
      const result: MeshData = jscadToThreeJS(jscadGeometry);

      expect(result.vertices.length).toBe(0);
      expect(result.indices.length).toBe(0);
      expect(result.normals.length).toBe(0);
    });

    it('should handle geometry without polygons', () => {
      const jscadGeometry: JSCADGeometry = [
        {
          sides: [
            {
              vertex0: [0, 0, 0],
              vertex1: [1, 0, 0],
            }
          ]
        } as JSCADGeometryObject 
      ];

      const result: MeshData = jscadToThreeJS(jscadGeometry);
      expect(result).toBeDefined();
    });

    it('should handle single geometry object', () => {
      const jscadGeometry: JSCADGeometry = { 
        polygons: [{
          vertices: [
            [0, 0, 0],
            [1, 0, 0],
            [1, 1, 0]
          ]
        }]
      } as JSCADGeometry; 

      const result: MeshData = jscadToThreeJS(jscadGeometry);
      expect(result).toBeDefined();
      expect(result.vertices.length).toBeGreaterThan(0);
    });

    it('should skip invalid polygons', () => {
      const jscadGeometry: JSCADGeometry = [
        {
          polygons: [{
            vertices: [
              [0, 0, 0],
              null, 
              [1, 1, 0]
            ]
          }]
        }
      ] as JSCADGeometry;

      const result: MeshData = jscadToThreeJS(jscadGeometry);
      expect(result).toBeDefined();
    });
  });
});
