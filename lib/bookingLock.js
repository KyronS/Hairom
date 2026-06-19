// Distributed lock using Upstash Redis (SET NX EX — atomic "set if not exists").
// In local development (no UPSTASH_REDIS_REST_URL env var), the lock is a no-op
// so the dev server still works without a Redis instance configured.

const LOCK_TTL_SECONDS = 15;  // must be long enough to read + check + write the sheet
const MAX_RETRIES      = 5;
const RETRY_DELAY_MS   = 250;

function getRedis() {
  const { Redis } = require("@upstash/redis");
  return new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function acquireLock(date) {
  const key = `booking_lock:${date}`;

  if (!process.env.UPSTASH_REDIS_REST_URL) {
    if (process.env.NODE_ENV === "production") {
      console.error("[bookingLock] UPSTASH_REDIS_REST_URL is not set in production — booking lock is DISABLED. Double-bookings are possible.");
    }
    return key;
  }

  const redis = getRedis();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // SET key "1" NX EX 15 — only sets if the key does not already exist
    const result = await redis.set(key, "1", { nx: true, ex: LOCK_TTL_SECONDS });
    if (result === "OK") return key;
    await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
  }

  return null; // could not acquire lock within the retry budget
}

export async function releaseLock(key) {
  if (!key || !process.env.UPSTASH_REDIS_REST_URL) return;
  try {
    const redis = getRedis();
    await redis.del(key);
  } catch {
    // The TTL will expire the key automatically if the delete fails
  }
}
