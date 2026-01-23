# Multi-API Explorer Dashboard

Modern, client-side dashboard that pulls data from multiple public APIs to practice real-world data fetching, state handling, and UI interactions without a backend.

## Learning goals

- Confidently use the Fetch API for GET/POST/PUT/DELETE flows
- Handle pagination, searching, filtering, and sorting on the client
- Manage async states: loading indicators, optimistic updates, error and retry patterns
- Compose reusable UI patterns: tabs, cards, modals, toasts

## APIs used

- JSONPlaceholder (CRUD sandbox)
- Rick & Morty API (characters and episodes)
- REST Countries (country facts and filtering)
- Open-Meteo (weather snapshots)

## Features

- Tabbed sections for each API with consistent layouts
- Search and filter controls with debounced requests
- Detail modals for richer entity views
- Pagination and infinite scrolling variants
- Inline loader states plus non-blocking toast notifications for success/error

## Run locally

1. Clone the repo and open the folder in VS Code.
2. Open `index.html` with the Live Server extension (or any static server).
3. Interact with the tabs to explore APIs; update env/config if you add keys.
