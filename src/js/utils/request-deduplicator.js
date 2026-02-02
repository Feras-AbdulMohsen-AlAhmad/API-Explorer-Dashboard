// Request deduplication helper to avoid concurrent duplicate calls

const inFlightRequests = new Map();

/**
 * Deduplicate concurrent requests by key
 * @param {string} key - Unique request key
 * @param {Function} requestFn - Function that returns a Promise
 * @returns {Promise<any>} Existing or new promise
 */
export function deduplicateRequest(key, requestFn) {
  if (!key || typeof requestFn !== "function") {
    return Promise.reject(new Error("Invalid deduplication request"));
  }

  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const promise = Promise.resolve().then(requestFn);
  inFlightRequests.set(key, promise);

  const cleanup = () => inFlightRequests.delete(key);
  promise.then(cleanup).catch(cleanup);

  return promise;
}

/**
 * Check if a request key is already in flight
 * @param {string} key - Unique request key
 * @returns {boolean} True if request is already in progress
 */
export function isRequestInFlight(key) {
  if (!key) return false;
  return inFlightRequests.has(key);
}
