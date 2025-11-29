import React from "react";

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 p-4 flex flex-col">
      <div className="text-lg font-semibold mb-6">Flowbit AOI</div>

      <nav className="space-y-2 text-sm">
        <button className="w-full text-left px-3 py-2 rounded-lg bg-slate-800">
          Dashboard
        </button>
        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-900">
          AOI Creation
        </button>
        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-900">
          Settings
        </button>
      </nav>

      <div className="mt-auto text-xs text-slate-500">
        Frontend Intern Assignment
      </div>
    </aside>
  );
};

export default Sidebar;
