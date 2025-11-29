import React from "react";

const TopBar: React.FC = () => {
  return (
    <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-950/80 backdrop-blur">
      <div>
        <h1 className="text-base font-medium">AOI Creation</h1>
        <p className="text-xs text-slate-400">
          Create and manage areas of interest on the map
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 hover:bg-slate-900">
          Cancel
        </button>
        <button className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400">
          Save AOI
        </button>
      </div>
    </header>
  );
};

export default TopBar;
