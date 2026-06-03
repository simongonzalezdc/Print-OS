import { get, set, update } from 'idb-keyval';
import { nanoid } from 'nanoid';

export interface DesignVersion {
  id: string;
  objectId: string;
  code: string;
  timestamp: number;
  label?: string;
  aiPrompt?: string;
}

const VERSIONS_KEY_PREFIX = 'caedo_versions_';

export class VersionManager {
  /**
   * Save a new version of a design
   */
  static async saveVersion(objectId: string, code: string, label?: string, aiPrompt?: string): Promise<DesignVersion> {
    const version: DesignVersion = {
      id: nanoid(),
      objectId,
      code,
      timestamp: Date.now(),
      label,
      aiPrompt
    };

    const key = `${VERSIONS_KEY_PREFIX}${objectId}`;
    await update(key, (val: DesignVersion[] = []) => {
      // Keep last 50 versions
      const newVersions = [version, ...val].slice(0, 50);
      return newVersions;
    });

    return version;
  }

  /**
   * Get all versions for an object
   */
  static async getVersions(objectId: string): Promise<DesignVersion[]> {
    const key = `${VERSIONS_KEY_PREFIX}${objectId}`;
    return (await get(key)) || [];
  }

  /**
   * Clear all versions for an object
   */
  static async clearVersions(objectId: string): Promise<void> {
    const key = `${VERSIONS_KEY_PREFIX}${objectId}`;
    await set(key, []);
  }
}
