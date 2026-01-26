# Multi-API Explorer Dashboard

A modern, responsive vanilla JavaScript dashboard that integrates multiple public APIs to showcase data fetching, pagination, filtering, and error handling in real-time.

## Learning Goals

- **Fetch API**: Async requests with proper error handling
- **CRUD Operations**: Create, read, update, delete workflows
- **Pagination**: Implement efficient data navigation
- **Filtering & Search**: Real-time data filtering capabilities
- **Error Handling**: User-friendly error messages and fallbacks
- **Component Architecture**: Modular, reusable UI components
- **State Management**: Client-side data persistence

## APIs Used

- **[JSONPlaceholder](https://jsonplaceholder.typicode.com/)** - Posts and user data
- **[Rick & Morty API](https://rickandmortyapi.com/)** - Character data with pagination
- **[REST Countries](https://restcountries.com/)** - Country information and flags
- **[Open-Meteo](https://open-meteo.com/)** - Weather forecasts (no API key required)

## Features

✨ **Multi-Tab Navigation** - Seamless switching between different data sources  
🔍 **Search & Filter** - Real-time filtering across all datasets  
📑 **Pagination** - Load more or paginated navigation for large datasets  
🎯 **Modal Details** - View detailed information in interactive modals  
⚙️ **Loading States** - Smooth loader animations during data fetching  
🔔 **Toast Notifications** - Real-time feedback for user actions  
💾 **Local Storage** - Persistent user preferences  
📱 **Responsive Design** - Works seamlessly on desktop and mobile  
♿ **Accessible UI** - Semantic HTML and keyboard navigation

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
