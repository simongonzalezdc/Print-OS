import { describe, it, expect, beforeEach, vi } from 'vitest';
import { enableMapSet } from 'immer';
import { useSceneStore } from '../store';
import type { Project } from '@/types';

// Enable MapSet support for Immer in tests
enableMapSet();

// Mock nanoid to return predictable incrementing IDs
let idCounter = 0;
vi.mock('nanoid', () => ({
  nanoid: () => `test-id-${++idCounter}`,
}));

describe('Scene Store', () => {
  beforeEach(() => {
    idCounter = 0;
    // Reset store state before each test
    useSceneStore.setState({
      project: null,
      objects: new Map(),
      selectedIds: new Set(),
      history: [],
      historyIndex: -1,
      activeTool: 'select',
      transformMode: 'translate',
      transformSpace: 'world',
      voiceState: { status: 'idle' },
      isAIProcessing: false,
    });
  });

  describe('Object Management', () => {
    it('should add objects correctly', () => {
      const store = useSceneStore.getState();

      const objectId = store.addObject('cube(10)', 'Test Cube');

      expect(objectId).toBe('test-id-1');
      expect(useSceneStore.getState().objects.size).toBe(1);

      const addedObject = useSceneStore.getState().objects.get(objectId);
      expect(addedObject).toBeDefined();
      expect(addedObject?.name).toBe('Test Cube');
      expect(addedObject?.jscadCode).toBe('cube(10)');
    });

    it('should update objects correctly', () => {
      const store = useSceneStore.getState();

      // Add an object first
      const objectId = store.addObject('cube(10)', 'Test Cube');

      // Update the object
      store.updateObject(objectId, {
        name: 'Updated Cube',
        position: [1, 2, 3],
      });

      const updatedObject = useSceneStore.getState().objects.get(objectId);
      expect(updatedObject?.name).toBe('Updated Cube');
      expect(updatedObject?.position).toEqual([1, 2, 3]);
      expect(updatedObject?.jscadCode).toBe('cube(10)'); // Unchanged
    });

    it('should delete objects correctly', () => {
      const store = useSceneStore.getState();

      // Add an object first
      const objectId = store.addObject('cube(10)', 'Test Cube');

      // Delete the object
      store.deleteObject(objectId);

      expect(useSceneStore.getState().objects.size).toBe(0);
      expect(useSceneStore.getState().objects.has(objectId)).toBe(false);
    });

    it('should handle object selection', () => {
      const store = useSceneStore.getState();

      // Add objects
      const objectId1 = store.addObject('cube(10)', 'Cube 1');
      const objectId2 = store.addObject('sphere(5)', 'Sphere 1');

      // Select first object
      store.selectObject(objectId1);
      expect(useSceneStore.getState().selectedIds.has(objectId1)).toBe(true);
      expect(useSceneStore.getState().selectedIds.has(objectId2)).toBe(false);

      // Select second object with additive selection
      store.selectObject(objectId2, true);
      expect(useSceneStore.getState().selectedIds.has(objectId1)).toBe(true);
      expect(useSceneStore.getState().selectedIds.has(objectId2)).toBe(true);

      // Select first object without additive (should deselect others)
      store.selectObject(objectId1, false);
      expect(useSceneStore.getState().selectedIds.has(objectId1)).toBe(true);
      expect(useSceneStore.getState().selectedIds.has(objectId2)).toBe(false);

      // Deselect all
      store.deselectAll();
      expect(useSceneStore.getState().selectedIds.size).toBe(0);
    });
  });

  describe('History Management', () => {
    it('should support undo/redo operations', () => {
      const store = useSceneStore.getState();

      // Add an object
      const objectId = store.addObject('cube(10)', 'Test Cube');
      expect(useSceneStore.getState().objects.size).toBe(1);
      expect(useSceneStore.getState().history.length).toBe(1);
      expect(useSceneStore.getState().historyIndex).toBe(0);

      // Update the object
      store.updateObject(objectId, { name: 'Updated Cube' });
      expect(useSceneStore.getState().objects.get(objectId)?.name).toBe('Updated Cube');
      expect(useSceneStore.getState().history.length).toBe(2);
      expect(useSceneStore.getState().historyIndex).toBe(1);

      // Undo the update
      store.undo();
      expect(useSceneStore.getState().objects.get(objectId)?.name).toBe('Test Cube');
      expect(useSceneStore.getState().historyIndex).toBe(0);

      // Redo the update
      store.redo();
      expect(useSceneStore.getState().objects.get(objectId)?.name).toBe('Updated Cube');
      expect(useSceneStore.getState().historyIndex).toBe(1);
    });

    it('should handle undo/redo bounds correctly', () => {
      const store = useSceneStore.getState();

      // Try undo when no history exists
      store.undo();
      expect(useSceneStore.getState().historyIndex).toBe(-1);

      // Add an object and try to redo beyond history
      store.addObject('cube(10)', 'Test Cube');
      store.redo(); // Should not crash
      expect(useSceneStore.getState().historyIndex).toBe(0);
    });
  });

  describe('Computed Values', () => {
    it('should provide getObject method', () => {
      const store = useSceneStore.getState();

      const objectId = store.addObject('cube(10)', 'Test Cube');
      const retrievedObject = useSceneStore.getState().getObject(objectId);

      expect(retrievedObject).toBeDefined();
      expect(retrievedObject?.name).toBe('Test Cube');

      // Test non-existent object
      const nonExistent = useSceneStore.getState().getObject('non-existent');
      expect(nonExistent).toBeUndefined();
    });

    it('should provide getSelectedObjects method', () => {
      const store = useSceneStore.getState();

      const objectId1 = store.addObject('cube(10)', 'Cube 1');
      const objectId2 = store.addObject('sphere(5)', 'Sphere 1');

      store.selectObject(objectId1);
      store.selectObject(objectId2, true);

      const selectedObjects = useSceneStore.getState().getSelectedObjects();
      expect(selectedObjects).toHaveLength(2);
      expect(selectedObjects.map(obj => obj.name)).toEqual(['Cube 1', 'Sphere 1']);
    });
  });

  describe('State Management', () => {
    it('should handle AI processing state', () => {
      const store = useSceneStore.getState();

      expect(store.isAIProcessing).toBe(false);

      store.setAIProcessing(true);
      expect(useSceneStore.getState().isAIProcessing).toBe(true);

      store.setAIProcessing(false);
      expect(useSceneStore.getState().isAIProcessing).toBe(false);
    });

    it('should handle project loading', () => {
      const store = useSceneStore.getState();

      const testProject = {
        id: 'test-project',
        name: 'Test Project',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: {
          gridVisible: true,
          axesVisible: true,
          buildPlate: { x: 250, y: 250, z: 250 },
          displayUnits: 'mm',
        },
        objects: [],
      } as unknown as Project;

      // Load project
      store.loadProject(testProject);
      expect(useSceneStore.getState().project?.name).toBe('Test Project');
      expect(useSceneStore.getState().project?.id).toBe('test-project');
    });
  });
});
