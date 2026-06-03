import { Redis } from '@upstash/redis';
import { createHash } from 'crypto';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || '',
});

export interface CacheEntry {
  text: string;
  model: string;
  timestamp: number;
}

/**
 * Generates a stable cache key for an AI request.
 */
export function generateCacheKey(systemPrompt: string, userPrompt: string, sceneContext?: unknown): string {
  const data = JSON.stringify({
    systemPrompt,
    userPrompt,
    sceneContext: sceneContext || {}
  });
  
  return `caedo_cache:${createHash('sha256').update(data).digest('hex')}`;
}

// In-memory fallback for solo-operator local mode
const localCache = new Map<string, CacheEntry>();

/**
 * Retrieves a cached AI response.
 */
export async function getCachedResponse(key: string): Promise<CacheEntry | null> {
  if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
    return localCache.get(key) || null;
  }

  try {
    const cached = await redis.get<CacheEntry>(key);
    return cached;
  } catch (error) {
    console.error('[AI-CACHE] Error reading from cache:', error);
    return null;
  }
}

/**
 * Stores an AI response in the cache.
 */
export async function setCachedResponse(key: string, entry: CacheEntry, ttl: number = 60 * 60 * 24 * 7): Promise<void> {
  if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
    localCache.set(key, entry);
    // Optional: Implement simple TTL cleanup for local cache
    if (localCache.size > 100) {
      const firstKey = localCache.keys().next().value;
      if (firstKey) localCache.delete(firstKey);
    }
    return;
  }

  try {
    await redis.set(key, entry, { ex: ttl });
  } catch (error) {
    console.error('[AI-CACHE] Error writing to cache:', error);
  }
}
