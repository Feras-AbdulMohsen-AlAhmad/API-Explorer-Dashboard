# 🌐 Multi-API Explorer Dashboard

A modern, production-ready vanilla JavaScript dashboard that integrates four different public APIs to showcase real-world data fetching, state management, and user interaction patterns. Built without frameworks to demonstrate core web development skills.

---

## 📋 Overview

This project is a comprehensive single-page application (SPA) that provides an interactive interface for exploring data from multiple REST APIs. It demonstrates modern JavaScript practices including modular architecture, async/await patterns, error handling, and responsive design—all using vanilla JavaScript, HTML, and CSS.

**Live Demo:** [Coming Soon]

---

## ✨ Key Features

### Core Functionality

- 🔄 **Multi-API Integration** - Seamlessly fetches data from 4 different REST APIs
- 🔍 **Advanced Search & Filtering** - Real-time filtering with debounced search inputs
- 📊 **Data Visualization** - Clean card-based layouts with detailed modal views
- 📄 **Pagination** - Efficient navigation through large datasets
- ⚡ **CRUD Operations** - Complete Create, Read, Update, Delete workflows (Posts)
- 🎯 **Sorting** - Multiple sort options for data organization

### User Experience

- ⏳ **Loading States** - Smooth loading animations during data fetching
- 🔔 **Toast Notifications** - User-friendly success/error feedback
- ❌ **Error Handling** - Comprehensive error states with retry functionality
- 📭 **Empty States** - Helpful messaging when no data is available
- 📱 **Responsive Design** - Fully responsive across desktop, tablet, and mobile
- ♿ **Accessibility** - Semantic HTML, ARIA labels, and keyboard navigation

### Technical Highlights

- 🏗️ **Modular Architecture** - Organized component-based structure
- 🔌 **Service Layer Pattern** - Abstracted API communication
- 🛣️ **Client-Side Routing** - Hash-based navigation without page reloads
- 💾 **No Build Tools** - Pure ES6 modules, no bundlers required
- 🎨 **CSS Custom Properties** - Maintainable theming system
- 📦 **Postman Collections** - Complete API documentation included

---

## 🔌 APIs Integrated

| API                                                          | Purpose                   | Features Used                    |
| ------------------------------------------------------------ | ------------------------- | -------------------------------- |
| **[JSONPlaceholder](https://jsonplaceholder.typicode.com/)** | Fake REST API for testing | CRUD operations, posts, comments |
| **[Rick & Morty API](https://rickandmortyapi.com/)**         | Character database        | Pagination, multi-filter search  |
| **[REST Countries](https://restcountries.com/)**             | Country information       | Sorting, search, detailed modals |
| **[Open-Meteo](https://open-meteo.com/)**                    | Weather forecasts         | Current weather, 7-day forecast  |

_All APIs are free and require no authentication._

## Getting Started

### Requirements

- Modern browser (Chrome, Firefox, Safari, Edge)
- [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension (optional but recommended)

### How to Run

1. **Clone or download the repository**

   ```bash
   git clone https://github.com/yourusername/api-explorer-dashboard.git
   cd api-explorer-dashboard
   ```

2. **Using Live Server (Recommended)**
   - Right-click `src/index.html` → "Open with Live Server"
   - Dashboard loads at `http://localhost:5500`

3. **Using Python**

   ```bash
   # Python 3.x
   python -m http.server 8000
   # Access at http://localhost:8000/src
   ```

4. **Direct File Open**
   - Open `src/index.html` directly in your browser
   - Note: Some features may not work due to CORS restrictions

## Project Structure

```
src/
├── index.html                 # Main HTML template
├── js/
│   ├── app.js                # Application entry point
│   ├── config.js             # Configuration and constants
│   ├── router.js             # Page routing logic
│   ├── api/
│   │   ├── endpoints.js      # API endpoint definitions
│   │   └── httpClient.js     # Fetch wrapper
│   ├── components/           # Reusable UI components
│   ├── pages/                # Page implementations
│   ├── services/             # API service layers
│   └── utils/                # Helper functions
└── styles/                   # CSS stylesheets
```

## Technologies

- **Vanilla JavaScript** (ES6+)
- **HTML5**
- **CSS3** (Flexbox, Grid)
- **Fetch API**
- **LocalStorage API**

## Future Enhancements

- Dark mode toggle
- Export data to CSV/JSON
- Advanced filtering UI
- Caching strategy
- Unit tests

## License

MIT License - feel free to use this project for learning and portfolio purposes.

## Author

Created as a vanilla JavaScript learning project to demonstrate modern web development practices.
