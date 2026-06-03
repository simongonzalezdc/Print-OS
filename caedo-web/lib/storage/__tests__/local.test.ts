import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorage } from '../local.js';
import type { Project, AIMessage } from '@/types';

const { mockSet, mockGet, mockDel, mockKeys } = vi.hoisted(() => ({
  mockSet: vi.fn(),
  mockGet: vi.fn(),
  mockDel: vi.fn(),
  mockKeys: vi.fn(),
}));

// Mock idb-keyval
vi.mock('idb-keyval', () => ({
  set: mockSet,
  get: mockGet,
  del: mockDel,
  keys: mockKeys,
}));

describe('Local Storage', () => {
  let storage: LocalStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new LocalStorage();
  });

  describe('Project Management', () => {
    const mockProject: Project = {
      id: 'test-project-id',
      name: 'Test Project',
      description: 'A test project',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: {
        gridVisible: true,
        axesVisible: true,
        buildPlate: { x: 250, y: 250, z: 250 },
        displayUnits: 'mm',
      },
      objects: [],
    };

    it('should save projects correctly', async () => {
      mockSet.mockResolvedValue(undefined);

      await storage.saveProject(mockProject);

      expect(mockSet).toHaveBeenCalledWith(
        'caedo-projects_test-project-id',
        mockProject
      );
    });

    it('should load projects correctly', async () => {
      mockGet.mockResolvedValue(mockProject);

      const result = await storage.loadProject('test-project-id');

      expect(mockGet).toHaveBeenCalledWith('caedo-projects_test-project-id');
      expect(result).toEqual(mockProject);
    });

    it('should return null for non-existent projects', async () => {
      mockGet.mockResolvedValue(null);

      const result = await storage.loadProject('non-existent');

      expect(result).toBeNull();
    });

    it('should list projects correctly', async () => {
      const mockKeyList = ['caedo-projects_1', 'caedo-projects_2', 'other-key'];
      const mockProjects = [mockProject, { ...mockProject, id: '2', name: 'Project 2' }];

      mockKeys.mockResolvedValue(mockKeyList);
      mockGet.mockImplementation((key: string) => {
        if (key === 'caedo-projects_1') return Promise.resolve(mockProjects[0]);
        if (key === 'caedo-projects_2') return Promise.resolve(mockProjects[1]);
        return Promise.resolve(null);
      });

      const result = await storage.listProjects();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockProjects[0]);
      expect(result[1]).toEqual(mockProjects[1]);
    });

    it('should delete projects correctly', async () => {
      mockDel.mockResolvedValue(undefined);

      await storage.deleteProject('test-project-id');

      expect(mockDel).toHaveBeenCalledWith('caedo-projects_test-project-id');
    });
  });

  describe('AI History Management', () => {
    const mockMessages: AIMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Create a cube',
        timestamp: Date.now(),
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'cube(10)',
        timestamp: Date.now() + 1000,
      },
    ];

    it('should save AI history correctly', async () => {
      mockSet.mockResolvedValue(undefined);

      await storage.saveAIHistory('test-project', mockMessages);

      expect(mockSet).toHaveBeenCalledWith(
        'caedo-ai-history_test-project',
        expect.objectContaining({
          messages: mockMessages,
          savedAt: expect.any(Number),
        })
      );
    });

    it('should load AI history correctly', async () => {
      const storedHistory = {
        messages: mockMessages,
        savedAt: Date.now(),
      };
      mockGet.mockResolvedValue(storedHistory);

      const result = await storage.loadAIHistory('test-project');

      expect(mockGet).toHaveBeenCalledWith('caedo-ai-history_test-project');
      expect(result).toEqual(mockMessages);
    });

    it('should return null for non-existent AI history', async () => {
      mockGet.mockResolvedValue(null);

      const result = await storage.loadAIHistory('test-project');

      expect(result).toBeNull();
    });

    it('should handle storage errors gracefully', async () => {
      mockSet.mockRejectedValue(new Error('Storage failed'));

      // Should catch error and log it, returning undefined/void instead of throwing
      await storage.saveAIHistory('test-project', mockMessages);
    });
  });

  describe('Preferences Management', () => {
    const mockPreferences = {
      theme: 'dark' as const,
      language: 'en',
      autoSave: true,
      aiProvider: 'ollama',
      voiceEnabled: true,
      autoSaveInterval: 30000,
      showDFMWarnings: true,
      defaultExportFormat: '3mf' as const,
    };

    it('should save preferences correctly', async () => {
      mockSet.mockResolvedValue(undefined);

      await storage.savePreferences(mockPreferences);

      expect(mockSet).toHaveBeenCalledWith(
        'caedo-preferences',
        mockPreferences
      );
    });

    it('should load preferences correctly', async () => {
      mockGet.mockResolvedValue(mockPreferences);

      const result = await storage.loadPreferences();

      expect(mockGet).toHaveBeenCalledWith('caedo-preferences');
      expect(result).toEqual(mockPreferences);
    });

    it('should return null for non-existent preferences', async () => {
      mockGet.mockResolvedValue(null);

      const result = await storage.loadPreferences();

      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors in save operations', async () => {
      mockSet.mockRejectedValue(new Error('Storage quota exceeded'));

      const mockProject: Project = {
        id: 'test',
        name: 'Test',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as Project;

      // Should rethrow error with custom message or same message
      await expect(storage.saveProject(mockProject))
        .rejects.toThrow('Failed to save project');
    });

    it('should handle storage errors in load operations', async () => {
      mockGet.mockRejectedValue(new Error('IndexedDB unavailable'));

      // Should catch error and return null
      const result = await storage.loadProject('test');
      expect(result).toBeNull();
    });
  });
});
