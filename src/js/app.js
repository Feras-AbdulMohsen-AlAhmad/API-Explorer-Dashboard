import { initNavbar } from "./components/navbar.js";
import { initRouter } from "./router.js";
import { loadConfig, isConfigValid } from "./config.js";
import { showToast } from "./components/toast.js";

async function bootstrap() {
  const appRoot = document.getElementById("app");

  // Load configuration BEFORE initializing app
  try {
    await loadConfig();

    // Validate config and show warning if using placeholder
    if (!isConfigValid()) {
      showToast(
        "Weather API key not configured. Create src/js/config.local.js with your Weatherstack key.",
        "error",
      );
      console.error(
        "⚠ Weather feature unavailable: Missing valid WEATHERSTACK_ACCESS_KEY.\n" +
          "→ Create src/js/config.local.js with:\n" +
          '  export const CONFIG = { WEATHERSTACK_ACCESS_KEY: "your_key_here" };',
      );
    }
  } catch (error) {
    console.error("Failed to load configuration:", error);
    showToast("Failed to load app configuration", "error");
  }

  // Initialize app
  initNavbar();
  initRouter(appRoot);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
