import axios from "axios";
import { getAuthToken } from "./authStorage";

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
