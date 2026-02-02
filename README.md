# Weather API Explorer

A production-grade weather application built with vanilla JavaScript, demonstrating real-world constraints and professional engineering patterns. Built without frameworks to showcase core web development fundamentals and optimization techniques.

---

## Overview

This weather application provides an interactive interface for exploring current weather conditions using the **Weatherstack API (FREE tier)**. The project demonstrates how to build scalable applications under **strict resource constraints** (100 API calls/month), emphasizing intelligent caching, request deduplication, and user-triggered data fetching. All code is written in vanilla JavaScript ES6+ with zero dependencies.

**Key Insight:** This project prioritizes **engineering discipline** over feature quantity—every optimization technique solves a real problem within the FREE tier constraint.

---

## Features

### User-Facing Features

- **City Search** - Search weather by city name with instant suggestions
- **Geolocation** - Auto-detect location via browser geolocation (with IP fallback)
- **Units Toggle** - Switch between Celsius and Fahrenheit with state persistence
- **Recent Searches** - localStorage-based suggestion dropdown (no API calls)
- **Keyboard Navigation** - Full accessibility: ArrowUp/Down, Enter, Escape
- **Weather Display** - Current conditions card with graceful missing field handling
- **Retry Logic** - Smart retry button remembers last successful action
- **State Restoration** - Automatically restores last weather view on page reload (24-hour validity)
- **Error Handling** - User-friendly error messages with specific guidance

### Technical Features

- **localStorage Caching** - 10-minute TTL with normalized query keys
- **Request Deduplication** - Concurrent duplicate requests share single Promise
- **Global Loading State** - Central manager for all UI loading indicators
- **Error Normalization** - Centralized error mapping (technical → user-friendly)
- **State Persistence** - Automatic save/restore with expiry validation
- **Dev Debug Panel** - Localhost-only UI showing network, cache, dedup stats
- **Secure Config** - API key stored in gitignored `config.local.js`

---

## Architecture

### Project Structure

```
src/
├── index.html
│
├── js/
│   ├── app.js                    # SPA bootstrap with validation
│   ├── config.js                 # Config loading with fallback chain
│   ├── router.js                 # Client-side routing (existing)
│   │
│   ├── services/
│   │   └── weather.service.js    # Weatherstack API client (⭐ main logic)
│   │
│   ├── pages/
│   │   └── weather.page.js       # Weather UI & state management
│   │
│   ├── state/
│   │   ├── loading.state.js      # Global loading indicator
│   │   ├── weather.persistence.js # State save/restore with TTL
│   │   └── weather.debug.js      # Stats tracking (dev-only)
│   │
│   ├── utils/
│   │   ├── error-mapper.js       # Technical → user-friendly errors
│   │   ├── request-deduplicator.js # Prevent concurrent duplicates
│   │   └── [existing utilities]
│   │
│   └── components/
│       ├── weather-debug.panel.js # Dev debug UI (localhost only)
│       └── [existing components]
│
└── styles/
    └── [existing styles]
```

### Module Responsibilities

| Module                    | Purpose                 | Exports                                                                       |
| ------------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| `weather.service.js`      | Weatherstack API client | `getCurrentByQuery()`, `getCurrentByCoords()`, `getCurrentByAutoIP()`         |
| `weather.page.js`         | UI & event handlers     | Renders DOM, manages state, calls service                                     |
| `loading.state.js`        | Global loading tracker  | `startLoading()`, `stopLoading()`, `isLoading()`                              |
| `weather.persistence.js`  | State save/restore      | `saveLastWeatherState()`, `getLastWeatherState()`                             |
| `error-mapper.js`         | Error normalization     | `mapWeatherError()` converts errors to user-friendly format                   |
| `request-deduplicator.js` | Dedup Promise tracking  | `deduplicateRequest()`, `isRequestInFlight()`                                 |
| `weather.debug.js`        | Stats tracking          | `incrementNetworkRequest()`, `incrementCacheHit()`, `incrementDeduplicated()` |
| `weather-debug.panel.js`  | Dev debug UI            | `renderWeatherDebugPanel()` (localhost only)                                  |

---

## Weather API Strategy

### Why Weatherstack (FREE Tier)?

- **No Authentication** - Single API key in `config.local.js`
- **Simple Current Endpoint** - `https://api.weatherstack.com/current`
- **Query Flexibility** - Supports city names, lat/lon, IP detection (`fetch:ip`)
- **Clear Error Format** - `{ success: false, error: { code, type, info } }`

### The 100 Calls/Month Challenge

**Problem:** 100 calls/month = ~3 calls/day. Typical usage with search would exhaust this instantly.

**Solution - Four Optimization Layers:**

1. **localStorage Caching (10-minute TTL)**
   - Most searches repeat within 10 minutes
   - Cache key: `weatherstack:current:units:normalizedQuery`
   - Example: searching "London" twice within 10 min → only 1 API call
   - Implementation: Check cache before API call, write on success

2. **Request Deduplication**
   - Rapid clicks on search button trigger multiple identical API calls
   - Solution: Share single Promise across concurrent requests
   - Map-based tracking: `dedupKey → Promise`
   - Auto-cleanup on resolve/reject

3. **User-Triggered Fetching Only**
   - No auto-refresh (unlike typical weather apps)
   - No background sync
   - Single button click = intentional API call
   - Reduces thoughtless requests

4. **Local Search Suggestions**
   - Recent searches stored in localStorage
   - 10 popular cities hardcoded (no API call)
   - Keyboard navigation without fetching
   - Users satisfy exploration urges without API consumption

**Result:** Realistic usage (search, toggle units, retry) uses ~0.5-1 call per session.

### Weatherstack Error Handling

```javascript
// Service detects success: false, maps to user-friendly error
const response = await fetch(...);
const data = await response.json();

if (!data.success) {
  // Weatherstack-specific error detection
  const error = mapWeatherError(data.error);
  // Returns: { title: "Invalid City", message: "We couldn't find...", code: "location_not_found" }
  throw error;
}
```

### Response Normalization

All weather responses normalized to consistent structure:

```javascript
{
  location: { name, region, country, lat, lon },
  current: { temp, condition, humidity, windSpeed, ... },
  raw: { ...full_weatherstack_response }
}
```

---

## Error Handling Philosophy

**Goal:** Never show users raw API error codes. Convert to actionable guidance.

### Error Mapping Strategy

| Technical Error                 | User Title            | User Message                       | Guidance                                 |
| ------------------------------- | --------------------- | ---------------------------------- | ---------------------------------------- |
| `invalid_access_key`            | Authentication Failed | Your API key is invalid or missing | Check `config.local.js`                  |
| `invalid_query`                 | Invalid City          | City name not recognized           | Try "New York", "London", "Tokyo"        |
| `no_result` (after valid)       | Location Not Found    | No weather data available          | City might be too small; try larger city |
| `resource_not_found` (104, 105) | API Limit Reached     | Used all monthly requests          | Try again next month or use geolocation  |
| Network timeout                 | Connection Error      | Request took too long              | Check internet connection; try again     |

### Implementation

1. **Centralized Mapper** (`error-mapper.js`)
   - Detects Weatherstack error types: `code`, `type`, `info`
   - Returns: `{ title, message, code? }`
   - No UI strings in service layer

2. **Integration Points**
   - weather.service.js catches and maps before throwing
   - weather.page.js receives formatted error and displays to user
   - Toast notifications use friendly titles/messages

---

## Performance & UX Decisions

### Why No Auto-Refresh?

Traditional weather apps refresh every 5-10 minutes. **Not here.**

- Wastes API quota (6-12 calls/session auto-refresh alone)
- User didn't ask for refresh; why consume resources?
- Geolocation changes are rare per session
- Decision: **User controls all API fetches** (search button, retry, geolocation)

### Global Loading State

Single source of truth prevents race conditions:

```javascript
startLoading("search"); // Multiple operations can call this
startLoading("geolocation");
// UI shows loading if ANY key is active

stopLoading("search");
stopLoading("geolocation"); // UI stops loading when all complete
```

**Benefits:**

- Button disabling works correctly (no accidental double-requests)
- Prevents showing success while other requests still pending
- Centralized: easy to hook logging/analytics

### State Persistence (24-Hour Expiry)

**Problem:** Users expect weather to reappear on page reload.

**Solution:**

- Save last successful weather fetch + units + timestamp
- Restore on page load if < 24 hours old
- Falls back to empty state gracefully
- Persisted data = offline-friendly bonus

### Dev-Only Debug Panel

**Visibility:** Shows only on `localhost` OR `window.__DEV__ === true`

**Displays:**

- Network Requests - Total API calls made
- Cache Hits - Requests served from localStorage
- Deduped Requests - Duplicate requests prevented
- Last Fetch Time - Timestamp of last API call
- Reset Stats - Button to clear tracking

**Purpose:** Monitor quota consumption during development without IDE tools

---

## Development & Setup

### Prerequisites

- Modern browser (Chrome, Firefox, Safari, Edge)
- VS Code with [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension

### Step 1: Get Weatherstack API Key

1. Visit [https://weatherstack.com/](https://weatherstack.com/)
2. Sign up for FREE tier (100 calls/month)
3. Copy your Access Key from dashboard

### Step 2: Configure Local API Key

1. Create `src/js/config.local.js`:

```javascript
export const CONFIG = {
  WEATHERSTACK_ACCESS_KEY: "your_actual_key_here",
};
```

2. **Important:** `config.local.js` is gitignored—never commit your key

3. Fallback: If `config.local.js` missing, app loads `config.example.js` (placeholder key)

### Step 3: Run Locally

1. Open project in VS Code
2. Right-click `src/index.html` → "Open with Live Server"
3. Navigate to Weather page
4. On `localhost`, debug panel visible in bottom-right

### Debugging Tips

**View Cache Status:**

- Open DevTools → Application → LocalStorage
- Search keys: `weatherstack:current:*`
- Each has format: `weatherstack:current:metric:london`

**Monitor API Usage:**

- Debug panel shows: Network, Cache Hits, Dedup count
- Check Weatherstack dashboard for monthly quota

**Force Cache Bypass:**

- Clear localStorage: `localStorage.clear()`
- Or specific key: `localStorage.removeItem("weatherstack:current:metric:london")`

**Enable Debug Panel on Production (Never!):**

```javascript
// In DevTools console (dev only)
window.__DEV__ = true; // Reload page
```

---

## Learning Outcomes

This project teaches:

1. **Real-World API Constraints** - How to optimize under quotas (100 calls/month)
2. **Caching Strategies** - localStorage TTL pattern, normalized keys
3. **Request Deduplication** - Promise sharing for concurrent requests
4. **State Management Without Frameworks** - Multiple state modules, centralized loading
5. **Error Mapping** - Technical → user-friendly conversion layer
6. **Configuration Patterns** - Secure API keys, gitignored local config
7. **Graceful Degradation** - Geolocation fallback to IP detection
8. **localStorage API** - TTL patterns, JSON serialization, expiry validation
9. **Async/Await Patterns** - Promise handling, error propagation
10. **Module Architecture** - Clear separation: services, pages, state, utils

### Code Quality Principles Demonstrated

- ✅ Single Responsibility Principle (weather.service.js only handles API)
- ✅ DRY (Shared helpers: normalizeQuery, buildCacheKey, mapError)
- ✅ Separation of Concerns (state logic separate from UI)
- ✅ Error Boundaries (try-catch at appropriate layers)
- ✅ Immutable Data Patterns (spread operator, Object.freeze where needed)
- ✅ Readable Code (meaningful variable names, JSDoc comments)

---

## Future Improvements

- **7-Day Forecast** - Add forecast endpoint (separate API call cost)
- **City Autocomplete API** - Geonames or OpenCage for better search
- **Multiple Units Display** - Show both C° and F° simultaneously
- **Favorite Cities** - Pin frequently searched cities
- **Historical Data** - View past week's weather trend
- **Dark Mode** - Persistent theme preference
- **PWA Support** - Install as app, offline functionality
- **TypeScript** - Type safety for larger codebase
- **Unit Tests** - Jest for service layer testing
- **Analytics** - Track most searched cities (privacy-respecting)

---

## Technologies & Standards

- **JavaScript:** ES6+ modules, async/await, URLSearchParams
- **Storage:** localStorage with TTL pattern
- **Patterns:** Service Layer, State Management, Error Mapping, Request Deduplication
- **Standards:** Semantic HTML5, ARIA accessibility, Fetch API

---

## License

MIT License - see LICENSE file for details

---

## Author

**Feras Abdul Mohsen Al-Ahmad**

- GitHub: [@Feras-AbdulMohsen-AlAhmad](https://github.com/Feras-AbdulMohsen-AlAhmad)
- Portfolio: [Coming Soon]

---

## Acknowledgments

- [Weatherstack](https://weatherstack.com/) - Real-time weather API
- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) - Modern JavaScript modules
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) - Modern HTTP requests
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) - Client-side persistence
