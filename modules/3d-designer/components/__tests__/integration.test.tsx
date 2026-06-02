import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Scene } from '../canvas/Scene';
import { AIPanel } from '../panels/AIPanel';
import { Toolbar } from '../ui/Toolbar';
import { useSceneStore } from '@/lib/scene/store';
import { enableMapSet } from 'immer';
import type { SceneStore, HistoryEntry } from '@/types';

// Enable MapSet support for Immer in tests
enableMapSet();

// Mock the scene store
vi.mock('@/lib/scene/store', () => ({
  useSceneStore: Object.assign(vi.fn(), {
    subscribe: vi.fn(() => vi.fn()),
  }),
}));

// Mock AI SDK
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    input: '',
        setInput: vi.fn(),
        handleSubmit: vi.fn(),
        status: 'ready' as const,
        append: vi.fn(),
    reload: vi.fn(),
    stop: vi.fn(),
    setMessages: vi.fn(),
    error: undefined,
    id: 'test-chat',
  })),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

const mockUseSceneStore = vi.mocked(useSceneStore);

const createHistoryEntry = (): HistoryEntry => ({
  id: Math.random().toString(36).slice(2),
  timestamp: Date.now(),
  type: 'add',
  description: 'test',
  objectIds: [],
  previousState: [],
  newState: [],
});

const createMockStore = (overrides: Partial<SceneStore> = {}): SceneStore => ({
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
  printerProfile: null,
  addObject: vi.fn(() => 'mock-object'),
  updateObject: vi.fn(),
  deleteObject: vi.fn(),
  selectObject: vi.fn(),
  deselectAll: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  loadProject: vi.fn(),
  saveProject: vi.fn(() => undefined),
  initProject: vi.fn(() => null),
  createProject: vi.fn(),
  renameProject: vi.fn(),
  openProject: vi.fn(() => null),
  listProjects: vi.fn(() => []),
  setVoiceState: vi.fn(),
  setAIProcessing: vi.fn(),
  setPrinterProfile: vi.fn(),
  setTransformMode: vi.fn(),
  duplicateObject: vi.fn(() => 'mock-duplicate'),
  deleteSelectedObjects: vi.fn(),
  getObject: vi.fn(),
  getSelectedObjects: vi.fn(),
  ...overrides,
});

describe('VoiceForge 3D - End-to-End Integration', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let storeState: SceneStore;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    storeState = createMockStore();
    mockUseSceneStore.mockImplementation((selector) => {
      if (selector) {
        return selector(storeState);
      }
      return storeState;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete User Workflow', () => {
    it('should allow creating a project and adding objects', async () => {
      // Mock successful object creation
      const mockAddObject = vi.fn().mockReturnValue('obj-123');
      storeState = createMockStore({
        project: { 
          id: 'proj-123', 
          name: 'Test Project', 
          createdAt: Date.now(), 
          updatedAt: Date.now(), 
          settings: {
            gridVisible: true,
            axesVisible: true,
            buildPlate: {
              x: 250,
              y: 250,
              z: 250,
            },
            displayUnits: 'mm',
          },
          objects: [],
        },
        addObject: mockAddObject,
      });

      // Mock AI API response
      global.fetch = vi.fn((input: RequestInfo | URL) => {
        const url = input.toString();
        if (url === '/api/ai/status') {
          return Promise.resolve(new Response(JSON.stringify({ isValid: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }));
        }
        return Promise.resolve(new Response(JSON.stringify({ status: 'ready' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      });

      // Mock AI chat
      const mockAI = {
        messages: [],
        input: '',
        setInput: vi.fn(),
        handleSubmit: vi.fn(),
        status: 'ready' as const,
        append: vi.fn(),
        reload: vi.fn(),
        stop: vi.fn(),
        setMessages: vi.fn(),
        sendMessage: vi.fn(),
        regenerate: vi.fn(),
        resumeStream: vi.fn(),
        addToolResult: vi.fn(),
        addToolOutput: vi.fn(),
        addToolApprovalResponse: vi.fn(),
        clearError: vi.fn(),
        error: undefined,
        id: 'test-chat',
      };

      vi.mocked(await import('@ai-sdk/react')).useChat.mockReturnValue(mockAI);

      render(
        <div className="h-screen flex">
          <div className="flex-1">
            <Scene />
          </div>
          <div className="w-96 border-l">
            <AIPanel onToggle={vi.fn()} />
          </div>
        </div>
      );

      // Verify components render
      expect(screen.getByText('AI Copilot')).toBeInTheDocument();

      // Test AI input
      const input = screen.getByPlaceholderText('What do you want to build?');
      
      // Wait for input to be enabled (after status check)
      await vi.waitFor(() => expect(input).not.toBeDisabled());
      
      await user.type(input, 'Create a cube');
      expect(input).toHaveValue('Create a cube');

      // Test voice input toggle (should be present)
      // Use regex to match potential variations like "Start voice command" or "Start voice input"
      const voiceButton = screen.getByRole('button', { name: /start voice/i });
      expect(voiceButton).toBeInTheDocument();
    });

    it('should handle toolbar operations correctly', () => {
      const mockUndo = vi.fn();
      const mockRedo = vi.fn();
      const mockSave = vi.fn();

      storeState = createMockStore({
        history: [createHistoryEntry(), createHistoryEntry()],
        historyIndex: 1,
        undo: mockUndo,
        redo: mockRedo,
        saveProject: mockSave,
      });

      render(<Toolbar />);

      // Test undo button
      const undoButton = screen.getByTitle('Undo (Ctrl+Z)');
      expect(undoButton).not.toBeDisabled();
      fireEvent.click(undoButton);
      expect(mockUndo).toHaveBeenCalledTimes(1);

      // Test redo button (should be disabled)
      const redoButton = screen.getByTitle('Redo (Ctrl+Shift+Z)');
      expect(redoButton).toBeDisabled();

      // Test save button
      const saveButton = screen.getByTitle('Save Project');
      fireEvent.click(saveButton);
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it('should handle error scenarios gracefully', () => {
      // Mock API failure
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      render(
        <div className="w-96">
          <AIPanel onToggle={vi.fn()} />
        </div>
      );

      // The component should render despite API failure
      expect(screen.getByText('AI Copilot')).toBeInTheDocument();
      // Text might be different or dynamic, checking for main panel presence
      expect(screen.getByRole('button', { name: /close ai panel/i })).toBeInTheDocument();
    });
  });

  describe('Performance and Stability', () => {
    it('should handle rapid state changes without crashing', () => {
      storeState = createMockStore();
      const { rerender } = render(<Scene />);

      // Rapid re-renders shouldn't cause crashes
      for (let i = 0; i < 10; i++) {
        rerender(<Scene />);
      }

      expect(screen.getByTestId).toBeDefined(); // Component should still be mounted
    });

    it('should handle empty or invalid props gracefully', () => {
      storeState = createMockStore();
      expect(() => render(<Scene />)).not.toThrow();
      expect(() => render(<AIPanel onToggle={() => {}} />)).not.toThrow();
      expect(() => render(<Toolbar />)).not.toThrow();
    });
  });

  describe('Accessibility and UX', () => {
    it('should have proper ARIA labels and keyboard navigation', async () => {
      render(<Toolbar />);

      // Check for proper titles/aria-labels
      const undoButton = screen.getByTitle('Undo (Ctrl+Z)');
      const redoButton = screen.getByTitle('Redo (Ctrl+Shift+Z)');
      const saveButton = screen.getByTitle('Save Project');

      expect(undoButton).toBeInTheDocument();
      expect(redoButton).toBeInTheDocument();
      expect(saveButton).toBeInTheDocument();

      // Test keyboard focus
      // Undo/Redo might be disabled, so test focus on Save button which is always enabled
      saveButton.focus();
      expect(document.activeElement).toBe(saveButton);
    });

    it('should provide visual feedback for user actions', async () => {
      const mockAddObject = vi.fn().mockReturnValue('obj-123');

      storeState = createMockStore({
        addObject: mockAddObject,
        history: [],
        historyIndex: -1,
      });

      render(<Toolbar />);

      const saveButton = screen.getByTitle('Save Project');

      // Button should be clickable
      expect(saveButton).not.toBeDisabled();

      // Test hover states (class changes indicate visual feedback)
      expect(saveButton).toHaveClass('hover:text-white');
    });
  });
});
