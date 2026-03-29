import axios from "axios";

const normalizeApiBaseUrl = (rawUrl) => {
  const fallback = "http://localhost:5000/api";

  if (!rawUrl || typeof rawUrl !== "string") {
    return fallback;
  }

  let trimmed = rawUrl.trim();

  if (!trimmed) {
    return fallback;
  }

  if (trimmed.startsWith(":")) {
    trimmed = `http://localhost${trimmed}`;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return fallback;
  }

  trimmed = trimmed.replace(/\/+$/, "");

  if (trimmed.toLowerCase().endsWith("/api")) {
    return trimmed;
  }

  return `${trimmed}/api`;
};

const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

export default apiClient;
