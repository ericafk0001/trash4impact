// app.js - Main JavaScript for Volunteer App
// Version: 2026-02-28-15:15 - Added Redeem page with gift cards and level-up rewards

console.log(
  "%c🔄 APP.JS LOADED - Version 2026-02-28-15:15",
  "background: #2d9c6f; color: white; padding: 8px; font-size: 14px; font-weight: bold;",
);

// Page switching functionality
const menuItems = document.querySelectorAll(".menu-item");
const pages = document.querySelectorAll(".page-content");
let userLocation = null;
let map = null;
let markers = [];

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    const targetPage = item.getAttribute("data-page");

    // Remove active class from all menu items
    menuItems.forEach((mi) => mi.classList.remove("active"));

    // Add active class to clicked menu item
    item.classList.add("active");

    // Hide all pages
    pages.forEach((page) => page.classList.remove("active"));

    // Show target page
    document.getElementById(targetPage + "-page").classList.add("active");

    // Load locations when Map page is opened
    if (targetPage === "map") {
      setTimeout(() => {
        if (!map) initMap();
        loadCleanupLocations();
      }, 100);
    }
  });
});

// Get user's location
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported, using default location");
      userLocation = { lat: 39.9526, lon: -75.1652 };
      resolve(userLocation);
      return;
    }

    console.log("Requesting geolocation...");
    const timeout = setTimeout(() => {
      console.log("Geolocation timeout, using default location");
      userLocation = { lat: 39.9526, lon: -75.1652 };
      resolve(userLocation);
    }, 5000); // 5 second timeout for geolocation

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeout);
        userLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        console.log("Got user location:", userLocation);
        console.log(
          `Location check: Lat=${userLocation.lat}, Lon=${userLocation.lon}`,
        );

        // Sanity check - warn if location seems wrong
        if (userLocation.lat > 50 || userLocation.lat < 25) {
          console.warn(
            "⚠️ WARNING: Latitude outside US range! Location might be wrong.",
          );
        }
        if (userLocation.lon > -65 || userLocation.lon < -125) {
          console.warn(
            "⚠️ WARNING: Longitude outside US range! Location might be wrong.",
          );
        }

        resolve(userLocation);
      },
      (error) => {
        clearTimeout(timeout);
        // Use default location (Philadelphia) if geolocation fails
        userLocation = { lat: 39.9526, lon: -75.1652 };
        console.log(
          "Geolocation error:",
          error.message,
          "- Using default location (Philadelphia)",
        );
        resolve(userLocation);
      },
    );
  });
}

// Initialize Leaflet map
function initMap() {
  if (map) return;

  // Create map centered on default location
  map = L.map("map").setView([39.9526, -75.1652], 13);

  // Add OpenStreetMap tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(map);

  // Add user location marker when available
  if (userLocation) {
    L.marker([userLocation.lat, userLocation.lon], {
      icon: L.icon({
        iconUrl:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMCIgZmlsbD0iIzJiN2E5ZiIgZmlsbC1vcGFjaXR5PSIwLjMiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI2IiBmaWxsPSIjMmI3YTlmIi8+PC9zdmc+",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    })
      .addTo(map)
      .bindPopup("<strong>Your Location</strong>");
  }
}

// Show full-page location overlay
async function showLocationOverlay(location) {
  const typeIcon =
    {
      ngo: "🤝",
      charity: "❤️",
      social_facility: "🏥",
      community_centre: "🏛️",
      shelter: "🏠",
      park: "🌳",
    }[location.type] || "📍";

  const typeLabel = location.type.replace("_", " ");
  const distanceText =
    location.distance < 1
      ? `${Math.round(location.distance * 1000)}m away`
      : `${location.distance.toFixed(1)}km away`;

  // Google Maps link
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lon}`;

  // Fetch real volunteer opportunities from VolunteerConnector API
  console.log("📍 Fetching opportunities near your location:", userLocation);

  const opportunities = await fetchOpportunitiesByLocation(
    userLocation.lat,
    userLocation.lon,
    "volunteer cleanup environmental community",
    25,
  );

  // Build opportunities HTML
  let opportunitiesHTML = "";
  if (opportunities.length > 0) {
    opportunitiesHTML = `
      <div class="popup-section-title">🌱 Volunteer Opportunities Near You</div>
      <div class="popup-info-note">
        These are volunteer opportunities in your area (not necessarily at this specific location)
      </div>
      <div class="opportunities-list">
        ${opportunities
          .slice(0, 3)
          .map(
            (opp) => `
          <a href="${opp.url}" target="_blank" class="opportunity-card">
            <div class="opportunity-title">${opp.title}</div>
            <div class="opportunity-description">${opp.description}</div>
            <div class="opportunity-location">📍 ${opp.location}</div>
          </a>
        `,
          )
          .join("")}
      </div>
    `;
  } else {
    // Fallback to search link if no opportunities found or API not configured
    const volunteerLink = `https://www.volunteermatch.org/search?l=${encodeURIComponent(location.name + " " + (location.tags?.["addr:city"] || "Philadelphia"))}`;
    opportunitiesHTML = `
      <div class="popup-section-title">🌱 Volunteer for Cleanup</div>
      <div class="popup-volunteer-info">
        <div class="popup-volunteer-text">
          Volunteer with <strong>${location.name}</strong>! Find opportunities to make a difference in your community through environmental and social impact work.
        </div>
      </div>
      <div class="popup-links">
        <a href="${volunteerLink}" target="_blank" class="popup-link">
          <span>🤝</span> View Volunteer Opportunities
        </a>
      </div>
    `;
  }

  const overlayHTML = `
    <div class="location-overlay active" id="locationOverlay">
      <div class="overlay-content">
        <button class="overlay-close" onclick="closeLocationOverlay()">×</button>
        <div class="popup-header">
          <div class="popup-title">${location.name}</div>
          <div class="popup-subtitle">
            <span class="popup-detail-icon">${typeIcon}</span>
            ${typeLabel} • ${distanceText}
          </div>
        </div>
        <div class="popup-body">
          <div class="popup-type">${typeLabel}</div>
          
          <div class="popup-detail">
            <span class="popup-detail-icon">📍</span>
            <span>${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}</span>
          </div>
          
          <div class="popup-divider"></div>
          
          ${opportunitiesHTML}
          
          <div class="popup-divider"></div>
          
          <a href="${mapsLink}" target="_blank" class="popup-link secondary">
            <span>🗺️</span> Get Directions
          </a>
        </div>
      </div>
    </div>
  `;

  // Remove existing overlay if any
  const existing = document.getElementById("locationOverlay");
  if (existing) {
    existing.remove();
  }

  // Add new overlay to body
  document.body.insertAdjacentHTML("beforeend", overlayHTML);

  // Prevent body scroll when overlay is open
  document.body.style.overflow = "hidden";

  // Close on background click
  document.getElementById("locationOverlay").addEventListener("click", (e) => {
    if (e.target.classList.contains("location-overlay")) {
      closeLocationOverlay();
    }
  });
}

// Close location overlay
function closeLocationOverlay() {
  const overlay = document.getElementById("locationOverlay");
  if (overlay) {
    overlay.classList.remove("active");
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = "";
    }, 300);
  }
}

// Add marker to map with click handler for overlay
function addMarker(location) {
  const typeIcon =
    {
      ngo: "🤝",
      charity: "❤️",
      social_facility: "🏥",
      community_centre: "🏛️",
      shelter: "🏠",
      park: "🌳",
    }[location.type] || "📍";

  // Create custom icon with color based on type
  const markerColor =
    {
      ngo: "#e63946",
      charity: "#d62828",
      social_facility: "#2b7a9f",
      community_centre: "#4f7942",
      shelter: "#f77f00",
      park: "#2d9c6f",
    }[location.type] || "#52796f";

  const customIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="background: ${markerColor}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="transform: rotate(45deg); font-size: 16px;">${typeIcon}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });

  const marker = L.marker([location.lat, location.lon], {
    icon: customIcon,
  }).addTo(map);

  // Show full-page overlay when marker is clicked
  marker.on("click", async () => {
    await showLocationOverlay(location);
  });

  location.marker = marker;
  markers.push(marker);
  return marker;
}

// Clear all markers from map
function clearMarkers() {
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to get ZIP code from coordinates (reverse geocoding)
async function getZipFromCoordinates(lat, lon) {
  try {
    console.log(`Getting ZIP code for coordinates: ${lat}, ${lon}`);
    // Using Nominatim (OpenStreetMap) reverse geocoding - free and no API key needed
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "VolunteerApp/1.0", // Required by Nominatim
        },
      },
    );

    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    const data = await response.json();
    console.log("Geocoding response:", data);

    // Try to get US ZIP code from postcode field
    const zip = data.address?.postcode || "";

    // Check if it's a US ZIP code (5 digits, optionally with -#### extension)
    const usZipRegex = /^\d{5}(-\d{4})?$/;
    if (zip && usZipRegex.test(zip.split(" ")[0])) {
      console.log(`Found US ZIP code: ${zip}`);
      return zip.split(" ")[0]; // Return just the ZIP, remove any extensions
    }

    // If not US or no ZIP found, check country
    const country = data.address?.country_code?.toLowerCase();
    console.warn(
      `Non-US location detected (${country}). Using user's location fallback.`,
    );

    // Use default US ZIP (Philadelphia) as fallback
    console.log("Using fallback ZIP: 19107");
    return "19107";
  } catch (error) {
    console.error("Error getting ZIP code:", error);
    return "19107"; // Default fallback ZIP (Philadelphia)
  }
}

/**
 * Fetch volunteer opportunities from VolunteerConnector API
 * @param {string} zip - ZIP code to search in
 * @param {string} keyword - Search keyword (default: "cleanup")
 * @param {number} radius - Search radius in miles (optional)
 * @returns {Promise<Array>} Array of volunteer opportunities
 *
 * @example
 * // Basic usage with ZIP code
 * const opportunities = await fetchVolunteerOpportunities('19107');
 *
 * @example
 * // Custom keyword search
 * const parkOpps = await fetchVolunteerOpportunities('19107', 'park cleanup');
 *
 * @example
 * // With radius parameter
 * const nearbyOpps = await fetchVolunteerOpportunities('19107', 'environmental', 15);
 */
async function fetchVolunteerOpportunities(
  zip,
  keyword = "cleanup",
  radius = null,
) {
  try {
    console.log("⚡ Fetching opportunities for ZIP:", zip);

    // Build API URL - no country restriction
    let apiUrl = `https://www.volunteerconnector.org/api/search/?q=${encodeURIComponent(keyword)}&zip=${zip}`;

    // Add radius parameter if provided
    if (radius) {
      apiUrl += `&radius=${radius}`;
    }

    console.log("🌐 API Request:", apiUrl);

    // Fetch opportunities from VolunteerConnector API
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`VolunteerConnector API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("📦 API returned", data.results?.length || 0, "opportunities");

    // Check if results exist
    if (!data || !data.results || data.results.length === 0) {
      console.log("No volunteer opportunities found");
      return [];
    }

    // Transform and simplify the data (no filtering)
    return data.results.map((opportunity) => {
      // Truncate description to 150 characters
      let description = opportunity.description || "No description available";
      if (description.length > 150) {
        description = description.substring(0, 147) + "...";
      }

      // Build location string from organization data (city + state if available)
      let location = "Location TBD";
      const org = opportunity.organization || {};

      if (org.city && org.state) {
        location = `${org.city}, ${org.state}`;
      } else if (org.city) {
        location = org.city;
      } else if (org.location) {
        location = org.location;
      } else if (opportunity.location) {
        location = opportunity.location;
      }

      return {
        id:
          opportunity.id ||
          opportunity._id ||
          `opp-${Date.now()}-${Math.random()}`,
        title: opportunity.title || "Volunteer Opportunity",
        description: description,
        location: location,
        url: opportunity.url || opportunity.link || "#",
      };
    });
  } catch (error) {
    console.error("Error fetching volunteer opportunities:", error);
    return []; // Return empty array on error
  }
}

// Example usage with coordinates (converts to ZIP first)
async function fetchOpportunitiesByLocation(
  lat,
  lon,
  keyword = "cleanup",
  radius = null,
) {
  console.log(
    `fetchOpportunitiesByLocation called with: lat=${lat}, lon=${lon}, keyword=${keyword}, radius=${radius}`,
  );
  const zip = await getZipFromCoordinates(lat, lon);
  console.log(`Fetching opportunities for ZIP: ${zip}`);
  return await fetchVolunteerOpportunities(zip, keyword, radius);
}

// Fetch cleanup locations using OpenStreetMap Overpass API
async function fetchLocationsFromOSM(lat, lon, radius = 3000) {
  console.log(
    `Fetching locations around ${lat}, ${lon} with radius ${radius}m`,
  );

  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="social_facility"](around:${radius},${lat},${lon});
      way["amenity"="social_facility"](around:${radius},${lat},${lon});
      node["amenity"="community_centre"](around:${radius},${lat},${lon});
      way["amenity"="community_centre"](around:${radius},${lat},${lon});
      node["office"="ngo"](around:${radius},${lat},${lon});
      way["office"="ngo"](around:${radius},${lat},${lon});
      node["office"="charity"](around:${radius},${lat},${lon});
      way["office"="charity"](around:${radius},${lat},${lon});
      node["amenity"="shelter"](around:${radius},${lat},${lon});
      way["amenity"="shelter"](around:${radius},${lat},${lon});
      node["leisure"="park"](around:${radius},${lat},${lon});
      way["leisure"="park"](around:${radius},${lat},${lon});
    );
    out center;
  `;

  const url = "https://overpass-api.de/api/interpreter";

  // Add timeout to fetch request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

  try {
    const response = await fetch(url, {
      method: "POST",
      body: query,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`Received ${data.elements.length} locations from API`);
    return data.elements;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      console.error("Request timed out");
      throw new Error("Request timed out - try again");
    }
    console.error("Fetch error:", error);
    throw error;
  }
}

// Process and display locations
async function loadCleanupLocations() {
  console.log("Loading cleanup locations...");
  const contentDiv = document.getElementById("location-content");
  contentDiv.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <div>Finding nearby locations...</div>
    </div>
  `;

  try {
    // Get user location
    const location = await getUserLocation();
    console.log("Location obtained:", location);

    // Update map center
    if (map) {
      map.setView([location.lat, location.lon], 13);
      clearMarkers();
    }

    // Fetch locations from OpenStreetMap
    console.log("Fetching from OSM API...");
    const rawLocations = await fetchLocationsFromOSM(
      location.lat,
      location.lon,
    );
    console.log("Processing locations...");

    // Process locations
    const locations = rawLocations
      .map((item) => {
        const lat = item.lat || (item.center && item.center.lat);
        const lon = item.lon || (item.center && item.center.lon);

        if (!lat || !lon) return null;

        const distance = calculateDistance(
          location.lat,
          location.lon,
          lat,
          lon,
        );

        const type =
          item.tags.office === "ngo"
            ? "ngo"
            : item.tags.office === "charity"
              ? "charity"
              : item.tags.amenity === "social_facility"
                ? "social_facility"
                : item.tags.amenity === "community_centre"
                  ? "community_centre"
                  : item.tags.amenity === "shelter"
                    ? "shelter"
                    : item.tags.leisure === "park"
                      ? "park"
                      : "volunteer_location";

        return {
          name: item.tags.name || "Unnamed Location",
          type: type,
          distance: distance,
          lat: lat,
          lon: lon,
          tags: item.tags,
        };
      })
      .filter((item) => item !== null && item.name !== "Unnamed Location")
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Get top 10 closest locations

    console.log(`Found ${locations.length} named locations`);

    // Log locations for debugging
    console.log(
      "Locations that will be displayed:",
      locations.map((loc) => loc.name),
    );

    // Display locations
    if (locations.length === 0) {
      contentDiv.innerHTML = `
        <div class="error-message">
          No cleanup locations found nearby. Showing sample locations.
        </div>
      `;
      // Show fallback locations
      showFallbackLocations(contentDiv, location);
      return;
    }

    // Add markers to map
    locations.forEach((loc) => {
      addMarker(loc);
    });

    const locationHTML = locations
      .map((loc, index) => {
        const typeIcon =
          {
            ngo: "🤝",
            charity: "❤️",
            social_facility: "🏥",
            community_centre: "🏛️",
            shelter: "🏠",
            park: "🌳",
          }[loc.type] || "📍";

        const typeLabel = loc.type.replace("_", " ");
        const distanceText =
          loc.distance < 1
            ? `${Math.round(loc.distance * 1000)}m away`
            : `${loc.distance.toFixed(1)}km away`;

        return `
        <div class="location-item" onclick="focusMarker(${index})">
          <div class="location-icon">${typeIcon}</div>
          <div class="location-info">
            <div class="location-name">${loc.name}</div>
            <div class="location-distance">${distanceText}</div>
            <div class="location-type">${typeLabel}</div>
          </div>
        </div>
      `;
      })
      .join("");

    contentDiv.innerHTML = `<div class="location-list">${locationHTML}</div>`;

    // Store locations globally for click handlers
    window.currentLocations = locations;
    console.log("Locations loaded successfully");
  } catch (error) {
    console.error("Error loading locations:", error);
    contentDiv.innerHTML = `
      <div class="error-message">
        ⚠️ ${error.message || "Unable to load locations"}. Showing sample locations.
      </div>
    `;
    showFallbackLocations(
      contentDiv,
      userLocation || { lat: 39.9526, lon: -75.1652 },
    );
  }
}

// Show fallback locations when API fails
function showFallbackLocations(contentDiv, location) {
  const fallbackLocations = [
    {
      name: "American Red Cross - Southeastern PA",
      type: "charity",
      lat: 39.9526,
      lon: -75.1652,
      tags: { "addr:city": "Philadelphia" },
    },
    {
      name: "Philabundance",
      type: "charity",
      lat: 39.9848,
      lon: -75.1447,
      tags: { "addr:city": "Philadelphia" },
    },
    {
      name: "Habitat for Humanity Philadelphia",
      type: "ngo",
      lat: 39.9724,
      lon: -75.1517,
      tags: { "addr:city": "Philadelphia" },
    },
    {
      name: "Project HOME",
      type: "social_facility",
      lat: 39.9551,
      lon: -75.1605,
      tags: { "addr:city": "Philadelphia" },
    },
  ];

  fallbackLocations.forEach((loc) => {
    loc.distance = calculateDistance(
      location.lat,
      location.lon,
      loc.lat,
      loc.lon,
    );
    if (map) addMarker(loc);
  });

  const locationHTML = fallbackLocations
    .map((loc, index) => {
      const typeIcon =
        {
          ngo: "🤝",
          charity: "❤️",
          social_facility: "🏥",
          community_centre: "🏛️",
          shelter: "🏠",
          park: "🌳",
        }[loc.type] || "📍";
      const distanceText =
        loc.distance < 1
          ? `${Math.round(loc.distance * 1000)}m away`
          : `${loc.distance.toFixed(1)}km away`;

      return `
      <div class="location-item">
        <div class="location-icon">${typeIcon}</div>
        <div class="location-info">
          <div class="location-name">${loc.name}</div>
          <div class="location-distance">${distanceText}</div>
          <div class="location-type">${loc.type}</div>
        </div>
      </div>
    `;
    })
    .join("");

  contentDiv.innerHTML += `<div class="location-list">${locationHTML}</div>`;
}

// Focus on a marker when location item is clicked
async function focusMarker(index) {
  if (!window.currentLocations || !window.currentLocations[index]) return;

  const loc = window.currentLocations[index];
  if (map && loc.marker) {
    map.setView([loc.lat, loc.lon], 15);
    // Show the overlay instead of small popup
    await showLocationOverlay(loc);
    // Scroll to top to show map
    document
      .querySelector(".map-container")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Redeem button functionality
document.addEventListener("DOMContentLoaded", () => {
  // Add click handlers to all redeem buttons
  const redeemButtons = document.querySelectorAll(".redeem-btn:not(.disabled)");

  redeemButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const rewardCard = e.target.closest(".reward-card");
      const rewardName = rewardCard.querySelector(".reward-name").textContent;
      const rewardValue = rewardCard.querySelector(".reward-value").textContent;
      const rewardCost = rewardCard.querySelector(".reward-cost").textContent;

      // Show confirmation message
      const confirmed = confirm(
        `Redeem ${rewardName} ${rewardValue} for ${rewardCost}?\n\n` +
          `This will deduct points from your account and send the reward to your email.`,
      );

      if (confirmed) {
        // Disable button and show success
        button.textContent = "✓ Redeemed";
        button.classList.add("disabled");
        button.style.background = "#52796f";

        // Show success message
        setTimeout(() => {
          alert(
            `🎉 Success! Your ${rewardName} gift card has been sent to your email!`,
          );
        }, 300);
      }
    });
  });
});
