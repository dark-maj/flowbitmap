import React, { useState } from "react";
import MapView from "./MapView";

type AOI = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

const MapPanel: React.FC = () => {
  const [aois, setAois] = useState<AOI[]>([]);

  // Called when user clicks on the map
  const handleMapClick = (lat: number, lng: number) => {
    const newAoi: AOI = {
      id: Date.now().toString(),
      name: `AOI ${aois.length + 1}`,
      lat,
      lng,
    };
    setAois((prev) => [...prev, newAoi]);
  };

  return (
    <main className="flex-1 p-4 bg-slate-950">
      <div className="w-full h-full rounded-xl border border-slate-800 bg-slate-900 flex overflow-hidden">
        {/* Left: AOI list */}
        <section className="w-80 border-r border-slate-800 p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Areas of Interest</h2>
          {aois.length === 0 ? (
            <p className="text-xs text-slate-400">
              Click anywhere on the map to create your first AOI.
            </p>
          ) : (
            <ul className="space-y-2 text-xs max-h-full overflow-auto pr-1">
              {aois.map((aoi) => (
                <li
                  key={aoi.id}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
                >
                  <div className="font-medium">{aoi.name}</div>
                  <div className="text-slate-400">
                    lat: {aoi.lat.toFixed(4)}, lng: {aoi.lng.toFixed(4)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Right: Map */}
        <section className="flex-1">
          <MapView aois={aois} onMapClick={handleMapClick} />
        </section>
      </div>
    </main>
  );
};

export default MapPanel;
