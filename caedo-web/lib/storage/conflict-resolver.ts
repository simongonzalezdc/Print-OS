export interface Project {
  id: string;
  name: string;
  data: unknown;
  updatedAt: number;
}

/**
 * Resolves conflicts between local and server versions of a project.
 * Uses "Last Write Wins" based on updatedAt timestamp.
 */
export function resolveProjectConflict(local: Project, server: Project): Project {
  if (local.updatedAt > server.updatedAt) {
    console.log(`[CONFLICT-RESOLVER] Local version of ${local.id} is newer. Keeping local.`);
    return local;
  } else if (server.updatedAt > local.updatedAt) {
    console.log(`[CONFLICT-RESOLVER] Server version of ${local.id} is newer. Updating local.`);
    return server;
  }
  
  // If timestamps are identical, return local as default
  return local;
}

/**
 * Merges two project lists, resolving conflicts for identical IDs.
 */
export function mergeProjectLists(localList: Project[], serverList: Project[]): Project[] {
  const serverMap = new Map(serverList.map(p => [p.id, p]));
  const merged = [...localList];
  
  merged.forEach((local, index) => {
    const server = serverMap.get(local.id);
    if (server) {
      merged[index] = resolveProjectConflict(local, server);
      serverMap.delete(local.id);
    }
  });
  
  // Add new items from server that weren't in local
  return [...merged, ...Array.from(serverMap.values())];
}
