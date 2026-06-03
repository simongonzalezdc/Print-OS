import { set, get, del, keys } from 'idb-keyval';
import { Project, UserPreferences, AIMessage } from '@/types';
import { STORAGE_KEYS } from '@/lib/constants';

interface StoredAIHistory {
  messages: AIMessage[];
  savedAt: number;
}

/**
 * Local storage utilities using IndexedDB
 * Provides persistent storage for projects and user preferences
 */

export class LocalStorage {
  // Projects
  async saveProject(project: Project): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.PROJECTS}_${project.id}`;
      await set(key, project);
    } catch (error) {
      console.error('Failed to save project:', error);
      throw new Error('Failed to save project');
    }
  }

  async loadProject(projectId: string): Promise<Project | null> {
    try {
      const key = `${STORAGE_KEYS.PROJECTS}_${projectId}`;
      const project = await get<Project>(key);
      return project || null;
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.PROJECTS}_${projectId}`;
      await del(key);
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw new Error('Failed to delete project');
    }
  }

  async listProjects(): Promise<Project[]> {
    try {
      const allKeys = await keys();
      const projectKeys = allKeys.filter(key =>
        typeof key === 'string' && key.startsWith(STORAGE_KEYS.PROJECTS)
      );

      const projects: Project[] = [];
      for (const key of projectKeys) {
        const project = await get<Project>(key);
        if (project) {
          projects.push(project);
        }
      }

      // Sort by last updated (newest first)
      return projects.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Failed to list projects:', error);
      return [];
    }
  }

  // Auto-save functionality
  async saveAutoSave(project: Project): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.AUTOSAVE_PREFIX}${project.id}`;
      await set(key, {
        ...project,
        autoSavedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to auto-save:', error);
    }
  }

  async loadAutoSave(projectId: string): Promise<Project | null> {
    try {
      const key = `${STORAGE_KEYS.AUTOSAVE_PREFIX}${projectId}`;
      const autoSave = await get<Project>(key);
      return autoSave || null;
    } catch (error) {
      console.error('Failed to load auto-save:', error);
      return null;
    }
  }

  async clearAutoSave(projectId: string): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.AUTOSAVE_PREFIX}${projectId}`;
      await del(key);
    } catch (error) {
      console.error('Failed to clear auto-save:', error);
    }
  }

  // User preferences
  async savePreferences(preferences: UserPreferences): Promise<void> {
    try {
      await set(STORAGE_KEYS.PREFERENCES, preferences);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw new Error('Failed to save preferences');
    }
  }

  async loadPreferences(): Promise<UserPreferences | null> {
    try {
      const preferences = await get<UserPreferences>(STORAGE_KEYS.PREFERENCES);
      return preferences || null;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return null;
    }
  }

  // AI conversation history
  async saveAIHistory(projectId: string, messages: AIMessage[]): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.AI_HISTORY}_${projectId}`;
      await set(key, {
        messages,
        savedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to save AI history:', error);
    }
  }

  async loadAIHistory(projectId: string): Promise<AIMessage[] | null> {
    try {
      const key = `${STORAGE_KEYS.AI_HISTORY}_${projectId}`;
      const history = await get<StoredAIHistory>(key);
      return history?.messages || null;
    } catch (error) {
      console.error('Failed to load AI history:', error);
      return null;
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    try {
      const allKeys = await keys();
      await Promise.all(allKeys.map(key => del(key)));
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw new Error('Failed to clear data');
    }
  }

  async getStorageStats(): Promise<{
    projects: number;
    totalSize: number;
  }> {
    try {
      const projects = await this.listProjects();
      // Rough estimate: each project ~10KB
      const estimatedSize = projects.length * 10 * 1024;

      return {
        projects: projects.length,
        totalSize: estimatedSize,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { projects: 0, totalSize: 0 };
    }
  }
}

// Export singleton instance
export const localStorage = new LocalStorage();

// Export individual functions for convenience
export const {
  saveProject,
  loadProject,
  deleteProject,
  listProjects,
  saveAutoSave,
  loadAutoSave,
  clearAutoSave,
  savePreferences,
  loadPreferences,
  saveAIHistory,
  loadAIHistory,
  clearAllData,
  getStorageStats,
} = localStorage;