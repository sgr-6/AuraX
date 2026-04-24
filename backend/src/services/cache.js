/**
 * cache.js — In-memory LRU cache for analysis results.
 *
 * Key = lightweight hash of (first 500 chars of document text + language).
 * Identical or near-identical documents skip the Gemini call entirely.
 *
 * Max 40 entries — avoids unbounded memory growth in long-running processes.
 */

const MAX_ENTRIES = 40;
const TTL_MS = 60 * 60 * 1000; // 1 hour — stale entries are evicted silently

// Map preserves insertion order, which gives us free LRU ordering.
const store = new Map();

// ── Simple non-crypto hash (djb2 variant) ───────────────────────
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash.toString(36);
}

function makeKey(text, language) {
  // Use first 500 chars — enough to fingerprint a document uniquely
  const fingerprint = `${language}::${text.substring(0, 500).replace(/\s+/g, ' ').trim()}`;
  return hashString(fingerprint);
}

// ── Public API ───────────────────────────────────────────────────

/** Return cached result or null if not found / expired. */
export function getCached(text, language) {
  const key = makeKey(text, language);
  const entry = store.get(key);
  if (!entry) return null;

  // Evict if expired
  if (Date.now() - entry.ts > TTL_MS) {
    store.delete(key);
    return null;
  }

  // Move to end to mark as recently used (LRU)
  store.delete(key);
  store.set(key, entry);

  console.log(`[Cache] HIT — key ${key} (${store.size} entries stored)`);
  return entry.data;
}

/** Store a result in the cache. */
export function setCached(text, language, data) {
  const key = makeKey(text, language);

  // Evict oldest entry when at capacity
  if (store.size >= MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    store.delete(oldestKey);
  }

  store.set(key, { data, ts: Date.now() });
  console.log(`[Cache] SET — key ${key} (${store.size}/${MAX_ENTRIES} entries)`);
}

/** Runtime stats for the /health endpoint. */
export function getCacheStats() {
  return { entries: store.size, maxEntries: MAX_ENTRIES, ttlMinutes: TTL_MS / 60000 };
}

/** Remove all entries — useful for testing. */
export function clearCache() {
  store.clear();
}
