import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
});

// Attach auth header to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("wocs_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 (token expired / invalid).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("wocs_token");
      localStorage.removeItem("wocs_user");
      // Only redirect if not already on login page to avoid redirect loops
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
