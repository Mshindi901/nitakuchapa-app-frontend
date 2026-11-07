import axios from "axios";
import { clearAuthSession, getAuthToken } from "./authStorage";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://nitakuchapa-app-backend.onrender.com";

export const api = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ""),
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "";
    const tokenExpired = error.response?.status === 401 &&
      /(?:expired|invalid).*token|token.*expired/i.test(message);
    const isAuthRequest = /\/api\/auth\/(?:signin|signup)(?:\/|$)/i.test(error.config?.url || "");

    if (tokenExpired && getAuthToken() && !isAuthRequest) {
      clearAuthSession();
      sessionStorage.setItem("nitakuchapa_session_expired", "true");
      if (window.location.pathname !== "/signin") {
        window.location.replace("/signin");
      }
    }

    return Promise.reject(error);
  },
);

export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    (error?.code === "ECONNABORTED"
      ? "The server took too long to respond. Please try again."
      : error?.message === "Network Error"
        ? "Could not reach the server. Check your connection and try again."
        : "Something went wrong. Please try again.")
  );
}

export function getResponseData(response) {
  return response?.data?.data ?? [];
}
