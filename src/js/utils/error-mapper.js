// Centralized error mapping for weather and future APIs

/**
 * Map raw errors to user-friendly messages
 * @param {any} error - Error object, API error payload, or string
 * @returns {{ title: string, message: string, code?: string }}
 */
export function mapWeatherError(error) {
  const fallback = {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
  };

  if (!error) return fallback;

  // If already normalized, return as-is
  if (error.title && error.message) {
    return error;
  }

  const rawInfo =
    error?.info || error?.error?.info || error?.data?.error?.info || "";
  const info = String(rawInfo).toLowerCase();

  const rawCode = error?.code || error?.error?.code || error?.data?.error?.code;
  const code =
    rawCode !== undefined && rawCode !== null ? String(rawCode) : undefined;

  const message =
    typeof error === "string"
      ? error
      : error?.message
        ? String(error.message)
        : "";
  const lowerMessage = message.toLowerCase();

  // Configuration errors (API key issues)
  if (
    info.includes("access key") ||
    lowerMessage.includes("access key") ||
    ["1002", "2006", "2007", "2008"].includes(code)
  ) {
    return {
      title: "Configuration error",
      message:
        "Weather service is not configured correctly. Please check API key.",
      code,
    };
  }

  // Rate limit / usage limit
  const limitCodes = new Set(["104", "105", "429", "2007"]);
  if (
    (code && limitCodes.has(code)) ||
    info.includes("rate limit") ||
    info.includes("usage limit") ||
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("usage limit")
  ) {
    return {
      title: "Service limit reached",
      message: "Weather service limit reached. Please try again later.",
      code,
    };
  }

  // Location not found
  if (
    info.includes("location") ||
    lowerMessage.includes("location") ||
    lowerMessage.includes("no_data") ||
    code === "1006"
  ) {
    return {
      title: "Location not found",
      message: "We couldn't find weather data for this location.",
      code,
    };
  }

  // Input validation errors
  if (
    lowerMessage.includes("query_required") ||
    lowerMessage.includes("invalid_coords") ||
    code === "1003"
  ) {
    return {
      title: "Invalid input",
      message: "Please enter a valid location.",
    };
  }

  // Network / connectivity issues
  if (
    lowerMessage.includes("failed to fetch") ||
    lowerMessage.includes("network") ||
    lowerMessage.includes("request failed")
  ) {
    return {
      title: "Network error",
      message: "Unable to connect. Please check your internet connection.",
    };
  }

  return { ...fallback, code };
}

/**
 * Map JSONPlaceholder Posts API errors
 * @param {any} error - Error object or string
 * @returns {{ title: string, message: string, code?: string }}
 */
export function mapPostsError(error) {
  const fallback = {
    title: "Posts service error",
    message: "Failed to load posts. Please try again.",
  };

  if (!error) return fallback;

  if (error.title && error.message) {
    return error;
  }

  const message =
    typeof error === "string"
      ? error
      : error?.message
        ? String(error.message)
        : "";
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("failed to fetch") ||
    lowerMessage.includes("network") ||
    lowerMessage.includes("request failed")
  ) {
    return {
      title: "Network error",
      message:
        "Unable to connect to posts service. Please check your internet connection.",
    };
  }

  if (lowerMessage.includes("404") || lowerMessage.includes("not found")) {
    return {
      title: "Not found",
      message: "The requested post or resource could not be found.",
    };
  }

  if (lowerMessage.includes("invalid") || lowerMessage.includes("validation")) {
    return {
      title: "Invalid input",
      message: "Please check the provided information and try again.",
    };
  }

  return fallback;
}

/**
 * Map REST Countries API errors
 * @param {any} error - Error object or string
 * @returns {{ title: string, message: string, code?: string }}
 */
export function mapCountriesError(error) {
  const fallback = {
    title: "Countries service error",
    message: "Failed to load countries. Please try again.",
  };

  if (!error) return fallback;

  if (error.title && error.message) {
    return error;
  }

  const message =
    typeof error === "string"
      ? error
      : error?.message
        ? String(error.message)
        : "";
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("failed to fetch") ||
    lowerMessage.includes("network") ||
    lowerMessage.includes("request failed")
  ) {
    return {
      title: "Network error",
      message:
        "Unable to connect to countries service. Please check your internet connection.",
    };
  }

  if (lowerMessage.includes("404") || lowerMessage.includes("not found")) {
    return {
      title: "Country not found",
      message: "The requested country could not be found.",
    };
  }

  if (lowerMessage.includes("invalid") || lowerMessage.includes("validation")) {
    return {
      title: "Invalid input",
      message: "Please check your search query and try again.",
    };
  }

  return fallback;
}
