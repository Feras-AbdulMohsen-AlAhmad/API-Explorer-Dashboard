// Configuration - Safe config loading pattern
// Loads from config.local.js (gitignored) or falls back to config.example.js

let loadedConfig = null;

/**
 * Load configuration from local or example file
 * Should be called once at app startup
 * @returns {Promise<Object>} CONFIG object with API keys
 */
export async function loadConfig() {
  if (loadedConfig) {
    return loadedConfig;
  }

  try {
    // Try to load from config.local.js first (not committed)
    const localModule = await import("./config.local.js");
    loadedConfig = localModule.CONFIG;
    console.log("✓ Loaded config from config.local.js");
  } catch (error) {
    // Fallback to config.example.js (committed with placeholder)
    try {
      const exampleModule = await import("./config.example.js");
      loadedConfig = exampleModule.CONFIG;
      console.warn(
        "⚠ Using config.example.js - Create config.local.js with real API key",
      );
    } catch (fallbackError) {
      // If both fail, use placeholder
      loadedConfig = {
        WEATHERSTACK_ACCESS_KEY: "YOUR_KEY_HERE",
      };
      console.error("✗ Failed to load config files, using placeholder");
    }
  }

  return loadedConfig;
}

/**
 * Get the loaded configuration
 * Must call loadConfig() first at app startup
 * @returns {Object} CONFIG object
 */
export function getConfig() {
  if (!loadedConfig) {
    throw new Error(
      "Config not loaded! Call loadConfig() at app startup first.",
    );
  }
  return loadedConfig;
}

/**
 * Check if configuration has valid API keys
 * @returns {boolean} True if config appears valid
 */
export function isConfigValid() {
  if (!loadedConfig) return false;

  const key = loadedConfig.WEATHERSTACK_ACCESS_KEY;
  return key && key !== "YOUR_KEY_HERE" && key !== "PLACEHOLDER_KEY_REPLACE_ME";
}
