# Postman Test Scripts Guide

## Automated Test Scripts for API-Explorer-Dashboard Collection

This document provides test scripts to add to each endpoint in the Postman collection for automated validation.

---

## How to Add Test Scripts

1. Open Postman collection
2. Select an endpoint
3. Click the "Tests" tab (below URL bar)
4. Copy the appropriate script from below
5. Paste into the Tests tab
6. Click "Save"

---

## JSONPlaceholder API Test Scripts

### 1. Get All Posts

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test: Response time is acceptable
pm.test("Response time is less than 1000ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(1000);
});

// Test: Response is an array
pm.test("Response is an array", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.be.an("array");
});

// Test: Array contains 100 posts
pm.test("Returns 100 posts", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.lengthOf(100);
});

// Test: Each post has required fields
pm.test("Posts have required fields", function () {
  var jsonData = pm.response.json();
  jsonData.forEach(function (post) {
    pm.expect(post).to.have.property("id");
    pm.expect(post).to.have.property("userId");
    pm.expect(post).to.have.property("title");
    pm.expect(post).to.have.property("body");
  });
});

// Test: Data types are correct
pm.test("Post data types are correct", function () {
  var jsonData = pm.response.json();
  var firstPost = jsonData[0];
  pm.expect(firstPost.id).to.be.a("number");
  pm.expect(firstPost.userId).to.be.a("number");
  pm.expect(firstPost.title).to.be.a("string");
  pm.expect(firstPost.body).to.be.a("string");
});
```

### 2. Get Post by ID

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test: Response is an object
pm.test("Response is an object", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.be.an("object");
});

// Test: Post has required fields
pm.test("Post has required fields", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("id");
  pm.expect(jsonData).to.have.property("userId");
  pm.expect(jsonData).to.have.property("title");
  pm.expect(jsonData).to.have.property("body");
});

// Test: Post ID matches request
pm.test("Post ID matches requested ID", function () {
  var jsonData = pm.response.json();
  var requestedId = parseInt(pm.environment.get("post_id"));
  pm.expect(jsonData.id).to.equal(requestedId);
});

// Test: Title and body are non-empty
pm.test("Title and body are not empty", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.title).to.not.be.empty;
  pm.expect(jsonData.body).to.not.be.empty;
});
```

### 3. Get Post Comments

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test: Response is an array
pm.test("Response is an array", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.be.an("array");
});

// Test: Comments have required fields
pm.test("Comments have required fields", function () {
  var jsonData = pm.response.json();
  jsonData.forEach(function (comment) {
    pm.expect(comment).to.have.property("id");
    pm.expect(comment).to.have.property("postId");
    pm.expect(comment).to.have.property("name");
    pm.expect(comment).to.have.property("email");
    pm.expect(comment).to.have.property("body");
  });
});

// Test: Email format is valid
pm.test("Email format is valid", function () {
  var jsonData = pm.response.json();
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  jsonData.forEach(function (comment) {
    pm.expect(comment.email).to.match(emailRegex);
  });
});

// Test: All comments belong to the post
pm.test("All comments belong to the requested post", function () {
  var jsonData = pm.response.json();
  var requestedPostId = parseInt(pm.environment.get("post_id"));
  jsonData.forEach(function (comment) {
    pm.expect(comment.postId).to.equal(requestedPostId);
  });
});
```

### 4. Create Post

```javascript
// Test: Status code is 201 Created
pm.test("Status code is 201", function () {
  pm.response.to.have.status(201);
});

// Test: Response contains new post with ID
pm.test("Response contains new post with ID", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("id");
  pm.expect(jsonData.id).to.be.a("number");
});

// Test: Created post contains submitted data
pm.test("Created post contains submitted data", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("title");
  pm.expect(jsonData).to.have.property("body");
  pm.expect(jsonData).to.have.property("userId");
});

// Test: Response time is acceptable
pm.test("Response time is less than 1000ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(1000);
});
```

### 5. Update Post (PUT)

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test: Response contains updated post
pm.test("Response contains updated post", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("id");
  pm.expect(jsonData).to.have.property("title");
  pm.expect(jsonData).to.have.property("body");
  pm.expect(jsonData).to.have.property("userId");
});

// Test: Post ID matches request
pm.test("Post ID matches requested ID", function () {
  var jsonData = pm.response.json();
  var requestedId = parseInt(pm.environment.get("post_id"));
  pm.expect(jsonData.id).to.equal(requestedId);
});
```

### 6. Update Post (PATCH)

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test: Response contains patched post
pm.test("Response contains patched post", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("id");
  pm.expect(jsonData).to.have.property("title");
});

// Test: Only specified fields are updated
pm.test("Patched fields are present", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.title).to.not.be.empty;
});
```

### 7. Delete Post

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test: Response is an empty object
pm.test("Response is an object", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.be.an("object");
});

// Test: Response time is acceptable
pm.test("Response time is less than 1000ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(1000);
});
```

---

## Rick & Morty API Test Scripts

### 1. Get Characters (Default)

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test: Response has info and results
pm.test("Response has info and results", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("info");
  pm.expect(jsonData).to.have.property("results");
});

// Test: Info has pagination data
pm.test("Info has pagination data", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.info).to.have.property("count");
  pm.expect(jsonData.info).to.have.property("pages");
  pm.expect(jsonData.info).to.have.property("next");
  pm.expect(jsonData.info).to.have.property("prev");
});

// Test: Results is an array
pm.test("Results is an array", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.results).to.be.an("array");
});

// Test: Results contains 20 characters
pm.test("Results contains 20 characters", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.results).to.have.lengthOf(20);
});

// Test: Characters have required fields
pm.test("Characters have required fields", function () {
  var jsonData = pm.response.json();
  jsonData.results.forEach(function (character) {
    pm.expect(character).to.have.property("id");
    pm.expect(character).to.have.property("name");
    pm.expect(character).to.have.property("status");
    pm.expect(character).to.have.property("species");
    pm.expect(character).to.have.property("gender");
    pm.expect(character).to.have.property("image");
    pm.expect(character).to.have.property("origin");
    pm.expect(character).to.have.property("location");
  });
});

// Test: Status values are valid
pm.test("Status values are valid", function () {
  var jsonData = pm.response.json();
  var validStatuses = ["Alive", "Dead", "unknown"];
  jsonData.results.forEach(function (character) {
    pm.expect(validStatuses).to.include(character.status);
  });
});

// Test: Image URLs are valid
pm.test("Image URLs are valid", function () {
  var jsonData = pm.response.json();
  jsonData.results.forEach(function (character) {
    pm.expect(character.image).to.match(/^https:\/\//);
  });
});
```

### 2-7. Rick & Morty Filter Endpoints

```javascript
// Use same structure as "Get Characters (Default)"
// Add filter-specific tests:

// Test: Filtered results match criteria
pm.test("Filtered results match criteria", function () {
  var jsonData = pm.response.json();
  // For name filter:
  // jsonData.results.forEach(function(character) {
  //     pm.expect(character.name.toLowerCase()).to.include('rick');
  // });

  // For status filter:
  // jsonData.results.forEach(function(character) {
  //     pm.expect(character.status.toLowerCase()).to.equal('alive');
  // });

  // For species filter:
  // jsonData.results.forEach(function(character) {
  //     pm.expect(character.species.toLowerCase()).to.equal('human');
  // });

  // For gender filter:
  // jsonData.results.forEach(function(character) {
  //     pm.expect(character.gender.toLowerCase()).to.equal('male');
  // });
});
```

---

## REST Countries API Test Scripts

### 1. Get All Countries

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test: Response is an array
pm.test("Response is an array", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.be.an("array");
});

// Test: Array contains 250+ countries
pm.test("Returns 250+ countries", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.length).to.be.above(250);
});

// Test: Countries have required fields
pm.test("Countries have required fields", function () {
  var jsonData = pm.response.json();
  jsonData.forEach(function (country) {
    pm.expect(country).to.have.property("name");
    pm.expect(country.name).to.have.property("common");
    pm.expect(country.name).to.have.property("official");
    pm.expect(country).to.have.property("cca2");
    pm.expect(country).to.have.property("cca3");
    pm.expect(country).to.have.property("region");
    pm.expect(country).to.have.property("flags");
  });
});

// Test: Flags have PNG and SVG
pm.test("Flags have PNG and SVG URLs", function () {
  var jsonData = pm.response.json();
  var firstCountry = jsonData[0];
  pm.expect(firstCountry.flags).to.have.property("png");
  pm.expect(firstCountry.flags).to.have.property("svg");
});

// Test: Response time is acceptable
pm.test("Response time is less than 3000ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(3000);
});
```

### 2. Get Country by Name

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test: Response is an array
pm.test("Response is an array", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.be.an("array");
});

// Test: Country has required fields
pm.test("Country has required fields", function () {
  var jsonData = pm.response.json();
  var country = jsonData[0];
  pm.expect(country).to.have.property("name");
  pm.expect(country).to.have.property("capital");
  pm.expect(country).to.have.property("population");
  pm.expect(country).to.have.property("region");
});

// Test: Response time is acceptable
pm.test("Response time is less than 1000ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(1000);
});
```

### 3. Get Country by Code

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test: Response is an array
pm.test("Response is an array", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.be.an("array");
});

// Test: Country code matches request
pm.test("Country code matches request", function () {
  var jsonData = pm.response.json();
  var country = jsonData[0];
  // Check both alpha-2 and alpha-3
  pm.expect([
    country.cca2.toLowerCase(),
    country.cca3.toLowerCase(),
  ]).to.include("nl");
});
```

### 4. Filter by Region

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test: Response is an array
pm.test("Response is an array", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.be.an("array");
});

// Test: All countries are from requested region
pm.test("All countries are from requested region", function () {
  var jsonData = pm.response.json();
  jsonData.forEach(function (country) {
    pm.expect(country.region.toLowerCase()).to.equal("europe");
  });
});

// Test: Response time is acceptable
pm.test("Response time is less than 2000ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

---

## WeatherAPI.com Test Scripts

### Pre-Request Script (Add to Collection Level)

```javascript
// Check if API key is configured
var apiKey = pm.environment.get("WEATHERAPI_KEY");
if (!apiKey || apiKey === "YOUR_WEATHERAPI_KEY_HERE") {
  throw new Error(
    "❌ WeatherAPI key not configured. Please update WEATHERAPI_KEY in environment.",
  );
}
```

### 1. Get Current Weather by City

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test: Response has location and current
pm.test("Response has location and current", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("location");
  pm.expect(jsonData).to.have.property("current");
});

// Test: Location has required fields
pm.test("Location has required fields", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.location).to.have.property("name");
  pm.expect(jsonData.location).to.have.property("country");
  pm.expect(jsonData.location).to.have.property("lat");
  pm.expect(jsonData.location).to.have.property("lon");
  pm.expect(jsonData.location).to.have.property("localtime");
});

// Test: Current has weather data
pm.test("Current has weather data", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.current).to.have.property("temp_c");
  pm.expect(jsonData.current).to.have.property("condition");
  pm.expect(jsonData.current).to.have.property("humidity");
  pm.expect(jsonData.current).to.have.property("wind_kph");
});

// Test: Condition has text and icon
pm.test("Condition has text and icon", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.current.condition).to.have.property("text");
  pm.expect(jsonData.current.condition).to.have.property("icon");
  pm.expect(jsonData.current.condition).to.have.property("code");
});

// Test: Temperature is a number
pm.test("Temperature is a number", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.current.temp_c).to.be.a("number");
});

// Test: Response time is acceptable
pm.test("Response time is less than 1000ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(1000);
});
```

### 2-3. Get Current Weather by Coords/IP

```javascript
// Use same tests as "Get Current Weather by City"
```

### 4. Location Search

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test: Response is an array
pm.test("Response is an array", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.be.an("array");
});

// Test: Locations have required fields
pm.test("Locations have required fields", function () {
  var jsonData = pm.response.json();
  if (jsonData.length > 0) {
    jsonData.forEach(function (location) {
      pm.expect(location).to.have.property("id");
      pm.expect(location).to.have.property("name");
      pm.expect(location).to.have.property("region");
      pm.expect(location).to.have.property("country");
      pm.expect(location).to.have.property("lat");
      pm.expect(location).to.have.property("lon");
    });
  }
});
```

### 5. Get Forecast

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test: Response has location, current, and forecast
pm.test("Response has location, current, and forecast", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("location");
  pm.expect(jsonData).to.have.property("current");
  pm.expect(jsonData).to.have.property("forecast");
});

// Test: Forecast has forecastday array
pm.test("Forecast has forecastday array", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.forecast).to.have.property("forecastday");
  pm.expect(jsonData.forecast.forecastday).to.be.an("array");
});

// Test: Each forecast day has required fields
pm.test("Each forecast day has required fields", function () {
  var jsonData = pm.response.json();
  jsonData.forecast.forecastday.forEach(function (day) {
    pm.expect(day).to.have.property("date");
    pm.expect(day).to.have.property("day");
    pm.expect(day.day).to.have.property("maxtemp_c");
    pm.expect(day.day).to.have.property("mintemp_c");
    pm.expect(day.day).to.have.property("condition");
  });
});
```

### 6. Get Historical Weather

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

// Test: Response has location and forecast (historical uses forecast structure)
pm.test("Response has location and forecast", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("location");
  pm.expect(jsonData).to.have.property("forecast");
});

// Test: Historical data has correct date
pm.test("Historical data has correct date", function () {
  var jsonData = pm.response.json();
  var requestedDate = pm.environment.get("HISTORICAL_DATE");
  var forecastDay = jsonData.forecast.forecastday[0];
  pm.expect(forecastDay.date).to.equal(requestedDate);
});
```

---

## Error Handling Test Scripts

### For 404 Errors (Add to relevant endpoints)

```javascript
// Test: Invalid ID returns 404
pm.test("Invalid ID returns 404 (if testing invalid ID)", function () {
  if (pm.environment.get("test_invalid_id")) {
    pm.response.to.have.status(404);
  }
});
```

### For WeatherAPI Error Codes

```javascript
// Test: Error response has proper structure
pm.test("Error response has error object", function () {
  if (pm.response.code !== 200) {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("error");
    pm.expect(jsonData.error).to.have.property("code");
    pm.expect(jsonData.error).to.have.property("message");
  }
});
```

---

## Collection-Level Pre-Request Script

Add this to the collection level (Collection → Edit → Pre-request Scripts):

```javascript
// Log request details for debugging
console.log("========================================");
console.log("Request: " + pm.request.method + " " + pm.request.url.toString());
console.log("Environment: " + pm.environment.name);
console.log("========================================");

// Check critical environment variables
var criticalVars = [
  "jsonplaceholder_url",
  "rickmorty_url",
  "restcountries_url",
  "WEATHERAPI_URL",
];

criticalVars.forEach(function (varName) {
  var value = pm.environment.get(varName);
  if (!value) {
    console.warn(
      "⚠️ Warning: Environment variable '" + varName + "' is not set.",
    );
  }
});
```

---

## Running All Tests

### Option 1: Collection Runner

1. Click "Runner" button in Postman
2. Select "API Explorer Dashboard" collection
3. Select "API Explorer Environment"
4. Click "Run API Explorer Dashboard"
5. View results summary

### Option 2: Newman (CLI)

```bash
newman run API-Explorer.postman_collection.json \
  -e API-Explorer.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

---

## Expected Pass Rates

| API             | Expected Pass Rate               |
| --------------- | -------------------------------- |
| JSONPlaceholder | 100% (7/7)                       |
| Rick & Morty    | 100% (7/7)                       |
| REST Countries  | 100% (4/4)                       |
| WeatherAPI      | 100% (6/6) - once key configured |

**Overall Expected**: 100% (24/24 endpoints)

---

**Document Version**: 1.0  
**Last Updated**: February 2, 2026
