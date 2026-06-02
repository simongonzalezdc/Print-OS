import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from '../Toolbar';
import { useSceneStore } from '@/lib/scene/store';
import type { SceneStore } from '@/types';

// Mock the scene store
vi.mock('@/lib/scene/store', () => ({
  useSceneStore: vi.fn(),
}));

const mockUseSceneStore = vi.mocked(useSceneStore);

describe('Toolbar', () => {
  const defaultState = {
    historyIndex: 0,
    history: [{}],
    undo: vi.fn(),
    redo: vi.fn(),
    saveProject: vi.fn(),
    transformMode: 'translate',
    setTransformMode: vi.fn(),
    selectedIds: new Set(),
    duplicateObject: vi.fn(),
    deleteSelectedObjects: vi.fn(),
  };

  const setupMockStore = (overrides = {}) => {
    const state = { ...defaultState, ...overrides };
    mockUseSceneStore.mockImplementation((selector) => selector(state as unknown as SceneStore));
    return state;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toolbar buttons', () => {
    setupMockStore();
    render(<Toolbar />);

    expect(screen.getByTitle('Undo (Ctrl+Z)')).toBeInTheDocument();
    expect(screen.getByTitle('Redo (Ctrl+Shift+Z)')).toBeInTheDocument();
    expect(screen.getByTitle('Save Project')).toBeInTheDocument();
  });

  it('should disable undo button when at the beginning of history', () => {
    setupMockStore({ historyIndex: 0 });
    render(<Toolbar />);

    const undoButton = screen.getByTitle('Undo (Ctrl+Z)');
    expect(undoButton).toBeDisabled();
  });

  it('should enable undo button when not at the beginning of history', () => {
    setupMockStore({ historyIndex: 1, history: [{}, {}] });
    render(<Toolbar />);

    const undoButton = screen.getByTitle('Undo (Ctrl+Z)');
    expect(undoButton).not.toBeDisabled();
  });

  it('should disable redo button when at the end of history', () => {
    setupMockStore({ historyIndex: 0, history: [{}] });
    render(<Toolbar />);

    const redoButton = screen.getByTitle('Redo (Ctrl+Shift+Z)');
    expect(redoButton).toBeDisabled();
  });

  it('should enable redo button when not at the end of history', () => {
    setupMockStore({ historyIndex: 0, history: [{}, {}] });
    render(<Toolbar />);

    const redoButton = screen.getByTitle('Redo (Ctrl+Shift+Z)');
    expect(redoButton).not.toBeDisabled();
  });

  it('should call undo when undo button is clicked', () => {
    const undo = vi.fn();
    setupMockStore({ historyIndex: 1, history: [{}, {}], undo });
    render(<Toolbar />);

    const undoButton = screen.getByTitle('Undo (Ctrl+Z)');
    fireEvent.click(undoButton);

    expect(undo).toHaveBeenCalledTimes(1);
  });

  it('should call redo when redo button is clicked', () => {
    const redo = vi.fn();
    setupMockStore({ historyIndex: 0, history: [{}, {}], redo });
    render(<Toolbar />);

    const redoButton = screen.getByTitle('Redo (Ctrl+Shift+Z)');
    fireEvent.click(redoButton);

    expect(redo).toHaveBeenCalledTimes(1);
  });

  it('should call saveProject when save button is clicked', () => {
    const saveProject = vi.fn();
    setupMockStore({ saveProject });
    render(<Toolbar />);

    const saveButton = screen.getByTitle('Save Project');
    fireEvent.click(saveButton);

    expect(saveProject).toHaveBeenCalledTimes(1);
  });

  it('should show transform tools as disabled when no objects are selected', () => {
    setupMockStore({ selectedIds: new Set() });
    render(<Toolbar />);

    expect(screen.getByTitle('Move (G)')).toBeDisabled();
    expect(screen.getByTitle('Rotate (R)')).toBeDisabled();
    expect(screen.getByTitle('Scale (S)')).toBeDisabled();
  });

  it('should show transform tools as enabled when objects are selected', () => {
    setupMockStore({ selectedIds: new Set(['id1']) });
    render(<Toolbar />);

    expect(screen.getByTitle('Move (G)')).not.toBeDisabled();
    expect(screen.getByTitle('Rotate (R)')).not.toBeDisabled();
    expect(screen.getByTitle('Scale (S)')).not.toBeDisabled();
  });

  it('should call setTransformMode when transform buttons are clicked', () => {
    const setTransformMode = vi.fn();
    setupMockStore({ selectedIds: new Set(['id1']), setTransformMode });
    render(<Toolbar />);

    fireEvent.click(screen.getByTitle('Rotate (R)'));
    expect(setTransformMode).toHaveBeenCalledWith('rotate');

    fireEvent.click(screen.getByTitle('Scale (S)'));
    expect(setTransformMode).toHaveBeenCalledWith('scale');
  });
});
