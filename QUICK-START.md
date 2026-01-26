# 🚀 Quick Start Guide

## Running the Project (3 Easy Steps)

### Method 1: VS Code Live Server (Recommended)

1. Open project in VS Code
2. Right-click `src/index.html`
3. Click "Open with Live Server"
   - App runs at: `http://localhost:5500/src/`

### Method 2: Python Server

```bash
cd src
python -m http.server 8000
```

- App runs at: `http://localhost:8000`

### Method 3: Direct Browser

- Double-click `src/index.html` (may have CORS limitations)

---

## Testing APIs with Postman

### Import Collection

1. Open Postman
2. Click "Import"
3. Select both files from `/postman` folder:
   - `API-Explorer.postman_collection.json`
   - `API-Explorer.postman_environment.json`
4. Select "API Explorer Environment" from dropdown
5. Test all 20+ endpoints!

---

## Project Navigation

### Main Pages

- **Posts** - `#posts` - CRUD operations
- **Characters** - `#characters` - Rick & Morty characters
- **Countries** - `#countries` - World countries data
- **Weather** - `#weather` - Weather forecast

### Key Files to Explore

```
src/js/
├── pages/              ← Page implementations
├── services/           ← API communication
├── components/         ← Reusable UI components
└── api/httpClient.js   ← Fetch wrapper
```

---

## Making Changes

### Add a New API

1. Add endpoint to `api/endpoints.js`
2. Create service in `services/`
3. Create page in `pages/`
4. Add route in `router.js`
5. Update navigation in `index.html`

### Modify Existing Features

- **Pages**: Edit `pages/*.page.js`
- **API calls**: Edit `services/*.service.js`
- **Styles**: Edit `styles/*.css`
- **Components**: Edit `components/*.js`

---

## Common Tasks

### Change Weather Location

Edit `weather.page.js`:

```javascript
const DEFAULT_LOCATION = {
  name: "Your City",
  lat: YOUR_LATITUDE,
  lon: YOUR_LONGITUDE,
};
```

### Modify Toast Duration

Edit `components/toast.js`:

```javascript
const AUTO_DISMISS_MS = 3000; // Change value
```

### Add New Filter

1. Add input to page HTML
2. Add filter to service query params
3. Wire up event listener
4. Call API with new filter

---

## Debugging Tips

### API Not Working?

- Check browser console (F12)
- Verify API endpoint in `endpoints.js`
- Test endpoint in Postman first
- Check CORS (use Live Server, not direct file)

### Styles Not Applying?

- Check CSS file order in `index.html`
- Clear browser cache (Ctrl+Shift+R)
- Inspect element (F12) to see computed styles

### Page Not Loading?

- Check router.js for hash mapping
- Verify page import in app.js
- Check console for JavaScript errors

---

## Features by Page

### Posts

- Create, edit, delete posts
- Search posts
- View comments
- Modal details

### Characters

- Page navigation
- Filter by name, status, species, gender
- Character details modal

### Countries

- Search countries
- Sort by name/population
- Country details modal
- Flag images

### Weather

- Current temperature
- 7-day forecast
- Amsterdam location (configurable)

---

## Browser DevTools

### Useful Shortcuts

- `F12` - Open DevTools
- `Ctrl+Shift+C` - Inspect element
- `Ctrl+Shift+J` - Console
- `F5` - Refresh
- `Ctrl+Shift+R` - Hard refresh (clear cache)

### Network Tab

- Monitor API requests
- Check response status codes
- View request/response data
- Debug CORS issues

---

## Need Help?

- 📖 Check [README.md](README.md) for full documentation
- 📋 Review [PROJECT-SUMMARY.md](PROJECT-SUMMARY.md) for features
- 🔍 Search code for examples of similar functionality
- 🧪 Test APIs in Postman first

---

**Happy Coding! 🎉**
