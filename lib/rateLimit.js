// Rate limiting via Upstash Redis (sliding window).
// In local dev (no UPSTASH_REDIS_REST_URL), rate limiting is skipped.

const WINDOW_SECONDS = 60;
const MAX_REQUESTS   = 10; // per IP per minute

function getRedis() {
  const { Redis } = require("@upstash/redis");
  return new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Returns true if the request is allowed, false if the limit is exceeded.
export async function checkRateLimit(ip) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return true; // skip in local dev

  const redis = getRedis();
  const key   = `rate_limit:${ip}`;

  const count = await redis.incr(key);
  if (count === 1) {
    // First request in this window — set the expiry
    await redis.expire(key, WINDOW_SECONDS);
  }

  return count <= MAX_REQUESTS;
}
