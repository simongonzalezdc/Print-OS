import { get, set, del } from 'idb-keyval';

const SYNC_QUEUE_KEY = 'caedo_sync_queue';

export interface SyncAction {
  id: string;
  type: 'CREATE_PROJECT' | 'UPDATE_PROJECT' | 'DELETE_PROJECT';
  payload: unknown;
  timestamp: number;
}

/**
 * Adds an action to the sync queue.
 */
export async function queueSyncAction(action: Omit<SyncAction, 'id' | 'timestamp'>): Promise<void> {
  const queue = await get<SyncAction[]>(SYNC_QUEUE_KEY) || [];
  const newAction: SyncAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  
  queue.push(newAction);
  await set(SYNC_QUEUE_KEY, queue);
  
  // Attempt background sync if possible
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    try {
      // @ts-ignore - sync is not in all types
      await registration.sync.register('sync-projects');
    } catch (e) {
      console.warn('[SYNC-QUEUE] Background sync registration failed', e);
    }
  }
}

/**
 * Retrieves and clears the sync queue.
 */
export async function flushSyncQueue(): Promise<SyncAction[]> {
  const queue = await get<SyncAction[]>(SYNC_QUEUE_KEY) || [];
  await del(SYNC_QUEUE_KEY);
  return queue;
}

/**
 * Processes the sync queue by sending items to the server.
 */
export async function processSyncQueue(): Promise<void> {
  const queue = await get<SyncAction[]>(SYNC_QUEUE_KEY) || [];
  if (queue.length === 0) return;

  console.log(`[SYNC-QUEUE] Processing ${queue.length} items...`);
  
  const results = await Promise.allSettled(queue.map(async (action) => {
    const res = await fetch('/api/projects/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });
    if (!res.ok) throw new Error(`Sync failed for action ${action.id}`);
    return action.id;
  }));

  const failedIds = results.flatMap((result, index) => {
    const item = queue[index];
    return result.status === 'rejected' && item ? [item.id] : [];
  });

  const remainingQueue = queue.filter(item => failedIds.includes(item.id));
  
  if (remainingQueue.length > 0) {
    await set(SYNC_QUEUE_KEY, remainingQueue);
    console.warn(`[SYNC-QUEUE] ${remainingQueue.length} items failed to sync and remain in queue.`);
  } else {
    await del(SYNC_QUEUE_KEY);
    console.log('[SYNC-QUEUE] Sync completed successfully.');
  }
}
