import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allow }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="screen-loader">Loading secure workspace…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) {
    return <Navigate to={user.role === "patient" ? "/patient/overview" : "/overview"} replace />;
  }
  return <Outlet />;
}