import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { nanoid } from 'nanoid';
import { DEFAULT_SCENE_SETTINGS, SceneStore, SceneObject, Project, HistoryEntry } from '@/types';
import { SCENE, STORAGE_KEYS } from '@/lib/constants';

// Enable Immer's MapSet plugin for Map and Set support
enableMapSet();

/**
 * Zustand store for VoiceForge 3D scene state management.
 *
 * This store serves as the single source of truth for all 3D scene data including:
 * - 3D objects and their properties
 * - Object selection state
 * - Undo/redo history management
 * - UI state (active tools, modes)
 * - AI processing state
 * - Project management
 *
 * Uses Immer for immutable state updates and Zustand for reactive state management.
 * Includes automatic history tracking for undo/redo functionality.
 *
 * @example
 * // Add a new object
 * const { addObject } = useSceneStore();
 * const objectId = addObject('cube(10)', 'My Cube');
 *
 * // Select an object
 * const { selectObject } = useSceneStore();
 * selectObject(objectId);
 *
 * // Undo last action
 * const { undo } = useSceneStore();
 * undo();
 */
export const useSceneStore = create<SceneStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Current project
      project: null,

      // Scene objects
      objects: new Map(),

      // Selection
      selectedIds: new Set(),

      // History for undo/redo
      history: [],
      historyIndex: -1,

      // UI state
      activeTool: 'select',
      transformMode: 'translate',
      transformSpace: 'world',

      // Voice state
      voiceState: { status: 'idle' },

      isAIProcessing: false,
      printerProfile: null,

      // Project Actions
      initProject: () => {
        const id = nanoid();
        const now = Date.now();
        const project: Project = {
          id,
          name: 'Untitled Project',
          objects: [],
          settings: { ...DEFAULT_SCENE_SETTINGS },
          createdAt: now,
          updatedAt: now,
        };
        set((state) => {
          state.project = project;
        });
        return project;
      },

      createProject: (name?: string, description?: string) => {
        const id = nanoid();
        const now = Date.now();
        const project: Project = {
          id,
          name: name || 'New Project',
          description,
          objects: [],
          settings: { ...DEFAULT_SCENE_SETTINGS },
          createdAt: now,
          updatedAt: now,
        };
        set((state) => {
          state.project = project;
          state.objects = new Map();
          state.selectedIds = new Set();
          state.history = [];
          state.historyIndex = -1;
        });
        return project;
      },

      renameProject: (name: string, description?: string) => {
        set((state) => {
          if (state.project) {
            state.project.name = name;
            if (description !== undefined) state.project.description = description;
            state.project.updatedAt = Date.now();
          }
        });
      },

      openProject: (_projectId: string) => {
        // Actual loading is handled by the storage layer when wired into the UI.
        return null;
      },

      listProjects: () => {
        // Actual listing is handled by the storage layer when wired into the UI.
        return [];
      },

      // Computed: Get object by ID
      getObject: (id: string) => get().objects.get(id) || undefined,

      // Computed: Get selected objects
      getSelectedObjects: () => {
        const { objects, selectedIds } = get();
        return Array.from(selectedIds)
          .map(id => objects.get(id))
          .filter(Boolean) as SceneObject[];
      },

      // Actions: Add object
      addObject: (jscadCode: string, name?: string) => {
        const id = nanoid();
        const now = Date.now();

        const object: SceneObject = {
          id,
          name: name || `Object ${id.slice(0, 8)}`,
          jscadCode,
          meshData: undefined, // Will be generated later
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: '#808080',
          visible: true,
          locked: false,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          state.objects.set(id, object);
          addToHistory(state, 'add', [object], []);
        });

        return id;
      },

      // Actions: Update object
      updateObject: (id: string, updates: Partial<SceneObject>) => {
        const current = get().objects.get(id);
        if (!current) return;

        const updated = { ...current, ...updates, updatedAt: Date.now() };

        set((state) => {
          state.objects.set(id, updated);
          addToHistory(state, 'update', [updated], [current]);
        });
      },

      // Actions: Delete object
      deleteObject: (id: string) => {
        const object = get().objects.get(id);
        if (!object) return;

        set((state) => {
          state.objects.delete(id);
          // Remove from selection if selected
          state.selectedIds.delete(id);
          addToHistory(state, 'delete', [], [object]);
        });
      },

      // Actions: Duplicate object
      duplicateObject: (id: string) => {
        const object = get().objects.get(id);
        if (!object) return '';

        const newId = nanoid();
        const now = Date.now();
        
        // Create duplicate with offset position
        const duplicated: SceneObject = {
          ...object,
          id: newId,
          name: `${object.name} (Copy)`,
          position: [
            object.position[0] + 10, // Offset by 10mm in X
            object.position[1],
            object.position[2],
          ],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          state.objects.set(newId, duplicated);
          // Select the new duplicate
          state.selectedIds.clear();
          state.selectedIds.add(newId);
          addToHistory(state, 'add', [duplicated], []);
        });

        return newId;
      },

      // Actions: Delete selected objects
      deleteSelectedObjects: () => {
        const { selectedIds, objects } = get();
        if (selectedIds.size === 0) return;

        const objectsToDelete = Array.from(selectedIds)
          .map(id => objects.get(id))
          .filter(Boolean) as SceneObject[];

        set((state) => {
          selectedIds.forEach(id => {
            state.objects.delete(id);
            state.selectedIds.delete(id);
          });
          addToHistory(state, 'delete', [], objectsToDelete);
        });
      },

      // Actions: Select objects
      selectObject: (id: string, additive = false) => {
        set((state) => {
          if (!additive) {
            state.selectedIds.clear();
          }
          state.selectedIds.add(id);
        });
      },

      // Actions: Deselect all
      deselectAll: () => {
        set((state) => {
          state.selectedIds.clear();
        });
      },

      // Actions: History
      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < 0) return;

        const entry = history[historyIndex];
        if (!entry) return;

        applyHistoryEntry(entry, true); // Reverse the action

        set((state) => {
          state.historyIndex--;
        });
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) return;

        const entry = history[historyIndex + 1];
        if (!entry) return;

        applyHistoryEntry(entry, false); // Apply the action

        set((state) => {
          state.historyIndex++;
        });
      },

      // Actions: Load project
      loadProject: (project: Project) => {
        set((state) => {
          state.project = project;
          state.objects = new Map(project.objects.map(obj => [obj.id, obj]));
          state.selectedIds.clear();
          state.history = [];
          state.historyIndex = -1;
        });
      },

      // Actions: Save project
      saveProject: () => {
        const { project, objects } = get();
        if (!project) return;

        const updatedProject: Project = {
          ...project,
          objects: Array.from(objects.values()),
          updatedAt: Date.now(),
        };

        set((state) => {
          state.project = updatedProject;
        });

        // Persist to local storage (client-only)
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            `${STORAGE_KEYS.PROJECTS}_${project.id}`,
            JSON.stringify(updatedProject)
          );
        }

        return updatedProject;
      },

      // Actions: Set voice state
      setVoiceState: (voiceState) => {
        set((state) => {
          state.voiceState = voiceState;
        });
      },

      // Actions: Set AI processing
      setAIProcessing: (isProcessing) => {
        set((state) => {
          state.isAIProcessing = isProcessing;
        });
      },

      // Actions: Set printer profile (used by AI + export context)
      setPrinterProfile: (profile) => {
        set((state) => {
          state.printerProfile = profile;
        });
      },

      // Actions: Set transform mode (translate/rotate/scale)
      setTransformMode: (mode) => {
        set((state) => {
          state.transformMode = mode;
        });
      },
    }))
  )
);

/**
 * Add an entry to the history stack
 */
function addToHistory(
  state: {
    history: HistoryEntry[];
    historyIndex: number;
  },
  type: 'add' | 'update' | 'delete',
  newState: SceneObject[],
  previousState: SceneObject[]
) {
  const now = Date.now();
  const objectIds = newState.length > 0 ? newState.map(o => o.id) : previousState.map(o => o.id);

  // Remove any history after current index (when doing new action after undo)
  state.history = state.history.slice(0, state.historyIndex + 1);

  const entry = {
    id: nanoid(),
    timestamp: now,
    type,
    description: getHistoryDescription(type, newState, previousState),
    objectIds,
    previousState,
    newState,
  };

  state.history.push(entry);
  state.historyIndex++;

  // Limit history size
  if (state.history.length > SCENE.MAX_HISTORY_ENTRIES) {
    state.history.shift();
    state.historyIndex--;
  }
}

/**
 * Apply a history entry (for undo/redo)
 */
function applyHistoryEntry(entry: HistoryEntry, reverse: boolean) {
  useSceneStore.setState((state) => {
    const removeObject = (obj: Partial<SceneObject>) => {
      if (obj.id) {
        state.objects.delete(obj.id);
        state.selectedIds.delete(obj.id);
      }
    };

    const restoreObject = (obj: Partial<SceneObject>) => {
      if (obj.id) {
        const existingObj = state.objects.get(obj.id);
        if (existingObj) {
          state.objects.set(obj.id, { ...existingObj, ...obj });
        } else {
          // If object doesn't exist (undo delete, redo add), restore it completely
          // We assume the history entry contains the full object state for these cases
          state.objects.set(obj.id, obj as SceneObject);
          // Also restore selection if it was selected? 
          // The history logic for selection is separate, but usually we might want to select it.
          // For now, just restoring the object is key.
        }
      }
    };

    if (reverse) {
      switch (entry.type) {
        case 'add':
          entry.newState.forEach(removeObject);
          break;
        case 'update':
        case 'delete':
          entry.previousState.forEach(restoreObject);
          break;
      }
    } else {
      switch (entry.type) {
        case 'add':
        case 'update':
          entry.newState.forEach(restoreObject);
          break;
        case 'delete':
          entry.previousState.forEach(removeObject);
          break;
      }
    }
  });
}

/**
 * Generate human-readable history description
 */
function getHistoryDescription(
  type: string,
  newState: SceneObject[],
  previousState: SceneObject[]
): string {
  const obj = newState[0] || previousState[0];
  const name = obj?.name || 'Object';

  switch (type) {
    case 'add':
      return `Added ${name}`;
    case 'update':
      return `Modified ${name}`;
    case 'delete':
      return `Deleted ${name}`;
    default:
      return 'Action performed';
  }
}

// Auto-save functionality
let autoSaveTimeout: NodeJS.Timeout | null = null;

if (typeof window !== 'undefined') {
  useSceneStore.subscribe(
    (state) => state.objects,
    () => {
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(() => {
        const store = useSceneStore.getState();
        if (store.project) {
          store.saveProject();
        }
      }, 30000);
    }
  );
}
