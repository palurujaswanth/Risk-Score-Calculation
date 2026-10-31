import { NavLink } from "react-router-dom";
import { Activity, BarChart3, ClipboardList, Database, FileText, Gauge, HeartPulse, HelpCircle, Microscope, Settings2, ShieldCheck, Users, UserRound, Stethoscope, SlidersHorizontal } from "lucide-react";
import Brand from "./Brand";

const professional = [
  { label: "Workspace", items: [
    ["Command Center", "/overview", Gauge],
    ["Patient Explorer", "/patients", Users],
  ]},
  { label: "Clinical intelligence", items: [
    ["Risk Assessment", "/risk-assessment", HeartPulse],
    ["Explainable AI", "/explainability", Microscope],
    ["What-If Simulator", "/simulator", SlidersHorizontal],
    ["Reports & Recommendations", "/reports", FileText],
  ]},
  { label: "Administration", items: [
    ["Data Management", "/data-management", Database, "admin"],
    ["User Management", "/admin/users", ShieldCheck, "admin"],
  ]},
];

const patient = [
  { label: "My health", items: [
    ["Overview", "/patient/overview", Gauge],
    ["Health profile", "/patient/profile", UserRound],
    ["My risk assessment", "/patient/risk", HeartPulse],
    ["AI explanation", "/patient/explainability", Microscope],
    ["What-If simulator", "/patient/simulator", SlidersHorizontal],
    ["My reports", "/patient/reports", FileText],
  ]},
];

export default function Sidebar({ role, mobileOpen, onNavigate }) {
  const groups = role === "patient" ? patient : professional;
  return <>
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand"><Brand /></div>
      <div className="workspace-label">{role === "patient" ? "PATIENT PORTAL" : role === "admin" ? "ADMINISTRATION" : "CLINICAL WORKSPACE"}</div>
      <nav className="side-nav">
        {groups.map((group) => <div className="nav-group" key={group.label}>
          <div className="nav-heading">{group.label}</div>
          {group.items.filter((item) => !item[3] || role === "admin").map(([label, path, Icon]) =>
            <NavLink key={path} to={path} onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          )}
        </div>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="secure-note"><ShieldCheck size={16} /><span>Secure clinical workspace</span></div>
        <div className="sidebar-version">HealthIQ · Healthcare Intelligence</div>
      </div>
    </aside>
    {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={onNavigate} />}
  </>;
}