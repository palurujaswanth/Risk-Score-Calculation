const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("healthiq_access_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const message = typeof payload === "object" && payload?.message
      ? payload.message
      : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

export const api = {
  login: (credentials) => request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  }),
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  upload: async (path, formData) => {
    const token = localStorage.getItem("healthiq_access_token");
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || `Upload failed (${response.status})`);
    return payload;
  },
};