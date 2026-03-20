/**
 * Simple in-memory rate limiter for serverless functions.
 * Uses a sliding window counter per IP/key.
 *
 * Note: On Vercel serverless, each function instance has its own memory,
 * so this provides per-instance rate limiting. For true global rate limiting
 * across all instances, use Vercel KV or Upstash Redis.
 * This is sufficient for MVP-level protection against abuse.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 60 seconds
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key (typically IP address).
 * Returns whether the request is allowed and how many requests remain.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

// ─── Preset configs ──────────────────────────────────────────────────────────

/** Analysis endpoint: 20 requests per minute per IP */
export const ANALYZE_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60_000,
};

/** Export endpoint: 30 requests per minute per IP */
export const EXPORT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

/** Upload endpoint: 5 requests per minute per IP */
export const UPLOAD_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60_000,
};

/** Admin endpoints: 60 requests per minute per IP */
export const ADMIN_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000,
};
