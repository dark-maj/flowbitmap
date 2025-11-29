# Flowbit AOI – Frontend Engineer Internship Assignment

A single-page React application for viewing interactive maps, searching locations, and creating Areas of Interest (AOIs).

## ✨ Features

- View an interactive map
- Search locations
- Create AOIs by clicking on the map
- Display AOIs in a list
- View markers and popups on the map

## 🚀 Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Leaflet (map library)
- OpenStreetMap tiles
- Playwright (E2E testing)

## 📦 Setup Instructions

```bash
npm install
npm run dev
```

Application runs at: **http://localhost:5173**

## 📌 Running E2E Tests

```bash
npm run test:e2e
```

## 🗺️ Map Library Choice

**Chosen:** Leaflet (direct integration)

**Why Leaflet?**
- Lightweight and beginner-friendly
- Excellent for raster/WMS-based maps
- Supports markers, popups, polygons, layers out of the box
- No vendor lock-in
- Works well in React-controlled structures

## 🌐 WMS Layer Note

The NRW WMS service (https://www.wms.nrw.de) blocks CORS requests from localhost.

The WMS layer is implemented in code using `L.tileLayer.wms()`, but browser cannot load tiles due to CORS restrictions. OpenStreetMap fallback tiles are added for a working demo during evaluation.

## 🧱 Architecture Overview

```
src/
├── components/
│   ├── Sidebar.tsx
│   ├── TopBar.tsx
│   ├── MapPanel.tsx
│   └── MapView.tsx
├── App.tsx
├── main.tsx
└── index.css
```

### Component Responsibilities

| Component | Purpose |
|-----------|---------|
| **App.tsx** | Global layout wrapper; renders sidebar + top bar + map panel |
| **Sidebar.tsx** | Static navigation using semantic `<aside>` + `<nav>` |
| **TopBar.tsx** | Header UI with page title + action buttons |
| **MapPanel.tsx** | Manages AOI state; displays AOI list; connects map events |
| **MapView.tsx** | Initializes Leaflet map; handles clicks; renders markers; implements location search |

## ⚡ Performance Considerations (1000+ AOIs)

- Use marker clustering
- Virtualize layers
- Debounce map events
- Load AOIs by bounding box query
- Use R-tree spatial indexing
- Memoize marker render operations

## 🧪 Testing Strategy

### ✓ What I tested (E2E):

- App loads
- Sidebar + top bar visible
- Map container renders
- Click on map → AOI created
- AOI list updates
- Markers update correctly

### With more time, I would also test:

- Polygon drawing
- Local storage persistence
- Error states in search

## 📁 API Documentation (Nominatim)

**Search API:**

```
GET https://nominatim.openstreetmap.org/search?format=json&q=<query>
```

**Response example:**

```json
[
  {
    "lat": "48.8588897",
    "lon": "2.320041",
    "display_name": "Paris, France"
  }
]
```

## 🧪 Playwright Tests

### tests/app.spec.ts

```typescript
import { test, expect } from "@playwright/test";

test("app loads with core UI elements", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(/Flowbit AOI/i)).toBeVisible();
  await expect(page.getByText(/AOI Creation/i)).toBeVisible();
  await expect(page.locator(".leaflet-container")).toBeVisible();
});
```

### tests/aoi.spec.ts

```typescript
import { test, expect } from "@playwright/test";

test("clicking on the map creates an AOI", async ({ page }) => {
  await page.goto("/");

  const map = page.locator(".leaflet-container");

  await map.click({ position: { x: 200, y: 200 } });

  await expect(page.getByText(/AOI 1/i)).toBeVisible();
});
```
