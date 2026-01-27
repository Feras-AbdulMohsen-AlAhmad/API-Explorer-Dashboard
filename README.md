# 🌐 API-Explorer-Dashboard

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

---

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge - latest versions)
- Code editor (VS Code recommended)
- [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension (optional)

### Installation & Running

1. **Clone the repository**

   ```bash
   git clone https://github.com/Feras-AbdulMohsen-AlAhmad/API-Explorer-Dashboard.git
   cd API-Explorer-Dashboard
   ```

2. **Option A: Using VS Code Live Server (Recommended)**
   - Open the project in VS Code
   - Right-click on `src/index.html`
   - Select "Open with Live Server"
   - Application opens at `http://localhost:5500/src/`

3. **Option B: Using Python HTTP Server**

   ```bash
   # Navigate to project root
   cd src
   python -m http.server 8000
   # Open browser to http://localhost:8000
   ```

4. **Option C: Direct File Access**
   - Open `src/index.html` directly in your browser
   - ⚠️ Note: Some features may not work due to CORS restrictions

### Testing with Postman

Import the included Postman collection to test all API endpoints:

1. Open Postman
2. Import `postman/API-Explorer.postman_collection.json`
3. Import `postman/API-Explorer.postman_environment.json`
4. Select "API Explorer Environment" from the environments dropdown
5. Test all endpoints with pre-configured requests

---

## 📁 Project Structure

```
API-Explorer-Dashboard/
│
├── src/
│   ├── index.html                    # Main HTML entry point
│   │
│   ├── js/
│   │   ├── app.js                   # Application initialization
│   │   ├── config.js                # Global configuration
│   │   ├── router.js                # Client-side routing
│   │   │
│   │   ├── api/
│   │   │   ├── endpoints.js         # API base URLs
│   │   │   └── httpClient.js        # Fetch wrapper with error handling
│   │   │
│   │   ├── components/
│   │   │   ├── card.js              # Reusable card component
│   │   │   ├── loader.js            # Loading spinner component
│   │   │   ├── modal.js             # Modal dialog component
│   │   │   ├── navbar.js            # Navigation component
│   │   │   ├── pagination.js        # Pagination controls
│   │   │   └── toast.js             # Toast notification system
│   │   │
│   │   ├── pages/
│   │   │   ├── posts.page.js        # Posts page (CRUD operations)
│   │   │   ├── characters.page.js   # Rick & Morty characters page
│   │   │   ├── countries.page.js    # Countries explorer page
│   │   │   └── weather.page.js      # Weather forecast page
│   │   │
│   │   ├── services/
│   │   │   ├── posts.service.js     # JSONPlaceholder API service
│   │   │   ├── rickmorty.service.js # Rick & Morty API service
│   │   │   ├── countries.service.js # REST Countries API service
│   │   │   └── weather.service.js   # Open-Meteo API service
│   │   │
│   │   └── utils/
│   │       ├── dom.js               # DOM manipulation helpers
│   │       ├── formatters.js        # Data formatting utilities
│   │       ├── storage.js           # LocalStorage wrapper
│   │       └── validators.js        # Input validation
│   │
│   └── styles/
│       ├── base.css                 # Reset & base styles
│       ├── components.css           # Component-specific styles
│       └── pages.css                # Page-specific styles
│
├── postman/
│   ├── API-Explorer.postman_collection.json    # Postman collection
│   └── API-Explorer.postman_environment.json   # Postman environment
│
└── README.md                        # Project documentation
```

---

## 🎨 Screenshots

### Posts Page - CRUD Operations

![Posts Page](./screenshots/posts-page.png)
_Create, read, update, and delete posts with real-time updates_

### Characters Page - Filtering & Pagination

![Characters Page](./screenshots/characters-page.png)
_Browse Rick & Morty characters with advanced filtering options_

### Countries Page - Search & Sort

![Countries Page](./screenshots/countries-page.png)
_Explore countries with flags, population data, and sorting_

### Weather Page - Forecast Display

![Weather Page](./screenshots/weather-page.png)
_View current temperature and 7-day weather forecast_

---

## 💻 Technologies & Patterns

### Core Technologies

- **JavaScript (ES6+)** - Modern JavaScript with modules, async/await, destructuring
- **HTML5** - Semantic markup for accessibility
- **CSS3** - Flexbox, Grid, Custom Properties, Animations

### Design Patterns

- **Module Pattern** - ES6 modules for code organization
- **Service Layer** - Abstracted API communication
- **Component-Based Architecture** - Reusable UI components
- **Observer Pattern** - Event-driven interactions
- **Error Handling** - Try-catch with user feedback

### Best Practices

- ✅ Separation of concerns (services, components, pages)
- ✅ DRY (Don't Repeat Yourself) principles
- ✅ Consistent error handling across all pages
- ✅ Loading states for all async operations
- ✅ Debounced search inputs for performance
- ✅ Accessible UI with semantic HTML and ARIA attributes
- ✅ Mobile-first responsive design
- ✅ Clean, readable code with JSDoc comments

---

## 🌟 Learning Outcomes

This project demonstrates proficiency in:

1. **API Integration** - Working with multiple REST APIs, handling different response formats
2. **Async JavaScript** - Promises, async/await, error handling, race conditions
3. **State Management** - Managing application state without frameworks
4. **DOM Manipulation** - Efficient rendering and updates
5. **User Experience** - Loading states, error messages, empty states, toast notifications
6. **Code Organization** - Modular architecture, service layers, component reusability
7. **Responsive Design** - Mobile-first CSS with Flexbox and Grid
8. **Accessibility** - Semantic HTML, ARIA labels, keyboard navigation
9. **Testing** - Postman collection for API testing and documentation

---

## 🔮 Future Enhancements

- [ ] Dark mode toggle with persistent preference
- [ ] Export data to CSV/JSON formats
- [ ] Advanced filter UI with range sliders
- [ ] Caching strategy with Service Workers
- [ ] Unit tests with Jest
- [ ] End-to-end tests with Playwright
- [ ] TypeScript migration
- [ ] PWA capabilities (offline support)
- [ ] Chart visualizations (Chart.js integration)
- [ ] User favorites/bookmarks system

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Feras Abdul Mohsen Al-Ahmad**

- GitHub: [@Feras-AbdulMohsen-AlAhmad](https://github.com/Feras-AbdulMohsen-AlAhmad)
- Portfolio: [Coming Soon]

---

## 🙏 Acknowledgments

- [JSONPlaceholder](https://jsonplaceholder.typicode.com/) - Free fake API for testing
- [Rick and Morty API](https://rickandmortyapi.com/) - Amazing character database
- [REST Countries](https://restcountries.com/) - Comprehensive country data
- [Open-Meteo](https://open-meteo.com/) - Free weather forecasts

---

**⭐ If you find this project helpful, please consider giving it a star!**
