// Configuration - API endpoints, constants, and settings

// Weatherstack API Configuration
// ⚠️ IMPORTANT: Replace with your actual API key
// Get your free API key at: https://weatherstack.com/
//
// To set locally (not committed):
// Option 1: Create src/js/config.local.js with:
//   export const WEATHERSTACK_ACCESS_KEY = "YOUR_KEY_HERE";
//   (Add config.local.js to .gitignore)
//
// Option 2: Set in environment/browser console before app loads:
//   window.WEATHERSTACK_ACCESS_KEY = "YOUR_KEY_HERE";

// Try to load from local config first, fallback to placeholder
let WEATHERSTACK_ACCESS_KEY = "PLACEHOLDER_KEY_REPLACE_ME";

// Check if local config exists (dynamic import)
try {
  const { WEATHERSTACK_ACCESS_KEY: localKey } =
    await import("./config.local.js").catch(() => ({
      WEATHERSTACK_ACCESS_KEY: null,
    }));
  if (localKey) {
    WEATHERSTACK_ACCESS_KEY = localKey;
  }
} catch (e) {
  // config.local.js doesn't exist - use placeholder
}

// Override with window variable if set at runtime
if (typeof window !== "undefined" && window.WEATHERSTACK_ACCESS_KEY) {
  WEATHERSTACK_ACCESS_KEY = window.WEATHERSTACK_ACCESS_KEY;
}

export { WEATHERSTACK_ACCESS_KEY };
