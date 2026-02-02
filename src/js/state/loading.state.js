// Simple loading state manager using a Set of active keys

const activeKeys = new Set();

/**
 * Mark a loading key as active
 * @param {string} key - Loading key identifier
 */
export function startLoading(key) {
  if (!key) return;
  activeKeys.add(String(key));
}

/**
 * Remove a loading key from active set
 * @param {string} key - Loading key identifier
 */
export function stopLoading(key) {
  if (!key) return;
  activeKeys.delete(String(key));
}

/**
 * Check if a loading key is active
 * @param {string} key - Loading key identifier
 * @returns {boolean} True if loading key is active
 */
export function isLoading(key) {
  if (!key) return false;
  return activeKeys.has(String(key));
}
