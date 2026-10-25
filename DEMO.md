# Trash4Impact demo build

The web demo is intentionally deterministic so it can be presented without
network APIs or browser geolocation permissions.

- `app.html` is the interactive product surface for a Philadelphia pilot.
- Three sample organizations and weekend events are rendered locally.
- Sign-ups, available slots, points, cleanups, and redeemed rewards persist in
  `localStorage` under `trash4impact-demo-state`.
- A first-visit event alert appears after roughly 20 seconds using
  `sessionStorage`.
- The map uses Leaflet and OpenStreetMap tiles, but opportunity data does not
  depend on an external volunteer API.

## Demo path

1. Open the landing page and select **Open the App**.
2. Open **Map**, select the PCDC pin, and choose **Volunteer Here**.
3. Confirm the updated points and reduced slot count on Home or Events.
4. Open **Redeem** to show the reward loop.

The next production step is replacing the local opportunity fixtures with a
server-side, authenticated events service while preserving this interface.
