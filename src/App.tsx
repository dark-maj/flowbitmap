import React from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/Topbar";
import MapPanel from "./components/Mappanel";

const App: React.FC = () => {
  return (
    <div className="h-screen flex bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar />
        <MapPanel />
      </div>
    </div>
  );
};

export default App;
