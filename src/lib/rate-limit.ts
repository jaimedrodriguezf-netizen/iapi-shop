import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

const hasRedis =
  (!!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN) ||
  process.env.NODE_ENV === "test" ||
  !!process.env.VITEST;

if (!hasRedis) {
  console.warn(
    "[Rate Limit] Upstash Redis credentials not configured. ALL rate-limited operations will be BLOCKED (fail-closed). Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable rate limiting."
  );
}

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "http://mock-redis-url.local",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "mock-token",
    })
  : null;

const createMockRatelimit = () => ({
  limit: async () => ({
    success: false,
    limit: 0,
    remaining: 0,
    reset: 0,
  }),
}) as unknown as Ratelimit;

/**
 * Auth rate limiter: 5 attempts per 15 minutes per IP
 * Protects login and register from brute force
 */
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "ratelimit:auth",
      analytics: true,
    })
  : createMockRatelimit();

/**
 * Order rate limiter: 10 orders per minute per IP
 * Protects public checkout from spam
 */
export const orderRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "ratelimit:orders",
      analytics: true,
    })
  : createMockRatelimit();

/**
 * AI rate limiter: 3 generations per minute per IP
 * Protects OpenAI API costs
 */
export const aiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 m"),
      prefix: "ratelimit:ai",
      analytics: true,
    })
  : createMockRatelimit();

/**
 * Upload rate limiter: 5 uploads per minute per user
 * Protects Supabase storage from abuse
 */
export const uploadRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: "ratelimit:upload",
      analytics: true,
    })
  : createMockRatelimit();

/**
 * Product rate limiter: 30 creations per minute per IP
 * Protects against mass product creation spam
 */
export const productRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      prefix: "ratelimit:products",
      analytics: true,
    })
  : createMockRatelimit();

/**
 * Category rate limiter: 10 creations per minute per IP
 * Protects against mass category creation spam
 */
export const categoryRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "ratelimit:categories",
      analytics: true,
    })
  : createMockRatelimit();

/**
 * Slug availability rate limiter: 10 requests per minute per IP
 * Protects slug check endpoint from enumeration
 */
export const slugRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "ratelimit:slug",
      analytics: true,
    })
  : createMockRatelimit();

/**
 * Tenant rate limiter: 2 creations per minute per IP
 * Protects against mass tenant creation abuse
 */
export const tenantRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(2, "1 m"),
      prefix: "ratelimit:tenants",
      analytics: true,
    })
  : createMockRatelimit();

/**
 * Report rate limiter: 3 reports per 15 minutes per IP
 * Protects store report submission from spam
 */
export const reportRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "15 m"),
      prefix: "ratelimit:reports",
      analytics: true,
    })
  : createMockRatelimit();

/**
 * Returns the client IP from request headers.
 */
export async function getClientIdentifier(): Promise<string> {
  try {
    const headersList = await headers();
    return (
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "127.0.0.1"
    );
  } catch {
    return "127.0.0.1";
  }
}