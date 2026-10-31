import { Bell, Menu, Search, ChevronDown, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ onMenu, title }) {
  const { user, signOut } = useAuth();
  return <header className="topbar">
    <div className="topbar-left">
      <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
      <div className="breadcrumb"><span>HealthIQ</span><span className="crumb-sep">/</span><strong>{title}</strong></div>
    </div>
    <div className="topbar-actions">
      <button className="search-trigger" aria-label="Search"><Search size={16} /><span>Search</span><kbd>⌘ K</kbd></button>
      <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
      <div className="profile-menu">
        <div className="avatar">{(user?.name || "U").slice(0,1).toUpperCase()}</div>
        <div className="profile-copy"><strong>{user?.name || "Account"}</strong><span>{user?.role === "admin" ? "Administrator" : user?.role === "doctor" ? "Clinical professional" : "Patient"}</span></div>
        <button className="icon-button logout-button" title="Sign out" onClick={signOut}><LogOut size={17} /></button>
      </div>
    </div>
  </header>;
}