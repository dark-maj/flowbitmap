// src/components/MapView.tsx
import React, { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import type { AOI } from "../types";

type Props = {
  aois: AOI[];
  onShapeCreate: (aoi: AOI) => void;
  onShapeDelete?: (ids: string[]) => void;
  onShapesCleared?: () => void;
};

const DEBOUNCE_MS = 300;

const MapView: React.FC<Props> = ({ aois, onShapeCreate, onShapeDelete, onShapesCleared }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const drawControlRef = useRef<any>(null);

  // track draw / marker modes
  const drawingRef = useRef(false); // true while an active drawer is enabled
  const markerModeRef = useRef(false); // true when user clicked "Marker" button and next click must place pin

  // search state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<any>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // init map + controls (only once)
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [51.5, 7.5],
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    const drawnItems = new L.FeatureGroup().addTo(map);
    drawnItemsRef.current = drawnItems;

    const drawOptions = {
      edit: { featureGroup: drawnItems, remove: true },
      draw: {
        polygon: { allowIntersection: false, showArea: true, shapeOptions: { color: "#d97828", weight: 3 } },
        polyline: { shapeOptions: { color: "#d97828", weight: 3 } },
        rectangle: { shapeOptions: { color: "#d97828", weight: 3 } },
        circle: false,
        marker: true,
      },
    };

    const drawControl = new (L.Control as any).Draw(drawOptions);
    drawControlRef.current = drawControl;
    drawControl.addTo(map);

    // map click handler: only create pin when markerModeRef is true and not currently drawing
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (drawingRef.current) {
        // ignore clicks while drawing (prevents rectangle click-drag being interrupted)
        return;
      }
      if (!markerModeRef.current) return; // only place pin when marker mode active
      const { lat, lng } = e.latlng;

      // create AOI point and notify parent
      const id = `aoi_pt_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const geojson = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: {},
      };
      const aoi: AOI = { id, name: `AOI ${Date.now().toString().slice(-5)}`, type: "point", lat, lng, geojson };

      // add marker visually to markersLayer (will be re-synced by parent state)
      L.marker([lat, lng]).bindPopup(aoi.name).addTo(markersLayer);

      // reset marker mode (one click places one pin)
      markerModeRef.current = false;

      onShapeCreate(aoi);
    });

    // When any draw handler starts, set drawingRef true; when created or canceled -> set false
    map.on("draw:drawstart", () => {
      drawingRef.current = true;
    });
    map.on("draw:drawstop", () => {
      // not all draw handlers emit drawstop; but safe reset
      drawingRef.current = false;
    });

    // draw:created - called when a shape or marker is created by Draw plugin
    map.on("draw:created", (e: any) => {
      const layer = e.layer;
      // store id on layer
      const id = `aoi_shape_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      (layer as any).__aoiId = id;
      drawnItems.addLayer(layer);

      // compute geojson + centroid
      const geojson = layer && typeof layer.toGeoJSON === "function" ? layer.toGeoJSON() : null;
      let centroid: [number, number] | undefined;
      try {
        if (geojson?.geometry?.type === "Polygon") {
          const ring = geojson.geometry.coordinates[0];
          const sum = ring.reduce((acc: [number, number], cur: [number, number]) => [acc[0] + cur[1], acc[1] + cur[0]], [0, 0]);
          centroid = [sum[0] / ring.length, sum[1] / ring.length];
        } else if (geojson?.geometry?.type === "LineString") {
          const pts = geojson.geometry.coordinates;
          const sum = pts.reduce((acc: [number, number], cur: [number, number]) => [acc[0] + cur[1], acc[1] + cur[0]], [0, 0]);
          centroid = [sum[0] / pts.length, sum[1] / pts.length];
        } else if (geojson?.geometry?.type === "Point") {
          centroid = [geojson.geometry.coordinates[1], geojson.geometry.coordinates[0]];
        }
      } catch {
        centroid = undefined;
      }

      const aoi: AOI = {
        id,
        name: `AOI ${Date.now().toString().slice(-5)}`,
        type: geojson?.geometry?.type === "Point" ? "point" : geojson?.geometry?.type === "Polygon" ? "polygon" : geojson?.geometry?.type === "LineString" ? "polyline" : "rectangle",
        lat: centroid ? centroid[0] : undefined,
        lng: centroid ? centroid[1] : undefined,
        geojson,
      };

      // notify parent
      onShapeCreate(aoi);

      // drawing finished
      drawingRef.current = false;
      // ensure marker mode off
      markerModeRef.current = false;
    });

    // track edits / deletes
    map.on("draw:edited", (e: any) => {
      // you can compute new geojsons here and notify parent if desired
      drawingRef.current = false;
    });

    map.on("draw:deleted", (e: any) => {
      const layers = e.layers;
      const removed: string[] = [];
      layers.eachLayer((layer: any) => {
        const id = (layer as any).__aoiId;
        if (id) removed.push(id);
      });
      if (removed.length && typeof onShapeDelete === "function") onShapeDelete(removed);
      if (typeof onShapesCleared === "function") onShapesCleared();
      drawingRef.current = false;
    });

    mapRef.current = map;
    drawnItemsRef.current = drawnItems;

    return () => {
      map.off();
      map.remove();
      mapRef.current = null;
      drawnItemsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onShapeCreate, onShapeDelete, onShapesCleared]);

  // sync AOIs visual -> parent is source of truth so we wipe layers and re-add
  useEffect(() => {
    const map = mapRef.current;
    const drawn = drawnItemsRef.current;
    const markers = markersLayerRef.current;
    if (!map || !drawn || !markers) return;

    drawn.clearLayers();
    markers.clearLayers();

    aois.forEach((a) => {
      if (a.type === "point" && typeof a.lat === "number" && typeof a.lng === "number") {
        L.marker([a.lat, a.lng]).bindPopup(a.name).addTo(markers);
      } else {
        try {
          const layer = (L as any).geoJSON(a.geojson, { style: { color: "#d97828", weight: 3 } });
          (layer as any).__aoiId = a.id;
          layer.addTo(drawn);
        } catch {
          // ignore invalid geojson
        }
      }
    });
  }, [aois]);

  // DRAW start helpers (use Draw constructors or fallback)
  const startDrawMode = (mode: "polygon" | "polyline" | "rectangle" | "marker") => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const Draw = (L as any).Draw;
      const ctorName = mode === "polygon" ? "Polygon" : mode === "polyline" ? "Polyline" : mode === "rectangle" ? "Rectangle" : "Marker";
      if (Draw && Draw[ctorName]) {
        const Drawer = Draw[ctorName];
        const opts = { shapeOptions: { color: "#d97828", weight: 3 } };
        const drawer = new Drawer(map, opts);
        // For marker mode we set markerModeRef instead of relying solely on Draw marker handler
        if (mode === "marker") {
          // let the Draw marker handle placement or use click-to-place as fallback:
          drawer.enable();
          return;
        } else {
          drawingRef.current = true;
          drawer.enable();
          return;
        }
      }
    } catch {
      // fallback to control internal handlers
    }
    try {
      const ctrl = drawControlRef.current;
      if (ctrl && (ctrl as any)._toolbars && (ctrl as any)._toolbars.draw) {
        const toolbar = (ctrl as any)._toolbars.draw;
        const handler = toolbar._modes[mode]?.handler;
        if (handler && typeof handler.enable === "function") {
          if (mode === "marker") {
            markerModeRef.current = true;
          } else {
            drawingRef.current = true;
            handler.enable();
          }
          return;
        }
      }
    } catch {
      // no-op
    }

    console.error("Unable to start draw mode:", mode);
  };

  const startDrawPolygon = () => startDrawMode("polygon");
  const startDrawPolyline = () => startDrawMode("polyline");
  const startDrawRectangle = () => startDrawMode("rectangle");
  const startPlaceMarker = () => {
    // enable marker draw handler OR toggle our marker mode fallback
    const map = mapRef.current;
    if (!map) return;
    try {
      const Draw = (L as any).Draw;
      if (Draw && Draw.Marker) {
        const drawer = new Draw.Marker(map);
        drawer.enable();
        return;
      }
    } catch {}
    // fallback: one-click pin using markerMode
    markerModeRef.current = true;
  };

  const clearAll = () => {
    const drawn = drawnItemsRef.current;
    const markers = markersLayerRef.current;
    const removed: string[] = [];
    if (drawn) {
      drawn.eachLayer((layer: any) => {
        const id = (layer as any).__aoiId;
        if (id) removed.push(id);
      });
      drawn.clearLayers();
    }
    if (markers) {
      markers.clearLayers();
    }
    if (removed.length && typeof onShapeDelete === "function") onShapeDelete(removed);
    if (typeof onShapesCleared === "function") onShapesCleared();
  };

  // ---------------- Search autocomplete (Nominatim with debounce) ----------------
  useEffect(() => {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    searchTimerRef.current = window.setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&addressdetails=1&limit=5`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = await res.json();
        if (!Array.isArray(data)) {
          setSearchError("No results");
          setSuggestions([]);
        } else {
          setSuggestions(data);
        }
      } catch {
        setSearchError("Search failed");
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, DEBOUNCE_MS);
    // cleanup on unmount or query change
    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, [searchQuery]);

  const goToSuggestion = (s: any) => {
    if (!mapRef.current) return;
    const latNum = parseFloat(s.lat);
    const lonNum = parseFloat(s.lon);
    mapRef.current.setView([latNum, lonNum], 13);
    setSuggestions([]);
    setSearchQuery(s.display_name || "");
  };

  // UI
  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Search box centered top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[28rem]">
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/90 border border-slate-200 rounded-lg px-3 py-2 shadow">
            <span className="text-slate-500">🔍</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location..."
              className="w-full bg-transparent placeholder:text-slate-500 outline-none text-sm"
            />
            <button
              onClick={() => suggestions.length ? goToSuggestion(suggestions[0]) : null}
              className="text-sm px-3 py-1 bg-emerald-600 text-white rounded"
              disabled={searchLoading}
            >
              {searchLoading ? "Searching..." : "Go"}
            </button>
          </div>

          {/* suggestions dropdown */}
          {suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 bg-white border border-slate-200 rounded-b-lg shadow mt-1 max-h-60 overflow-auto z-60">
              {suggestions.map((s, idx) => (
                <li
                  key={idx}
                  onClick={() => goToSuggestion(s)}
                  className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                >
                  <div className="font-medium">{s.display_name}</div>
                </li>
              ))}
            </ul>
          )}
          {searchError && <div className="text-xs text-red-500 mt-1">{searchError}</div>}
        </div>
      </div>

      {/* Right toolbar */}
      <div className="absolute right-6 top-36 z-[1100] flex flex-col gap-3">
        <button title="Draw polygon" onClick={startDrawPolygon} className="w-10 h-10 bg-white/95 shadow rounded-md flex items-center justify-center">
          🖊️
        </button>
        <button title="Draw line" onClick={startDrawPolyline} className="w-10 h-10 bg-white/95 shadow rounded-md flex items-center justify-center">
          ➖
        </button>
        <button title="Draw rectangle" onClick={startDrawRectangle} className="w-10 h-10 bg-white/95 shadow rounded-md flex items-center justify-center">
          ▭
        </button>
        <button
          title="Place marker"
          onClick={startPlaceMarker}
          className={`w-10 h-10 ${markerModeRef.current ? "ring-2 ring-emerald-400" : ""} bg-white/95 shadow rounded-md flex items-center justify-center`}
        >
          📍
        </button>
        <button title="Clear shapes" onClick={clearAll} className="w-10 h-10 bg-white/95 shadow rounded-md flex items-center justify-center text-red-600">
          🗑️
        </button>
      </div>
    </div>
  );
};

export default MapView;
