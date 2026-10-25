const DEMO_CENTER = { lat: 39.9576, lon: -75.1548 };
const STORAGE_KEY = "trash4impact-demo-state";
const DEFAULT_STATE = {
  points: 2847,
  cleanups: 127,
  signedUp: [],
  slots: { pcdc: 4, facts: 6, crane: 8 },
};

const PHILLY_DEMO_LOCATIONS = [
  {
    id: "facts",
    name: "FACTS Community Cleanup",
    type: "school",
    lat: 39.9590125,
    lon: -75.15603,
    address: "1023 Callowhill St, Philadelphia, PA 19123",
    description: "Help refresh the school garden and prep activity spaces for students.",
    event: "Saturday, 9:00 AM",
    points: 250,
    slotsKey: "facts",
  },
  {
    id: "pcdc",
    name: "PCDC Chinatown Cleanup",
    type: "ngo",
    lat: 39.957634,
    lon: -75.153671,
    address: "301-305 N 9th St, Philadelphia, PA 19107",
    description: "Join neighbors for a two-hour cleanup around Chinatown and the Night Market corridor.",
    event: "Saturday, 9:00 AM",
    points: 300,
    slotsKey: "pcdc",
  },
  {
    id: "crane",
    name: "Crane Community Center",
    type: "recreation",
    lat: 39.9575179,
    lon: -75.1557648,
    address: "1001 Vine St, Philadelphia, PA 19107",
    description: "Support a community garden and help set up supplies for youth programming.",
    event: "Sunday, 10:30 AM",
    points: 200,
    slotsKey: "crane",
  },
];

const DEMO_EVENTS = [
  { id: "pcdc", icon: "🤝", title: "PCDC Chinatown Cleanup", type: "park", date: "Sat, Mar 7 · 9:00 AM", place: "301 N 9th St", points: 300 },
  { id: "facts", icon: "🏫", title: "FACTS School Garden Day", type: "community", date: "Sat, Mar 7 · 9:00 AM", place: "1023 Callowhill St", points: 250 },
  { id: "crane", icon: "🌳", title: "Crane Center Green Team", type: "park", date: "Sun, Mar 8 · 10:30 AM", place: "1001 Vine St", points: 200 },
];

let state = loadState();
let map = null;
let markers = [];
let currentLocations = [];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...DEFAULT_STATE, ...saved, slots: { ...DEFAULT_STATE.slots, ...saved.slots } } : { ...DEFAULT_STATE, slots: { ...DEFAULT_STATE.slots } };
  } catch (error) {
    console.warn("Unable to load demo state; starting fresh.", error);
    return { ...DEFAULT_STATE, slots: { ...DEFAULT_STATE.slots } };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateUserStats();
}

function updateUserStats() {
  document.querySelectorAll("[data-points]").forEach((element) => {
    element.textContent = `${state.points.toLocaleString()} pts`;
  });
  document.querySelectorAll("[data-cleanups]").forEach((element) => {
    element.textContent = state.cleanups;
  });
  const pointsValue = document.querySelector(".points-value");
  if (pointsValue) pointsValue.textContent = state.points.toLocaleString();
}

function showToast(message, tone = "success") {
  const existing = document.querySelector(".app-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = `app-toast ${tone}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `<span>${tone === "success" ? "✓" : "🔔"}</span><span>${message}</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  }, 4200);
}

function switchPage(pageName) {
  document.querySelectorAll(".menu-item").forEach((item) => item.classList.toggle("active", item.dataset.page === pageName));
  document.querySelectorAll(".page-content").forEach((page) => page.classList.toggle("active", page.id === `${pageName}-page`));
  if (pageName === "map") {
    setTimeout(() => {
      if (!map) initMap();
      loadCleanupLocations();
    }, 100);
  }
  if (pageName === "events") renderEvents();
}

function initMap() {
  if (map) return;
  map = L.map("map").setView([DEMO_CENTER.lat, DEMO_CENTER.lon], 16);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(map);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function addMarker(location) {
  const icon = location.type === "ngo" ? "🤝" : location.type === "school" ? "🏫" : "🏀";
  const marker = L.marker([location.lat, location.lon], {
    icon: L.divIcon({
      className: "custom-marker",
      html: `<div class="map-pin" aria-label="${location.name}">${icon}</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
    }),
  }).addTo(map);
  marker.on("click", () => showLocationOverlay(location));
  markers.push(marker);
}

function clearMarkers() {
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];
}

function loadCleanupLocations() {
  const content = document.getElementById("location-content");
  if (!content) return;
  clearMarkers();
  currentLocations = PHILLY_DEMO_LOCATIONS.map((location) => ({
    ...location,
    distance: calculateDistance(DEMO_CENTER.lat, DEMO_CENTER.lon, location.lat, location.lon),
  })).sort((a, b) => a.distance - b.distance);
  currentLocations.forEach(addMarker);
  content.innerHTML = `<div class="location-list">${currentLocations.map((location, index) => `
    <button class="location-item" onclick="focusMarker(${index})">
      <span class="location-icon">${location.type === "ngo" ? "🤝" : location.type === "school" ? "🏫" : "🏀"}</span>
      <span class="location-info"><strong class="location-name">${location.name}</strong>
      <span class="location-distance">${Math.round(location.distance * 1000)}m away · ${location.address}</span>
      <span class="location-type">${state.slots[location.slotsKey]} slots left · ${location.event}</span></span>
      <span class="location-arrow">→</span>
    </button>`).join("")}</div>`;
  const updated = document.querySelector("[data-last-updated]");
  if (updated) updated.textContent = "Updated 2h ago";
}

function focusMarker(index) {
  const location = currentLocations[index];
  if (!location) return;
  map.setView([location.lat, location.lon], 17);
  showLocationOverlay(location);
}

function showLocationOverlay(location) {
  const signedUp = state.signedUp.includes(location.id);
  const overlay = document.createElement("div");
  overlay.className = "location-overlay active";
  overlay.id = "locationOverlay";
  overlay.innerHTML = `<div class="overlay-content" role="dialog" aria-modal="true" aria-labelledby="opportunity-title">
    <button class="overlay-close" aria-label="Close opportunity details">×</button>
    <div class="popup-header"><div class="popup-title" id="opportunity-title">${location.name}</div>
    <div class="popup-subtitle">📍 ${location.event} · ${state.slots[location.slotsKey]} spots left</div></div>
    <div class="popup-body"><div class="popup-type">Philadelphia demo event</div>
    <div class="popup-detail"><span class="popup-detail-icon">📍</span><span>${location.address}</span></div>
    <div class="popup-divider"></div><div class="popup-section-title">🌱 What you'll do</div>
    <div class="popup-volunteer-info"><div class="popup-volunteer-text">${location.description}</div></div>
    <div class="popup-section-title">Reward: +${location.points} points</div>
    <div class="popup-links"><button class="popup-link signup-button ${signedUp ? "signed-up" : ""}" ${signedUp ? "disabled" : ""}>${signedUp ? "✓ You're signed up" : "🤝 Volunteer Here"}</button>
    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}" target="_blank" rel="noreferrer" class="popup-link secondary"><span>🗺️</span> Get Directions</a></div></div></div>`;
  document.getElementById("locationOverlay")?.remove();
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  overlay.querySelector(".overlay-close").addEventListener("click", closeLocationOverlay);
  overlay.addEventListener("click", (event) => { if (event.target === overlay) closeLocationOverlay(); });
  overlay.querySelector(".signup-button").addEventListener("click", () => signUpForEvent(location));
}

function closeLocationOverlay() {
  document.getElementById("locationOverlay")?.remove();
  document.body.style.overflow = "";
}

function signUpForEvent(location) {
  if (state.signedUp.includes(location.id) || state.slots[location.slotsKey] < 1) return;
  state.signedUp.push(location.id);
  state.slots[location.slotsKey] -= 1;
  state.points += location.points;
  state.cleanups += 1;
  saveState();
  closeLocationOverlay();
  showToast(`You're signed up for ${location.event}! +${location.points} points`);
  loadCleanupLocations();
  setTimeout(() => showToast(`Level progress updated — ${state.points.toLocaleString()} points`, "info"), 900);
}

function renderEvents(filter = "all") {
  const list = document.querySelector("#events-list");
  if (!list) return;
  const events = filter === "all" ? DEMO_EVENTS : DEMO_EVENTS.filter((event) => event.type === filter);
  list.innerHTML = events.map((event) => {
    const location = PHILLY_DEMO_LOCATIONS.find((item) => item.id === event.id);
    const signedUp = state.signedUp.includes(event.id);
    return `<article class="demo-event-card"><div class="demo-event-icon">${event.icon}</div><div class="demo-event-info"><span class="event-tag">${event.type}</span><h3>${event.title}</h3><p>${event.date} · ${event.place}</p><strong>+${event.points} pts · ${state.slots[event.id]} spots left</strong></div><button class="event-action ${signedUp ? "signed-up" : ""}" ${signedUp ? "disabled" : ""}>${signedUp ? "Joined" : "Join"}</button></article>`;
  }).join("");
  list.querySelectorAll(".event-action:not([disabled])").forEach((button, index) => {
    button.addEventListener("click", () => {
      const visibleEvents = filter === "all" ? DEMO_EVENTS : DEMO_EVENTS.filter((event) => event.type === filter);
      signUpForEvent(PHILLY_DEMO_LOCATIONS.find((location) => location.id === visibleEvents[index].id));
      renderEvents(filter);
    });
  });
}

function initDemoAlert() {
  if (sessionStorage.getItem("trash4impact-alert-shown")) return;
  setTimeout(() => {
    sessionStorage.setItem("trash4impact-alert-shown", "true");
    showToast("New events near you — 3 Philly cleanups this weekend", "info");
  }, 20000);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".menu-item").forEach((item) => item.addEventListener("click", () => switchPage(item.dataset.page)));
  document.querySelector(".refresh-btn")?.addEventListener("click", loadCleanupLocations);
  document.querySelectorAll(".event-filter").forEach((filter) => filter.addEventListener("click", () => {
    document.querySelectorAll(".event-filter").forEach((item) => item.classList.remove("active"));
    filter.classList.add("active");
    renderEvents(filter.dataset.filter);
  }));
  document.querySelectorAll(".redeem-btn:not(.disabled)").forEach((button) => button.addEventListener("click", () => {
    const card = button.closest(".reward-card");
    const cost = Number(card.querySelector(".reward-cost").textContent.replace(/[^0-9]/g, ""));
    const name = card.querySelector(".reward-name").textContent;
    if (state.points < cost) {
      showToast(`You need ${cost.toLocaleString()} points for ${name}.`, "info");
      return;
    }
    state.points -= cost;
    saveState();
    button.textContent = "✓ Redeemed";
    button.classList.add("disabled");
    showToast(`${name} reward redeemed — check your demo inbox!`);
  }));
  updateUserStats();
  renderEvents();
  initDemoAlert();
});

window.closeLocationOverlay = closeLocationOverlay;
window.focusMarker = focusMarker;
window.loadCleanupLocations = loadCleanupLocations;
