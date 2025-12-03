// src/components/MapPanel.tsx
import React, { useEffect, useState } from "react";
import MapView from "./MapView";
import type { AOI } from "../types";

const STORAGE_KEY = "flowbit_aois_v1";

const MapPanel: React.FC = () => {
  const [aois, setAois] = useState<AOI[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAois(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(aois));
    } catch {
      // ignore
    }
  }, [aois]);

  const handleShapeCreate = (aoi: AOI) => {
    setAois((p) => [...p, aoi]);
  };

  const handleShapeDelete = (ids: string[]) => {
    setAois((p) => p.filter((a) => !ids.includes(a.id)));
  };

  const handleDeleteOne = (id: string) => {
    setAois((p) => p.filter((a) => a.id !== id));
  };

  const startRename = (a: AOI) => {
    setEditingId(a.id);
    setEditValue(a.name);
  };
  const saveRename = (id: string) => {
    setAois((p) => p.map((a) => (a.id === id ? { ...a, name: editValue } : a)));
    setEditingId(null);
    setEditValue("");
  };

  const handleClearAll = () => {
    if (!confirm("Clear all AOIs?")) return;
    setAois([]);
  };

  return (
    <main className="flex-1 p-4 bg-slate-950">
      <div className="w-full h-full rounded-xl border border-slate-800 bg-slate-900 flex overflow-hidden">
        <section className="w-80 border-r border-slate-800 p-4 flex flex-col gap-3 bg-white/3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Areas of Interest</h2>
            <button onClick={handleClearAll} className="text-xs text-rose-400">Clear</button>
          </div>

          <div className="flex-1 overflow-auto">
            {aois.length === 0 ? (
              <p className="text-xs text-slate-400">Draw shapes or place pins on the map to create AOIs.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {aois.map((a) => (
                  <li key={a.id} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 flex justify-between items-start">
                    <div className="flex-1">
                      {editingId === a.id ? (
                        <div className="flex gap-2 items-center">
                          <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="bg-slate-900 px-2 py-1 rounded text-sm outline-none" />
                          <button onClick={() => saveRename(a.id)} className="text-xs text-emerald-400">Save</button>
                          <button onClick={() => { setEditingId(null); setEditValue(""); }} className="text-xs text-slate-400">Cancel</button>
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-slate-100">{a.name}</div>
                          <div className="text-slate-400 text-xs">
                            {a.type} {a.lat ? `• ${a.lat.toFixed(4)}, ${a.lng?.toFixed(4)}` : ""}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 items-end ml-3">
                      <button onClick={() => startRename(a)} className="text-xs text-amber-300">Rename</button>
                      <button onClick={() => handleDeleteOne(a.id)} className="text-xs text-rose-400">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <button
              onClick={() => alert("Apply outline as base image — not implemented (shapes preserved).")}
              className="w-full bg-amber-700 text-white px-3 py-2 rounded-md text-sm"
            >
              Apply outline as base image
            </button>
          </div>
        </section>

        <section className="flex-1">
          <MapView
            aois={aois}
            onShapeCreate={handleShapeCreate}
            onShapeDelete={handleShapeDelete}
            onShapesCleared={() => setAois([])}
          />
        </section>
      </div>
    </main>
  );
};

export default MapPanel;
