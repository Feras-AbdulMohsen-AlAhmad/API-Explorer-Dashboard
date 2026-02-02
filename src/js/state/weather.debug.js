// Dev-only in-memory weather debug stats (no persistence)

const stats = {
  networkRequests: 0,
  cacheHits: 0,
  deduplicatedRequests: 0,
  lastFetchTime: null,
};

/**
 * Increment count for real network requests
 */
export function incrementNetworkRequest() {
  stats.networkRequests += 1;
  stats.lastFetchTime = Date.now();
}

/**
 * Increment count for cache hits
 */
export function incrementCacheHit() {
  stats.cacheHits += 1;
}

/**
 * Increment count for deduplicated requests
 */
export function incrementDeduplicated() {
  stats.deduplicatedRequests += 1;
}

/**
 * Get a snapshot of weather debug stats
 * @returns {{ networkRequests: number, cacheHits: number, deduplicatedRequests: number, lastFetchTime: number | null }}
 */
export function getWeatherDebugStats() {
  return { ...stats };
}

/**
 * Reset weather debug stats
 */
export function resetWeatherDebugStats() {
  stats.networkRequests = 0;
  stats.cacheHits = 0;
  stats.deduplicatedRequests = 0;
  stats.lastFetchTime = null;
}
