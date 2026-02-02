# API Explorer Dashboard

A frontend training project demonstrating professional API integration patterns, clean architecture, and separation of concerns. This project integrates multiple public APIs using a unified three-layer architecture pattern designed for scalability and maintainability.

## Project Overview

This project serves as a practical exploration of modern frontend architecture patterns when working with external APIs. It addresses common challenges in API-driven applications:

- **Raw API responses leaking into UI components**, making them brittle and difficult to maintain
- **Inconsistent error handling** across different API integrations
- **Business logic scattered** between UI and HTTP layers
- **Difficulty in testing** due to tight coupling between layers

The solution is a three-layer architecture that enforces strict separation of concerns: API Layer (HTTP only), Service Layer (normalization, caching, error mapping), and UI Layer (presentation only). This pattern, established with the WeatherAPI.com integration, is consistently applied across all APIs in the project.

## Features

### Weather (WeatherAPI.com)

- Current weather by city, country, or coordinates
- Auto-detection via IP geolocation
- 7-day weather forecast with detailed metrics
- Historical weather data queries
- Location search with autocomplete suggestions
- Persistent weather state and recent searches
- Temperature unit conversion (Celsius/Fahrenheit)

### Posts (JSONPlaceholder)

- Full CRUD operations (Create, Read, Update, Delete)
- Search and filter posts by title
- View post comments
- In-line editing and deletion
- Form validation and error handling

### Countries (REST Countries API)

- Browse all countries worldwide
- Search by country name
- Search by ISO country code (2 or 3 letters)
- Filter by geographic region
- Sort by name, population, or area
- Detailed country information with flags

### Characters (Rick and Morty API)

- Paginated character browsing
- Filter by name, status, species, and gender
- Character detail modal with full information
- Pagination controls with API-driven state

## Tech Stack

- **JavaScript (ES6+)** - Vanilla JavaScript with modern syntax
- **CSS3** - Custom properties, Grid, Flexbox
- **Architecture** - Three-layer pattern (API, Service, UI)
- **HTTP Client** - Custom wrapper around Fetch API
- **State Management** - LocalStorage for persistence, module-level state
- **Postman** - API testing and documentation

## Architecture Overview

This project implements a three-layer architecture that strictly separates concerns:

```
┌─────────────────────────────────────────┐
│            UI Layer (Pages)             │
│  - Rendering                            │
│  - User interactions                    │
│  - Display normalized data/errors       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Service Layer (Services)        │
│  - Data normalization                   │
│  - Business logic (sorting, filtering)  │
│  - Error mapping (via error-mapper)     │
│  - Caching and deduplication            │
│  - Pagination state management          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          API Layer (API files)          │
│  - Pure HTTP requests                   │
│  - URL construction                     │
│  - Query parameter handling             │
│  - No business logic                    │
└─────────────────────────────────────────┘
```

### Why This Separation Matters

**API Layer** handles only HTTP mechanics. Functions here are pure: given parameters, they make HTTP requests and return raw responses. No normalization, no error handling beyond what the HTTP client provides.

**Service Layer** is where intelligence lives. Raw API responses are normalized into consistent shapes. Errors are mapped to user-friendly messages. Caching, sorting, filtering, and pagination logic reside here. This layer presents a clean interface to the UI.

**UI Layer** handles only presentation. Pages receive normalized data and normalized error objects. They never see raw API responses or HTTP errors. This makes UI components simple, testable, and resilient to API changes.

## Folder Structure

```
src/
├── api/                    # API Layer - HTTP operations only
│   ├── httpClient.js       # Fetch wrapper with common headers
│   ├── endpoints.js        # API base URLs and configuration
│   ├── weather.api.js      # WeatherAPI.com HTTP functions
│   ├── posts.api.js        # JSONPlaceholder HTTP functions
│   ├── countries.api.js    # REST Countries HTTP functions
│   └── rickmorty.api.js    # Rick & Morty API HTTP functions
│
├── services/               # Service Layer - Business logic
│   ├── weather.service.js  # Weather normalization, caching, error mapping
│   ├── posts.service.js    # Posts normalization and error mapping
│   ├── countries.service.js # Countries normalization, sorting
│   └── rickmorty.service.js # Characters normalization, pagination
│
├── pages/                  # UI Layer - Presentation only
│   ├── weather.page.js     # Weather UI and interactions
│   ├── posts.page.js       # Posts CRUD UI
│   ├── countries.page.js   # Countries explorer UI
│   └── characters.page.js  # Characters browser UI
│
├── components/             # Reusable UI components
│   ├── navbar.js           # Navigation
│   ├── loader.js           # Loading spinner
│   ├── toast.js            # Notifications
│   ├── modal.js            # Modal dialogs
│   ├── pagination.js       # Pagination controls
│   └── card.js             # Card component
│
├── utils/                  # Shared utilities
│   ├── error-mapper.js     # Centralized error normalization
│   ├── dom.js              # DOM helpers
│   ├── formatters.js       # Data formatting utilities
│   ├── storage.js          # LocalStorage abstraction
│   └── validators.js       # Input validation
│
├── config.js               # Application configuration
├── router.js               # Client-side routing
├── app.js                  # Application entry point
└── index.html              # HTML shell

postman/                    # API testing
├── API-Explorer.postman_collection.json
└── API-Explorer.postman_environment.json
```

## Error Handling Strategy

All errors in this project flow through a centralized error mapper (`utils/error-mapper.js`). Each API has its own mapping function that converts raw errors into normalized error objects.

### Normalized Error Object

```javascript
{
  title: "Network Error",           // User-facing error title
  message: "Unable to connect...",  // Detailed user message
  code: "NETWORK_ERR"               // Optional error code
}
```

### API-Specific Mappers

- `mapWeatherError()` - Handles WeatherAPI.com errors (API key issues, location not found, rate limits)
- `mapPostsError()` - Handles JSONPlaceholder errors (404, network, validation)
- `mapCountriesError()` - Handles REST Countries errors (country not found, network)
- `mapRickMortyError()` - Handles Rick & Morty API errors (character not found, rate limits)

### Benefits

1. **Consistent UX** - All errors look the same to users regardless of which API failed
2. **Maintainable** - Error handling logic is centralized, not scattered across pages
3. **Testable** - Error mappers are pure functions that can be unit tested
4. **Resilient** - API changes to error formats don't break the UI

Example from service layer:

```javascript
export async function getAllCountries() {
  try {
    const data = await countriesApi.fetchAllCountries();
    return normalizeCountriesData(data);
  } catch (error) {
    throw mapCountriesError(error); // Always normalized
  }
}
```

Example from UI layer:

```javascript
try {
  const countries = await getAllCountries();
  renderCountries(countries);
} catch (error) {
  // error is guaranteed to have { title, message }
  showToast(error.message, "error");
}
```

## API Integrations

### WeatherAPI.com (Reference Implementation)

The WeatherAPI.com integration establishes the reference pattern followed by all other APIs:

- **API Layer**: `weather.api.js` with 5 functions (`fetchCurrentWeather`, `fetchForecast`, etc.)
- **Service Layer**: `weather.service.js` with normalization (`normalizeWeatherData`), caching (10-min TTL), request deduplication, and error mapping
- **Error Handling**: `mapWeatherError` handles API key issues, location errors, rate limits
- **Advanced Features**: IP-based auto-detection, unit conversion, persistent state

### JSONPlaceholder (Posts API)

Follows the WeatherAPI pattern:

- **API Layer**: `posts.api.js` with 8 functions (all CRUD operations)
- **Service Layer**: `posts.service.js` with data normalization and error mapping
- **Error Handling**: `mapPostsError` for 404, network, and validation errors

### REST Countries API

Follows the WeatherAPI pattern:

- **API Layer**: `countries.api.js` with 5 functions (search by name, code, region)
- **Service Layer**: `countries.service.js` with normalization, alphabetical sorting
- **Error Handling**: `mapCountriesError` for country not found and network errors
- **Business Logic**: Sorting moved from UI to service layer

### Rick and Morty API (Characters)

Follows the WeatherAPI pattern:

- **API Layer**: `rickmorty.api.js` with 3 functions (paginated characters, single character, bulk fetch)
- **Service Layer**: `rickmorty.service.js` with normalization and pagination response handling
- **Error Handling**: `mapRickMortyError` for character not found, rate limits
- **Business Logic**: Pagination state managed in service layer

## Postman Collection

The project includes a comprehensive Postman collection for testing and documentation purposes.

### Importing the Collection

1. Open Postman
2. Click **Import** button
3. Select `postman/API-Explorer.postman_collection.json`
4. Import the environment: `postman/API-Explorer.postman_environment.json`
5. Select "API-Explorer" environment from the dropdown

### Environment Variables

The following variables are used across requests:

- `WEATHERAPI_URL` - Base URL for WeatherAPI.com
- `WEATHERAPI_KEY` - Your WeatherAPI.com API key
- `WEATHERAPI_AQI` - Air quality data flag (yes/no)
- `WEATHERAPI_DAYS` - Forecast days (1-10)
- `CITY_NAME` - Sample city for testing
- `LATITUDE`, `LONGITUDE` - Coordinates for testing
- `HISTORICAL_DATE` - Date for historical queries

### Why Postman is Included

Postman provides:

- **API Documentation** - Each request includes descriptions, parameter docs, and example responses
- **Quick Testing** - Test API endpoints without running the app
- **Debugging** - Isolate API issues from frontend code
- **Rate Limit Testing** - Experiment with endpoints before integrating
- **Team Collaboration** - Share API knowledge with team members

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- WeatherAPI.com API key (free tier available)
- Local web server (Live Server, http-server, or similar)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Feras-AbdulMohsen-AlAhmad/API-Explorer-Dashboard.git
   cd API-Explorer-Dashboard
   ```

2. Configure API keys:
   - Open `src/config.js`
   - Add your WeatherAPI.com API key:
     ```javascript
     WEATHER_API_KEY: "your_api_key_here";
     ```

3. Serve the project:

   ```bash
   # Using Live Server (VS Code extension)
   # Right-click on index.html → Open with Live Server

   # Or using http-server (Node.js)
   npx http-server src -p 8080
   ```

4. Open browser:
   ```
   http://localhost:8080
   ```

### Configuration Notes

- JSONPlaceholder, REST Countries, and Rick & Morty APIs require no authentication
- WeatherAPI.com requires a free API key from [weatherapi.com](https://www.weatherapi.com/)
- API keys are configured in `src/config.js`

## Design Principles

### Separation of Concerns

Each layer has a single responsibility. API layers know nothing about normalization. Services know nothing about rendering. Pages know nothing about HTTP.

### Scalability

Adding a new API requires:

1. Create `api/newapi.api.js` with HTTP functions
2. Create `services/newapi.service.js` with normalization and error mapping
3. Add `mapNewApiError` to `error-mapper.js`
4. Create `pages/newapi.page.js` for UI

The pattern is repeatable and predictable.

### Maintainability

- Changes to API response formats only affect service normalization functions
- Changes to error handling only affect error mapper functions
- Changes to UI only affect page components
- Layers are loosely coupled and independently testable

### Consistency

All four APIs follow the same pattern. A developer familiar with one API integration can immediately understand another. Error objects have the same shape. Service functions have similar naming conventions. The codebase is predictable.

## Future Improvements

- **Authentication** - Add user authentication with JWT tokens
- **Advanced Caching** - Implement cache invalidation strategies and cache size limits
- **Unit Tests** - Add Jest or Vitest for testing services and error mappers
- **TypeScript Migration** - Add type safety across all layers
- **State Management Library** - Consider Redux or Zustand for complex state
- **Build Pipeline** - Add Vite or Webpack for bundling and optimization
- **API Rate Limiting UI** - Display rate limit status to users
- **Offline Support** - Service Worker for offline functionality
- **Accessibility Audit** - WCAG 2.1 AA compliance testing
- **Performance Monitoring** - Add performance metrics and logging

---

**License**: MIT  
**Author**: Feras AbdulMohsen AlAhmad  
**Repository**: [API-Explorer-Dashboard](https://github.com/Feras-AbdulMohsen-AlAhmad/API-Explorer-Dashboard)
