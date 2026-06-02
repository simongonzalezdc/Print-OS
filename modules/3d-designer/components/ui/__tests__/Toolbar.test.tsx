import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from '../Toolbar';
import { useSceneStore } from '@/lib/scene/store';

// Mock the scene store
vi.mock('@/lib/scene/store', () => ({
  useSceneStore: vi.fn(),
}));

const mockUseSceneStore = vi.mocked(useSceneStore);

describe('Toolbar', () => {
  it('should render toolbar buttons', () => {
    // Mock all the hook calls for this test
    mockUseSceneStore
      .mockReturnValueOnce(false) // canUndo
      .mockReturnValueOnce(false) // canRedo
      .mockReturnValueOnce(vi.fn()) // undo
      .mockReturnValueOnce(vi.fn()) // redo
      .mockReturnValueOnce(vi.fn()); // saveProject

    render(<Toolbar />);

    expect(screen.getByTitle('Undo')).toBeInTheDocument();
    expect(screen.getByTitle('Redo')).toBeInTheDocument();
    expect(screen.getByTitle('Save Project')).toBeInTheDocument();
  });

  it('should disable undo button when cannot undo', () => {
    mockUseSceneStore
      .mockReturnValueOnce(false) // canUndo
      .mockReturnValueOnce(false) // canRedo
      .mockReturnValueOnce(vi.fn()) // undo
      .mockReturnValueOnce(vi.fn()) // redo
      .mockReturnValueOnce(vi.fn()); // saveProject

    render(<Toolbar />);

    const undoButton = screen.getByTitle('Undo');
    expect(undoButton).toBeDisabled();
  });

  it('should enable undo button when can undo', () => {
    mockUseSceneStore
      .mockReturnValueOnce(true) // canUndo
      .mockReturnValueOnce(false) // canRedo
      .mockReturnValueOnce(vi.fn()) // undo
      .mockReturnValueOnce(vi.fn()) // redo
      .mockReturnValueOnce(vi.fn()); // saveProject

    render(<Toolbar />);

    const undoButton = screen.getByTitle('Undo');
    expect(undoButton).not.toBeDisabled();
  });

  it('should disable redo button when cannot redo', () => {
    mockUseSceneStore
      .mockReturnValueOnce(false) // canUndo
      .mockReturnValueOnce(false) // canRedo
      .mockReturnValueOnce(vi.fn()) // undo
      .mockReturnValueOnce(vi.fn()) // redo
      .mockReturnValueOnce(vi.fn()); // saveProject

    render(<Toolbar />);

    const redoButton = screen.getByTitle('Redo');
    expect(redoButton).toBeDisabled();
  });

  it('should enable redo button when can redo', () => {
    mockUseSceneStore
      .mockReturnValueOnce(false) // canUndo
      .mockReturnValueOnce(true) // canRedo
      .mockReturnValueOnce(vi.fn()) // undo
      .mockReturnValueOnce(vi.fn()) // redo
      .mockReturnValueOnce(vi.fn()); // saveProject

    render(<Toolbar />);

    const redoButton = screen.getByTitle('Redo');
    expect(redoButton).not.toBeDisabled();
  });

  it('should call undo when undo button is clicked', () => {
    const mockUndo = vi.fn();
    mockUseSceneStore
      .mockReturnValueOnce(true) // canUndo
      .mockReturnValueOnce(false) // canRedo
      .mockReturnValueOnce(mockUndo) // undo
      .mockReturnValueOnce(vi.fn()) // redo
      .mockReturnValueOnce(vi.fn()); // saveProject

    render(<Toolbar />);

    const undoButton = screen.getByTitle('Undo');
    fireEvent.click(undoButton);

    expect(mockUndo).toHaveBeenCalledTimes(1);
  });

  it('should call redo when redo button is clicked', () => {
    const mockRedo = vi.fn();
    mockUseSceneStore
      .mockReturnValueOnce(false) // canUndo
      .mockReturnValueOnce(true) // canRedo
      .mockReturnValueOnce(vi.fn()) // undo
      .mockReturnValueOnce(mockRedo) // redo
      .mockReturnValueOnce(vi.fn()); // saveProject

    render(<Toolbar />);

    const redoButton = screen.getByTitle('Redo');
    fireEvent.click(redoButton);

    expect(mockRedo).toHaveBeenCalledTimes(1);
  });

  it('should call saveProject when save button is clicked', () => {
    const mockSave = vi.fn();
    mockUseSceneStore
      .mockReturnValueOnce(false) // canUndo
      .mockReturnValueOnce(false) // canRedo
      .mockReturnValueOnce(vi.fn()) // undo
      .mockReturnValueOnce(vi.fn()) // redo
      .mockReturnValueOnce(mockSave); // saveProject

    render(<Toolbar />);

    const saveButton = screen.getByTitle('Save Project');
    fireEvent.click(saveButton);

    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('should not call undo when button is disabled', () => {
    const mockUndo = vi.fn();
    mockUseSceneStore
      .mockReturnValueOnce(false) // canUndo
      .mockReturnValueOnce(false) // canRedo
      .mockReturnValueOnce(mockUndo) // undo
      .mockReturnValueOnce(vi.fn()) // redo
      .mockReturnValueOnce(vi.fn()); // saveProject

    render(<Toolbar />);

    const undoButton = screen.getByTitle('Undo');
    fireEvent.click(undoButton);

    expect(mockUndo).not.toHaveBeenCalled();
  });

  it('should not call redo when button is disabled', () => {
    const mockRedo = vi.fn();
    mockUseSceneStore
      .mockReturnValueOnce(false) // canUndo
      .mockReturnValueOnce(false) // canRedo
      .mockReturnValueOnce(vi.fn()) // undo
      .mockReturnValueOnce(mockRedo) // redo
      .mockReturnValueOnce(vi.fn()); // saveProject

    render(<Toolbar />);

    const redoButton = screen.getByTitle('Redo');
    fireEvent.click(redoButton);

    expect(mockRedo).not.toHaveBeenCalled();
  });
});
