import React, { useEffect, useRef, useState } from "react";
import * as L from "leaflet";

type AOI = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type MapViewProps = {
  aois: AOI[];
  onMapClick: (lat: number, lng: number) => void;
};

const MapView: React.FC<MapViewProps> = ({ aois, onMapClick }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Create map once
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [51.5, 7.5], // default center
      zoom: 6,
      zoomControl: true,
    });

    // Base layer: OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Layer group for AOI markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Map click handler -> create AOI
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onMapClick]);

  // Update markers whenever AOIs change
  useEffect(() => {
    if (!markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    aois.forEach((aoi) => {
      L.marker([aoi.lat, aoi.lng])
        .bindPopup(
          `<b>${aoi.name}</b><br/>${aoi.lat.toFixed(4)}, ${aoi.lng.toFixed(4)}`
        )
        .addTo(layer);
    });
  }, [aois]);

  // Handle location search with Nominatim
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;

    setSearchLoading(true);
    setSearchError(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery.trim()
      )}&limit=1`;

      const res = await fetch(url, {
        headers: {
          // polite usage – Nominatim likes having a user agent / referer
          "Accept": "application/json",
        },
      });

      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        setSearchError("No results found");
        return;
      }

      const { lat, lon } = data[0];
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);

      mapRef.current.setView([latNum, lonNum], 13);
    } catch (err) {
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="w-full h-full relative">
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Search box overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 shadow-lg backdrop-blur"
        >
          <span className="text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none w-56"
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="text-xs px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-medium disabled:opacity-60"
          >
            {searchLoading ? "Searching..." : "Go"}
          </button>
        </form>
        {searchError && (
          <p className="mt-1 text-[10px] text-red-400 bg-slate-900/80 px-2 py-1 rounded">
            {searchError}
          </p>
        )}
      </div>
    </div>
  );
};

export default MapView;
