import { Project, SceneObject } from '@/types';
import { log } from '@/lib/logger';
import { createHash } from 'crypto';

/**
 * Cloud Storage Client for syncing projects to the CAEDO API.
 * The backend CAEDO API handles the actual persistence to S3/R2 storage.
 */
export class CloudStorage {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  private static syncedHashes: Record<string, string> = {};

  /**
   * Calculates what changed since last sync.
   */
  private static calculateDelta(project: Project): { delta: Partial<SceneObject>[], currentHashes: Record<string, string> } {
    const currentHashes: Record<string, string> = {};
    const delta: Partial<SceneObject>[] = [];

    project.objects.forEach(obj => {
      // Create a stable hash of the object's content
      const content = JSON.stringify({
        jscadCode: obj.jscadCode,
        position: obj.position,
        rotation: obj.rotation,
        scale: obj.scale,
        color: obj.color
      });
      const hash = createHash('sha256').update(content).digest('hex');
      currentHashes[obj.id] = hash;

      if (this.syncedHashes[obj.id] !== hash) {
        delta.push(obj);
      }
    });

    return { delta, currentHashes };
  }

  /**
   * Sync a project to the cloud using delta sync if possible.
   */
  static async syncProject(project: Project, forceFull: boolean = false): Promise<{ success: boolean; version?: string }> {
    try {
      log.info(`[CLOUD] Syncing project: ${project.id} (${project.name})`);
      
      let payload: Project | {
        id: string;
        name: string;
        updatedAt: number;
        delta: Partial<SceneObject>[];
        isDelta: true;
      } = project;
      if (!forceFull) {
        const { delta } = this.calculateDelta(project);
        if (delta.length < project.objects.length && delta.length > 0) {
          log.info(`[CLOUD] Sending delta sync for ${delta.length} objects`);
          payload = {
            id: project.id,
            name: project.name,
            updatedAt: project.updatedAt,
            delta: delta,
            isDelta: true
          };
        }
      }

      const response = await fetch(`${this.baseUrl}/api/projects/${project.id}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Sync failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update synced hashes on success
      const { currentHashes } = this.calculateDelta(project);
      this.syncedHashes = currentHashes;

      return { success: true, version: data.version };
    } catch (error) {
      log.error(`[CLOUD] Sync failed for project ${project.id}:`, error);
      return { success: false };
    }
  }

  /**
   * Load a project from the cloud.
   */
  static async loadProject(projectId: string): Promise<Project | null> {
    try {
      log.info(`[CLOUD] Loading project: ${projectId}`);
      
      const response = await fetch(`${this.baseUrl}/api/projects/${projectId}`);
      
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Fetch failed with status: ${response.status}`);

      return await response.json();
    } catch (error) {
      log.error(`[CLOUD] Failed to load project ${projectId}:`, error);
      return null;
    }
  }

  /**
   * List all projects for the current user from the cloud.
   */
  static async listProjects(): Promise<Array<{ id: string; name: string; updatedAt: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/projects`);
      if (!response.ok) throw new Error(`List failed with status: ${response.status}`);
      
      return await response.json();
    } catch (error) {
      log.error('[CLOUD] Failed to list projects:', error);
      return [];
    }
  }
}
