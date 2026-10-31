import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";

const titles = {
  "/overview": "Command Center", "/patients": "Patient Explorer",
  "/data-management": "Data Management", "/risk-assessment": "Risk Assessment",
  "/explainability": "Explainable AI", "/simulator": "What-If Simulator",
  "/reports": "Reports & Recommendations", "/admin/users": "User Management",
};
export default function ProfessionalLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const title = location.pathname.startsWith("/patients/") ? "Patient 360°" : titles[location.pathname] || "Workspace";
  return <div className="app-shell">
    <Sidebar role={user?.role === "admin" ? "admin" : "doctor"} mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
    <div className="main-shell"><Topbar title={title} onMenu={() => setMobileOpen(!mobileOpen)} />
      <main className="page-content"><Outlet /></main>
      <footer className="app-footer">HealthIQ <span>·</span> Clinical information should be reviewed by qualified professionals.</footer>
    </div>
  </div>;
}