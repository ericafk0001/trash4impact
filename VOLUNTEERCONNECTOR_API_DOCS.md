# VolunteerConnector API Integration

Your app now uses the **VolunteerConnector API** to show real volunteer opportunities!

## ✅ API Integration Complete

The app has been successfully integrated with VolunteerConnector API - **no API key required!**

## 🚀 Key Features

### Core Function: `fetchVolunteerOpportunities(zip, keyword, radius)`

**Parameters:**
- `zip` (required) - ZIP code to search in
- `keyword` (optional) - Search keyword, defaults to "cleanup"
- `radius` (optional) - Search radius in miles

**Returns:** Array of simplified opportunity objects:
```javascript
{
  id: "unique-id",
  title: "Opportunity Title",
  description: "Truncated to 150 characters...",
  location: "City, State",
  url: "https://..."
}
```

### Usage Examples

```javascript
// Basic usage with ZIP code
const opportunities = await fetchVolunteerOpportunities('19107');

// Custom keyword search
const parkOpps = await fetchVolunteerOpportunities('19107', 'park cleanup');

// With radius parameter (10 miles)
const nearbyOpps = await fetchVolunteerOpportunities('19107', 'environmental', 10);
```

### Helper Function: `fetchOpportunitiesByLocation(lat, lon, keyword, radius)`

Automatically converts coordinates to ZIP code, then fetches opportunities:

```javascript
// Using coordinates (what the app uses)
const opps = await fetchOpportunitiesByLocation(39.9526, -75.1652, 'cleanup volunteer', 10);
```

## 🎨 What Changed

1. **Removed VolunteerMatch API** - No longer needs API key
2. **Added VolunteerConnector API** - Free, no authentication required
3. **Reverse Geocoding** - Converts lat/lon to ZIP automatically using OpenStreetMap
4. **Simplified Data** - Clean object structure with id, title, description, location, url
5. **Error Handling** - Returns empty array on errors, never crashes
6. **Description Truncation** - Automatically limits to 150 characters

## 📋 API Endpoint

```
https://www.volunteerconnector.org/api/search/?q={keyword}&zip={zip}&radius={radius}
```

## 🛠️ Implementation Details

### Reverse Geocoding
- Uses Nominatim (OpenStreetMap) for free geocoding
- Converts coordinates to ZIP code automatically
- Falls back to Philadelphia ZIP (19107) if geocoding fails

### Error Handling
- Network errors caught with try/catch
- Returns empty array on failure
- Logs errors to console for debugging
- Never throws unhandled errors

### Data Transformation
- API response mapped to simplified format
- Descriptions truncated to 150 chars max
- Location built from city + state when available
- Generates unique IDs if not provided by API

## 🔧 Customization

Edit these values in [app.js](app.js):

**Default keyword in showLocationOverlay:**
```javascript
const opportunities = await fetchOpportunitiesByLocation(
  location.lat, 
  location.lon, 
  'cleanup volunteer environmental', // <- Change keywords here
  10 // <- Change radius here
);
```

**Fallback ZIP code:**
```javascript
const zip = data.address?.postcode || '19107'; // <- Change fallback ZIP
```

**Number of displayed opportunities:**
```javascript
${opportunities.slice(0, 3).map(opp => ... // <- Change 3 to show more/fewer
```

## 📱 How It Works

1. User clicks location pin on map
2. App gets lat/lon coordinates
3. Reverse geocoding converts to ZIP code
4. Fetches opportunities from VolunteerConnector API
5. Displays up to 3 opportunities in modal overlay
6. Each card shows title, description, and location
7. Click card to open opportunity details in new tab

## ✅ No Setup Required!

Unlike VolunteerMatch, VolunteerConnector requires:
- ❌ No API key
- ❌ No registration
- ❌ No rate limits (reasonable usage)
- ✅ Just works out of the box!

---

**Previous Version:** This file originally documented VolunteerMatch API setup, which required API key registration. The app has been migrated to VolunteerConnector for a simpler, no-auth-required experience.
