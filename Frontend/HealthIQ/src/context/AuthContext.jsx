import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("healthiq_access_token");
    if (!token) {
      setLoading(false);
      return () => { active = false; };
    }
    api.me()
      .then((result) => { if (active) setUser(result.user || result); })
      .catch(() => { localStorage.removeItem("healthiq_access_token"); if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async signIn(email, password) {
      const result = await api.login({ email, password });
      const token = result.accessToken || result.token;
      const nextUser = result.user;
      if (!token || !nextUser?.role) throw new Error("The authentication response is missing a session token or user role.");
      const role = String(nextUser.role).toLowerCase();
      if (!["patient", "doctor", "admin"].includes(role)) throw new Error("Your account has an unsupported role.");
      localStorage.setItem("healthiq_access_token", token);
      setUser({ ...nextUser, role });
      return nextUser;
    },
    async signOut() {
      try { await api.logout(); } finally {
        localStorage.removeItem("healthiq_access_token");
        setUser(null);
      }
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}