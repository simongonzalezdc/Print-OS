import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Distributed rate limiting using Upstash Redis.
 * Required for serverless environments where in-memory maps are not shared.
 */

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || '',
});

// Create rate limiter: 10 requests per 60 seconds (sliding window)
export const aiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: true,
  prefix: 'caedo_ratelimit',
});

// In-memory fallback for solo-operator local mode
const localRateLimitMap = new Map<string, { count: number, reset: number }>();

/**
 * Check if a client is rate limited.
 * @param identifier Unique identifier for the client (e.g., IP address)
 * @returns Object containing success status and limit info
 */
export async function checkAIRateLimit(identifier: string) {
  // If credentials are missing, use local in-memory rate limiting
  if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const limit = 10;
    
    let client = localRateLimitMap.get(identifier);
    if (!client || now > client.reset) {
      client = { count: 0, reset: now + windowMs };
    }
    
    client.count++;
    localRateLimitMap.set(identifier, client);
    
    if (client.count > limit) {
      return { success: false, limit, remaining: 0, reset: client.reset };
    }
    
    return { success: true, limit, remaining: limit - client.count, reset: client.reset };
  }

  try {
    const result = await aiRateLimiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('[RATE-LIMIT] Error checking rate limit:', error);
    // Fail open to avoid blocking users if Redis is down
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}

