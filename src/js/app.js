import { initNavbar } from "./components/navbar.js";
import { initRouter } from "./router.js";

function bootstrap() {
  const appRoot = document.getElementById("app");
  initNavbar();
  initRouter(appRoot);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
