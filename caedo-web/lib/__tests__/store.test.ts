import { describe, it, expect, beforeEach } from 'vitest';
import { useSceneStore } from '../scene/store';

describe('Scene Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useSceneStore.setState({
      objects: new Map(),
      selectedIds: new Set(),
      history: [],
      historyIndex: -1,
      project: null
    });
  });

  it('should add an object', () => {
    const { addObject } = useSceneStore.getState();
    const id = addObject('cube(10)', 'Test Cube');
    
    const state = useSceneStore.getState();
    expect(state.objects.size).toBe(1);
    expect(state.objects.get(id)?.name).toBe('Test Cube');
    expect(state.history.length).toBe(1);
    expect(state.historyIndex).toBe(0);
  });

  it('should select an object', () => {
    const { addObject, selectObject } = useSceneStore.getState();
    const id = addObject('cube(10)');
    selectObject(id);
    
    const state = useSceneStore.getState();
    expect(state.selectedIds.has(id)).toBe(true);
  });

  it('should update an object', () => {
    const { addObject, updateObject } = useSceneStore.getState();
    const id = addObject('cube(10)');
    updateObject(id, { color: '#ff0000' });
    
    const state = useSceneStore.getState();
    expect(state.objects.get(id)?.color).toBe('#ff0000');
    expect(state.history.length).toBe(2);
  });

  it('should delete an object', () => {
    const { addObject, deleteObject } = useSceneStore.getState();
    const id = addObject('cube(10)');
    deleteObject(id);
    
    const state = useSceneStore.getState();
    expect(state.objects.size).toBe(0);
    expect(state.history.length).toBe(2);
  });

  it('should undo and redo', () => {
    const { addObject, undo, redo } = useSceneStore.getState();
    
    // Action 1: Add object
    const id = addObject('cube(10)');
    expect(useSceneStore.getState().objects.size).toBe(1);
    
    // Undo adding
    undo();
    expect(useSceneStore.getState().objects.size).toBe(0);
    expect(useSceneStore.getState().historyIndex).toBe(-1);
    
    // Redo adding
    redo();
    expect(useSceneStore.getState().objects.size).toBe(1);
    expect(useSceneStore.getState().objects.has(id)).toBe(true);
    expect(useSceneStore.getState().historyIndex).toBe(0);
  });

  it('should handle project initialization', () => {
    const { initProject } = useSceneStore.getState();
    const project = initProject();
    
    expect(project?.name).toBe('Untitled Project');
    expect(useSceneStore.getState().project?.id).toBe(project?.id);
  });
});
