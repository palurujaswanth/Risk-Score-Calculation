import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const titles = {
  "/patient/overview": "My Health Overview", "/patient/profile": "My Health Profile",
  "/patient/risk": "My Risk Assessment", "/patient/explainability": "Understanding My Results",
  "/patient/simulator": "What-If Simulator", "/patient/reports": "My Reports",
};
export default function PatientLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  return <div className="app-shell">
    <Sidebar role="patient" mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
    <div className="main-shell"><Topbar title={titles[location.pathname] || "My Health"} onMenu={() => setMobileOpen(!mobileOpen)} />
      <main className="page-content"><Outlet /></main>
      <footer className="app-footer">HealthIQ <span>·</span> Your health information, in one place.</footer>
    </div>
  </div>;
}